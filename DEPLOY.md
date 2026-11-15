# Deployment guide

## 1. Supabase
1. Create a free project at supabase.com.
2. Open **SQL Editor > New query**, paste all of `supabase.sql`, click **Run**.
3. Open **Project Settings > API**. Copy the Project URL and the `service_role` key.

## 2. GitHub
```bash
cd portfolio
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```
Confirm `.env` is not in the repo (it is in `.gitignore`).

## 3. Render
1. Sign in at render.com with GitHub. **New > Web Service**, pick your repo.
2. Settings:
   - Runtime: **Python 3**
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app:app`
   - Instance type: **Free**
3. **Environment** tab, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `PYTHON_VERSION` = `3.12.7`
4. Optional: set Health Check Path to `/healthz`.
5. Click **Create Web Service**. After the build, open your `https://<name>.onrender.com` URL.

Free services sleep after inactivity, so the first load can take about a minute.

## 4. Live test checklist
Visitor counter
- [ ] Footer shows a number, not "..." or "n/a".
- [ ] Reload the page: the number goes up by 1.
- [ ] Open `/api/visits` directly: JSON with `"ok": true` and a larger count.
- [ ] Supabase > Table Editor > `site_stats` shows the same number.

Contact form
- [ ] Submit it empty: errors appear under each field, nothing is sent.
- [ ] Use an invalid email (`abc`): email error appears.
- [ ] Use a valid name, email and a 10+ character message: green success message, form clears, no page reload.
- [ ] Supabase > `messages` has the new row.
- [ ] Send `<b>hi</b> test message`: saved without the tags.
- [ ] Honeypot: in a terminal run
  `curl -X POST https://YOUR-URL/contact -H "Content-Type: application/json" -d '{"name":"Bot","email":"a@b.co","message":"spam spam spam","website":"x"}'`
  It returns success, but no new row appears.
- [ ] Send 6 valid messages within an hour: the 6th returns "Too many messages".

General
- [ ] Theme toggle works and is remembered after reload.
- [ ] Menu works on a phone-width screen; Tab key shows visible focus.
- [ ] Replaced all `github.com/username` and LinkedIn placeholder links.
