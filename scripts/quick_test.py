"""Quick test - just copy template and list slides."""
import sys
print("Starting...", flush=True)

import os
import pickle
print("Imports done", flush=True)

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
print("Google imports done", flush=True)

TEMPLATE_ID = "1u33Ce9BtozFyQZZM7wfEz84EtwPNTn0ULZTEon2gclI"
SCOPES = ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive']

# Get credentials
print("Getting credentials...", flush=True)
token_file = os.path.join(os.path.dirname(__file__), 'token.pickle')
credentials_file = os.path.join(os.path.dirname(__file__), 'credentials.json')

creds = None
if os.path.exists(token_file):
    print("Loading saved token...", flush=True)
    with open(token_file, 'rb') as f:
        creds = pickle.load(f)

if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        print("Refreshing token...", flush=True)
        creds.refresh(Request())
    else:
        print("Opening browser for auth...", flush=True)
        flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
        creds = flow.run_local_server(port=0)
    with open(token_file, 'wb') as f:
        pickle.dump(creds, f)

print("Authenticated!", flush=True)

# Build services
print("Building API services...", flush=True)
slides_service = build('slides', 'v1', credentials=creds)
drive_service = build('drive', 'v3', credentials=creds)
print("Services ready!", flush=True)

# Copy template
print("Copying template to new presentation...", flush=True)
copied = drive_service.files().copy(
    fileId=TEMPLATE_ID,
    body={'name': 'Deciphex 2026 Kickoff - TEST'}
).execute()
new_id = copied.get('id')
print(f"NEW PRESENTATION ID: {new_id}", flush=True)
print(f"URL: https://docs.google.com/presentation/d/{new_id}/edit", flush=True)

# List slides
print("Getting slide list...", flush=True)
pres = slides_service.presentations().get(presentationId=new_id).execute()
slides = pres.get('slides', [])
print(f"Found {len(slides)} slides", flush=True)

for i, slide in enumerate(slides):
    print(f"  Slide {i+1}: {slide.get('objectId')}", flush=True)

print("\nDONE! Check the URL above.", flush=True)
