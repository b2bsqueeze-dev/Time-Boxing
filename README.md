# TimeBox Planner (with mini server)

This repository contains a small Express server and the TimeBox Planner static client. The server stores daily data as JSON files under `data/` and exposes a small REST API for load/save/export.

Quick run (locally)
1. Install dependencies:
   ```
   npm install
   ```
2. Start server:
   ```
   npm start
   ```
3. Open http://localhost:3000 in your browser.

API endpoints
- GET /api/data/:date          -> load data for given date (YYYY-MM-DD)
- POST /api/data/:date         -> save data for given date (body: JSON)
- GET /api/dates               -> list saved dates
- GET /api/export/:date        -> download JSON file for a date
- GET /api/export-all          -> download all saved data as one JSON

Deployment
- Docker:
  - Build: `docker build -t timebox-planner .`
  - Run: `docker run -p 3000:3000 timebox-planner`
- Host providers: Railway / Render / Fly / Heroku (use the Dockerfile or Node start script)
  - Push repo to GitHub and connect your provider — set PORT environment or let provider set it.

Notes
- Data is saved server-side in `data/` as `YYYY-MM-DD.json`. For production use you may want to add authentication, DB storage (SQLite/Postgres), and backup.