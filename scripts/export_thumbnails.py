"""Export thumbnails of all slides for visual inspection."""
import os
import pickle
import requests
print("Starting thumbnail export...", flush=True)

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'new_deck_thumbnails')

# Get credentials
token_file = os.path.join(os.path.dirname(__file__), 'token.pickle')
with open(token_file, 'rb') as f:
    creds = pickle.load(f)

slides_service = build('slides', 'v1', credentials=creds)
print("Connected to Google Slides API", flush=True)

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Saving thumbnails to: {OUTPUT_DIR}", flush=True)

# Get presentation
pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get('slides', [])
print(f"Found {len(slides)} slides to export", flush=True)

# Export each slide
for i, slide in enumerate(slides):
    slide_id = slide.get('objectId')
    try:
        thumbnail = slides_service.presentations().pages().getThumbnail(
            presentationId=PRESENTATION_ID,
            pageObjectId=slide_id,
            thumbnailProperties_thumbnailSize='LARGE'
        ).execute()
        
        image_url = thumbnail.get('contentUrl')
        if image_url:
            response = requests.get(image_url)
            output_path = os.path.join(OUTPUT_DIR, f'slide_{i+1:02d}.png')
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"  [{i+1:02d}/{len(slides)}] Exported slide_{i+1:02d}.png", flush=True)
    except Exception as e:
        print(f"  [{i+1:02d}/{len(slides)}] FAILED: {str(e)[:50]}", flush=True)

print(f"\nDONE! Exported {len(slides)} thumbnails to {OUTPUT_DIR}", flush=True)
