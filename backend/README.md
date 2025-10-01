# YOLO Flask Live Inference

A Flask app with a clean UI that streams YOLO detections from your webcam.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Place your weights in the project root as `pokemodel.pt` (preferred) or ensure `yolo11n.pt` exists. The app auto-picks the first available from: `pokemodel.pt` or `yolo11n.pt`. If none are found, it falls back to the public model name `yolo11n.pt`.

## Run

```bash
python flaskapp.py
```

Open `http://localhost:5000` and click Start.

## Notes

- Change camera index in `open_camera(0)` if needed.
- Adjust confidence in `generate_frames(confidence=0.4)`.
- Grant camera permission to the terminal app on macOS if prompted.
