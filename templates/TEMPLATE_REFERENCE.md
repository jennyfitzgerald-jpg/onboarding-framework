# Deciphex Slide Template Reference

10 curated template layouts from historical Deciphex presentations. Use these as visual references when prompting AI to generate slide content or designs.

---

## Template Library

### 01. Title Hero (`01_title_hero.png`)
**Use for:** Opening/title slides, section openers
**Layout:**
- Large hero image (top right)
- Bold title text (bottom left)
- Subtitle and presenter name badge
- Footer with tagline and date

**Elements:** Deciphex logo, hero image, large title (black), subtitle (gray), presenter badge (orange), tagline footer

---

### 02. Quote with Portrait (`02_quote_portrait.png`)
**Use for:** Inspirational quotes, thought leadership, cultural moments
**Layout:**
- Large orange quotation marks (top-left, bottom-right)
- Quote text (bold black, centered)
- Circular portrait photo (bottom left)
- Attribution name (orange) and role (gray)

**Elements:** Quote marks, quote text, portrait circle, name, title

---

### 03. Bold Statement (`03_statement_bold.png`)
**Use for:** Mission statements, vision, key messages, section transitions
**Layout:**
- Minimal white background
- Orange accent bar (top left)
- Large statement text (black + orange emphasis)
- Orange triangle accent (bottom right corner)

**Elements:** Accent bar, statement text with bi-color emphasis, corner triangle

---

### 04. Content + Image (`04_content_image.png`)
**Use for:** Value propositions, feature explanations, "what we do"
**Layout:**
- Title (bold black)
- Left column: subheading + bullet list
- Right column: large supporting image
- CTA button (orange)

**Elements:** Title, subheading, bullet list, image, button

---

### 05. Data Dashboard (`05_data_dashboard.png`)
**Use for:** Market context, problem statements, industry data
**Layout:**
- Title (bold black)
- Multiple data visualizations (charts, graphs)
- Big statistics (orange numbers)
- Icon + label pairs
- Supporting bullet points

**Elements:** Title, line charts, bar charts, big stats, icons, bullets

---

### 06. Case Study (`06_case_study.png`)
**Use for:** Customer success stories, testimonials with data
**Layout:**
- Title (bold black)
- Quote block (left)
- Bar chart with metrics (right)
- Key stats callouts (orange numbers)
- Customer logo
- Footer icons with benefits

**Elements:** Title, quote marks, testimonial text, bar chart, metrics, logo, icon row

---

### 07. Big Number (`07_big_number.png`)
**Use for:** Key metrics, achievements, milestone callouts
**Layout:**
- Title bar with accent (top)
- Giant number (orange, centered)
- Description text (black)
- YoY/growth indicator with arrow icon

**Elements:** Title, huge statistic, description, growth arrow

---

### 08. Comparison (`08_comparison.png`)
**Use for:** Comparing approaches, trade-offs, methodologies
**Layout:**
- Title (bold black)
- Subheading (orange)
- 2-3 column layout with headers
- Central "vs" badge
- Bullet lists per column
- Right sidebar with benefits

**Elements:** Title, columns, vs badge, bullet lists, sidebar

---

### 09. Multi-Column (`09_multi_column.png`)
**Use for:** Stages, phases, timelines, maturity models
**Layout:**
- Title (bold black)
- Subheading (bold)
- 4-5 numbered columns
- Each column: number, title, bullet list
- Orange accent on active/highlighted columns

**Elements:** Title, numbered columns, headers, bullet points

---

### 10. Numbered List (`10_numbered_list.png`)
**Use for:** Strategic priorities, OKRs, action items
**Layout:**
- Left-aligned section title (bold)
- Numbered list (1-10) with orange numbers
- Each item: number + description (bold keywords)
- Clean, minimal design

**Elements:** Section title, numbered items, bold keyword emphasis

---

### 11. Feature Cards (`11_feature_cards.png`)
**Use for:** Feature overviews, service descriptions, capabilities
**Layout:**
- Title + subtitle (top left)
- Hero image (top right)
- Section title
- 4-column cards with orange badge headers
- Description text under each badge

**Elements:** Title, subtitle, hero image, section title, 4 feature cards with badges

---

### 12. Process Flow (`12_process_flow.png`)
**Use for:** Workflows, processes, system architecture
**Layout:**
- Title (top)
- Images on left and right sides
- Center labels with arrow
- 4 numbered steps with connecting arrows
- Feedback loop at bottom

**Elements:** Title, images, step numbers, step titles, arrow labels, feedback loop

---

### 13. Timeline Table (`13_timeline_table.png`)
**Use for:** Roadmaps, evolution comparisons, strategy timelines
**Layout:**
- Title (top)
- Horizontal timeline with dots
- 6-column table
- 2 comparison rows (one highlighted)
- Vertical row labels

**Elements:** Title, timeline, column headers, row labels, cell content

---

### 14. Section Opener (`14_section_opener.png`)
**Use for:** Section breaks, chapter dividers, topic transitions
**Layout:**
- Logo (top left)
- Clipped image (top right, 50% width)
- Large section title (bottom left)
- Accent bar and divider line

**Elements:** Logo, image, accent bar, section title

---

### 15. Photo Testimonial (`15_photo_testimonial.png`)
**Use for:** Customer testimonials, team spotlights, product endorsements
**Layout:**
- Dark gradient background with decorative swirls
- Brand logo (top left)
- Quote with testimonial text
- Attribution (name, role, company)
- Large person photo (right side)

**Elements:** Brand name, quote, testimonial text, person details, full photo

---

### 16. Bullet List (`16_bullet_list.html`)
**Use for:** Simple bullet points, key takeaways, feature lists
**Layout:**
- Bold title with orange accent bar
- 5 bullet items with orange dot icons
- Each item supports `<strong>` tags for inline highlights
- Clean footer with logo and slide number

**Elements:** Title, 5 bullet items (ITEM_1-5), footer

**Variables:**
- `{{TITLE}}` - Slide title
- `{{ITEM_1}}` through `{{ITEM_5}}` - Bullet items (supports `<strong>` for highlights)
- `{{DECK_TITLE}}` - Footer title
- `{{SLIDE_NUMBER}}` - Slide number

---

### 17. Two-Column Compare (`17_two_column_compare.html`)
**Use for:** Before/after, pros/cons, old vs new comparisons
**Layout:**
- Title and subtitle at top
- Two columns with icons and headers
- 5 items per column
- Side-by-side layout

**Elements:** Title, subtitle, column headers with icons, comparison items

**Variables:**
- `{{TITLE}}`, `{{SUBTITLE}}`
- `{{LEFT_ICON}}`, `{{LEFT_TITLE}}`, `{{LEFT_1}}` through `{{LEFT_5}}`
- `{{RIGHT_ICON}}`, `{{RIGHT_TITLE}}`, `{{RIGHT_1}}` through `{{RIGHT_5}}`

---

### 18. Data Table (`18_data_table.html`)
**Use for:** Tabular data, financial summaries, comparison matrices
**Layout:**
- Title and subtitle
- 4-column table with headers
- 5 data rows
- Orange header row

**Elements:** Title, column headers, table cells

**Variables:**
- `{{TITLE}}`, `{{SUBTITLE}}`
- `{{COL_1_HEADER}}` through `{{COL_4_HEADER}}`
- `{{ROW_X_COL_Y}}` for each cell (rows 1-5, cols 1-4)

---

### 19. Logo Grid (`19_logo_grid.html`)
**Use for:** Team overview, platform features, partner showcase, stat cards
**Layout:**
- Title and subtitle
- 2x2 grid of cards
- Each card: icon, name, description, tag
- Rounded cards with subtle shadows

**Elements:** Title, 4 cards with icon/name/description/tag

**Variables:**
- `{{TITLE}}`, `{{SUBTITLE}}`
- `{{CARD_X_ICON}}`, `{{CARD_X_NAME}}`, `{{CARD_X_DESC}}`, `{{CARD_X_TAG}}` (X = 1-4)

---

### 20. Journey (`20_journey.html`)
**Use for:** Timelines, company history, roadmaps, milestones
**Layout:**
- Title at top
- 4 stages in horizontal flow
- Each stage: year/label, title, description
- Callout box at bottom

**Elements:** Title, 4 journey stages, callout

**Variables:**
- `{{TITLE}}`
- `{{STAGE_X_YEAR}}`, `{{STAGE_X_TITLE}}`, `{{STAGE_X_DESC}}` (X = 1-4)
- `{{CALLOUT_ICON}}`, `{{CALLOUT_TEXT}}`

---

### 21. Key Accounts (`21_key_accounts.html`)
**Use for:** Account summaries, customer portfolios, sales pipelines
**Layout:**
- Title and subtitle
- 2x2 grid of account cards with orange left border
- Each card: name, value, status
- Highlight box with stats at bottom

**Elements:** Title, 4 account cards, highlight stats

**Variables:**
- `{{TITLE}}`, `{{SUBTITLE}}`
- `{{ACCOUNT_X_NAME}}`, `{{ACCOUNT_X_VALUE}}`, `{{ACCOUNT_X_STATUS}}` (X = 1-4)
- `{{STAT_1_VALUE}}`, `{{STAT_1_LABEL}}`, `{{STAT_2_VALUE}}`, `{{STAT_2_LABEL}}`
- `{{HIGHLIGHT_TEXT}}`

---

### 22. Memorial (`22_memorial.html`)
**Use for:** In memoriam slides, tribute slides, remembrance
**Layout:**
- Respectful, minimal design
- Portrait placeholder
- Name and role
- Memorial quote

**Elements:** Portrait, name, role, quote

**Variables:**
- `{{QUOTE_TEXT}}` - Memorial quote
- `{{PORTRAIT_URL}}` - Image URL
- `{{PERSON_NAME}}` - Name
- `{{PERSON_ROLE}}` - Role/team

---

### 23. GoFundMe (`23_gofundme.html`)
**Use for:** Fundraising callouts, charitable appeals, support requests
**Layout:**
- Portrait and name
- Campaign description
- Support message callout box
- Clean, respectful design

**Elements:** Portrait, name, campaign info, support message

**Variables:**
- `{{PERSON_NAME}}` - Name
- `{{PORTRAIT_URL}}` - Image URL
- `{{CAMPAIGN_DESCRIPTION}}` - Description text
- `{{SUPPORT_MESSAGE}}` - Callout box message

---

## Usage in AI Prompts

When prompting an AI to generate slide content, reference these templates:

```
Create slide content following the "Big Number" template format:
- Title bar at top
- Giant statistic (e.g., "147,000") in orange
- Description below
- YoY growth indicator

Content: FY25 case volume achievement
```

Or for visual generation:

```
Generate a slide in the Deciphex "Quote with Portrait" style:
- White background
- Large orange quotation marks top-left and bottom-right
- Quote: "Strength does not come from winning..."
- Portrait: Arnold Schwarzenegger
- Attribution in orange below portrait
```

---

---

## HTML Templates

HTML equivalents of all templates are in the `/html` subfolder.

### Files

```
templates/html/
├── styles.css           # Shared design system CSS
├── index.html           # Gallery view of all templates
├── render_template.py   # Python utility to render with data
├── render_deck.py       # Batch render entire deck from JSON
├── 01_title_hero.html
├── 02_quote_portrait.html
├── 03_statement_bold.html
├── 04_content_image.html
├── 05_data_dashboard.html
├── 06_case_study.html
├── 07_big_number.html
├── 08_comparison.html
├── 09_multi_column.html
├── 10_numbered_list.html
├── 11_feature_cards.html
├── 12_process_flow.html
├── 13_timeline_table.html
├── 14_section_opener.html
├── 15_photo_testimonial.html
├── 16_bullet_list.html      # Simple bullet points
├── 17_two_column_compare.html # Side-by-side comparisons
├── 18_data_table.html       # Tabular data display
├── 19_logo_grid.html        # 2x2 card grid (stats, platforms)
├── 20_journey.html          # Timeline/milestone stages
├── 21_key_accounts.html     # Account cards with metrics
├── 22_memorial.html         # In memoriam slides
└── 23_gofundme.html         # Fundraising/support callouts
```

### Viewing Templates

Open `index.html` in a browser to see all templates with links to HTML and PNG versions.

### Using the Render Script

```bash
# List all templates and their variables
python render_template.py --list

# Render a template with data
python render_template.py \
  --template 07_big_number \
  --data '{"BIG_NUMBER": "147,000", "DESCRIPTION": "Cases Reported", "GROWTH_VALUE": "38% YoY"}' \
  --output slide.html

# Use a JSON data file
python render_template.py --template 07_big_number --data-file slide_data.json --output slide.html
```

### Template Variables

Each template uses `{{VARIABLE_NAME}}` placeholders. Run `python render_template.py --list` to see all variables for each template.

Example for Big Number template:
- `{{TITLE}}` - Title above number
- `{{BIG_NUMBER}}` - The giant statistic (e.g. "100,000")
- `{{DESCRIPTION}}` - Description text below
- `{{GROWTH_VALUE}}` - Growth percentage (e.g. "137% YoY")
- `{{DECK_TITLE}}` - Footer deck title
- `{{SLIDE_NUMBER}}` - Slide number

### Converting to Images

Use a headless browser to convert HTML to PNG:

```python
from playwright.sync_api import sync_playwright

def html_to_png(html_path, output_path):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(f"file://{html_path}")
        page.locator(".slide").screenshot(path=output_path)
        browser.close()
```

---

## Design System Notes

**Colors:**
- Primary: Orange (#FF4D00 or similar)
- Text: Black (#000000)
- Secondary text: Gray (#666666)
- Background: White (#FFFFFF)

**Typography:**
- Titles: Bold, large sans-serif
- Body: Regular weight sans-serif
- Numbers: Extra bold, oversized for impact

**Accents:**
- Orange corner triangles
- Orange horizontal bars
- Orange quotation marks
- Orange number highlighting

**Branding:**
- Deciphex logo (top left, small)
- Footer: "Accelerate Together" | "slide" | page number
