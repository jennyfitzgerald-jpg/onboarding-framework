"""
Edit slide text using delete and insert approach.
"""
import os
import pickle
import requests

from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'new_deck_thumbnails')

# Get credentials
token_file = os.path.join(os.path.dirname(__file__), 'token.pickle')
with open(token_file, 'rb') as f:
    creds = pickle.load(f)

slides_service = build('slides', 'v1', credentials=creds)
print("Connected", flush=True)


def get_text_boxes(slide_index):
    """Get all text boxes and their content from a slide."""
    pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
    slides = pres.get('slides', [])
    slide = slides[slide_index - 1]
    slide_id = slide.get('objectId')
    
    text_boxes = []
    for element in slide.get('pageElements', []):
        obj_id = element.get('objectId')
        shape = element.get('shape', {})
        text_data = shape.get('text', {})
        
        if text_data:
            # Get full text
            full_text = ""
            for te in text_data.get('textElements', []):
                content = te.get('textRun', {}).get('content', '')
                full_text += content
            
            if full_text.strip():
                text_boxes.append({
                    'id': obj_id,
                    'text': full_text.strip(),
                    'text_length': len(full_text)
                })
    
    return slide_id, text_boxes


def replace_element_text(element_id, new_text):
    """Replace all text in an element."""
    # First delete all text, then insert new text
    requests = [
        {
            'deleteText': {
                'objectId': element_id,
                'textRange': {'type': 'ALL'}
            }
        },
        {
            'insertText': {
                'objectId': element_id,
                'text': new_text,
                'insertionIndex': 0
            }
        }
    ]
    
    result = slides_service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={'requests': requests}
    ).execute()
    return result


def export_thumbnail(slide_id, output_name):
    """Export a slide as thumbnail."""
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
    return None


# ===== SLIDE 1: Get current text boxes =====
print("\n=== SLIDE 1 TEXT BOXES ===", flush=True)
slide_id, text_boxes = get_text_boxes(1)

for i, tb in enumerate(text_boxes):
    print(f"\n[{i}] ID: {tb['id']}", flush=True)
    print(f"    Text: '{tb['text']}'", flush=True)

# Based on inspection, manually map:
# - Box containing "Accelerate Together!" -> new title
# - Box containing "A review of 2024" -> new subtitle

print("\n=== APPLYING EDITS ===", flush=True)

for tb in text_boxes:
    if "Accelerate Together" in tb['text']:
        print(f"Updating title box...", flush=True)
        replace_element_text(tb['id'], "Resilience to Results")
        print(f"  [OK] Title -> 'Resilience to Results'", flush=True)
    
    elif "review of 2024" in tb['text']:
        print(f"Updating subtitle box...", flush=True)
        replace_element_text(tb['id'], "A review of 2025 and focus on 2026")
        print(f"  [OK] Subtitle -> 'A review of 2025 and focus on 2026'", flush=True)

# Export
print("\n=== EXPORTING ===", flush=True)
export_thumbnail(slide_id, "slide_01_v2.png")
print("\n[DONE] Check new_deck_thumbnails/slide_01_v2.png", flush=True)
