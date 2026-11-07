# Telegram bot setup

The bot accepts pasted job ads and uploads (`.txt`, `.csv`, `.pdf`, photos), runs the same scam-check / Job Bot pipeline as the web app, and replies with a verdict plus a clickable report URL.

## Env vars

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBHOOK_SECRET` | Random string; must match webhook secret |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://kazi-check.rumptycloud.app` (absolute https) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Optional public username without `@` |

Also set on RumptyCloud: `DATABASE_URL`, LLM/ThriveWave as needed.

## Create the bot

1. Open BotFather → `/newbot` → copy the token into `TELEGRAM_BOT_TOKEN`.
2. Generate a secret, e.g. `openssl rand -hex 24` → `TELEGRAM_WEBHOOK_SECRET`.
3. Deploy the app with those env vars.

## Set webhook

After deploy (replace token, host, and secret):

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://kazi-check.rumptycloud.app/api/webhooks/telegram\",\"secret_token\":\"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

Query-string alternative (same secret):

`https://kazi-check.rumptycloud.app/api/webhooks/telegram?secret=<TELEGRAM_WEBHOOK_SECRET>`

Verify:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

## Try it

- `/start` — menu  
- Paste a scam sample (interview fee + lookalike domain)  
- Upload a screenshot or `.txt`  

You should get a verdict and an `https://…/checks/<id>` link on its own line.
