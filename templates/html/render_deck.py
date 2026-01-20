#!/usr/bin/env python3
"""
Batch render an entire deck from a JSON definition file.

Usage:
    python render_deck.py --deck ../deck_2026_kickoff.json --output-dir ../../output/html_slides
    
This will render all slides defined in the JSON file to individual HTML files.
"""

import argparse
import json
import os
from pathlib import Path
from render_template import render_slide, get_template_path


def get_navigation_html(slide_num: int, total_slides: int, slides: list) -> str:
    """Generate navigation HTML with keyboard support."""
    
    # Find prev/next filenames
    prev_file = None
    next_file = None
    
    for i, s in enumerate(slides):
        if s.get('slide_number') == slide_num:
            if i > 0:
                prev_s = slides[i - 1]
                prev_file = f"slide_{str(prev_s['slide_number']).zfill(2)}_{prev_s['template']}.html"
            if i < len(slides) - 1:
                next_s = slides[i + 1]
                next_file = f"slide_{str(next_s['slide_number']).zfill(2)}_{next_s['template']}.html"
            break
    
    prev_link = prev_file if prev_file else 'index.html'
    next_link = next_file if next_file else 'index.html'
    
    return f'''
<!-- Navigation -->
<style>
  .nav-overlay {{
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 1000;
    opacity: 0.3;
    transition: opacity 0.2s;
  }}
  .nav-overlay:hover {{ opacity: 1; }}
  .nav-btn {{
    padding: 10px 20px;
    background: #333;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-family: -apple-system, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .nav-btn:hover {{ background: #FF4D00; }}
  .nav-btn.disabled {{ opacity: 0.3; pointer-events: none; }}
  .nav-progress {{
    padding: 10px 16px;
    background: #222;
    color: #888;
    border-radius: 6px;
    font-family: -apple-system, sans-serif;
    font-size: 14px;
  }}
  .key-hint {{
    background: #555;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
  }}
</style>
<div class="nav-overlay">
  <a href="{prev_link}" class="nav-btn {'disabled' if not prev_file else ''}" id="prev-btn">
    <span class="key-hint">&larr;</span> Previous
  </a>
  <span class="nav-progress">{slide_num} / {total_slides}</span>
  <a href="{next_link}" class="nav-btn {'disabled' if not next_file else ''}" id="next-btn">
    Next <span class="key-hint">&rarr;</span>
  </a>
  <a href="index.html" class="nav-btn">
    <span class="key-hint">Esc</span> Index
  </a>
</div>
<script>
  document.addEventListener('keydown', function(e) {{
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {{
      e.preventDefault();
      document.getElementById('prev-btn').click();
    }}
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {{
      e.preventDefault();
      document.getElementById('next-btn').click();
    }}
    if (e.key === 'Escape' || e.key === 'Home') {{
      window.location.href = 'index.html';
    }}
  }});
</script>
'''


def render_deck(deck_path: str, output_dir: str, verbose: bool = True):
    """
    Render all slides from a deck definition JSON file.
    
    Args:
        deck_path: Path to deck JSON file
        output_dir: Directory to output rendered HTML files
        verbose: Print progress messages
    """
    # Load deck definition
    deck_path = Path(deck_path)
    with open(deck_path, encoding='utf-8') as f:
        deck = json.load(f)
    
    deck_title = deck.get('deck_title', 'Untitled')
    slides = deck.get('slides', [])
    total_slides = len(slides)
    
    if verbose:
        print(f"\n{'='*60}")
        print(f"  RENDERING: {deck_title}")
        print(f"  Slides: {len(slides)}")
        print(f"{'='*60}\n")
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Track results
    success = []
    failed = []
    
    for slide in slides:
        slide_num = slide.get('slide_number', 0)
        template = slide.get('template', '')
        section = slide.get('section', '')
        data = slide.get('data', {})
        
        # Add deck-level defaults
        data.setdefault('DECK_TITLE', deck_title)
        data.setdefault('SLIDE_NUMBER', str(slide_num).zfill(2))
        
        try:
            # Render the slide
            html = render_slide(template, data)
            
            # Inject navigation before </body>
            nav_html = get_navigation_html(slide_num, total_slides, slides)
            html = html.replace('</body>', f'{nav_html}</body>')
            
            # Write to file
            filename = f"slide_{str(slide_num).zfill(2)}_{template}.html"
            filepath = output_path / filename
            filepath.write_text(html, encoding='utf-8')
            
            success.append(slide_num)
            if verbose:
                print(f"  [OK] Slide {slide_num:02d} [{section}] -> {filename}")
                
        except Exception as e:
            failed.append((slide_num, str(e)))
            if verbose:
                print(f"  [FAIL] Slide {slide_num:02d} [{section}] ERROR: {e}")
    
    # Create index file
    create_index(output_path, deck, slides)
    
    # Summary
    if verbose:
        print(f"\n{'='*60}")
        print(f"  COMPLETE: {len(success)} slides rendered")
        if failed:
            print(f"  FAILED: {len(failed)} slides")
            for num, err in failed:
                print(f"    - Slide {num}: {err}")
        print(f"  Output: {output_path.absolute()}")
        print(f"{'='*60}\n")
    
    return success, failed


def create_index(output_dir: Path, deck: dict, slides: list):
    """Create an index.html file for browsing rendered slides."""
    
    deck_title = deck.get('deck_title', 'Untitled')
    presenter = deck.get('presenter', '')
    date = deck.get('date', '')
    
    slides_html = []
    current_section = None
    
    for slide in slides:
        slide_num = slide.get('slide_number', 0)
        template = slide.get('template', '')
        section = slide.get('section', '')
        
        # Section header
        if section != current_section:
            slides_html.append(f'<h2 class="section-header">{section}</h2>')
            current_section = section
        
        filename = f"slide_{str(slide_num).zfill(2)}_{template}.html"
        
        slides_html.append(f'''
        <div class="slide-card">
          <div class="slide-number">{slide_num:02d}</div>
          <div class="slide-info">
            <div class="slide-template">{template}</div>
          </div>
          <a href="{filename}" class="btn">View</a>
        </div>
        ''')
    
    # Get first slide filename
    first_slide = slides[0] if slides else None
    first_slide_file = f"slide_{str(first_slide['slide_number']).zfill(2)}_{first_slide['template']}.html" if first_slide else "#"
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{deck_title} - Slide Index</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a1a;
      color: white;
      padding: 40px;
    }}
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
    }}
    .header-left {{ }}
    h1 {{ font-size: 32px; margin-bottom: 5px; }}
    .subtitle {{ color: #888; }}
    .start-btn {{
      padding: 16px 32px;
      background: #FF4D00;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background 0.2s, transform 0.2s;
    }}
    .start-btn:hover {{ background: #E64500; transform: scale(1.02); }}
    .nav-hints {{
      background: #2a2a2a;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }}
    .nav-hints h3 {{
      font-size: 14px;
      color: #888;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .hints-grid {{
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
    }}
    .hint {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .key {{
      background: #444;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-family: monospace;
      color: #FF4D00;
    }}
    .hint-text {{ color: #888; font-size: 14px; }}
    .section-header {{
      font-size: 18px;
      color: #FF4D00;
      margin: 30px 0 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
    }}
    .slide-card {{
      display: flex;
      align-items: center;
      background: #2a2a2a;
      padding: 15px 20px;
      margin-bottom: 10px;
      border-radius: 8px;
      transition: background 0.2s;
    }}
    .slide-card:hover {{ background: #333; }}
    .slide-number {{
      font-size: 24px;
      font-weight: bold;
      color: #FF4D00;
      width: 50px;
    }}
    .slide-info {{ flex: 1; }}
    .slide-template {{
      font-size: 14px;
      color: #888;
    }}
    .btn {{
      padding: 8px 20px;
      background: #FF4D00;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
    }}
    .btn:hover {{ background: #E64500; }}
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>{deck_title}</h1>
      <p class="subtitle">{presenter} | {date} | {len(slides)} slides</p>
    </div>
    <a href="{first_slide_file}" class="start-btn">
      Start Presentation &rarr;
    </a>
  </div>
  
  <div class="nav-hints">
    <h3>Keyboard Navigation</h3>
    <div class="hints-grid">
      <div class="hint"><span class="key">&larr;</span><span class="hint-text">Previous slide</span></div>
      <div class="hint"><span class="key">&rarr;</span><span class="hint-text">Next slide</span></div>
      <div class="hint"><span class="key">Space</span><span class="hint-text">Next slide</span></div>
      <div class="hint"><span class="key">Esc</span><span class="hint-text">Back to index</span></div>
    </div>
  </div>
  
  {''.join(slides_html)}
  
  <script>
    document.addEventListener('keydown', function(e) {{
      if (e.key === 'Enter' || e.key === ' ') {{
        window.location.href = '{first_slide_file}';
      }}
    }});
  </script>
</body>
</html>
'''
    
    (output_dir / 'index.html').write_text(html, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(
        description="Batch render a deck from JSON definition"
    )
    parser.add_argument(
        "--deck", "-d",
        required=True,
        help="Path to deck JSON definition file"
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="./rendered",
        help="Output directory for rendered slides (default: ./rendered)"
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress progress output"
    )
    
    args = parser.parse_args()
    
    render_deck(
        deck_path=args.deck,
        output_dir=args.output_dir,
        verbose=not args.quiet
    )


if __name__ == "__main__":
    main()
