# Saved taxpayers

- `custom-taxpayers.json`: commit an export here (Settings > Saved taxpayers > Export) to make taxpayers permanent for every deploy and every browser.
- `ui-text.json`: demo wording saved from Settings > Demo text (git-ignored here). Export it and commit the file as `data/demo-text.json` to make it permanent.
- `saved-taxpayers.json`: written by the server as you add taxpayers. It is git-ignored. On Render, set `DATA_DIR` to a persistent disk path to keep it across deploys.
