"""Print page element IDs/types/text for selected slides (current deck order).

Usage:
  python inspect_slide_elements.py 1 2 5
"""

import sys
import pickle
from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
SLIDES = [int(x) for x in sys.argv[1:]] if len(sys.argv) > 1 else [5, 6]

creds = pickle.load(open("token.pickle", "rb"))
svc = build("slides", "v1", credentials=creds)

pres = svc.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get("slides", [])

for slide_num in SLIDES:
    slide = slides[slide_num - 1]
    page_elements = slide.get("pageElements", [])
    print(f"\n=== SLIDE {slide_num} ({slide.get('objectId')}) elements: {len(page_elements)} ===")
    for el in page_elements:
        oid = el.get("objectId")
        kind = "unknown"
        if "shape" in el:
            kind = "shape"
        elif "image" in el:
            kind = "image"
        elif "line" in el:
            kind = "line"
        elif "video" in el:
            kind = "video"
        elif "sheetsChart" in el:
            kind = "chart"

        txt = ""
        if kind == "shape" and el["shape"].get("text"):
            full = ""
            for te in el["shape"]["text"].get("textElements", []):
                full += te.get("textRun", {}).get("content", "")
            txt = " ".join(full.strip().split())[:80]

        print(f"- {oid} | {kind} | {txt}")

