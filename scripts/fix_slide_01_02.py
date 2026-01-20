"""Fix slide 1 (subtitle + speaker line) and slide 2 (remove extra attribution line)."""

import os
import pickle
import requests

from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUT_DIR = os.path.join(os.path.dirname(__file__), "review_thumbnails")

creds = pickle.load(open(os.path.join(os.path.dirname(__file__), "token.pickle"), "rb"))
svc = build("slides", "v1", credentials=creds)

# Slide 1 element IDs
SUBTITLE = "g32d3330ae38_8_5"
SPEAKER = "g32d3330ae38_8_6"
DATE = "g32d3330ae38_8_7"

# Slide 2 element ID to remove
EXTRA_ATTR = "g329d79ffd87_0_4"

reqs = [
    {"deleteText": {"objectId": SUBTITLE, "textRange": {"type": "ALL"}}},
    {"insertText": {"objectId": SUBTITLE, "text": "The Year We Turned a Corner", "insertionIndex": 0}},
    {
        "updateTextStyle": {
            "objectId": SUBTITLE,
            "style": {"italic": True, "foregroundColor": {"opaqueColor": {"rgbColor": {"red": 0.45, "green": 0.45, "blue": 0.45}}}},
            "textRange": {"type": "ALL"},
            "fields": "italic,foregroundColor",
        }
    },
    {"deleteText": {"objectId": SPEAKER, "textRange": {"type": "ALL"}}},
    {"insertText": {"objectId": SPEAKER, "text": "Donal O'Shea | CEO | January 2026", "insertionIndex": 0}},
    # Clear separate date box (redundant once speaker line includes date)
    {"deleteText": {"objectId": DATE, "textRange": {"type": "ALL"}}},
    # Remove the extra line on slide 2
    {"deleteObject": {"objectId": EXTRA_ATTR}},
]

svc.presentations().batchUpdate(presentationId=PRESENTATION_ID, body={"requests": reqs}).execute()

def export(slide_num_1: int, name: str) -> None:
    pres = svc.presentations().get(presentationId=PRESENTATION_ID).execute()
    slide_id = pres["slides"][slide_num_1 - 1]["objectId"]
    thumb = svc.presentations().pages().getThumbnail(
        presentationId=PRESENTATION_ID, pageObjectId=slide_id, thumbnailProperties_thumbnailSize="LARGE"
    ).execute()
    r = requests.get(thumb["contentUrl"], timeout=60)
    r.raise_for_status()
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, name), "wb") as f:
        f.write(r.content)

export(1, "slide_01_FIXED.png")
export(2, "slide_02_FIXED.png")
print("[OK] Exported slide_01_FIXED.png and slide_02_FIXED.png")

