# Deciphex 2026 Kickoff Presentation Workspace

Workspace for building and managing the Deciphex 2026 Kickoff presentation.

## Folder Structure

```
kickoff-workspace/
├── output/              # Final PPTX presentation files
├── scripts/             # Python utility scripts for slides
├── docs/
│   ├── drafts/          # Deck content drafts (MD)
│   ├── planning/        # TODOs, build plans, slide maps
│   └── guides/          # Style guides, setup documentation
├── templates/           # 10 curated slide templates for AI prompts
├── reference/           # Source materials, transcripts, summaries
├── assets/              # Generated images & thumbnails
├── config/              # Auth tokens, credentials
└── slide_builder_app/   # AI-powered slide builder application
```

## Folders

### `/output`
Final presentation deliverables (PPTX files).

### `/scripts`
Python scripts for Google Slides automation:
- `create_google_slides.py` - Create new presentations
- `edit_slide.py`, `edit_slide_v2.py` - Edit individual slides
- `batch_edit_slides.py`, `mega_batch_update.py` - Batch operations
- `export_thumbnails.py` - Export slide thumbnails
- `fix_slide_*.py` - One-off slide fixes

### `/docs`
All documentation and planning:
- **drafts/** - Deck narrative drafts (GPT, Opus, Gemini, Consensus versions)
- **planning/** - Build plans, TODOs, slide-by-slide mapping
- **guides/** - Presentation style guide, Google Slides setup

### `/templates`
10 curated slide templates for use in AI prompts:
- `01_title_hero.png` - Opening/title slides with hero image
- `02_quote_portrait.png` - Inspirational quotes with portrait
- `03_statement_bold.png` - Mission/vision bold statements
- `04_content_image.png` - Bullet list + image layout
- `05_data_dashboard.png` - Charts, stats, data visualizations
- `06_case_study.png` - Customer testimonial with metrics
- `07_big_number.png` - Giant statistic callout
- `08_comparison.png` - Side-by-side comparison columns
- `09_multi_column.png` - Numbered stages/phases
- `10_numbered_list.png` - Strategic priorities list

See `TEMPLATE_REFERENCE.md` for detailed usage guide.

### `/reference`
Source materials and supporting content:
- Meeting transcripts
- FY25 performance summaries
- C-Suite meeting notes
- Previous keynote summaries

### `/assets`
Generated images:
- `extracted_slides/` - Slides extracted from reference PDFs
- `slide_thumbnails/` - Current deck thumbnails
- `new_deck_thumbnails/` - Updated thumbnails
- `review_thumbnails/` - Thumbnails for review

### `/config`
Configuration and credentials:
- `token.pickle` - Google OAuth token
- `service-account.json.bak` - Service account backup

### `/slide_builder_app`
Self-contained AI slide builder application with its own:
- Python modules (`slide_builder/`)
- Generated outputs (`*_output/` folders)
- Runner scripts

## Quick Start

1. **View current deck**: Check `output/` for latest PPTX
2. **Edit slides**: Use scripts in `scripts/`
3. **Review content**: See `docs/drafts/` for narrative
4. **Check progress**: See `docs/planning/DECK_TODO.md`

## Google Slides

Deck URL: https://docs.google.com/presentation/d/1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM/edit
