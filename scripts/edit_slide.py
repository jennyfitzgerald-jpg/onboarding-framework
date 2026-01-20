"""
Edit a single slide and export thumbnail for verification.
"""
import os
import pickle
import requests
import sys

from google.auth.transport.requests import Request
from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'new_deck_thumbnails')

# Get credentials
token_file = os.path.join(os.path.dirname(__file__), 'token.pickle')
with open(token_file, 'rb') as f:
    creds = pickle.load(f)

slides_service = build('slides', 'v1', credentials=creds)
print("Connected to Google Slides API", flush=True)


def get_slide_info(slide_index):
    """Get slide ID and text elements for a specific slide."""
    pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
    slides = pres.get('slides', [])
    
    if slide_index > len(slides):
        print(f"Error: Only {len(slides)} slides exist")
        return None, None
    
    slide = slides[slide_index - 1]  # 1-indexed
    slide_id = slide.get('objectId')
    
    # Find text elements
    text_elements = []
    for element in slide.get('pageElements', []):
        obj_id = element.get('objectId')
        shape = element.get('shape', {})
        
        # Get current text
        text_content = ""
        for te in shape.get('text', {}).get('textElements', []):
            text_content += te.get('textRun', {}).get('content', '')
        
        if text_content.strip():
            text_elements.append({
                'id': obj_id,
                'text': text_content.strip()[:50]
            })
    
    return slide_id, text_elements


def replace_text(element_id, old_text, new_text):
    """Replace text in a specific element."""
    requests = [{
        'replaceAllText': {
            'containsText': {
                'text': old_text,
                'matchCase': False
            },
            'replaceText': new_text,
            'pageObjectIds': []  # Empty = all pages
        }
    }]
    
    result = slides_service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={'requests': requests}
    ).execute()
    
    return result


def replace_text_on_slide(slide_id, old_text, new_text):
    """Replace text only on a specific slide."""
    requests = [{
        'replaceAllText': {
            'containsText': {
                'text': old_text,
                'matchCase': False
            },
            'replaceText': new_text,
            'pageObjectIds': [slide_id]
        }
    }]
    
    result = slides_service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={'requests': requests}
    ).execute()
    
    return result


def export_thumbnail(slide_id, output_name):
    """Export a slide as thumbnail."""
    try:
        thumbnail = slides_service.presentations().pages().getThumbnail(
            presentationId=PRESENTATION_ID,
            pageObjectId=slide_id,
            thumbnailProperties_thumbnailSize='LARGE'
        ).execute()
        
        image_url = thumbnail.get('contentUrl')
        if image_url:
            response = requests.get(image_url)
            output_path = os.path.join(OUTPUT_DIR, output_name)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"Exported: {output_name}", flush=True)
            return output_path
    except Exception as e:
        print(f"Export failed: {e}", flush=True)
    return None


# ===== SLIDE 1: TITLE SLIDE =====
print("\n=== EDITING SLIDE 1: Title Slide ===", flush=True)

slide_id, elements = get_slide_info(1)
print(f"Slide ID: {slide_id}", flush=True)
print("Current text elements:", flush=True)
for elem in elements:
    print(f"  - {elem['text']}", flush=True)

# Make replacements
print("\nApplying text replacements...", flush=True)

# Replace main title
replace_text_on_slide(slide_id, "Accelerate Together!", "Resilience to Results")
print("  [OK] Title: 'Accelerate Together!' -> 'Resilience to Results'", flush=True)

# Replace subtitle
replace_text_on_slide(slide_id, "A review of 2024 and focus on 2025", "A review of 2025 and focus on 2026")
print("  [OK] Subtitle updated", flush=True)

# Replace date
replace_text_on_slide(slide_id, "01.21.2025", "01.20.2026")
print("  [OK] Date updated", flush=True)

# Export updated thumbnail
print("\nExporting updated slide...", flush=True)
export_thumbnail(slide_id, "slide_01_UPDATED.png")

print("\n[DONE] Slide 1 edited. Check new_deck_thumbnails/slide_01_UPDATED.png", flush=True)
