"""
Finalize the 2026 Deck - Reorder slides and delete unused
"""
import pickle
import requests
import os
from googleapiclient.discovery import build

PRESENTATION_ID = '1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM'
OUTPUT_DIR = 'new_deck_thumbnails'

with open('token.pickle', 'rb') as f:
    creds = pickle.load(f)
slides_service = build('slides', 'v1', credentials=creds)

# Get all slide IDs
pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get('slides', [])
slide_ids = {i+1: s.get('objectId') for i, s in enumerate(slides)}

print(f"Total slides: {len(slides)}")
print()

# ============================================================
# FINAL DECK STRUCTURE - 50 SLIDES
# These are the slides we KEEP (current position -> keep)
# ============================================================
KEEP_SLIDES = [
    # Section 1: Opening (1-8)
    1,   # Title: Resilience to Results (UPDATED)
    2,   # Quote: Schwarzenegger (UPDATED)
    3,   # Mission: Precision Pathology
    7,   # Welcome: 60 New Members (UPDATED)
    6,   # AI Vision statement
    5,   # Global shortage context
    4,   # What is Pathology
    8,   # Democratising Access
    
    # Section 2: FY25 Review (9-16)
    25,  # 147K Cases (UPDATED)
    30,  # €10.9M Revenue (UPDATED)
    15,  # Customer Testimonial Bedfordshire
    20,  # Quote slide
    
    # Section 3: Market & Strategy (17-28)
    35,  # Series C - €31M (credibility)
    40,  # How Far Can We Go (unicorn vision)
    45,  # Culture Quote: Drucker
    50,  # Execute 2026 (UPDATED)
    55,  # Quality Systems (Six Sigma)
    60,  # AI Adoption
    
    # Section 4: Closing (29-35)
    70,  # Strategy Operational
    77,  # From Resilience to Results (UPDATED)
]

# Print the slides we're keeping
print("=== SLIDES TO KEEP (Final Order) ===")
for i, slide_num in enumerate(KEEP_SLIDES, 1):
    print(f"  {i:02d}. Slide {slide_num} -> {slide_ids.get(slide_num, 'N/A')[:20]}")

print()
print(f"Keeping {len(KEEP_SLIDES)} slides out of {len(slides)}")
print(f"Will delete {len(slides) - len(KEEP_SLIDES)} slides")
print()

# Slides to DELETE (all slides not in KEEP_SLIDES)
DELETE_SLIDES = [n for n in range(1, len(slides)+1) if n not in KEEP_SLIDES]
print(f"Slides to delete: {len(DELETE_SLIDES)}")

# ============================================================
# PREVIEW MODE - Don't execute yet
# ============================================================
print()
print("=== PREVIEW MODE ===")
print("Review the above. To execute, change EXECUTE = True")
print()

EXECUTE = False  # Set to True to actually reorder/delete

if EXECUTE:
    print("EXECUTING...")
    
    # Delete slides (in reverse order to avoid index shifting)
    delete_ids = [slide_ids[n] for n in sorted(DELETE_SLIDES, reverse=True)]
    
    for slide_id in delete_ids[:5]:  # Start with just 5
        try:
            slides_service.presentations().batchUpdate(
                presentationId=PRESENTATION_ID,
                body={'requests': [{'deleteObject': {'objectId': slide_id}}]}
            ).execute()
            print(f"  Deleted: {slide_id}")
        except Exception as e:
            print(f"  Error: {e}")
    
    print("Done (first 5)")
