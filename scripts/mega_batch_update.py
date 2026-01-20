"""
MEGA BATCH UPDATE - Update all 35 remaining slides efficiently
"""
import pickle
import requests
import os
import time
from googleapiclient.discovery import build

PRESENTATION_ID = '1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM'
OUTPUT_DIR = 'new_deck_thumbnails'

with open('token.pickle', 'rb') as f:
    creds = pickle.load(f)
slides_service = build('slides', 'v1', credentials=creds)

# =============================================================
# STEP 1: Get presentation and build slide ID map
# =============================================================
print("=" * 60)
print("MEGA BATCH UPDATE - 35 Slides")
print("=" * 60)
print("\n[1] Loading presentation...", flush=True)

pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get('slides', [])
print(f"    Found {len(slides)} slides", flush=True)

# Build slide ID map (1-indexed)
SLIDE_IDS = {i+1: s.get('objectId') for i, s in enumerate(slides)}

# =============================================================
# STEP 2: Define all updates (slide_num, element_updates)
# =============================================================
# Will scan each slide and update title/main text

TITLE_UPDATES = {
    # Section breaks and titles to update
    4: "A Year of Adversity",
    5: "In Memory",  # Memorial slide
    6: "We Turned a Corner",
    8: "The Global Crisis",
    11: "The Honest Assessment",
    14: "What Worked",
    15: "What Struggled", 
    16: "The Sales Evolution",
    17: "The Data Flywheel",
    18: "The Market Is Consolidating",
    19: "Market Validation: Paige AI",
    20: "Market Validation: Modella AI",
    21: "We Are The Strategic Asset",
    22: "2026: Year of Execution",
    23: "Three Strategic Pillars",
    24: "2026 Financial Targets",
    26: "US Growth Levers",
    27: "The UK Fortress",
    28: "UK Territory Targets",
    29: "Strategic Partnerships",
    31: "The 500x Story",
    32: "AI Tools - Approved",
    33: "Building The Future",
    34: "Technology Priorities",
    35: "The CAV Factory",
    37: "Pirates + Navy",
    38: "From Pirates to Navy",
    39: "2026 Behaviors",
    42: "New Leadership",
    43: "Why We Fight",
    44: "147,000 Lives Impacted",
    45: "Top 0.5% Trajectory",
    48: "The Call to Action",
    49: "Three Things I'm Asking",
}

print(f"\n[2] Will update {len(TITLE_UPDATES)} slide titles", flush=True)

# =============================================================
# STEP 3: Find title elements for each slide
# =============================================================
print("\n[3] Scanning for title elements...", flush=True)

updates_to_make = []

for slide_num, new_title in TITLE_UPDATES.items():
    if slide_num > len(slides):
        print(f"    SKIP slide {slide_num} (not enough slides)", flush=True)
        continue
        
    slide = slides[slide_num - 1]
    
    # Find title element (usually first text box or one with large font)
    for element in slide.get('pageElements', []):
        obj_id = element.get('objectId')
        shape = element.get('shape', {})
        text_data = shape.get('text', {})
        
        if text_data:
            # Check if this looks like a title (usually shorter text at top)
            full_text = ''
            for te in text_data.get('textElements', []):
                full_text += te.get('textRun', {}).get('content', '')
            
            # If it's a title-like element (short, non-number)
            if full_text.strip() and len(full_text.strip()) < 100 and full_text.strip() != '0':
                updates_to_make.append({
                    'slide': slide_num,
                    'element_id': obj_id,
                    'old_text': full_text.strip()[:30],
                    'new_text': new_title
                })
                break  # Found title, move to next slide

print(f"    Found {len(updates_to_make)} elements to update", flush=True)

# =============================================================
# STEP 4: Execute batch update
# =============================================================
print("\n[4] Executing batch update...", flush=True)

# Build requests
requests_list = []
for update in updates_to_make:
    requests_list.append({
        'deleteText': {
            'objectId': update['element_id'],
            'textRange': {'type': 'ALL'}
        }
    })
    requests_list.append({
        'insertText': {
            'objectId': update['element_id'],
            'text': update['new_text'],
            'insertionIndex': 0
        }
    })

# Execute in batches of 50 requests (25 slides) to avoid limits
BATCH_SIZE = 50
total_batches = (len(requests_list) + BATCH_SIZE - 1) // BATCH_SIZE

for i in range(0, len(requests_list), BATCH_SIZE):
    batch = requests_list[i:i+BATCH_SIZE]
    batch_num = i // BATCH_SIZE + 1
    print(f"    Batch {batch_num}/{total_batches}: {len(batch)//2} slides...", flush=True)
    
    try:
        slides_service.presentations().batchUpdate(
            presentationId=PRESENTATION_ID,
            body={'requests': batch}
        ).execute()
        print(f"    [OK] Batch {batch_num} complete", flush=True)
    except Exception as e:
        print(f"    [ERR] Batch {batch_num}: {e}", flush=True)
    
    time.sleep(0.5)  # Rate limit protection

# =============================================================
# STEP 5: Export updated slides
# =============================================================
print("\n[5] Exporting updated slides...", flush=True)

updated_slides = set(u['slide'] for u in updates_to_make)
for slide_num in sorted(updated_slides)[:10]:  # First 10 for preview
    try:
        slide_id = SLIDE_IDS[slide_num]
        thumbnail = slides_service.presentations().pages().getThumbnail(
            presentationId=PRESENTATION_ID,
            pageObjectId=slide_id,
            thumbnailProperties_thumbnailSize='LARGE'
        ).execute()
        
        response = requests.get(thumbnail.get('contentUrl'))
        filename = f'slide_{slide_num:02d}_v2.png'
        with open(os.path.join(OUTPUT_DIR, filename), 'wb') as f:
            f.write(response.content)
        print(f"    [OK] {filename}", flush=True)
    except Exception as e:
        print(f"    [ERR] Slide {slide_num}: {e}", flush=True)

print("\n" + "=" * 60)
print("MEGA BATCH COMPLETE")
print("=" * 60)
print(f"\nUpdated: {len(updates_to_make)} slides")
print(f"View deck: https://docs.google.com/presentation/d/{PRESENTATION_ID}/edit")
