#!/usr/bin/env python3
"""Gera PDFs A4 das cartilhas bônus a partir dos HTML."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
PDF_DIR = ROOT / "pdf"
PDF_DIR.mkdir(exist_ok=True)

JOBS = [
    ("bonus-01-ritual-limpeza.html", "Bonus-01-Ritual-Limpeza-Renovacao-Emocional.pdf"),
    ("bonus-02-ritual-desapego.html", "Bonus-02-Ritual-Desapego-Relacao-Confusa.pdf"),
    ("bonus-03-kit-protecao.html", "Bonus-03-Kit-Protecao-Emocional-Recaida.pdf"),
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for html_name, pdf_name in JOBS:
            html_path = ROOT / html_name
            pdf_path = PDF_DIR / pdf_name
            url = html_path.as_uri()
            print(f"→ {html_name}")
            page.goto(url, wait_until="networkidle", timeout=120000)
            # wait fonts
            page.wait_for_timeout(1500)
            page.pdf(
                path=str(pdf_path),
                format="A4",
                print_background=True,
                margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
                prefer_css_page_size=True,
            )
            size_kb = pdf_path.stat().st_size / 1024
            print(f"  ✓ {pdf_name} ({size_kb:.0f} KB)")
        browser.close()
    print("Pronto:", PDF_DIR)


if __name__ == "__main__":
    main()
