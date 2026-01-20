# AI-Assisted Presentation Workflow

## Overview

This document describes how to use AI tools in combination with the HTML slide template framework to rapidly create professional presentations.

The workflow combines:
- **AI for content generation** — Draft narratives, talking points, data analysis
- **Templates for structure** — Consistent, professional visual design
- **Automation for production** — Batch rendering, export to multiple formats

---

## The Three-Phase Workflow

### Phase 1: Content Strategy (AI-Assisted)

Use AI to help with:

| Task | Prompt Pattern |
|------|----------------|
| **Narrative structure** | "Help me structure a presentation about [topic] for [audience]. Key messages are..." |
| **Slide outline** | "Break this content into individual slides. Each slide should have one key message..." |
| **Speaker notes** | "Write speaker notes for this slide. Duration target: 45 seconds. Tone: conversational..." |
| **Data synthesis** | "Summarize these metrics into the 3-5 most impactful points for an executive audience..." |

#### Example Prompt for Deck Structure

```
I'm creating a 30-slide presentation for [event] with [audience].

Key themes:
1. [Theme 1]
2. [Theme 2]
3. [Theme 3]

For each section, suggest:
- Opening slide type (quote, statement, section break)
- 3-5 content slides with recommended template type
- Transition approach to next section

Keep in mind: One idea per slide. Big numbers get their own slides.
```

### Phase 2: Template Selection & Content Mapping

Match content to templates:

| Content Type | Recommended Template |
|--------------|---------------------|
| Opening statement | `01_title_hero` or `03_statement_bold` |
| Inspirational quote | `02_quote_portrait` |
| Key metric | `07_big_number` |
| Year-over-year data | `05_data_dashboard` |
| Strategic priorities | `10_numbered_list` |
| Before/after comparison | `08_comparison` |
| Process explanation | `12_process_flow` |
| Customer success | `06_case_study` |
| Timeline/roadmap | `13_timeline_table` |
| Section transition | `14_section_opener` |

#### Content-to-Template Mapping Prompt

```
Given these slides, recommend which HTML template to use for each:

Slide 1: Welcome and event title
Slide 2: Opening quote about [theme]
Slide 3: Key achievement - [number] [metric]
...

Available templates: [list from TEMPLATE_REFERENCE.md]

For each slide, specify:
- Template name
- Key variables to populate
- Any layout considerations
```

### Phase 3: Production & Rendering

#### Generate Slide Data Files

Use AI to format content as JSON for template rendering:

```
Convert this slide content to JSON format for the 07_big_number template:

Title: Year in Review
Key number: 147,000
Description: Cases Reported
Growth: +47% YoY
Deck title: Annual Kickoff
Slide number: 12

Output JSON matching these variables:
- TITLE
- BIG_NUMBER
- DESCRIPTION
- GROWTH_VALUE
- DECK_TITLE
- SLIDE_NUMBER
```

#### Batch Render Script

```python
import json
from pathlib import Path
from render_template import render_slide

# Load deck configuration
with open("deck_config.json") as f:
    deck = json.load(f)

# Render all slides
output_dir = Path("output/slides")
output_dir.mkdir(parents=True, exist_ok=True)

for i, slide in enumerate(deck["slides"], 1):
    html = render_slide(slide["template"], slide["data"])
    output_path = output_dir / f"slide_{i:02d}_{slide['template']}.html"
    output_path.write_text(html, encoding="utf-8")
    print(f"Rendered: {output_path}")
```

---

## Deck Configuration Format

### Structure

```json
{
  "title": "Presentation Title",
  "event": "Event Name",
  "date": "January 2026",
  "presenter": "Presenter Name",
  "slides": [
    {
      "template": "01_title_hero",
      "section": "opening",
      "data": {
        "HERO_IMAGE_URL": "images/hero.jpg",
        "TITLE_LINE_1": "Main Title",
        "TITLE_LINE_2": "Subtitle Line",
        "PRESENTER_NAME": "John Smith",
        "DATE": "January 21, 2026"
      },
      "speaker_notes": "Welcome everyone. Today we're going to..."
    },
    {
      "template": "02_quote_portrait",
      "section": "opening",
      "data": {
        "QUOTE_TEXT": "The quote text here...",
        "PORTRAIT_URL": "images/portrait.jpg",
        "PERSON_NAME": "Quote Author",
        "PERSON_ROLE": "Title, Company"
      },
      "speaker_notes": "I chose this quote because..."
    }
  ]
}
```

### Using AI to Generate Deck Config

```
Create a JSON deck configuration for this presentation outline:

[Paste outline here]

Use this format for each slide:
{
  "template": "[template name]",
  "section": "[section name]",
  "data": { [template variables] },
  "speaker_notes": "[45-60 second talking points]"
}

Available templates and their variables:
[Paste from TEMPLATE_REFERENCE.md]
```

---

## AI-Assisted Content Refinement

### Improving Headlines

```
Rewrite these slide headlines to be:
- Maximum 8 words
- Action-oriented
- Impactful without context

Current headlines:
1. "Our revenue grew significantly this year"
2. "We had some challenges but overcame them"
3. "Here's what we're planning for next year"
```

### Generating Speaker Notes

```
Write speaker notes for this slide:

Template: 07_big_number
Title: Customer Growth
Number: 147,000
Description: Customers Served
Growth: +47% YoY

Requirements:
- 45-60 seconds when spoken
- Conversational tone
- Include transition to next slide
- Add one humanizing detail or story
```

### Synthesizing Data for Dashboards

```
I have these metrics for a data dashboard slide:

[Raw data here]

Create content for the 05_data_dashboard template:
- Select 2-3 most impactful statistics
- Write concise labels (3-4 words each)
- Suggest chart type for supporting visual
- Write 3-4 bullet points summarizing implications
```

---

## Quote Slide Best Practices

### Quote Selection Criteria

| Quality | Description |
|---------|-------------|
| **Relevance** | Directly connects to your message |
| **Authority** | Speaker has credibility with audience |
| **Brevity** | 1-2 sentences maximum |
| **Memorability** | Phrasing that sticks |

### AI Prompt for Quote Discovery

```
I need a quote for a slide about [theme/message].

Audience: [description]
Tone: [inspirational/cautionary/motivational/thoughtful]

Requirements:
- From a recognized figure (business, sports, historical)
- Maximum 2 sentences
- Should feel fresh (avoid overused quotes)

Provide 3-5 options with:
- Full quote
- Attribution
- Why it works for this context
```

### Quote Figures by Theme

| Theme | Suggested Figures |
|-------|-------------------|
| Teamwork | Henry Ford, Phil Jackson |
| Perseverance | Churchill, Schwarzenegger |
| Innovation | Jobs, Bezos, Musk |
| Culture | Drucker, Collins |
| Excellence | Lombardi, Jordan |
| Vision | Michelangelo, Kennedy |
| Growth Mindset | Dweck, Nadella |

---

## Big Number Slides

### When to Use

- Key achievements (revenue, customers, cases)
- Milestone announcements
- Year-over-year comparisons
- Opening impact statements

### Formatting Guidelines

| Number Type | Format | Example |
|-------------|--------|---------|
| Large integers | Abbreviated | 147,000 → 147K |
| Currency | Abbreviated with symbol | €25,400,000 → €25.4M |
| Percentages | Include sign | +47% |
| Decimals | One decimal max | 3.14 → 3.1 |

### AI Prompt for Number Context

```
I want to present this number dramatically:

Number: [X]
Context: [what it represents]
Comparison: [previous period or benchmark]

Help me:
1. Write a contextual headline (5-8 words)
2. Format the number for visual impact
3. Write the description (3-5 words)
4. Calculate and format YoY growth
5. Write speaker notes that make this feel significant
```

---

## Section Transitions

### Transition Patterns

| From | To | Recommended Approach |
|------|------|---------------------|
| Opening | Content | Quote slide setting theme |
| Review | Strategy | Statement slide ("What's Next") |
| Strategy | Tactics | Section opener with image |
| Content | Close | Aspirational quote |

### AI-Generated Transitions

```
Write transition speaker notes between these slides:

Slide A: [content summary]
Slide B: [content summary]

Requirements:
- Natural flow
- Preview what's coming
- 1-2 sentences
- Maintain energy level: [building/sustained/reflective]
```

---

## Exporting and Delivery

### HTML to PNG Export

```bash
# Single slide
npx playwright screenshot slide.html slide.png --viewport-size=1280,720

# Batch export
node render_slides.cjs
```

### Creating PDF Deck

```python
from PIL import Image
import os

def pngs_to_pdf(png_folder, output_pdf):
    images = []
    for f in sorted(os.listdir(png_folder)):
        if f.endswith('.png'):
            img = Image.open(os.path.join(png_folder, f))
            images.append(img.convert('RGB'))
    
    if images:
        images[0].save(output_pdf, save_all=True, append_images=images[1:])

pngs_to_pdf("output/_renders", "presentation.pdf")
```

### Presenter View Setup

For presentations with speaker notes:

1. Open HTML slides in browser
2. Use dual-monitor setup
3. Audience sees slides
4. Presenter sees notes (kept in deck config JSON)

---

## Quality Checklist

### Before Finalizing

- [ ] Every slide has one key message
- [ ] Numbers are formatted consistently
- [ ] Speaker notes cover 45-60 seconds each
- [ ] Transitions flow naturally
- [ ] Quote attributions are accurate
- [ ] Images are high resolution
- [ ] Brand colors used correctly
- [ ] Footer information is correct

### AI-Assisted Review

```
Review this presentation for:

1. Consistency issues (formatting, terminology)
2. Weak headlines that need strengthening
3. Slides with too much content
4. Missing transitions
5. Opportunities for stronger data visualization

Presentation content:
[Paste deck config JSON]
```

---

## Summary: The AI + Templates Workflow

1. **Strategy** — Use AI to structure narrative and outline slides
2. **Selection** — Match content to appropriate templates
3. **Generation** — AI creates JSON data for each template
4. **Rendering** — Batch process templates to HTML/PNG
5. **Refinement** — AI-assisted review and improvement
6. **Delivery** — Export to required format

This workflow reduces presentation creation from days to hours while maintaining professional quality and consistency.

---

*Workflow Guide Version 1.0*
