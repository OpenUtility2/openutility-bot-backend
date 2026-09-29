# OpenUtility Bot Backend

Render-ready Node.js/Express backend for the OpenUtility Bot website.

## Deploy
1. Upload this repository to GitHub.
2. Create a Render Web Service from the repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the variables from `.env.example` in Render Environment settings.
6. In Discord Developer Portal -> OAuth2 -> Redirects, add:
`https://YOUR-RENDER-SERVICE.onrender.com/auth/discord/callback`

Never commit `.env`, the Discord client secret, or bot token.

## API
GET /api/health
GET /api/me
GET /api/guilds
GET /api/guilds/:guildId/channels
GET /api/guilds/:guildId/config
PUT /api/guilds/:guildId/config
POST /auth/logout
