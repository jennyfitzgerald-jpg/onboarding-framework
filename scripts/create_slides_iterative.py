"""
Iterative Slide Creator with Visual Verification
Creates slides one at a time and exports thumbnails for review.
"""

import os
import re
import time
import pickle
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Configuration
TEMPLATE_ID = "1u33Ce9BtozFyQZZM7wfEz84EtwPNTn0ULZTEon2gclI"
SCOPES = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive',
]

def get_credentials():
    """Get OAuth credentials."""
    credentials_file = os.path.join(os.path.dirname(__file__), 'credentials.json')
    token_file = os.path.join(os.path.dirname(__file__), 'token.pickle')
    
    creds = None
    if os.path.exists(token_file):
        with open(token_file, 'rb') as token:
            creds = pickle.load(token)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_file, 'wb') as token:
            pickle.dump(creds, token)
    
    return creds


def get_slide_thumbnail(slides_service, presentation_id, slide_id, output_path):
    """Export a slide as a thumbnail image."""
    try:
        thumbnail = slides_service.presentations().pages().getThumbnail(
            presentationId=presentation_id,
            pageObjectId=slide_id,
            thumbnailProperties_thumbnailSize='LARGE'
        ).execute()
        
        image_url = thumbnail.get('contentUrl')
        if image_url:
            response = requests.get(image_url)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"Could not get thumbnail: {e}")
    return False


def analyze_template(slides_service, presentation_id):
    """Analyze template slides and categorize them."""
    presentation = slides_service.presentations().get(presentationId=presentation_id).execute()
    slides = presentation.get('slides', [])
    
    print(f"\n=== TEMPLATE ANALYSIS ===")
    print(f"Found {len(slides)} slides in template\n")
    
    slide_info = []
    for i, slide in enumerate(slides):
        slide_id = slide.get('objectId')
        
        # Extract text
        text_content = ""
        for element in slide.get('pageElements', []):
            shape = element.get('shape', {})
            for te in shape.get('text', {}).get('textElements', []):
                text_content += te.get('textRun', {}).get('content', '')
        
        # First 100 chars
        preview = text_content.replace('\n', ' ')[:100].strip()
        slide_info.append({
            'index': i,
            'id': slide_id,
            'preview': preview
        })
        print(f"Slide {i+1}: {preview[:60]}...")
    
    return slides, slide_info


def copy_template(drive_service, template_id, new_name):
    """Copy the template to a new presentation."""
    copied = drive_service.files().copy(
        fileId=template_id,
        body={'name': new_name}
    ).execute()
    return copied.get('id')


def main():
    print("=" * 60)
    print("ITERATIVE SLIDE CREATOR WITH VISUAL VERIFICATION")
    print("=" * 60)
    
    # Authenticate
    print("\n[1] Authenticating...")
    creds = get_credentials()
    slides_service = build('slides', 'v1', credentials=creds)
    drive_service = build('drive', 'v3', credentials=creds)
    
    # Analyze the template first
    print("\n[2] Analyzing template slides...")
    slides, slide_info = analyze_template(slides_service, TEMPLATE_ID)
    
    # Create output directory for thumbnails
    thumb_dir = os.path.join(os.path.dirname(__file__), 'slide_thumbnails')
    os.makedirs(thumb_dir, exist_ok=True)
    
    # Export thumbnails of template slides
    print("\n[3] Exporting template slide thumbnails...")
    for info in slide_info:
        thumb_path = os.path.join(thumb_dir, f"template_slide_{info['index']+1:02d}.png")
        if get_slide_thumbnail(slides_service, TEMPLATE_ID, info['id'], thumb_path):
            print(f"    Exported: template_slide_{info['index']+1:02d}.png")
        time.sleep(0.5)  # Rate limiting
    
    print(f"\n[DONE] Thumbnails saved to: {thumb_dir}")
    print("\nNext: Review the thumbnails to identify which slides to reuse.")
    print("The template slides are now available for visual inspection.")


if __name__ == '__main__':
    main()
