# Saved taxpayers

- `custom-taxpayers.json`: commit an export here (Settings > Saved taxpayers > Export) to make taxpayers permanent for every deploy and every browser.
- `saved-taxpayers.json`: written by the server as you add taxpayers. It is git-ignored. On Render, set `DATA_DIR` to a persistent disk path to keep it across deploys.
