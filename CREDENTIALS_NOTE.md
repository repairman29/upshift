# Credentials note

- **Gateway token** and **Together API key** are stored in `~/.clawdbot/.env` (not in this repo). They were used to configure the gateway and Together AI as the default model.
- **Security:** Those values were pasted in chat. If you want to rotate the gateway token later: generate a new one, set `CLAWDBOT_GATEWAY_TOKEN` in `~/.clawdbot/.env`, and restart the gateway.
- **Discord:** When you’re ready to chat, add your Discord bot token to `~/.clawdbot/.env` as `DISCORD_BOT_TOKEN`, then install/start the gateway. See **DISCORD_SETUP.md** for how to create the bot and enable intents.
