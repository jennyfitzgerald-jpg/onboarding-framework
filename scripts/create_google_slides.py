"""
Deciphex 2026 Kickoff - Google Slides Generator (Template-Based)
Creates a native Google Slides presentation by copying and adapting template slides.

This version:
1. Copies the template presentation (never modifies original)
2. Analyzes each template slide to categorize it
3. For each content slide, duplicates the best-matching template slide
4. Modifies the duplicated slide with new content
5. Deletes the original template slides
"""

import os
import re
import time
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# =============================================================================
# CONFIGURATION
# =============================================================================

# Deciphex 2025 template - will be COPIED, never modified
TEMPLATE_PRESENTATION_ID = "1u33Ce9BtozFyQZZM7wfEz84EtwPNTn0ULZTEon2gclI"

# Email to share the presentation with
SHARE_WITH_EMAIL = "donal.oshea@deciphex.com"

# API rate limiting (requests per minute)
REQUESTS_PER_MINUTE = 60
REQUEST_DELAY = 60.0 / REQUESTS_PER_MINUTE  # ~1 second between requests

# Scopes
SCOPES = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
]


def get_credentials():
    """Get Google API credentials - supports both service account and OAuth."""
    
    # First, try service account
    service_account_file = os.path.join(os.path.dirname(__file__), 'service-account.json')
    if os.path.exists(service_account_file):
        print("       Using service account authentication")
        creds = service_account.Credentials.from_service_account_file(
            service_account_file,
            scopes=SCOPES
        )
        return creds
    
    # Fall back to OAuth
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
            if not os.path.exists(credentials_file):
                print("\n[ERROR] No credentials found!")
                return None
            
            print("       Using OAuth authentication (browser will open)")
            flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open(token_file, 'wb') as token:
            pickle.dump(creds, token)
    
    return creds


def rate_limited_request(func, *args, **kwargs):
    """Execute a request with rate limiting and retry logic."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            time.sleep(REQUEST_DELAY)
            return func(*args, **kwargs)
        except HttpError as e:
            if e.resp.status == 429:  # Rate limited
                wait_time = (attempt + 1) * 30
                print(f"       [RATE LIMITED] Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
    raise Exception("Max retries exceeded")


def parse_markdown_deck(filepath):
    """Parse EXTENDED_CONSENSUS_DECK.md into slide objects."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    slides = []
    
    # Split by slide markers
    slide_pattern = r'## SLIDE (\d+): (.+?)(?=\n---|\n## SLIDE|\n# SECTION|\n# APPENDIX|$)'
    slide_matches = re.finditer(slide_pattern, content, re.DOTALL)
    
    for match in slide_matches:
        slide_num = int(match.group(1))
        slide_content = match.group(2).strip()
        
        lines = slide_content.split('\n')
        title = lines[0].strip() if lines else f"Slide {slide_num}"
        
        body = ""
        notes = ""
        
        if '**SPEAKER NOTES:**' in slide_content:
            parts = slide_content.split('**SPEAKER NOTES:**')
            body = parts[0].strip()
            notes = parts[1].strip() if len(parts) > 1 else ""
        else:
            body = slide_content
        
        body_lines = body.split('\n')[1:]
        body = '\n'.join(body_lines).strip()
        
        slide_type = detect_slide_type(title, body, slide_num)
        
        # Clean notes
        notes = re.sub(r'^- ', '', notes, flags=re.MULTILINE)
        notes = notes.replace('- ', '\n')
        
        slides.append({
            'num': slide_num,
            'title': title,
            'body': body,
            'notes': notes,
            'type': slide_type
        })
    
    return slides


def detect_slide_type(title, body, slide_num):
    """Detect the optimal slide type based on content analysis."""
    title_lower = title.lower()
    body_lower = body.lower()
    
    # Title slide (slide 1)
    if slide_num == 1:
        return 'title'
    
    # Section breaks
    if 'section break' in title_lower:
        return 'section'
    
    # Memorial
    if 'memory' in title_lower or 'memorial' in title_lower:
        return 'memorial'
    
    # Quote slides
    if '>' in body and ('--' in body or '—' in body):
        return 'quote'
    
    # Closing
    if any(phrase in title_lower for phrase in ['call to action', 'closing', 'thank you', 'three things']):
        return 'closing'
    
    # Metrics (big numbers)
    metric_patterns = [r'€\d+', r'\$\d+', r'\d+%', r'\d{2,3}[Kk]']
    metric_count = sum(len(re.findall(p, body)) for p in metric_patterns)
    if metric_count >= 3:
        return 'metrics'
    
    # Table slides
    if body.count('|') >= 6:
        return 'table'
    
    return 'content'


def analyze_template_slides(service, presentation_id):
    """Analyze template slides to categorize them for reuse."""
    presentation = service.presentations().get(presentationId=presentation_id).execute()
    slides = presentation.get('slides', [])
    
    template_slides = {
        'title': None,
        'quote': None,
        'section': None,
        'content': None,
        'metrics': None,
        'table': None,
        'closing': None,
        'memorial': None,
    }
    
    for i, slide in enumerate(slides):
        slide_id = slide.get('objectId')
        
        # Extract text from the slide to categorize it
        text_content = ""
        has_quote_marks = False
        has_big_number = False
        has_image = False
        
        for element in slide.get('pageElements', []):
            # Check for images
            if 'image' in element:
                has_image = True
            
            shape = element.get('shape', {})
            text_elements = shape.get('text', {}).get('textElements', [])
            
            for te in text_elements:
                text_run = te.get('textRun', {})
                content = text_run.get('content', '')
                text_content += content
                
                # Check for quote marks
                if '"' in content or '"' in content or '❝' in content:
                    has_quote_marks = True
                
                # Check for big numbers (large font)
                style = text_run.get('style', {})
                font_size = style.get('fontSize', {}).get('magnitude', 0)
                if font_size >= 72 and re.search(r'\d+', content):
                    has_big_number = True
        
        text_lower = text_content.lower()
        
        # Categorize based on content patterns
        if i == 0 and has_image:
            template_slides['title'] = slide_id
        elif has_quote_marks or 'quote' in text_lower:
            if not template_slides['quote']:
                template_slides['quote'] = slide_id
        elif has_big_number:
            if not template_slides['metrics']:
                template_slides['metrics'] = slide_id
        elif 'precision pathology' in text_lower or 'mission' in text_lower:
            if not template_slides['section']:
                template_slides['section'] = slide_id
        elif has_image and len(text_content) < 200:
            if not template_slides['closing']:
                template_slides['closing'] = slide_id
        elif '|' in text_content or 'table' in text_lower:
            if not template_slides['table']:
                template_slides['table'] = slide_id
        else:
            if not template_slides['content']:
                template_slides['content'] = slide_id
    
    # Fill in any missing with content as fallback
    fallback = template_slides['content'] or (slides[1]['objectId'] if len(slides) > 1 else slides[0]['objectId'])
    for key in template_slides:
        if template_slides[key] is None:
            template_slides[key] = fallback
    
    return template_slides, slides


def duplicate_slide(service, presentation_id, source_slide_id, insertion_index):
    """Duplicate a slide and return the new slide's ID."""
    requests = [{
        'duplicateObject': {
            'objectId': source_slide_id,
        }
    }]
    
    response = rate_limited_request(
        lambda: service.presentations().batchUpdate(
            presentationId=presentation_id,
            body={'requests': requests}
        ).execute()
    )
    
    new_slide_id = response.get('replies', [{}])[0].get('duplicateObject', {}).get('objectId')
    return new_slide_id


def get_text_elements(service, presentation_id, slide_id):
    """Get all text elements from a slide."""
    presentation = service.presentations().get(presentationId=presentation_id).execute()
    
    for slide in presentation.get('slides', []):
        if slide.get('objectId') == slide_id:
            text_elements = []
            for element in slide.get('pageElements', []):
                shape = element.get('shape', {})
                if shape.get('text'):
                    text_elements.append({
                        'objectId': element.get('objectId'),
                        'text': shape.get('text'),
                        'placeholder_type': shape.get('placeholder', {}).get('type')
                    })
            return text_elements
    return []


def replace_slide_text(service, presentation_id, slide_id, title, body):
    """Replace text in a slide's placeholders."""
    text_elements = get_text_elements(service, presentation_id, slide_id)
    
    requests = []
    
    # Clean the text
    title = re.sub(r'\*\*(.+?)\*\*', r'\1', title)
    title = re.sub(r'\*(.+?)\*', r'\1', title)
    title = title.replace('#', '').strip()
    
    body = re.sub(r'\*\*(.+?)\*\*', r'\1', body)
    body = re.sub(r'\*(.+?)\*', r'\1', body)
    body = re.sub(r'> ', '', body)
    body = re.sub(r'\[.*?\]', '', body)
    
    # Clean up tables
    if '|' in body:
        lines = body.split('\n')
        cleaned_lines = []
        for line in lines:
            if '|' in line and not line.strip().startswith('|--'):
                cells = [c.strip() for c in line.split('|') if c.strip()]
                if cells:
                    cleaned_lines.append(' | '.join(cells))
            elif not line.strip().startswith('|'):
                cleaned_lines.append(line)
        body = '\n'.join(cleaned_lines)
    
    for elem in text_elements:
        obj_id = elem['objectId']
        placeholder = elem.get('placeholder_type')
        
        # Delete existing text
        requests.append({
            'deleteText': {
                'objectId': obj_id,
                'textRange': {'type': 'ALL'}
            }
        })
        
        # Insert new text based on placeholder type
        if placeholder in ['TITLE', 'CENTERED_TITLE']:
            requests.append({
                'insertText': {
                    'objectId': obj_id,
                    'text': title[:200],  # Limit length
                    'insertionIndex': 0
                }
            })
        elif placeholder in ['BODY', 'SUBTITLE']:
            requests.append({
                'insertText': {
                    'objectId': obj_id,
                    'text': body[:2000],  # Limit length
                    'insertionIndex': 0
                }
            })
    
    if requests:
        try:
            rate_limited_request(
                lambda: service.presentations().batchUpdate(
                    presentationId=presentation_id,
                    body={'requests': requests}
                ).execute()
            )
        except Exception as e:
            # Text replacement might fail on some elements, continue
            pass


def add_speaker_notes(service, presentation_id, slide_id, notes_text):
    """Add speaker notes to a slide."""
    if not notes_text:
        return
    
    presentation = service.presentations().get(presentationId=presentation_id).execute()
    
    notes_id = None
    for slide in presentation.get('slides', []):
        if slide.get('objectId') == slide_id:
            notes_page = slide.get('slideProperties', {}).get('notesPage', {})
            for element in notes_page.get('pageElements', []):
                shape = element.get('shape', {})
                if shape.get('placeholder', {}).get('type') == 'BODY':
                    notes_id = element.get('objectId')
                    break
            break
    
    if notes_id:
        clean_notes = notes_text.replace('- ', '\n').strip()
        clean_notes = re.sub(r'\*\*(.+?)\*\*', r'\1', clean_notes)
        clean_notes = re.sub(r'\*(.+?)\*', r'\1', clean_notes)
        # Remove problematic unicode
        clean_notes = clean_notes.encode('ascii', 'ignore').decode('ascii')
        
        requests = [{
            'deleteText': {
                'objectId': notes_id,
                'textRange': {'type': 'ALL'}
            }
        }, {
            'insertText': {
                'objectId': notes_id,
                'text': clean_notes[:5000],
                'insertionIndex': 0
            }
        }]
        
        try:
            rate_limited_request(
                lambda: service.presentations().batchUpdate(
                    presentationId=presentation_id,
                    body={'requests': requests}
                ).execute()
            )
        except:
            pass


def main():
    print("=" * 60)
    print("Deciphex 2026 Kickoff - Template-Based Generator")
    print("=" * 60)
    print(f"[INFO] Template: {TEMPLATE_PRESENTATION_ID}")
    print("[INFO] Will COPY template, never modify original")
    
    # Authenticate
    print("\n[1/6] Authenticating with Google...")
    creds = get_credentials()
    if not creds:
        return
    
    slides_service = build('slides', 'v1', credentials=creds)
    drive_service = build('drive', 'v3', credentials=creds)
    
    # Parse content
    print("[2/6] Parsing EXTENDED_CONSENSUS_DECK.md...")
    deck_path = os.path.join(os.path.dirname(__file__), 'EXTENDED_CONSENSUS_DECK.md')
    slides_data = parse_markdown_deck(deck_path)
    print(f"       Found {len(slides_data)} slides to create")
    
    # Show type distribution
    type_counts = {}
    for s in slides_data:
        type_counts[s['type']] = type_counts.get(s['type'], 0) + 1
    print("       Slide types:")
    for stype, count in sorted(type_counts.items()):
        print(f"         - {stype}: {count}")
    
    # Copy template
    print("[3/6] Copying template to new presentation...")
    new_title = "Deciphex 2026 Kickoff: Resilience to Results"
    copied_file = rate_limited_request(
        lambda: drive_service.files().copy(
            fileId=TEMPLATE_PRESENTATION_ID,
            body={'name': new_title}
        ).execute()
    )
    presentation_id = copied_file.get('id')
    print(f"[OK] Created: {new_title}")
    print(f"[OK] ID: {presentation_id}")
    print(f"[OK] URL: https://docs.google.com/presentation/d/{presentation_id}/edit")
    
    # Analyze template slides
    print("[4/6] Analyzing template slide types...")
    template_map, original_slides = analyze_template_slides(slides_service, presentation_id)
    print("       Template slide mapping:")
    for stype, sid in template_map.items():
        status = "found" if sid else "missing"
        print(f"         - {stype}: {status}")
    
    # Store original slide IDs for deletion later
    original_slide_ids = [s['objectId'] for s in original_slides]
    
    # Create new slides by duplicating and modifying template slides
    print("[5/6] Building slides from templates...")
    new_slide_ids = []
    
    for i, slide_data in enumerate(slides_data):
        try:
            slide_type = slide_data['type']
            template_slide_id = template_map.get(slide_type, template_map['content'])
            
            # Duplicate the template slide
            new_slide_id = duplicate_slide(
                slides_service, 
                presentation_id, 
                template_slide_id,
                len(original_slides) + i
            )
            new_slide_ids.append(new_slide_id)
            
            # Replace text content
            replace_slide_text(
                slides_service,
                presentation_id,
                new_slide_id,
                slide_data['title'],
                slide_data['body']
            )
            
            # Add speaker notes
            add_speaker_notes(
                slides_service,
                presentation_id,
                new_slide_id,
                slide_data['notes']
            )
            
            print(f"       Slide {slide_data['num']:2d} [{slide_type:8s}]: {slide_data['title'][:35]}...")
            
        except Exception as e:
            error_msg = str(e)[:40]
            print(f"       [WARN] Slide {slide_data['num']}: {error_msg}")
    
    # Delete original template slides
    print("[6/6] Cleaning up template slides...")
    delete_requests = [{'deleteObject': {'objectId': sid}} for sid in original_slide_ids]
    if delete_requests:
        try:
            # Delete in batches to avoid rate limits
            batch_size = 10
            for i in range(0, len(delete_requests), batch_size):
                batch = delete_requests[i:i+batch_size]
                rate_limited_request(
                    lambda b=batch: slides_service.presentations().batchUpdate(
                        presentationId=presentation_id,
                        body={'requests': b}
                    ).execute()
                )
            print(f"       Removed {len(original_slide_ids)} template slides")
        except Exception as e:
            print(f"       [WARN] Could not remove some template slides: {str(e)[:40]}")
    
    # Share presentation
    if SHARE_WITH_EMAIL:
        print("\n[SHARING] Granting access...")
        try:
            rate_limited_request(
                lambda: drive_service.permissions().create(
                    fileId=presentation_id,
                    body={
                        'type': 'user',
                        'role': 'writer',
                        'emailAddress': SHARE_WITH_EMAIL
                    },
                    sendNotificationEmail=True
                ).execute()
            )
            print(f"       Shared with {SHARE_WITH_EMAIL}")
        except Exception as e:
            print(f"       [WARN] Could not share: {str(e)[:40]}")
    
    print("\n" + "=" * 60)
    print("[DONE] Presentation created successfully!")
    print(f"URL: https://docs.google.com/presentation/d/{presentation_id}/edit")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Open the URL in your browser")
    print("2. Review slide formatting")
    print("3. Adjust any slides that need refinement")
    print("4. The original template was NOT modified")


if __name__ == '__main__':
    main()
