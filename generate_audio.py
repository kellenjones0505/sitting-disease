"""Generate narration MP3s (plus caption timestamps) with ElevenLabs.

Reads ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID from .env (never hard-coded).
Only the "narration" field of each scene in public/scenes.json is sent;
the "visual" notes are never sent.

Usage (run from this folder):
    python generate_audio.py 2          # just scene 2 (test clip)
    python generate_audio.py all        # every scene that doesn't have audio yet
    python generate_audio.py 3 5 7      # specific scenes
    python generate_audio.py all --force   # regenerate even if files exist (costs credits!)
    python generate_audio.py --check    # no API calls: list files and sizes
    python generate_audio.py 1 --takes 3   # 3 alternate readings of scene 1 into takes/ (costs credits)
    python generate_audio.py --pick 1 2    # make take 2 the live audio for scene 1 (no API call)
"""

import base64
import json
import shutil
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCENES_FILE = ROOT / "public" / "scenes.json"
AUDIO_DIR = ROOT / "public" / "audio"
TAKES_DIR = ROOT / "takes"
ENV_FILE = ROOT / ".env"

MODEL_ID = "eleven_multilingual_v2"
OUTPUT_FORMAT = "mp3_44100_128"
API_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format={fmt}"


def load_env():
    values = {}
    if not ENV_FILE.exists():
        sys.exit("ERROR: .env file not found next to this script.")
    for line in ENV_FILE.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        values[key.strip()] = val.strip().strip('"').strip("'")
    return values


def load_scenes():
    return json.loads(SCENES_FILE.read_text(encoding="utf-8"))["scenes"]


def words_from_alignment(alignment):
    """Group character timings into word timings for captions."""
    words = []
    current, start, end = "", None, None
    chars = alignment["characters"]
    starts = alignment["character_start_times_seconds"]
    ends = alignment["character_end_times_seconds"]
    in_tag = None  # skip <break .../> pause tags and [curious]-style voice directions
    for ch, s, e in zip(chars, starts, ends):
        if in_tag:
            if ch == in_tag:
                in_tag = None
            continue
        if ch in "<[":
            in_tag = ">" if ch == "<" else "]"
            ch = " "
        if ch.isspace():
            if current:
                words.append({"word": current, "start": start, "end": end})
            current, start, end = "", None, None
        else:
            if not current:
                start = s
            current += ch
            end = e
    if current:
        words.append({"word": current, "start": start, "end": end})
    return words


def generate(scene, api_key, voice_id, out_dir=None, name=None, extra=None):
    text = scene["narration"]
    url = API_URL.format(voice_id=voice_id, fmt=OUTPUT_FORMAT)
    payload = {"text": text, "model_id": MODEL_ID}
    payload.update(extra or {})
    body = json.dumps(payload).encode("utf-8")
    out_dir = out_dir or AUDIO_DIR
    name = name or f"scene{scene['id']}"
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", errors="replace")[:800]
        sys.exit(f"ERROR from ElevenLabs on scene {scene['id']} (HTTP {err.code}): {detail}")
    except urllib.error.URLError as err:
        sys.exit(f"ERROR: could not reach ElevenLabs: {err.reason}")

    audio = base64.b64decode(data["audio_base64"])
    mp3_path = out_dir / f"{name}.mp3"
    mp3_path.write_bytes(audio)

    alignment = data.get("alignment") or data.get("normalized_alignment")
    timing = {
        "scene": scene["id"],
        "text": text,
        "model": MODEL_ID,
        "words": words_from_alignment(alignment) if alignment else [],
        "alignment": alignment,
    }
    json_path = out_dir / f"{name}.json"
    json_path.write_text(json.dumps(timing, indent=1), encoding="utf-8")

    dur = timing["words"][-1]["end"] if timing["words"] else 0
    print(f"  {name}: {len(audio):,} bytes, ~{dur:.1f}s, {len(timing['words'])} timed words")


# Alternate takes: same words, different "rolls" of the voice so you can pick the best delivery.
# Take 1 = your voice's saved settings with a new random seed; takes 2-3 are more expressive.
TAKE_SETTINGS = [
    {"seed": 1111},
    {"seed": 2222, "voice_settings": {"stability": 0.38, "similarity_boost": 0.8, "style": 0.1, "use_speaker_boost": True}},
    {"seed": 3333, "voice_settings": {"stability": 0.3, "similarity_boost": 0.8, "style": 0.25, "use_speaker_boost": True}},
]


def make_takes(scene, api_key, voice_id, count):
    TAKES_DIR.mkdir(exist_ok=True)
    for k in range(1, count + 1):
        generate(scene, api_key, voice_id, out_dir=TAKES_DIR, name=f"scene{scene['id']}_take{k}",
                 extra=TAKE_SETTINGS[(k - 1) % len(TAKE_SETTINGS)])


def pick_take(n, k):
    """Swap take k in as the live audio for scene n (the original is backed up once)."""
    src_mp3, src_json = TAKES_DIR / f"scene{n}_take{k}.mp3", TAKES_DIR / f"scene{n}_take{k}.json"
    if not src_mp3.exists():
        sys.exit(f"ERROR: {src_mp3.name} not found")
    for ext in ("mp3", "json"):
        live, backup = AUDIO_DIR / f"scene{n}.{ext}", TAKES_DIR / f"scene{n}_original.{ext}"
        if live.exists() and not backup.exists():
            shutil.copy2(live, backup)
    shutil.copy2(src_mp3, AUDIO_DIR / f"scene{n}.mp3")
    shutil.copy2(src_json, AUDIO_DIR / f"scene{n}.json")
    print(f"Scene {n} now uses take {k}. (Original saved as takes/scene{n}_original.mp3)")


def check(scenes):
    ok = True
    total = 0.0
    for s in scenes:
        for ext in ("mp3", "json"):
            p = AUDIO_DIR / f"scene{s['id']}.{ext}"
            size = p.stat().st_size if p.exists() else 0
            status = "OK " if size > 0 else "MISSING/EMPTY"
            if size == 0:
                ok = False
            print(f"  {status:13} {p.name:12} {size:>9,} bytes")
        jp = AUDIO_DIR / f"scene{s['id']}.json"
        if jp.exists() and jp.stat().st_size:
            words = json.loads(jp.read_text(encoding="utf-8")).get("words") or []
            if words:
                total += words[-1]["end"]
    print(f"\nTotal narration length: ~{total:.0f}s ({total / 60:.1f} min)")
    print("ALL FILES PRESENT" if ok else "SOME FILES MISSING")
    return ok


def main():
    args = sys.argv[1:]
    scenes = load_scenes()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    if "--check" in args:
        sys.exit(0 if check(scenes) else 1)

    if "--pick" in args:  # python generate_audio.py --pick 1 2   -> scene 1 uses take 2
        i = args.index("--pick")
        pick_take(int(args[i + 1]), int(args[i + 2]))
        return

    takes = 0
    if "--takes" in args:  # python generate_audio.py 1 --takes 3
        i = args.index("--takes")
        takes = int(args[i + 1])
        args = args[:i] + args[i + 2:]

    force = "--force" in args or takes > 0
    picks = [a for a in args if not a.startswith("--")]
    if not picks:
        sys.exit(__doc__)

    if picks == ["all"]:
        chosen = scenes
    else:
        ids = {int(p) for p in picks}
        chosen = [s for s in scenes if s["id"] in ids]

    if not force:
        skipped = [s["id"] for s in chosen if (AUDIO_DIR / f"scene{s['id']}.mp3").exists()]
        if skipped:
            print(f"Skipping scenes that already have audio (use --force to redo): {skipped}")
        chosen = [s for s in chosen if s["id"] not in skipped]

    if not chosen:
        print("Nothing to generate.")
        return

    env = load_env()
    api_key = env.get("ELEVENLABS_API_KEY", "")
    voice_id = env.get("ELEVENLABS_VOICE_ID", "")
    if not api_key:
        sys.exit("ERROR: ELEVENLABS_API_KEY is empty in .env")
    if not voice_id:
        sys.exit("ERROR: ELEVENLABS_VOICE_ID is empty in .env")

    chars = sum(len(s["narration"]) for s in chosen) * (takes or 1)
    print(f"Generating {len(chosen)} scene(s) x {takes or 1} take(s), {chars:,} characters, model {MODEL_ID}")
    for s in chosen:
        if takes:
            make_takes(s, api_key, voice_id, takes)
        else:
            generate(s, api_key, voice_id)
    print("Done.")


if __name__ == "__main__":
    main()
