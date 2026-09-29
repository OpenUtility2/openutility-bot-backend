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
4. Redeploy after adding variables.

## Discord redirect

After Vercel gives you a domain, add this exact URL in Discord Developer Portal -> OAuth2 -> Redirects:

`https://YOUR-PROJECT.vercel.app/api/auth/discord/callback`

Do not put the Discord client secret or bot token in frontend code.

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

## Storage note

This starter uses a small JSON configuration layer for development only. Vercel serverless functions do not provide durable local filesystem storage. For real persistent configuration, connect the API to a database such as Vercel Postgres, Neon, Supabase, or another hosted database.
