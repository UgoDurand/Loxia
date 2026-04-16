#!/usr/bin/env python3
"""Export Loxia presentation HTML → PDF via Playwright."""
import asyncio
import os
from pathlib import Path

from playwright.async_api import async_playwright

HTML_PATH = Path(__file__).parent / "presentation.html"
PDF_PATH  = Path(__file__).parent / "Loxia_Presentation.pdf"

async def main():
    print(f"Rendering: {HTML_PATH}")
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=["--no-sandbox"])
        page = await browser.new_page()

        # Load file
        await page.goto(f"file://{HTML_PATH.resolve()}", wait_until="networkidle")
        # Extra wait for Google Fonts to load
        await page.wait_for_timeout(3000)

        # Export PDF — 16:9 slide format (297 × 167 mm)
        await page.pdf(
            path=str(PDF_PATH),
            width="297mm",
            height="167mm",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
        )

        await browser.close()
    print(f"✓ PDF exporté : {PDF_PATH}")
    print(f"  Taille : {PDF_PATH.stat().st_size / 1024:.0f} Ko")

if __name__ == "__main__":
    asyncio.run(main())
