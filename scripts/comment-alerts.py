#!/usr/bin/env python3
"""VPS cron worker. Reads production comments without changing the website DB."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
from urllib import error, request

ROOT = Path.home() / '.config/telegram-notifications/comment-alerts'
CREDENTIALS = Path.home() / '.config/telegram-notifications/.env'
QUERY = """
import json, sqlite3, sys
db = sqlite3.connect('file:/opt/portfolio/data/portfolio.db?mode=ro', uri=True, timeout=5)
db.row_factory = sqlite3.Row
since = int(sys.argv[1])
if since < 0:
    print(json.dumps(db.execute('SELECT coalesce(max(id),0) FROM comments').fetchone()[0]))
else:
    print(json.dumps([dict(r) for r in db.execute('''
      SELECT c.id,c.name,c.body,c.is_private,p.title,p.slug
      FROM comments c JOIN posts p ON p.id=c.post_id
      WHERE c.id>? AND c.is_admin=0 ORDER BY c.id LIMIT 20''', (since,))]))
db.close()
"""


def comments(since):
    result = subprocess.run(
        ['/usr/bin/sudo', '-n', '-u', 'portfolio', '/usr/bin/python3', '-c', QUERY, str(since)],
        capture_output=True, timeout=15, check=True)
    return json.loads(result.stdout)


def save(state):
    fd, name = tempfile.mkstemp(dir=ROOT, prefix='.state-')
    try:
        with os.fdopen(fd, 'w') as out:
            json.dump(state, out)
            out.flush()
            os.fsync(out.fileno())
        os.replace(name, ROOT / 'state.json')
        directory = os.open(ROOT, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--initialize', action='store_true', help='Baseline existing comments; never sends')
    args = parser.parse_args()
    os.umask(0o077)
    ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    with (ROOT / 'lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        path = ROOT / 'state.json'
        if args.initialize:
            if path.exists():
                raise RuntimeError('Already initialized; refusing to reset delivery state')
            save({'last_id': comments(-1), 'pending': None, 'failures': 0})
            print('Comment alert baseline saved; no messages sent')
            return
        state = json.loads(path.read_text())
        if state['pending'] is not None:
            raise RuntimeError('Uncertain delivery; inspect pending comment before clearing state')
        if state['failures'] >= 3:
            raise RuntimeError('Delivery paused after three rejected attempts; inspect configuration')
        env = {}
        for line in CREDENTIALS.read_text().splitlines():
            parts = shlex.split(line, comments=True)
            if parts:
                key, _, value = ' '.join(parts).removeprefix('export ').partition('=')
                env[key.strip()] = value.strip()
        token, chat = env['TELEGRAM_BOT_TOKEN'], env['TELEGRAM_CHAT_ID']
        if not token or not chat:
            raise RuntimeError('Missing Telegram credentials')
        for comment in comments(state['last_id']):
            visibility = 'Private comment' if comment['is_private'] else 'New comment'
            text = (f"{visibility} #{comment['id']} on {comment['title'][:300]}\n"
                    f"From: {comment['name'][:100]}\n\n{comment['body'][:1500]}\n\n"
                    f"https://adityakinjawadekar.com/writing/{comment['slug'][:300]}\n"
                    'Manage: https://adityakinjawadekar.com/admin/comments')
            payload = json.dumps({'chat_id': chat, 'text': text,
                                  'link_preview_options': {'is_disabled': True}}).encode()
            req = request.Request('https://api.telegram.org/bot' + token + '/sendMessage',
                                  data=payload, headers={'Content-Type': 'application/json'})
            # Persist before submission: ambiguous failures must not cause duplicate sends.
            state['pending'] = comment['id']
            save(state)
            try:
                with request.urlopen(req, timeout=15) as response:
                    accepted = json.load(response).get('ok') is True
            except error.HTTPError as exc:
                if 400 <= exc.code < 500:
                    state.update(pending=None, failures=state['failures'] + 1)
                    save(state)
                raise RuntimeError('Telegram request failed; details suppressed') from None
            if not accepted:
                state.update(pending=None, failures=state['failures'] + 1)
                save(state)
                raise RuntimeError('Telegram rejected delivery')
            state.update(last_id=comment['id'], pending=None, failures=0)
            save(state)
            print(f"Comment alert {comment['id']} accepted by Telegram", flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Exceptions from HTTP libraries can include the secret-bearing endpoint.
        print('Comment alerts failed or paused; inspect private state and configuration. No automatic retry of uncertain delivery.', file=sys.stderr)
        sys.exit(1)
