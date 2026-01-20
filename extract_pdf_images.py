import fitz  # PyMuPDF
import os
from pathlib import Path

# Define paths
workspace = Path(r"C:\Users\donal.oshea_deciphex\Kickoff workspace")
supporting_content = workspace / "supporting content"
output_dir = workspace / "extracted_slides"

# Create output directory
output_dir.mkdir(exist_ok=True)

# PDF files to process
pdfs = [
    supporting_content / "Deciphex Investor Deck + Kickoff.pdf",
    supporting_content / "Donals Keynote - 2025 Kickoff meeting .pdf"
]

for pdf_path in pdfs:
    if pdf_path.exists():
        print(f"\n{'='*60}")
        print(f"Processing: {pdf_path.name}")
        print(f"{'='*60}")
        
        # Create subfolder for this PDF (strip whitespace from name)
        folder_name = pdf_path.stem.strip()
        pdf_output = output_dir / folder_name
        pdf_output.mkdir(exist_ok=True)
        
        # Open PDF
        doc = fitz.open(pdf_path)
        print(f"Total pages: {len(doc)}")
        
        # Extract each page as image
        total_pages = len(doc)
        for page_num in range(total_pages):
            page = doc[page_num]
            
            # Render page to image at 2x resolution for quality
            mat = fitz.Matrix(2, 2)  # 2x zoom for higher quality
            pix = page.get_pixmap(matrix=mat)
            
            # Save as PNG
            output_file = pdf_output / f"slide_{page_num + 1:03d}.png"
            pix.save(str(output_file))
            
            if (page_num + 1) % 10 == 0 or page_num == 0:
                print(f"  Extracted slide {page_num + 1}/{total_pages}")
        
        doc.close()
        print(f"  Complete! {total_pages} slides saved to: {pdf_output}")
    else:
        print(f"Not found: {pdf_path}")

print(f"\n{'='*60}")
print(f"All slides extracted to: {output_dir}")
print(f"{'='*60}")
