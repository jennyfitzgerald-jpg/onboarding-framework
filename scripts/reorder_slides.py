"""
REORDER SLIDES - Move needed slides to front, unneeded to back
"""
import pickle
import time
from googleapiclient.discovery import build

PRESENTATION_ID = '1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM'

with open('token.pickle', 'rb') as f:
    creds = pickle.load(f)
slides_service = build('slides', 'v1', credentials=creds)

# =============================================================
# DEFINE THE 50 SLIDES WE NEED (in final order)
# These will be moved to positions 1-50
# =============================================================
FINAL_ORDER = [
    # Section 1: Opening (1-7)
    1,   # Title
    2,   # Quote Arnie
    7,   # Welcome 60 new
    6,   # AI Vision  
    5,   # Global shortage
    4,   # What is Pathology
    3,   # Mission
    
    # Section 2: Problem (8-10)
    8,   # Democratising access (section)
    5,   # Pathology bottleneck (reuse)
    4,   # 3 Pillars (reuse)
    
    # Section 3: Reckoning (11-17)
    11,  # Section break
    25,  # FY25 numbers (147K)
    30,  # Revenue (10.9M)
    14,  # What Worked
    16,  # What Struggled
    17,  # Sales Evolution
    18,  # Tesla/Data Flywheel
    
    # Section 4: Market (18-21)
    19,  # Market consolidating 
    35,  # Series C (credibility)
    21,  # Market validation
    22,  # Strategic asset
    
    # Section 5: Strategy (22-32)
    23,  # 2026 Year of Execution
    60,  # 3 Pillars strategy
    31,  # Financial targets
    10,  # US Frontier (Patholytix)
    12,  # UK Fortress
    13,  # UK targets
    15,  # Customer testimonial
    55,  # Quality systems
    56,  # Tech comparison
    57,  # AI tools
    
    # Section 6: Tech (33-36)
    58,  # Tech priorities
    59,  # CAV Factory
    70,  # Operations
    71,  # More ops
    
    # Section 7: Culture (37-42)
    45,  # Culture Drucker quote
    46,  # Pirates Navy section
    47,  # Pirates vs Navy
    48,  # Expectations
    50,  # Think 2X (Execute 2026)
    60,  # AI Adoption stages
    
    # Section 8: Charge (43-50)
    62,  # Why we fight
    63,  # Human impact
    64,  # Benchmark
    40,  # Unicorn vision
    65,  # Call to action
    66,  # Three things
    77,  # Closing (Resilience to Results)
]

print("=" * 60)
print("REORDER SLIDES")
print("=" * 60)

# Get current slide IDs
print("\n[1] Getting current slide order...", flush=True)
pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get('slides', [])
print(f"    Total slides: {len(slides)}", flush=True)

# Map slide number to object ID
slide_ids = {i+1: s.get('objectId') for i, s in enumerate(slides)}

# Get unique slides we need (remove duplicates, keep order)
seen = set()
unique_final = []
for s in FINAL_ORDER:
    if s not in seen and s <= len(slides):
        seen.add(s)
        unique_final.append(s)

print(f"    Slides to keep at front: {len(unique_final)}", flush=True)

# Calculate slides to move to back
all_slides = set(range(1, len(slides) + 1))
keep_slides = set(unique_final)
move_to_back = sorted(all_slides - keep_slides)
print(f"    Slides to move to back: {len(move_to_back)}", flush=True)

# =============================================================
# REORDER: Move needed slides to front one by one
# =============================================================
print("\n[2] Moving slides to final positions...", flush=True)

# We'll move each slide to its target position
# Start from position 0 and work forward
requests_list = []

for target_pos, slide_num in enumerate(unique_final):
    slide_id = slide_ids.get(slide_num)
    if slide_id:
        requests_list.append({
            'updateSlidesPosition': {
                'slideObjectIds': [slide_id],
                'insertionIndex': target_pos
            }
        })

# Execute in batches to avoid rate limits
BATCH_SIZE = 10
total_batches = (len(requests_list) + BATCH_SIZE - 1) // BATCH_SIZE

print(f"    Executing {len(requests_list)} moves in {total_batches} batches...", flush=True)

for i in range(0, len(requests_list), BATCH_SIZE):
    batch = requests_list[i:i+BATCH_SIZE]
    batch_num = i // BATCH_SIZE + 1
    
    try:
        slides_service.presentations().batchUpdate(
            presentationId=PRESENTATION_ID,
            body={'requests': batch}
        ).execute()
        print(f"    [OK] Batch {batch_num}/{total_batches}", flush=True)
    except Exception as e:
        print(f"    [ERR] Batch {batch_num}: {str(e)[:50]}", flush=True)
    
    time.sleep(0.5)  # Rate limit protection

print("\n" + "=" * 60)
print("REORDER COMPLETE")
print("=" * 60)
print(f"\nFirst {len(unique_final)} slides are now the 2026 content")
print(f"Remaining {len(move_to_back)} slides moved to back (archive)")
print(f"\nView: https://docs.google.com/presentation/d/{PRESENTATION_ID}/edit")
