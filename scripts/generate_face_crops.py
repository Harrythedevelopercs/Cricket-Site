#!/usr/bin/env python3
"""Generate the face-centered player headshots used by /players.

The players directory serves square crops from public/images/players/faces/,
named by the basename of each player's CricClubs profile photo. When a new
player appears in the roster with a photo but no local crop, their card falls
back to the sample silhouette until this script is run.

Usage:
    python3 scripts/generate_face_crops.py            # crop whatever is missing
    python3 scripts/generate_face_crops.py --force    # regenerate everything

Reads the roster from the live /api/players (override with --api), downloads
each missing photo from media.cricclubs.com, finds the face (OpenCV Haar
cascade — ships inside the opencv wheel, no model download), and writes a
420x420 crop centered on it. Photos where no face is detected get a center-top
square crop, which matches how CricClubs portraits are framed.
"""

import argparse
import json
import sys
import urllib.request
from pathlib import Path

import cv2
import numpy as np

FACES_DIR = Path(__file__).resolve().parent.parent / "public/images/players/faces"
OUT_SIZE = 420
# How much of the crop the face should occupy, and where its center sits.
FACE_SCALE = 2.6  # crop edge = face height x this
FACE_CENTER_Y = 0.42  # face center sits at 42% from the top of the crop


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ccc-face-crops/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def largest_face(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    if len(faces) == 0:
        return None
    return max(faces, key=lambda f: f[2] * f[3])


def square_crop(img, face):
    h, w = img.shape[:2]
    if face is not None:
        fx, fy, fw, fh = face
        cx = fx + fw / 2
        cy = fy + fh / 2
        edge = int(min(max(fh * FACE_SCALE, 120), min(h, w)))
        x0 = int(cx - edge / 2)
        y0 = int(cy - edge * FACE_CENTER_Y)
    else:
        # No face found: assume a portrait framing — square anchored to the top.
        edge = min(h, w)
        x0 = (w - edge) // 2
        y0 = 0
    x0 = max(0, min(x0, w - edge))
    y0 = max(0, min(y0, h - edge))
    return img[y0 : y0 + edge, x0 : x0 + edge]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="https://www.clubcricketofchicago.com/api/players")
    ap.add_argument("--force", action="store_true", help="regenerate existing crops too")
    args = ap.parse_args()

    FACES_DIR.mkdir(parents=True, exist_ok=True)
    entries = json.loads(fetch(args.api)).get("entries", [])

    done = skipped = failed = 0
    for e in entries:
        images = e.get("playerImage") or [{}]
        url = images[0].get("url") or ""
        if not url:
            continue
        name = url.split("/")[-1].split("?")[0]
        out = FACES_DIR / name
        if out.exists() and not args.force:
            skipped += 1
            continue
        try:
            raw = fetch(url)
            img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("not a decodable image")
            face = largest_face(img)
            crop = cv2.resize(square_crop(img, face), (OUT_SIZE, OUT_SIZE), interpolation=cv2.INTER_AREA)
            if name.lower().endswith(".png"):
                cv2.imwrite(str(out), crop)
            else:
                cv2.imwrite(str(out), crop, [cv2.IMWRITE_JPEG_QUALITY, 88])
        except Exception as err:  # report and continue — one bad photo shouldn't stop the run
            print(f"  FAILED {name} — {e.get('title')}: {err}", file=sys.stderr)
            failed += 1
            continue
        tag = "face" if face is not None else "top-crop"
        print(f"  wrote {name} ({tag}) — {e.get('title')}")
        done += 1

    print(f"done: {done} written, {skipped} already present, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
