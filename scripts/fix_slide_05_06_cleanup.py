"""Clean up slides 5 and 6 by deleting leftover template elements and formatting text."""

import os
import pickle
import requests

from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUT_DIR = os.path.join(os.path.dirname(__file__), "review_thumbnails")

creds = pickle.load(open(os.path.join(os.path.dirname(__file__), "token.pickle"), "rb"))
svc = build("slides", "v1", credentials=creds)

pres = svc.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get("slides", [])

def export_slide(slide_idx_0: int, name: str) -> None:
    slide_id = slides[slide_idx_0]["objectId"]
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
    with open(os.path.join(OUT_DIR, name), "wb") as f:
        f.write(r.content)


requests_list = []

# -----------------------------
# Slide 5 (index 4): Memorial
# Keep only the memorial text boxes; delete everything else.
# -----------------------------
slide5 = slides[4]
keep5 = {
    "g333c0d108cd_2_818",  # In Memory
    "g333c0d108cd_2_822",  # Chris
    "g333c0d108cd_2_823",  # Oxford Laboratory Team
    "g333c0d108cd_2_826",  # quote line 1
    "g333c0d108cd_2_827",  # quote line 2
}
for el in slide5.get("pageElements", []):
    oid = el.get("objectId")
    if oid and oid not in keep5:
        requests_list.append({"deleteObject": {"objectId": oid}})

# Style slide 5 text
def set_text_style(object_id: str, font_pt: int, rgb: tuple[float, float, float], italic: bool | None = None, bold: bool | None = None):
    style = {
        "fontSize": {"magnitude": font_pt, "unit": "PT"},
        "foregroundColor": {"opaqueColor": {"rgbColor": {"red": rgb[0], "green": rgb[1], "blue": rgb[2]}}},
    }
    if italic is not None:
        style["italic"] = italic
    if bold is not None:
        style["bold"] = bold
    fields = ["fontSize", "foregroundColor"]
    if italic is not None:
        fields.append("italic")
    if bold is not None:
        fields.append("bold")
    requests_list.append(
        {
            "updateTextStyle": {
                "objectId": object_id,
                "style": style,
                "textRange": {"type": "ALL"},
                "fields": ",".join(fields),
            }
        }
    )

set_text_style("g333c0d108cd_2_818", 34, (0.1, 0.1, 0.1), bold=True)
set_text_style("g333c0d108cd_2_822", 36, (1.0, 0.302, 0.11), bold=True)  # Deciphex orange
set_text_style("g333c0d108cd_2_823", 22, (0.35, 0.35, 0.35))
set_text_style("g333c0d108cd_2_826", 20, (0.15, 0.15, 0.15), italic=True)
set_text_style("g333c0d108cd_2_827", 20, (0.15, 0.15, 0.15), italic=True)


# -----------------------------
# Slide 6 (index 5): Acknowledging 2025
# Keep title + one body box; delete image/lines/extra text.
# -----------------------------
slide6 = slides[5]
keep6 = {
    "g333c0d108cd_2_50",  # title
    "g333c0d108cd_2_72",  # body
}
for el in slide6.get("pageElements", []):
    oid = el.get("objectId")
    if oid and oid not in keep6:
        requests_list.append({"deleteObject": {"objectId": oid}})

# Replace slide 6 body with bullet list
body6 = "\n".join(
    [
        "We lost Chris in Oxford",
        "Dar McCarthy's injury",
        "Personal tragedies across the team",
        "Health challenges for colleagues and families",
        "Summer cashflow pressure — met with €15M Claret Capital venture debt",
    ]
)
requests_list.extend(
    [
        {"deleteText": {"objectId": "g333c0d108cd_2_72", "textRange": {"type": "ALL"}}},
        {"insertText": {"objectId": "g333c0d108cd_2_72", "text": body6, "insertionIndex": 0}},
        {
            "createParagraphBullets": {
                "objectId": "g333c0d108cd_2_72",
                "textRange": {"type": "ALL"},
                "bulletPreset": "BULLET_DISC_CIRCLE_SQUARE",
            }
        },
        {
            "updateTextStyle": {
                "objectId": "g333c0d108cd_2_72",
                "style": {
                    "fontSize": {"magnitude": 22, "unit": "PT"},
                    "foregroundColor": {"opaqueColor": {"rgbColor": {"red": 0.1, "green": 0.1, "blue": 0.1}}},
                },
                "textRange": {"type": "ALL"},
                "fields": "fontSize,foregroundColor",
            }
        },
        {
            "updateTextStyle": {
                "objectId": "g333c0d108cd_2_50",
                "style": {
                    "fontSize": {"magnitude": 34, "unit": "PT"},
                    "foregroundColor": {"opaqueColor": {"rgbColor": {"red": 0.1, "green": 0.1, "blue": 0.1}}},
                },
                "textRange": {"type": "ALL"},
                "fields": "fontSize,foregroundColor",
            }
        },
    ]
)

print(f"Applying {len(requests_list)} requests...", flush=True)
svc.presentations().batchUpdate(presentationId=PRESENTATION_ID, body={"requests": requests_list}).execute()
print("[OK] Updated slides 5 and 6", flush=True)

os.makedirs(OUT_DIR, exist_ok=True)
export_slide(4, "slide_05_FIXED.png")
export_slide(5, "slide_06_FIXED.png")
print("[OK] Exported thumbnails to review_thumbnails/", flush=True)

