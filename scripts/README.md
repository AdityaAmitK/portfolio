# Finance article import

`import-article.mjs` is a trusted local database writer, using the installed `better-sqlite3` and `sharp` packages. It does not migrate a database, verify Git/main/PR state, deploy, invalidate running Next.js caches, or send Telegram messages. Deploy/apply the `lib/db.ts` migrations through the separately authorized application workflow before importing. The Finance series must already be seeded.

Store new finance articles in `finance/<slug>/` in the writing content repository. Existing archived articles remain in sibling `<slug>/` folders and are not imported by this Finance-only CLI:

- `article.md`: body-only Markdown, no YAML front matter, nonempty, at most 2 MiB.
- `metadata.json`: an object with `title`, `slug`, `description`, `tags` (string array), `series` (exactly `"finance"`), `cover` (a filename), and `cover_alt` (nonempty). Optional `published_at` accepts an ISO date or UTC timestamp; it is validated but does not set publication time. First publication uses the current time; updates preserve the existing date. `published` metadata has no authority and is ignored.
- The named cover: PNG, JPEG, GIF, or WebP, matching its extension, nonempty and at most 8 MiB. Files must be regular direct children of a real folder without symlink components. Traversal and symlinks are rejected. Other linked Markdown assets are not imported; use the named cover or separately managed URLs.

Slugs use lowercase ASCII letters/digits separated by single hyphens, at most 160 characters. Reserved slugs include `finance`, `series`, `admin`, `api`, `preview`, `uploads`, `writing`, `feed`, `rss`, `sitemap`, `new`, `edit`, and `tags`. Metadata is limited to 64 KiB; title to 300 characters, description to 2000, alt text to 1000, and tags to 30 names of up to 80 characters. Tags must produce a usable ASCII slug and reuse existing matching tags.

From the portfolio repository, with an authorized local database and uploads directory:

```sh
DATABASE_PATH=/path/to/migrated/portfolio.db UPLOAD_DIR=/path/to/uploads \
  node scripts/import-article.mjs /path/to/writing/finance/article-slug
```

Defaults are `/opt/portfolio/data/portfolio.db` and its sibling `uploads/` directory; explicitly override both for isolated setup. Importing writes data and assets and belongs to the authorized publishing workflow.

Draft stdout is exactly one JSON object `{id,slug,previewUrl}`. **The preview URL is a secret bearer credential: capture stdout privately; do not log it, commit it, or include it in reports.** Each successful draft import rotates the 32-byte random token, stores only SHA-256, and expires it in seven days. Existing HMAC previews remain supported independently. Draft imports update only unpublished Finance posts; a published slug or a slug owned outside Finance is an error. Draft imports never unpublish a post. Repeating a draft import updates the same post and replaces its preview credential.

Only after the coordinator wrapper has verified that the exact article tree is on merged writing `main`, materialized that exact tree (including sidecar and cover), and excluded dirty/untracked substitutions:

```sh
DATABASE_PATH=/path/to/migrated/portfolio.db UPLOAD_DIR=/path/to/uploads \
  node scripts/import-article.mjs /path/to/exact/merged/finance/article-slug \
  --publish --revision <full-git-article-tree-oid>
```

This CLI trusts that local caller. An OID is format-checked (full SHA-1 or SHA-256), not checked against Git or the folder contents. Never publish an arbitrary working folder merely because a revision argument is present. The coordinator owns main/merge verification, cache/deployment handling, and subsequent Telegram URLs. Published stdout is `{id,slug,url,changed,revision}`. The same already-published revision is a no-op; a new revision publishes atomically and clears stored preview credentials. Admin saves preserve series membership unless explicitly provided and clear revision provenance, since an edited post can no longer be asserted to match its imported Git tree.

Cover filenames hash article body and cover bytes; existing names cannot be overwritten with different bytes. Social JPEG settings match uploads: 1200×630, cover fit, JPEG quality 78 with mozjpeg. Image processing and immutable file writes finish before the immediate database transaction. A cover failure cannot partially publish. Post/tag changes roll back together; failed/racing imports may leave unreferenced immutable assets. Asset cleanup and token renewal without reimport are not implemented. Only the latest published tree is recorded, so the coordinator must also prevent stale/reversed publication order. A same-revision no-op assumes trusted callers have maintained provenance and asset storage.

Code checks (no database, imports, server, or runtime requests):

```sh
node --check scripts/import-article.mjs
./node_modules/.bin/eslint lib/db.ts lib/preview.ts 'app/preview/[id]/page.tsx' scripts/import-article.mjs
./node_modules/.bin/tsc --noEmit --incremental false
```

Separate authorized verification should cover migrations on an existing disposable database, draft creation/reimport/token expiry and malformed tokens, HMAC compatibility, published/non-Finance slug refusal, transactional rollback on invalid covers/tag failures, revision no-op, first-publication/update dates, credential clearing, and public exclusion of drafts. Those checks are not performed by the code-check commands above.


## Telegram comment alerts (VPS)

`comment-alerts.py` runs as `t3` on `aditya-vps` every minute through the
`portfolio-comment-alerts` crontab entry. Installed worker and private delivery
state live in `~/.config/telegram-notifications/comment-alerts/`. Credentials are
read from the existing `~/.config/telegram-notifications/.env` at runtime.
The worker reads `/opt/portfolio/data/portfolio.db` read-only using the existing
`sudo -n -u portfolio` permission. No site restart or schema change is needed.

Install/update the script there with mode 600 and invoke it using `/usr/bin/python3`.
On first installation only, run it with `--initialize` before enabling cron;
this saves the current maximum comment ID without sending old comments.
Never reset existing state when updating the worker.

Reader comments on all posts, including private and hidden comments, generate
plain-text notifications with author, body, article link, and moderation link.
Author replies are excluded. Deleted comments cannot be recovered by this poller.
A lock prevents overlapping runs. Accepted messages advance an atomically saved
cursor. An ambiguous timeout/crash leaves `pending` set and pauses delivery to
avoid duplicate messages; inspect Telegram before manually reconciling that ID.
Three explicit Telegram rejections also pause delivery until configuration is fixed
and the private `failures` count is reset. Logs contain safe IDs/outcomes only.

Check `crontab -l`, the cron service, and private `state.json` to inspect setup.
Separate end-to-end verification: submit a reader comment, wait up to two minutes,
confirm one Telegram alert, and confirm another cron tick does not repeat it.
Also check a private comment and confirm author replies do not trigger alerts.
No delivery test message is sent during installation.
