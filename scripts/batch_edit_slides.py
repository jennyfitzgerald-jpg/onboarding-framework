"""
Batch Slide Editor - Fast iterative updates
Uses cached thumbnails, only exports changes, batches API calls
"""
import pickle
import requests
import os
from googleapiclient.discovery import build

PRESENTATION_ID = '1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM'
OUTPUT_DIR = 'new_deck_thumbnails'

# Load credentials once
with open('token.pickle', 'rb') as f:
    creds = pickle.load(f)
slides_service = build('slides', 'v1', credentials=creds)

# Cache slide IDs (fetched once)
SLIDE_CACHE = {}

def get_slide_id(slide_num):
    """Get slide object ID from cache or fetch once."""
    if not SLIDE_CACHE:
        pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
        for i, slide in enumerate(pres.get('slides', [])):
            SLIDE_CACHE[i+1] = slide.get('objectId')
    return SLIDE_CACHE.get(slide_num)

def batch_update_texts(updates):
    """
    Batch update multiple text elements across slides.
    updates: list of (element_id, new_text) tuples
    """
    requests_list = []
    for element_id, new_text in updates:
        requests_list.append({'deleteText': {'objectId': element_id, 'textRange': {'type': 'ALL'}}})
        requests_list.append({'insertText': {'objectId': element_id, 'text': new_text, 'insertionIndex': 0}})
    
    if requests_list:
        slides_service.presentations().batchUpdate(
            presentationId=PRESENTATION_ID,
            body={'requests': requests_list}
        ).execute()
    return len(updates)

def export_slide(slide_num, suffix=''):
    """Export a single slide thumbnail."""
    slide_id = get_slide_id(slide_num)
    thumbnail = slides_service.presentations().pages().getThumbnail(
        presentationId=PRESENTATION_ID,
        pageObjectId=slide_id,
        thumbnailProperties_thumbnailSize='LARGE'
    ).execute()
    
    response = requests.get(thumbnail.get('contentUrl'))
    filename = f'slide_{slide_num:02d}{suffix}.png'
    with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
        f.write(response.content)
    return filename

def move_slide(from_position, to_position):
    """Move a slide from one position to another."""
    slide_id = get_slide_id(from_position)
    slides_service.presentations().batchUpdate(
        presentationId=PRESENTATION_ID,
        body={'requests': [{
            'updateSlidesPosition': {
                'slideObjectIds': [slide_id],
                'insertionIndex': to_position - 1  # 0-indexed
            }
        }]}
    ).execute()

def delete_slides(slide_nums):
    """Delete multiple slides at once."""
    requests_list = []
    for num in slide_nums:
        slide_id = get_slide_id(num)
        if slide_id:
            requests_list.append({'deleteObject': {'objectId': slide_id}})
    
    if requests_list:
        slides_service.presentations().batchUpdate(
            presentationId=PRESENTATION_ID,
            body={'requests': requests_list}
        ).execute()

def get_slide_elements(slide_num):
    """Get all text elements from a slide."""
    pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
    slide = pres.get('slides', [])[slide_num - 1]
    
    elements = []
    for element in slide.get('pageElements', []):
        obj_id = element.get('objectId')
        shape = element.get('shape', {})
        text_data = shape.get('text', {})
        if text_data:
            full_text = ''
            for te in text_data.get('textElements', []):
                full_text += te.get('textRun', {}).get('content', '')
            if full_text.strip():
                elements.append({'id': obj_id, 'text': full_text.strip()})
    return elements


# ============================================================
# BATCH EDIT DEFINITIONS
# Define all remaining edits here, then execute in one batch
# ============================================================

EDITS = {
    # Slide 50 (Think 2X) - update to 2026 message
    50: [
        # Will be populated with element IDs after inspection
    ],
    
    # Slide 70 (Strategy Operational) - update for 2026
    70: [
        # Will be populated
    ],
}

if __name__ == '__main__':
    print("=" * 60)
    print("BATCH SLIDE EDITOR")
    print("=" * 60)
    
    # Initialize cache
    print("\n[1] Loading slide cache...", flush=True)
    get_slide_id(1)
    print(f"    Cached {len(SLIDE_CACHE)} slides", flush=True)
    
    # Show available slides (from cached thumbnails)
    print("\n[2] Cached thumbnails available:", flush=True)
    thumbnails = sorted([f for f in os.listdir(OUTPUT_DIR) if f.startswith('slide_') and f.endswith('.png')])
    print(f"    {len(thumbnails)} thumbnails ready for local viewing", flush=True)
    
    print("\n[3] Ready for batch edits", flush=True)
    print("    Use: batch_update_texts([(element_id, new_text), ...])")
    print("    Use: export_slide(slide_num) to get updated thumbnail")
    print("    Use: delete_slides([num1, num2, ...]) to remove slides")
    print("    Use: move_slide(from_pos, to_pos) to reorder")
