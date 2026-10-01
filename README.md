# OpenUtility Bot — Vercel Backend

Vercel-ready serverless API for the OpenUtility Bot website.

## Deploy

1. Upload this repository to GitHub.
2. Import the repository into Vercel.
3. Add these environment variables in Vercel:
   - DISCORD_CLIENT_ID
   - DISCORD_CLIENT_SECRET
   - DISCORD_BOT_TOKEN
   - DISCORD_REDIRECT_URI
   - FRONTEND_URL
   - SESSION_SECRET
   - BOT_SYNC_SECRET
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
4. Redeploy after adding variables.

## Discord redirect

After Vercel gives you a domain, add this exact URL in Discord Developer Portal -> OAuth2 -> Redirects:

`https://YOUR-PROJECT.vercel.app/api/auth/discord/callback`

Do not put the Discord client secret, bot token, or bot sync secret in frontend code.

## Endpoints

GET /api/health
GET /api/auth/discord
GET /api/auth/discord/callback
POST /api/auth/logout
GET /api/me
GET /api/guilds
GET /api/guilds/:guildId/channels
GET /api/guilds/:guildId/config
PUT /api/guilds/:guildId/config
GET /api/bot/guild/:guildId/config
PUT /api/bot/guild/:guildId/config

## Bot synchronization

The bot-to-website configuration endpoint is protected by `BOT_SYNC_SECRET`. The OpenUtility Bot should send:

`Authorization: Bearer <BOT_SYNC_SECRET>`

to:

`https://YOUR-PROJECT.vercel.app/api/bot/guild/:guildId/config`

The bot can `PUT` its current guild snapshot and can `GET` the website's current configuration. The endpoint stores configuration in the same Upstash-backed database used by the website API.

For the Phase 3 bot, set `WEBSITE_SYNC_URL` to the Vercel project base URL and set the bot's `WEBSITE_SYNC_SECRET` to the exact same value as Vercel's `BOT_SYNC_SECRET`.

## Storage

The API uses Upstash Redis when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured. Without them, a process-local memory fallback is used for development only and is not durable across Vercel invocations.
