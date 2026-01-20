"""Nudge slide 6 bullet box up to reduce whitespace."""

import os
import pickle
import requests
from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUT_DIR = os.path.join(os.path.dirname(__file__), "review_thumbnails")
BODY = "g333c0d108cd_2_72"

creds = pickle.load(open(os.path.join(os.path.dirname(__file__), "token.pickle"), "rb"))
svc = build("slides", "v1", credentials=creds)

svc.presentations().batchUpdate(
    presentationId=PRESENTATION_ID,
    body={
        "requests": [
            {
                "updatePageElementTransform": {
                    "objectId": BODY,
                    "applyMode": "RELATIVE",
                    "transform": {"scaleX": 1, "scaleY": 1, "translateX": 0, "translateY": -1300000, "unit": "EMU"},
                }
            }
        ]
    },
).execute()

pres = svc.presentations().get(presentationId=PRESENTATION_ID).execute()
slide_id = pres["slides"][5]["objectId"]
thumb = svc.presentations().pages().getThumbnail(
    presentationId=PRESENTATION_ID, pageObjectId=slide_id, thumbnailProperties_thumbnailSize="LARGE"
).execute()
r = requests.get(thumb["contentUrl"], timeout=60)
r.raise_for_status()
os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, "slide_06_FIXED_v4.png"), "wb") as f:
    f.write(r.content)
print("[OK] slide_06_FIXED_v4.png")

