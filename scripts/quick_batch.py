"""Quick batch edit - all remaining key slides"""
import pickle
import requests
import os
from googleapiclient.discovery import build

PRESENTATION_ID = '1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM'
OUTPUT_DIR = 'new_deck_thumbnails'

with open('token.pickle', 'rb') as f:
    creds = pickle.load(f)
slides_service = build('slides', 'v1', credentials=creds)

print('=== ANALYZING SLIDES 35, 40, 55 ===', flush=True)

pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
slides = pres.get('slides', [])

for slide_num in [35, 40, 55]:
    slide = slides[slide_num - 1]
    slide_id = slide.get('objectId')
    print(f'\n--- SLIDE {slide_num} (ID: {slide_id}) ---', flush=True)
    
    for element in slide.get('pageElements', []):
        obj_id = element.get('objectId')
        shape = element.get('shape', {})
        text_data = shape.get('text', {})
        if text_data:
            full_text = ''
            for te in text_data.get('textElements', []):
                full_text += te.get('textRun', {}).get('content', '')
            if full_text.strip():
                print(f'  {obj_id}: {full_text.strip()[:55]}', flush=True)
