# Sitting Disease — Stuff You Should Know

A ~3-minute narrated, fully automatic presentation for the help desk team meeting.
Click **Play** once and it runs start to finish: narration, animations and synced captions.

## Controls (optional — nothing is needed once it starts)
| Key | Action |
|---|---|
| Space | Pause / resume |
| ← / → | Previous / next scene |
| F | Toggle fullscreen |

Move the mouse to reveal the pause button; it hides again after 2 seconds (so it won't show up in a recording).
Add `?nofs` to the URL to stop Play from going fullscreen.

## Project layout
```
public/            <- the website (this is what Render serves)
  index.html, styles.css, app.js, scenes.js
  scenes.json      <- narration script + visual notes
  audio/           <- sceneN.mp3 + sceneN.json (word timings for captions)
generate_audio.py  <- one-time ElevenLabs generator (reads key from .env, never committed)
```

## Run locally
```powershell
python -m http.server 8765 --directory public
```
Then open http://localhost:8765

## Deploy (Render Static Site)
- Build command: *(leave blank)*
- Publish directory: `public`
