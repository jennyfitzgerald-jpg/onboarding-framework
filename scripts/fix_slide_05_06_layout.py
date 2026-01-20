"""Fix layout issues for slides 5 and 6 (positioning + text runs)."""

import os
import pickle
import requests

from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUT_DIR = os.path.join(os.path.dirname(__file__), "review_thumbnails")

creds = pickle.load(open(os.path.join(os.path.dirname(__file__), "token.pickle"), "rb"))
svc = build("slides", "v1", credentials=creds)


def export_slide(slide_num_1: int, name: str) -> None:
    pres = svc.presentations().get(presentationId=PRESENTATION_ID).execute()
    slide_id = pres["slides"][slide_num_1 - 1]["objectId"]
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
    url = thumb.get("contentUrl")
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, name), "wb") as f:
        f.write(r.content)


ORANGE = {"red": 1.0, "green": 0.302, "blue": 0.11}
DARK = {"red": 0.1, "green": 0.1, "blue": 0.1}
GRAY = {"red": 0.35, "green": 0.35, "blue": 0.35}

requests_list = []

# -----------------------------
# Slide 5: merge Chris + team into one box, delete extra box
# -----------------------------
CHRIS_BOX = "g333c0d108cd_2_822"
TEAM_BOX = "g333c0d108cd_2_823"

merged = "Chris\nOxford Lab Team"

requests_list.extend(
    [
        {"deleteObject": {"objectId": TEAM_BOX}},
        {"deleteText": {"objectId": CHRIS_BOX, "textRange": {"type": "ALL"}}},
        {"insertText": {"objectId": CHRIS_BOX, "text": merged, "insertionIndex": 0}},
        # set ALL to gray/subtitle style
        {
            "updateTextStyle": {
                "objectId": CHRIS_BOX,
                "style": {
                    "fontSize": {"magnitude": 26, "unit": "PT"},
                    "foregroundColor": {"opaqueColor": {"rgbColor": GRAY}},
                    "bold": False,
                },
                "textRange": {"type": "ALL"},
                "fields": "fontSize,foregroundColor,bold",
            }
        },
        # first line (Chris) emphasized
        {
            "updateTextStyle": {
                "objectId": CHRIS_BOX,
                "style": {
                    "fontSize": {"magnitude": 48, "unit": "PT"},
                    "foregroundColor": {"opaqueColor": {"rgbColor": ORANGE}},
                    "bold": True,
                },
                "textRange": {"type": "FIXED_RANGE", "startIndex": 0, "endIndex": 5},
                "fields": "fontSize,foregroundColor,bold",
            }
        },
        # nudge box slightly down so it doesn't crowd the title
        {
            "updatePageElementTransform": {
                "objectId": CHRIS_BOX,
                "applyMode": "RELATIVE",
                "transform": {
                    "scaleX": 1,
                    "scaleY": 1,
                    "translateX": 0,
                    "translateY": 250000,  # ~0.27 inch
                    "unit": "EMU",
                },
            }
        },
    ]
)

# -----------------------------
# Slide 6: move bullets down so they don't overlap title
# -----------------------------
BODY6 = "g333c0d108cd_2_72"
requests_list.append(
    {
        "updatePageElementTransform": {
            "objectId": BODY6,
            "applyMode": "RELATIVE",
            "transform": {
                "scaleX": 1,
                "scaleY": 1,
                "translateX": 0,
                "translateY": 900000,  # ~1 inch
                "unit": "EMU",
            },
        }
    }
)

# Also slightly reduce bullet font size for safety
requests_list.append(
    {
        "updateTextStyle": {
            "objectId": BODY6,
            "style": {
                "fontSize": {"magnitude": 20, "unit": "PT"},
                "foregroundColor": {"opaqueColor": {"rgbColor": DARK}},
            },
            "textRange": {"type": "ALL"},
            "fields": "fontSize,foregroundColor",
        }
    }
)

print(f"Applying {len(requests_list)} requests...", flush=True)
svc.presentations().batchUpdate(presentationId=PRESENTATION_ID, body={"requests": requests_list}).execute()
print("[OK] Applied layout fixes", flush=True)

export_slide(5, "slide_05_FIXED_v2.png")
export_slide(6, "slide_06_FIXED_v2.png")
print("[OK] Exported updated thumbnails", flush=True)

