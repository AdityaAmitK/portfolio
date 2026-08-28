# Aditya Kinjawadekar — Portfolio

A fast, self-hosted portfolio, project archive, recommendations page, and Markdown publishing desk for [adityakinjawadekar.com](https://adityakinjawadekar.com).

The overall editorial direction is inspired by [Conor Dewey](https://www.conordewey.com/), while the chronological project presentation is inspired by [Parth Sharma](https://www.psrth.sh/projects).

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`. The admin is at `/admin`; set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` before using it.

## Production

Generate a session secret with `openssl rand -hex 32`, add it to `.env`, then deploy:

```bash
docker compose up -d --build
```

The container listens on `127.0.0.1:3000` for Caddy or Nginx. SQLite data lives in the persistent `portfolio_data` volume.

## Checks

```bash
npm run lint
npm run build
```
