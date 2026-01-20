"""Adjust slide 6 title/body positions to remove overlap and fit bullets."""

import os
import pickle
import requests

from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUT_DIR = os.path.join(os.path.dirname(__file__), "review_thumbnails")

creds = pickle.load(open(os.path.join(os.path.dirname(__file__), "token.pickle"), "rb"))
svc = build("slides", "v1", credentials=creds)

TITLE = "g333c0d108cd_2_50"
BODY = "g333c0d108cd_2_72"

body_text = "\n".join(
    [
        "We lost Chris in Oxford",
        "Dar McCarthy's injury",
        "Personal tragedies across the team",
        "Health challenges for colleagues and families",
        "Summer cashflow pressure — met with €15M Claret venture debt",
    ]
)

reqs = [
    {
        "updatePageElementTransform": {
            "objectId": TITLE,
            "applyMode": "RELATIVE",
            "transform": {"scaleX": 1, "scaleY": 1, "translateX": 0, "translateY": -700000, "unit": "EMU"},
        }
    },
    {
        "updatePageElementTransform": {
            "objectId": BODY,
            "applyMode": "RELATIVE",
            "transform": {"scaleX": 1, "scaleY": 1, "translateX": 0, "translateY": 400000, "unit": "EMU"},
        }
    },
    {"deleteText": {"objectId": BODY, "textRange": {"type": "ALL"}}},
    {"insertText": {"objectId": BODY, "text": body_text, "insertionIndex": 0}},
    {
        "createParagraphBullets": {
            "objectId": BODY,
            "textRange": {"type": "ALL"},
            "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE",
        }
    },
    {
        "updateTextStyle": {
            "objectId": BODY,
            "style": {
                "fontSize": {"magnitude": 18, "unit": "PT"},
                "foregroundColor": {"opaqueColor": {"rgbColor": {"red": 0.1, "green": 0.1, "blue": 0.1}}},
            },
            "textRange": {"type": "ALL"},
            "fields": "fontSize,foregroundColor",
        }
    },
]

svc.presentations().batchUpdate(presentationId=PRESENTATION_ID, body={"requests": reqs}).execute()

pres = svc.presentations().get(presentationId=PRESENTATION_ID).execute()
slide_id = pres["slides"][5]["objectId"]  # slide 6
thumb = (
    svc.presentations()
    .pages()
    .getThumbnail(
        presentationId=PRESENTATION_ID,
        pageObjectId=slide_id,
        thumbnailProperties_thumbnailSize="LARGE",
    )
    .execute()
)
r = requests.get(thumb["contentUrl"], timeout=60)
r.raise_for_status()
os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, "slide_06_FIXED_v3.png"), "wb") as f:
    f.write(r.content)

print("[OK] slide_06_FIXED_v3.png")

