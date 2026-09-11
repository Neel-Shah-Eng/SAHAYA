# Sahkaar Seva — Backend API

Backend for the Sahkaar Seva frontend (`index.html`). It receives and
stores real user input — service bookings, worker/cooperative
registrations, and safety events — and returns it to the frontend so the
site's booking flow, live worker list, and OTP-based service start all
work against real data instead of hardcoded arrays.

## What it captures from users
- **Bookings** (`POST /api/bookings`) — name, phone, location, date, time
  slot, service, and job details from the booking form.
- **Worker/cooperative registrations** (`POST /api/workers/register`) —
  name, service, phone, cooperative, experience, specialties.
- **Safety events** (`POST /api/safety/*`) — emergency alerts, check-ins,
  and issue reports, optionally linked to a booking.

All submitted data is saved to `data/db.json`, so it survives server
restarts — no database setup needed to get started.

## Setup
```bash
npm install
npm start
```
Server runs at **http://localhost:5000**. On first run it creates
`data/db.json` automatically, seeded with demo workers.

## Connect the frontend
In `index.html`, the API base is already set to `http://localhost:5000/api`.
To point it elsewhere (e.g. after deploying), add this before the closing
`<script>` tag, or edit the `API_BASE` line directly:
```html
<script>window.SAHKAAR_API_BASE = 'https://your-deployed-backend.onrender.com';</script>
```

## API Reference

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/services` | List service categories |
| GET | `/api/workers?service=&status=&q=` | List/filter/search workers |
| GET | `/api/workers/:id` | One worker's profile |
| GET | `/api/workers/map/pins?service=` | Map marker data |
| POST | `/api/workers/register` | Worker/cooperative registration |
| POST | `/api/bookings` | Create a booking (auto-assigns worker + OTP) |
| GET | `/api/bookings/:id` | Booking status |
| POST | `/api/bookings/:id/otp/regenerate` | New OTP |
| POST | `/api/bookings/:id/start` | Start service — body `{ "otp": "1234" }` |
| POST | `/api/bookings/:id/complete` | Mark completed |
| POST | `/api/safety/emergency` | Log emergency — body `{ "type": "112" }` |
| POST | `/api/safety/checkin` | Safety check-in |
| POST | `/api/safety/report` | Report an issue |
| GET | `/api/stats` | Platform stats snapshot |

## About hosting this on GitHub

GitHub itself only stores and version-controls code — it doesn't run a
Node.js server for you (GitHub Pages, GitHub's free static hosting, only
serves plain HTML/CSS/JS files, not backend code). So the workflow is:

1. **Push this backend's code to a GitHub repo** — for version control and
   so you can deploy from it.
2. **Deploy it somewhere that actually runs Node servers**, using that
   GitHub repo as the source. Free options that work well for a project
   like this:
   - **Render** (render.com) — connect your GitHub repo, it auto-detects
     `npm start` and gives you a public URL.
   - **Railway** (railway.app) — similar one-click GitHub deploy.
   - **Cyclic** or **Fly.io** — also support small free Node apps.
3. Once deployed, update `SAHKAAR_API_BASE` in your frontend to that
   public URL, and push the frontend to GitHub Pages (or wherever you're
   hosting it) so the two are connected.

## Push to GitHub
```bash
git init
git add .
git commit -m "Add backend with persistent storage"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```
`data/db.json` is excluded via `.gitignore` since it's user-generated
runtime data, not source code — each deployment starts with fresh seed
data unless you set up a real database (see below).

## Next steps
- **Real database:** `data/db.json` works for a prototype/demo, but isn't
  safe for concurrent writes at scale. For production, swap the
  `loadDb()`/`saveDb()` functions for MongoDB (Mongoose) or PostgreSQL.
- **SMS OTP delivery:** currently the OTP is returned directly in the
  booking API response for demo purposes — wire up Twilio/MSG91 to text
  it instead.
- **Auth:** add login for customers/workers/cooperative admins so
  bookings and registrations are tied to real accounts.
