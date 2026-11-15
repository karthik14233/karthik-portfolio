# Karthik S: Portfolio

Single-page portfolio built with Flask, vanilla JS and Supabase. Hosted on Render.

## Structure
```
portfolio/
├── app.py
├── requirements.txt
├── supabase.sql
├── .env.example
├── .gitignore
├── DEPLOY.md
├── templates/index.html
└── static/{style.css, script.js}
```

## Run locally
```bash
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env    # fill in your Supabase values
python app.py           # http://127.0.0.1:5000
```

## Environment variables
| Name | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase > Project Settings > API > Project URL |
| `SUPABASE_SERVICE_KEY` | Same page > `service_role` key (secret, server only) |

## API
- `POST /contact` takes JSON `{name, email, message, website}`. `website` is the honeypot and must stay empty.
- `GET /api/visits` increments and returns `{ok, visits}`.
- `GET /healthz` health check.

Render start command: `gunicorn app:app`

Before publishing, replace the placeholder GitHub and LinkedIn links in `templates/index.html`.
See `DEPLOY.md` for deployment and testing.
