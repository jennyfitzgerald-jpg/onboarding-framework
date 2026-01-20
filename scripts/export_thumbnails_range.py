"""Export thumbnails of a slide range (current deck order) for visual inspection."""
import os
import pickle
import requests

from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "review_thumbnails")

# 1-indexed inclusive range in the CURRENT deck order
START_SLIDE = 1
END_SLIDE = 45

print("Starting thumbnail export (range)...", flush=True)
print(f"Deck: {PRESENTATION_ID}", flush=True)
print(f"Range: {START_SLIDE}..{END_SLIDE}", flush=True)

token_file = os.path.join(os.path.dirname(__file__), "token.pickle")
with open(token_file, "rb") as f:
    creds = pickle.load(f)

slides_service = build("slides", "v1", credentials=creds)
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Saving thumbnails to: {OUTPUT_DIR}", flush=True)

pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get("slides", [])
total = len(slides)
print(f"Found {total} slides", flush=True)

if END_SLIDE > total:
    raise SystemExit(f"END_SLIDE={END_SLIDE} exceeds deck size={total}")

for i in range(START_SLIDE - 1, END_SLIDE):
    slide = slides[i]
    slide_id = slide.get("objectId")
    slide_num = i + 1
    try:
        thumbnail = (
            slides_service.presentations()
            .pages()
            .getThumbnail(
                presentationId=PRESENTATION_ID,
                pageObjectId=slide_id,
                thumbnailProperties_thumbnailSize="LARGE",
            )
            .execute()
        )
        image_url = thumbnail.get("contentUrl")
        if image_url:
            response = requests.get(image_url, timeout=60)
            response.raise_for_status()
            output_path = os.path.join(OUTPUT_DIR, f"slide_{slide_num:02d}.png")
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"  [{slide_num:02d}/{END_SLIDE:02d}] slide_{slide_num:02d}.png", flush=True)
        else:
            print(f"  [{slide_num:02d}/{END_SLIDE:02d}] FAILED: no contentUrl", flush=True)
    except Exception as e:
        print(f"  [{slide_num:02d}/{END_SLIDE:02d}] FAILED: {str(e)[:120]}", flush=True)

print("DONE", flush=True)

