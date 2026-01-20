"""
Analyze current deck (first N slides) vs expected content from EXTENDED_CONSENSUS_DECK.md.

Outputs DECK_AMENDMENTS.md with per-slide:
- expected title
- expected key lines (body excerpt)
- actual extracted text snippets
- initial fix notes
"""

from __future__ import annotations

import os
import pickle
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List

from googleapiclient.discovery import build

PRESENTATION_ID = "1OoLNIDGV-2v4MHzxZ64O2yeaEzSE9PPLnY1zhceBgIM"
EXPECTED_MD = "EXTENDED_CONSENSUS_DECK.md"
OUTPUT_MD = "DECK_AMENDMENTS.md"

ANALYZE_SLIDES = 45  # current deck active portion
EXPECTED_SLIDES = 50


@dataclass
class ExpectedSlide:
    n: int
    title: str
    body_lines: List[str]


def parse_expected(md_text: str) -> List[ExpectedSlide]:
    slides: List[ExpectedSlide] = []
    cur_n = None
    cur_title = None
    cur_body: List[str] = []

    for raw in md_text.splitlines():
        line = raw.rstrip("\n")
        m = re.match(r"^##\s+SLIDE\s+(\d+):\s*(.+?)\s*$", line.strip())
        if m:
            if cur_n is not None:
                slides.append(ExpectedSlide(cur_n, cur_title or "", cur_body))
            cur_n = int(m.group(1))
            cur_title = m.group(2).strip()
            cur_body = []
            continue

        if cur_n is None:
            continue

        if line.strip().startswith("**SPEAKER NOTES:**"):
            continue
        if line.strip().startswith("---"):
            continue
        if not line.strip():
            continue

        # exclude speaker note bullets which sometimes appear without header
        if line.strip().startswith("- ") and "SPEAKER NOTES" in md_text:
            # keep bullets only if they're in the main body (heuristic: before notes header)
            pass

        cur_body.append(line.strip())

    if cur_n is not None:
        slides.append(ExpectedSlide(cur_n, cur_title or "", cur_body))

    slides = [s for s in slides if 1 <= s.n <= EXPECTED_SLIDES]
    slides.sort(key=lambda s: s.n)
    return slides


def extract_slide_text(slide: dict) -> List[str]:
    out: List[str] = []
    for element in slide.get("pageElements", []):
        shape = element.get("shape", {})
        text_data = shape.get("text", {})
        if not text_data:
            continue
        full = ""
        for te in text_data.get("textElements", []):
            full += te.get("textRun", {}).get("content", "")
        txt = full.strip()
        if not txt:
            continue
        if txt in {"0", "00", "slide"}:
            continue
        out.append(re.sub(r"\s+", " ", txt))
    # de-dup while preserving order
    seen = set()
    dedup = []
    for t in out:
        if t not in seen:
            seen.add(t)
            dedup.append(t)
    return dedup


def main() -> None:
    md_text = Path(EXPECTED_MD).read_text(encoding="utf-8")
    expected = parse_expected(md_text)
    expected_by_n = {s.n: s for s in expected}

    token_file = Path(__file__).with_name("token.pickle")
    with token_file.open("rb") as f:
        creds = pickle.load(f)

    slides_service = build("slides", "v1", credentials=creds)
    pres = slides_service.presentations().get(presentationId=PRESENTATION_ID).execute()
    slides = pres.get("slides", [])

    lines: List[str] = []
    lines.append("# DECK AMENDMENTS — Expected vs Actual")
    lines.append("")
    lines.append(f"- **Deck**: `https://docs.google.com/presentation/d/{PRESENTATION_ID}/edit`")
    lines.append(f"- **Analyzed**: Slides 1–{ANALYZE_SLIDES} (current order)")
    lines.append(f"- **Expected source**: `{EXPECTED_MD}`")
    lines.append("")

    for i in range(1, min(ANALYZE_SLIDES, len(slides)) + 1):
        actual_text = extract_slide_text(slides[i - 1])
        exp = expected_by_n.get(i)
        lines.append(f"## Slide {i:02d}")
        lines.append("")
        if exp:
            lines.append(f"- **Expected**: {exp.title}")
            if exp.body_lines:
                excerpt = exp.body_lines[:6]
                lines.append("- **Expected key lines**:")
                for l in excerpt:
                    lines.append(f"  - {l}")
        else:
            lines.append("- **Expected**: (no expected slide found in extended deck)")

        lines.append("- **Actual text (extracted)**:")
        if actual_text:
            for t in actual_text[:12]:
                lines.append(f"  - {t}")
            if len(actual_text) > 12:
                lines.append(f"  - (… +{len(actual_text) - 12} more)")
        else:
            lines.append("  - (no text detected)")

        # very lightweight heuristic notes
        if exp and actual_text:
            title_hit = any(exp.title.lower() in t.lower() for t in actual_text[:3])
            if not title_hit:
                lines.append("- **Fix notes (initial)**: Title/content mismatch — needs rewrite + likely delete leftover template elements.")
            else:
                lines.append("- **Fix notes (initial)**: Title matches — verify body and remove leftover template elements if present.")
        elif exp and not actual_text:
            lines.append("- **Fix notes (initial)**: Blank slide — needs content creation.")
        else:
            lines.append("- **Fix notes (initial)**: Review needed.")
        lines.append("")

    Path(OUTPUT_MD).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[OK] Wrote {OUTPUT_MD}")


if __name__ == "__main__":
    main()

