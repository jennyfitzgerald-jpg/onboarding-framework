#!/usr/bin/env python3
"""
Render HTML slide templates with dynamic data.

Usage:
    python render_template.py --template 07_big_number --output slide.html --data '{"BIG_NUMBER": "147,000", "DESCRIPTION": "Cases Reported"}'
    
Or use programmatically:
    from render_template import render_slide
    html = render_slide("07_big_number", {"BIG_NUMBER": "147,000", "DESCRIPTION": "Cases Reported"})
"""

import argparse
import json
import re
from pathlib import Path


# Template variable definitions for each template
TEMPLATE_VARS = {
    "01_title_hero": {
        "HERO_IMAGE_URL": "URL of hero image",
        "TITLE_LINE_1": "First line of title",
        "TITLE_LINE_2": "Second line of title", 
        "SUBTITLE": "Subtitle text",
        "PRESENTER_NAME": "Presenter name for badge",
        "TAGLINE": "Footer tagline",
        "DATE": "Presentation date"
    },
    "02_quote_portrait": {
        "QUOTE_TEXT": "The quote text",
        "PORTRAIT_URL": "URL of portrait image",
        "PERSON_NAME": "Name of person quoted",
        "PERSON_ROLE": "Role/title of person",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "03_statement_bold": {
        "STATEMENT_PART_1": "First part of statement (black)",
        "STATEMENT_HIGHLIGHT": "Highlighted part (orange)",
        "STATEMENT_PART_2": "Remaining part (black)",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "04_content_image": {
        "TITLE": "Slide title",
        "SUBHEADING": "Section subheading",
        "BULLET_1": "First bullet point",
        "BULLET_2": "Second bullet point",
        "BULLET_3": "Third bullet point",
        "BULLET_4": "Fourth bullet point",
        "BULLET_5": "Fifth bullet point",
        "CTA_TEXT": "Call to action button text",
        "IMAGE_URL": "URL of supporting image",
        "IMAGE_ALT": "Alt text for image",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "05_data_dashboard": {
        "TITLE": "Dashboard title",
        "STAT_1_NUMBER": "First big statistic (e.g. 90%)",
        "STAT_1_LABEL_BOLD": "Bold part of label",
        "STAT_1_LABEL": "Rest of label",
        "STAT_2_NUMBER": "Second statistic",
        "STAT_2_LABEL": "Second stat label",
        "CHART_LABEL": "Mini chart label",
        "LIST_HEADING": "Bullet list heading",
        "LIST_ITEM_1": "List item 1",
        "LIST_ITEM_2": "List item 2",
        "LIST_ITEM_3": "List item 3",
        "LIST_ITEM_4": "List item 4",
        "CHART_TITLE": "Main chart title",
        "CHART_SUBTITLE": "Chart subtitle",
        "LEGEND_1": "Legend item 1",
        "LEGEND_2": "Legend item 2",
        "LEGEND_3": "Legend item 3",
        "LEGEND_4": "Legend item 4",
        "ICON_LABEL_1": "Icon label 1",
        "ICON_LABEL_2": "Icon label 2",
        "ICON_LABEL_3": "Icon label 3",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "06_case_study": {
        "TITLE": "Case study title",
        "TESTIMONIAL_TEXT": "Customer testimonial quote",
        "CUSTOMER_LOGO_URL": "Customer logo URL",
        "CUSTOMER_NAME": "Customer name (fallback)",
        "CHART_PERIOD": "Chart period label",
        "CHART_METRIC": "Chart metric label",
        "METRIC_1_VALUE": "First metric value",
        "METRIC_1_LABEL": "First metric label",
        "METRIC_2_VALUE": "Second metric value",
        "METRIC_2_LABEL": "Second metric label",
        "METRIC_3_VALUE": "Third metric value",
        "METRIC_3_LABEL": "Third metric label",
        "SUMMARY_TEXT": "Summary statement",
        "BENEFIT_1": "Benefit 1",
        "BENEFIT_2": "Benefit 2",
        "BENEFIT_3": "Benefit 3",
        "BENEFIT_4": "Benefit 4",
        "BRAND_NAME": "Brand name for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "07_big_number": {
        "TITLE": "Title above number",
        "BIG_NUMBER": "The big statistic (e.g. 100,000)",
        "DESCRIPTION": "Description below number",
        "GROWTH_VALUE": "Growth percentage (e.g. 137% YoY)",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "08_comparison": {
        "TITLE": "Comparison title",
        "SUBTITLE": "Comparison subtitle",
        "COL_1_HEADER": "Left column header",
        "COL_1_ITEM_1": "Left column item 1",
        "COL_1_ITEM_2": "Left column item 2",
        "COL_1_ITEM_3": "Left column item 3",
        "COL_1_ITEM_4": "Left column item 4",
        "COL_1_ITEM_5": "Left column item 5",
        "COL_2_HEADER": "Right column header",
        "COL_2_ITEM_1": "Right column item 1",
        "COL_2_ITEM_2": "Right column item 2",
        "COL_2_ITEM_3": "Right column item 3",
        "COL_2_ITEM_4": "Right column item 4",
        "COL_2_ITEM_5": "Right column item 5",
        "SIDEBAR_TITLE": "Orange sidebar title",
        "SIDEBAR_ITEM_1": "Sidebar benefit 1",
        "SIDEBAR_ITEM_2": "Sidebar benefit 2",
        "SIDEBAR_ITEM_3": "Sidebar benefit 3",
        "SIDEBAR_ITEM_4": "Sidebar benefit 4",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "09_multi_column": {
        "TITLE": "Main title",
        "SUBTITLE": "Subtitle",
        "COL_1_HEADER": "Column 1 header",
        "COL_1_SUBHEADER": "Column 1 subheader",
        "COL_1_ITEM_1": "Col 1 item 1",
        "COL_1_ITEM_2": "Col 1 item 2",
        "COL_1_ITEM_3": "Col 1 item 3",
        "COL_2_HEADER": "Column 2 header",
        "COL_2_SUBHEADER": "Column 2 subheader",
        "COL_2_ITEM_1": "Col 2 item 1",
        "COL_2_ITEM_2": "Col 2 item 2",
        "COL_2_ITEM_3": "Col 2 item 3",
        "COL_3_HEADER": "Column 3 header",
        "COL_3_SUBHEADER": "Column 3 subheader",
        "COL_3_ITEM_1": "Col 3 item 1",
        "COL_3_ITEM_2": "Col 3 item 2",
        "COL_3_ITEM_3": "Col 3 item 3",
        "COL_4_HEADER": "Column 4 header",
        "COL_4_SUBHEADER": "Column 4 subheader",
        "COL_4_ITEM_1": "Col 4 item 1",
        "COL_4_ITEM_2": "Col 4 item 2",
        "COL_4_ITEM_3": "Col 4 item 3",
        "COL_5_HEADER": "Column 5 header",
        "COL_5_SUBHEADER": "Column 5 subheader",
        "COL_5_ITEM_1": "Col 5 item 1",
        "COL_5_ITEM_2": "Col 5 item 2",
        "COL_5_ITEM_3": "Col 5 item 3",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "10_numbered_list": {
        "SECTION_TITLE": "Section title (left side)",
        "ITEM_1_TEXT": "Item 1 text",
        "ITEM_2_TEXT": "Item 2 text",
        "ITEM_3_TEXT": "Item 3 text",
        "ITEM_4_TEXT": "Item 4 text",
        "ITEM_5_TEXT": "Item 5 text",
        "ITEM_6_TEXT": "Item 6 text",
        "ITEM_7_TEXT": "Item 7 text",
        "ITEM_8_TEXT": "Item 8 text",
        "ITEM_9_TEXT": "Item 9 text",
        "ITEM_10_TEXT": "Item 10 text",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "11_feature_cards": {
        "TITLE": "Main title",
        "SUBTITLE": "Subtitle description",
        "HERO_IMAGE_URL": "URL of hero image",
        "SECTION_TITLE": "Section title above cards",
        "CARD_1_TITLE": "Card 1 badge title",
        "CARD_1_CONTENT": "Card 1 description",
        "CARD_2_TITLE": "Card 2 badge title",
        "CARD_2_CONTENT": "Card 2 description",
        "CARD_3_TITLE": "Card 3 badge title",
        "CARD_3_CONTENT": "Card 3 description",
        "CARD_4_TITLE": "Card 4 badge title",
        "CARD_4_CONTENT": "Card 4 description",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "12_process_flow": {
        "TITLE": "Main title",
        "LEFT_IMAGE_URL": "Left image URL",
        "RIGHT_IMAGE_URL": "Right image URL",
        "HEADER_LEFT": "Left header label",
        "HEADER_RIGHT": "Right header label",
        "STEP_1_TITLE": "Step 1 title",
        "STEP_2_TITLE": "Step 2 title",
        "STEP_3_TITLE": "Step 3 title",
        "STEP_4_TITLE": "Step 4 title",
        "ARROW_1_LABEL": "Arrow 1 label",
        "ARROW_2_LABEL": "Arrow 2 label",
        "ARROW_3_LABEL": "Arrow 3 label",
        "FEEDBACK_LABEL": "Feedback loop label",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "13_timeline_table": {
        "TITLE": "Main title",
        "TIMELINE_LABEL": "Timeline section label",
        "COL_1_HEADER": "Column 1 header",
        "COL_2_HEADER": "Column 2 header",
        "COL_3_HEADER": "Column 3 header",
        "COL_4_HEADER": "Column 4 header",
        "COL_5_HEADER": "Column 5 header",
        "COL_6_HEADER": "Column 6 header",
        "ROW_1_LABEL": "Row 1 label",
        "ROW_1_COL_1": "Row 1 Col 1 content",
        "ROW_1_COL_2": "Row 1 Col 2 content",
        "ROW_1_COL_3": "Row 1 Col 3 content",
        "ROW_1_COL_4": "Row 1 Col 4 content",
        "ROW_1_COL_5": "Row 1 Col 5 content",
        "ROW_1_COL_6": "Row 1 Col 6 content",
        "ROW_2_LABEL": "Row 2 label (highlighted)",
        "ROW_2_COL_1": "Row 2 Col 1 content",
        "ROW_2_COL_2": "Row 2 Col 2 content",
        "ROW_2_COL_3": "Row 2 Col 3 content",
        "ROW_2_COL_4": "Row 2 Col 4 content",
        "ROW_2_COL_5": "Row 2 Col 5 content",
        "ROW_2_COL_6": "Row 2 Col 6 content",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "14_section_opener": {
        "TITLE": "Section title",
        "IMAGE_URL": "Background image URL",
        "DECK_TITLE": "Deck title for footer"
    },
    "15_photo_testimonial": {
        "BRAND_NAME": "Product/brand name",
        "POWERED_BY": "Powered by company name",
        "TESTIMONIAL_TEXT": "Testimonial quote text",
        "PERSON_NAME": "Person name",
        "PERSON_ROLE": "Person role/title",
        "PERSON_COMPANY": "Person company",
        "PHOTO_URL": "Photo URL of person"
    },
    "16_bullet_list": {
        "TITLE": "Slide title",
        "ITEM_1": "First bullet (supports <strong> for highlights)",
        "ITEM_2": "Second bullet",
        "ITEM_3": "Third bullet",
        "ITEM_4": "Fourth bullet",
        "ITEM_5": "Fifth bullet",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "17_two_column_compare": {
        "TITLE": "Comparison title",
        "SUBTITLE": "Subtitle text",
        "LEFT_ICON": "Icon/emoji for left column",
        "LEFT_TITLE": "Left column header",
        "LEFT_1": "Left item 1",
        "LEFT_2": "Left item 2",
        "LEFT_3": "Left item 3",
        "LEFT_4": "Left item 4",
        "LEFT_5": "Left item 5",
        "RIGHT_ICON": "Icon/emoji for right column",
        "RIGHT_TITLE": "Right column header",
        "RIGHT_1": "Right item 1",
        "RIGHT_2": "Right item 2",
        "RIGHT_3": "Right item 3",
        "RIGHT_4": "Right item 4",
        "RIGHT_5": "Right item 5",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "18_data_table": {
        "TITLE": "Table title",
        "SUBTITLE": "Table subtitle",
        "COL_1_HEADER": "Column 1 header",
        "COL_2_HEADER": "Column 2 header",
        "COL_3_HEADER": "Column 3 header",
        "COL_4_HEADER": "Column 4 header",
        "ROW_1_COL_1": "Row 1 Col 1",
        "ROW_1_COL_2": "Row 1 Col 2",
        "ROW_1_COL_3": "Row 1 Col 3",
        "ROW_1_COL_4": "Row 1 Col 4",
        "ROW_2_COL_1": "Row 2 Col 1",
        "ROW_2_COL_2": "Row 2 Col 2",
        "ROW_2_COL_3": "Row 2 Col 3",
        "ROW_2_COL_4": "Row 2 Col 4",
        "ROW_3_COL_1": "Row 3 Col 1",
        "ROW_3_COL_2": "Row 3 Col 2",
        "ROW_3_COL_3": "Row 3 Col 3",
        "ROW_3_COL_4": "Row 3 Col 4",
        "ROW_4_COL_1": "Row 4 Col 1",
        "ROW_4_COL_2": "Row 4 Col 2",
        "ROW_4_COL_3": "Row 4 Col 3",
        "ROW_4_COL_4": "Row 4 Col 4",
        "ROW_5_COL_1": "Row 5 Col 1",
        "ROW_5_COL_2": "Row 5 Col 2",
        "ROW_5_COL_3": "Row 5 Col 3",
        "ROW_5_COL_4": "Row 5 Col 4",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "19_logo_grid": {
        "TITLE": "Grid title",
        "SUBTITLE": "Grid subtitle",
        "CARD_1_ICON": "Card 1 icon/emoji",
        "CARD_1_NAME": "Card 1 name",
        "CARD_1_DESC": "Card 1 description",
        "CARD_1_TAG": "Card 1 tag",
        "CARD_2_ICON": "Card 2 icon/emoji",
        "CARD_2_NAME": "Card 2 name",
        "CARD_2_DESC": "Card 2 description",
        "CARD_2_TAG": "Card 2 tag",
        "CARD_3_ICON": "Card 3 icon/emoji",
        "CARD_3_NAME": "Card 3 name",
        "CARD_3_DESC": "Card 3 description",
        "CARD_3_TAG": "Card 3 tag",
        "CARD_4_ICON": "Card 4 icon/emoji",
        "CARD_4_NAME": "Card 4 name",
        "CARD_4_DESC": "Card 4 description",
        "CARD_4_TAG": "Card 4 tag",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "20_journey": {
        "TITLE": "Journey title",
        "STAGE_1_YEAR": "Stage 1 year/label",
        "STAGE_1_TITLE": "Stage 1 title",
        "STAGE_1_DESC": "Stage 1 description",
        "STAGE_2_YEAR": "Stage 2 year/label",
        "STAGE_2_TITLE": "Stage 2 title",
        "STAGE_2_DESC": "Stage 2 description",
        "STAGE_3_YEAR": "Stage 3 year/label",
        "STAGE_3_TITLE": "Stage 3 title",
        "STAGE_3_DESC": "Stage 3 description",
        "STAGE_4_YEAR": "Stage 4 year/label",
        "STAGE_4_TITLE": "Stage 4 title",
        "STAGE_4_DESC": "Stage 4 description",
        "CALLOUT_ICON": "Callout icon/emoji",
        "CALLOUT_TEXT": "Callout text",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "21_key_accounts": {
        "TITLE": "Accounts title",
        "SUBTITLE": "Accounts subtitle",
        "ACCOUNT_1_NAME": "Account 1 name",
        "ACCOUNT_1_VALUE": "Account 1 value",
        "ACCOUNT_1_STATUS": "Account 1 status",
        "ACCOUNT_2_NAME": "Account 2 name",
        "ACCOUNT_2_VALUE": "Account 2 value",
        "ACCOUNT_2_STATUS": "Account 2 status",
        "ACCOUNT_3_NAME": "Account 3 name",
        "ACCOUNT_3_VALUE": "Account 3 value",
        "ACCOUNT_3_STATUS": "Account 3 status",
        "ACCOUNT_4_NAME": "Account 4 name",
        "ACCOUNT_4_VALUE": "Account 4 value",
        "ACCOUNT_4_STATUS": "Account 4 status",
        "STAT_1_VALUE": "Highlight stat 1 value",
        "STAT_1_LABEL": "Highlight stat 1 label",
        "STAT_2_VALUE": "Highlight stat 2 value",
        "STAT_2_LABEL": "Highlight stat 2 label",
        "HIGHLIGHT_TEXT": "Highlight callout text",
        "DECK_TITLE": "Deck title for footer",
        "SLIDE_NUMBER": "Slide number"
    },
    "22_memorial": {
        "QUOTE_TEXT": "Memorial quote text",
        "PORTRAIT_URL": "URL of portrait image",
        "PERSON_NAME": "Name of person",
        "PERSON_ROLE": "Role/team of person"
    },
    "23_gofundme": {
        "PERSON_NAME": "Name of person",
        "PORTRAIT_URL": "URL of portrait image",
        "CAMPAIGN_DESCRIPTION": "Campaign description text",
        "SUPPORT_MESSAGE": "Support message in callout box"
    }
}


def get_template_path(template_name: str) -> Path:
    """Get the path to a template file."""
    templates_dir = Path(__file__).parent
    template_file = templates_dir / f"{template_name}.html"
    if not template_file.exists():
        raise FileNotFoundError(f"Template not found: {template_file}")
    return template_file


def render_slide(template_name: str, data: dict) -> str:
    """
    Render a slide template with the provided data.
    
    Args:
        template_name: Name of template (e.g. "07_big_number")
        data: Dictionary of template variables to replace
        
    Returns:
        Rendered HTML string
    """
    template_path = get_template_path(template_name)
    html = template_path.read_text(encoding="utf-8")
    
    # Replace all {{VARIABLE}} placeholders
    for key, value in data.items():
        placeholder = f"{{{{{key}}}}}"
        html = html.replace(placeholder, str(value))
    
    return html


def list_templates():
    """List all available templates and their variables."""
    print("\n=== Available Templates ===\n")
    for name, variables in TEMPLATE_VARS.items():
        print(f"  {name}")
        print(f"  {'─' * len(name)}")
        for var, desc in variables.items():
            print(f"    {{{{ {var} }}}} - {desc}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Render HTML slide templates with dynamic data"
    )
    parser.add_argument(
        "--template", "-t",
        help="Template name (e.g. 07_big_number)"
    )
    parser.add_argument(
        "--data", "-d",
        help="JSON string of template variables"
    )
    parser.add_argument(
        "--data-file", "-f",
        help="Path to JSON file with template variables"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output file path (default: stdout)"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all templates and their variables"
    )
    
    args = parser.parse_args()
    
    if args.list:
        list_templates()
        return
    
    if not args.template:
        parser.error("--template is required (or use --list to see available templates)")
    
    # Load data
    data = {}
    if args.data:
        data = json.loads(args.data)
    elif args.data_file:
        with open(args.data_file) as f:
            data = json.load(f)
    
    # Render
    html = render_slide(args.template, data)
    
    # Output
    if args.output:
        Path(args.output).write_text(html, encoding="utf-8")
        print(f"Rendered to: {args.output}")
    else:
        print(html)


if __name__ == "__main__":
    main()
