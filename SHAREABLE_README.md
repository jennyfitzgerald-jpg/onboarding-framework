# Slide Template Framework

A modular HTML/CSS slide templating system for building professional presentations. Includes AI workflow guides and strategic documentation for modern presentation development.

## What's Included

### Core Templating System
- **23 HTML templates** with `{{VARIABLE}}` placeholders (all documented)
- **Shared CSS design system** for consistent branding
- **Python render utility** for batch slide generation
- **Playwright exporter** for HTML-to-PNG conversion

### AI Strategy & Workflow Guides
| Document | Purpose |
|----------|---------|
| `docs/shareable/AI_CONTEXT_ENGINEERING.md` | How to leverage AI for 10x development productivity |
| `docs/shareable/AI_COMMERCIAL_THESIS.md` | Strategic framework: "Tech Eating Service" vs incremental AI |
| `docs/shareable/AI_PRESENTATION_WORKFLOW.md` | End-to-end AI-assisted presentation creation |
| `docs/shareable/AI_ADOPTION_MATURITY.md` | 5 stages of organizational AI adoption |
| `docs/shareable/CULTURAL_SCALING_FRAMEWORKS.md` | Pirates vs Navy, Think 2X, Growth Mindset |

---

## Quick Start

```bash
# 1. Clone or copy the framework
# 2. Install dependencies
npm install

# 3. Open template gallery in browser
open templates/html/index.html

# 4. Render a template with data
cd templates/html
python render_template.py --template 07_big_number \
  --data '{"BIG_NUMBER": "500K", "DESCRIPTION": "Users Onboarded", "GROWTH_VALUE": "42% YoY"}' \
  --output my_slide.html

# 5. Export slides to PNG (requires Playwright)
node render_slides.cjs
```

## Folder Structure

```
slide-templates/
├── templates/
│   ├── html/                    # HTML template files
│   │   ├── styles.css           # Shared design system CSS
│   │   ├── index.html           # Template gallery viewer
│   │   ├── render_template.py   # Python render utility
│   │   ├── 01_title_hero.html
│   │   ├── 02_quote_portrait.html
│   │   ├── ...                  # 23 templates total
│   │   └── 23_gofundme.html
│   ├── *.png                    # Visual reference images
│   └── TEMPLATE_REFERENCE.md    # Detailed template docs
├── render_slides.cjs            # Playwright PNG exporter
├── package.json                 # Node dependencies
└── README.md
```

## Available Templates

| # | Template | Best For |
|---|----------|----------|
| 01 | Title Hero | Opening slides, section headers |
| 02 | Quote Portrait | Inspirational quotes with photo |
| 03 | Bold Statement | Mission/vision statements |
| 04 | Content + Image | Features with supporting image |
| 05 | Data Dashboard | Charts, statistics, metrics |
| 06 | Case Study | Customer success stories |
| 07 | Big Number | Giant metric callouts |
| 08 | Comparison | Side-by-side comparisons |
| 09 | Multi-Column | Phases, stages, processes |
| 10 | Numbered List | Priorities, OKRs, action items |
| 11 | Feature Cards | Product capabilities grid |
| 12 | Process Flow | Workflows with arrows |
| 13 | Timeline Table | Roadmaps, evolution |
| 14 | Section Opener | Chapter/section dividers |
| 15 | Photo Testimonial | Full testimonial with photo |
| 16 | Bullet List | Simple bullet points |
| 17 | Two-Column Compare | Side-by-side with icons |
| 18 | Data Table | Tabular data display |
| 19 | Logo Grid | Partner/client logos |
| 20 | Journey | Timeline/milestone stages |
| 21 | Key Accounts | Account cards with stats |
| 22 | Memorial | In memoriam slide |
| 23 | GoFundMe | Fundraising callout |

## Using Templates

### Option 1: Direct HTML Editing

Open any template HTML file, find `{{VARIABLE}}` placeholders, replace with your content:

```html
<!-- Before -->
<div class="big-number">{{BIG_NUMBER}}</div>
<span class="description">{{DESCRIPTION}}</span>

<!-- After -->
<div class="big-number">1.2M</div>
<span class="description">Monthly Active Users</span>
```

### Option 2: Python Render Script

```bash
# List all templates and their variables
python render_template.py --list

# Render with inline JSON
python render_template.py \
  --template 07_big_number \
  --data '{"BIG_NUMBER": "147,000", "DESCRIPTION": "Cases Processed"}' \
  --output slide.html

# Render with JSON file
python render_template.py \
  --template 07_big_number \
  --data-file my_data.json \
  --output slide.html
```

### Option 3: Programmatic Python

```python
from render_template import render_slide

html = render_slide("07_big_number", {
    "TITLE": "FY25 Results",
    "BIG_NUMBER": "147,000",
    "DESCRIPTION": "Cases Reported",
    "GROWTH_VALUE": "38% YoY",
    "DECK_TITLE": "Annual Review",
    "SLIDE_NUMBER": "12"
})

with open("output.html", "w") as f:
    f.write(html)
```

## Converting HTML to PNG

The `render_slides.cjs` script uses Playwright to capture high-resolution PNGs:

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run the renderer
node render_slides.cjs
```

This outputs 2x resolution PNGs (2560x1440) from `output/html_slides/` to `output/html_slides/_renders/`.

### Custom PNG Export

```python
from playwright.sync_api import sync_playwright

def html_to_png(html_path: str, output_path: str):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(f"file:///{html_path}")
        page.locator(".slide").screenshot(path=output_path)
        browser.close()
```

## Design System

### Colors (CSS Variables)

```css
--primary-orange: #FF4D00    /* Primary brand color */
--text-black: #000000        /* Headings */
--text-gray: #666666         /* Body text */
--text-light-gray: #999999   /* Captions, footers */
--background-white: #FFFFFF  /* Slide background */
--background-light: #F5F5F5  /* Card backgrounds */
```

### Typography

- **Titles**: Bold/Black weight, large sans-serif
- **Body**: Regular weight, readable sizes
- **Big Numbers**: Extra bold, oversized for impact

### Slide Dimensions

All templates are designed for **16:9 aspect ratio**:
- Width: 1280px
- Height: 720px

## Customizing the Design System

Edit `templates/html/styles.css` to change:

1. **Brand colors** - Update CSS variables in `:root`
2. **Typography** - Modify font family/weights
3. **Accents** - Adjust corner triangles, bars, badges
4. **Footer** - Customize logo shape and tagline format

## Building a Full Deck

1. Create a deck config JSON:

```json
{
  "title": "Q4 Business Review",
  "slides": [
    {"template": "01_title_hero", "data": {"TITLE_LINE_1": "Q4 2025", ...}},
    {"template": "07_big_number", "data": {"BIG_NUMBER": "2.4M", ...}},
    {"template": "10_numbered_list", "data": {"SECTION_TITLE": "Priorities", ...}}
  ]
}
```

2. Write a batch renderer:

```python
import json
from pathlib import Path
from render_template import render_slide

config = json.load(open("deck_config.json"))
output_dir = Path("output/html_slides")
output_dir.mkdir(parents=True, exist_ok=True)

for i, slide in enumerate(config["slides"], 1):
    html = render_slide(slide["template"], slide["data"])
    (output_dir / f"slide_{i:02d}.html").write_text(html)
```

3. Run `node render_slides.cjs` to generate PNGs

## Requirements

- **Python 3.8+** (for render script)
- **Node.js 18+** (for PNG export)
- **Playwright** (`npm install playwright`)

---

## AI Strategy Guides

### Context Engineering (`docs/shareable/AI_CONTEXT_ENGINEERING.md`)

A comprehensive guide to the new development paradigm:

- **The shift**: Assembly → C → Python → **English**
- **500x faster, 700x cheaper**: Real examples of AI-assisted development
- **Implementation roadmap**: From pilot to organization-wide adoption
- **Hiring in the AI era**: Curiosity beats current competence

### Commercial AI Thesis (`docs/shareable/AI_COMMERCIAL_THESIS.md`)

Strategic framework for positioning AI as a business driver:

- **Tech eating service vs service with tech**: The valuation difference
- **The margin transformation model**: 45% → 65% gross margin
- **Four pillars**: Operational proof, economic transformation, external validation, defensible moat
- **Avoiding the traps**: Marketing-only AI vs operational AI

### Presentation Workflow (`docs/shareable/AI_PRESENTATION_WORKFLOW.md`)

End-to-end guide for AI-assisted presentation creation:

- **Three-phase workflow**: Strategy → Template Selection → Production
- **Prompt patterns**: Content generation, speaker notes, data synthesis
- **Deck configuration format**: JSON-based slide definitions
- **Quality checklist**: AI-assisted review process

### AI Adoption Maturity (`docs/shareable/AI_ADOPTION_MATURITY.md`)

The 5 stages of organizational AI adoption:

- **Stage 1**: Initial Access — Basic tools, ad hoc usage
- **Stage 2**: Knowledge Integration — Custom GPTs, API connections
- **Stage 3**: Enterprise Scale — Governance, certification, standardization
- **Stage 4**: Advanced Integration — Fine-tuned models, process automation
- **Stage 5**: AI-First — Embedded in business model, competitive advantage

### Cultural Scaling Frameworks (`docs/shareable/CULTURAL_SCALING_FRAMEWORKS.md`)

Frameworks for scaling organizational culture:

- **Pirates vs Navy**: Innovation vs operational excellence balance
- **Think 2X**: Four levers for doubling capacity without doubling headcount
- **Growth Mindset Requirements**: Six critical attributes for scaling teams
- **Two-Speed Organization**: Dangers and solutions for adoption gaps
- **Safe vs Smart Decision**: Marketing framework for different buyer types

---

## Using AI with This Framework

### 1. Generate Deck Structure

```
Help me structure a 30-slide presentation about [topic].
Key themes: [list themes]
Audience: [description]

For each section suggest:
- Opening slide type
- Content slides with template recommendations
- Transition approach
```

### 2. Create Slide Data

```
Convert this content to JSON for the 07_big_number template:

Title: [headline]
Number: [metric]
Description: [label]
Growth: [YoY change]
```

### 3. Generate Speaker Notes

```
Write 45-60 second speaker notes for this slide:
[slide content]

Include transition to next slide about [topic].
```

### 4. Review and Refine

```
Review this presentation for:
- Weak headlines needing improvement
- Slides with too much content
- Missing transitions
- Data visualization opportunities
```

---

## License

MIT - Use freely for commercial or personal projects.
