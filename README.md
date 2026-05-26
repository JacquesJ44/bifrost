# Bifrost Signup App

Bifrost is a full-stack signup system for fibre applications.

- Backend: Flask API in `app.py`
- Frontend: React + Vite app in `bifrost-fe-vite/`
- Database access: SQLAlchemy session in `db.py` (read-only Heimdall connection)
- Bot protection: rate limiting + honeypot/speed/user-agent risk scoring

## What The App Does

The frontend collects signup information (name, contact details, building/site, unit, package, activation preference) and sends it to the backend.

The backend:

1. Validates request payload.
2. Applies anti-bot checks:
   - Honeypot field
   - Form submit speed
   - User-Agent heuristics
3. Validates email syntax/domain/MX.
4. Checks site and unit validity from the database.
5. Sends support and customer confirmation emails.

Main API routes:

- `GET /api/sites`
- `GET /api/units?site_id=<id>`
- `POST /api/signup`

## Project Structure

- `app.py`: Flask app, API routes, anti-bot logic, and email sending
- `db.py`: SQLAlchemy engine/session setup
- `requirements.txt`: Python dependencies
- `tests/test_bot_risk.py`: unit tests for anti-bot scoring scenarios
- `bifrost-fe-vite/`: frontend app

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- Access to required environment variables in `.env`

## Environment Variables

Set these in `.env` at repo root (or in your shell):

- `HEIMDALL_RO_DB_URI`
- `REDIS_URI`
- `SECRET_KEY`
- `CORS_ORIGIN`
- `MAIL_SERVER`
- `MAIL_PORT`
- `MAIL_USE_TLS`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `SUPPORT_EMAIL`

## Backend Setup And Run

From repo root:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run backend:

```powershell
python app.py
```

Backend default URL: `http://localhost:5000`

## Frontend Setup And Run

From `bifrost-fe-vite/`:

```powershell
npm install
npm run dev
```

Set `VITE_API_BASE_URL` if your backend is not on `http://localhost:5000`.

## Unit Tests

Current unit tests are focused on anti-bot risk scoring (`tests/test_bot_risk.py`).

### Run all current tests

From repo root:

```powershell
venv\Scripts\python.exe -m unittest tests/test_bot_risk.py -v
```

### Run with Python on PATH

```powershell
python -m unittest tests/test_bot_risk.py -v
```

### Run a single test case

```powershell
venv\Scripts\python.exe -m unittest tests.test_bot_risk.EvaluateBotRiskTests.test_honeypot_only_is_soft_allowed -v
```

## Test Scenarios Covered

- Legit browser submission is allowed
- Honeypot-only (autocomplete-like) is soft-allowed
- Extremely fast submit is blocked
- Honeypot + fast submit is blocked
- Honeypot + non-browser user-agent is blocked
- Non-browser user-agent alone is allowed
- Invalid timestamp does not crash or auto-block

## Manual Bot Scenario Script (PowerShell)

If you want to manually compare bot-check outcomes without editing tests,
run this script from repo root:

```powershell
.\tests\simulate_signup_bot_scenarios.ps1
```

Optional custom API URL:

```powershell
.\tests\simulate_signup_bot_scenarios.ps1 -ApiUrl "http://localhost:5000/api/signup"
```

Optional payload controls:

```powershell
.\tests\simulate_signup_bot_scenarios.ps1 -PackageName "My Test Package" -EmailDomain "gmail.com"
```

What it does:

- Fetches a real site and available unit from your API.
- Sends full signup payloads with controlled `form_loaded_at` values.
- Prints a summary table and raw response body for each scenario.
- Classifies each result as either:
   - `Blocked by bot filter`
   - `Not blocked by bot filter`

Important: non-blocked scenarios can create real signups and trigger confirmation/support emails.
Use a dedicated test mailbox/domain and clean up test records as needed.

## Notes

- `flask-limiter` is enabled on signup (`5 per minute`).
- Blocked/suspicious attempts are logged to `blocked_attempts.log`.
