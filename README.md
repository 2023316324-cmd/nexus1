# Nexus Contact Server - Local Setup

This is a minimal Node/Express server to receive contact messages from the Nexus site, optionally send e-mail (via SMTP), and store messages in a local SQLite DB.

## Quick start (development)

1) Install deps

```powershell
npm install
```

2) Copy `.env.example` to `.env` and edit the credentials

```powershell
cp .env.example .env
# edit .env with your SMTP provider or set MOCK_EMAIL=true for testing
```

3) Start the server

```powershell
npm run start
# or npm run dev (requires nodemon)
```

4) The API will be available at `http://localhost:3000/api/messages`.

## Endpoint

POST /api/messages

Body (JSON):
- from: sender email (string)
- to: optional recipient email (string). If missing, `DEFAULT_RECIPIENT` is used
- subject: string
- message: string
- specialist: optional (string) - stored for analytics
- recaptchaToken: optional recaptcha token if front-end uses it

Response: { success: true, id: number }

## Security
- Allowed recipients are validated via `ALLOWED_RECIPIENTS` in `.env`.
- Rate limiting is enabled by default (10 req/min). Adjust `RATE_LIMIT_MAX`.
- Optional reCAPTCHA validation if `RECAPTCHA_SECRET` is provided.

## Notes
- When `MOCK_EMAIL=true` in `.env`, the server will not perform SMTP `sendMail` and will use a mock id.
- For production, set appropriate SMTP credentials, reCAPTCHA, and secure the server behind an HTTPS load balancer.

