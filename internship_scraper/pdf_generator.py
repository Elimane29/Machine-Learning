"""
Générateur de PDF pour les lettres de motivation.
Utilise reportlab pour créer des PDFs propres et professionnels.
"""

import os
import logging
import textwrap
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT, TA_RIGHT

from config import PROFILE

logger = logging.getLogger(__name__)

# Palette de couleurs
NAVY = colors.Color(31/255, 73/255, 125/255)
STEEL = colors.Color(70/255, 130/255, 180/255)
DARK = colors.Color(40/255, 40/255, 40/255)
LIGHT_GRAY = colors.Color(0.96, 0.96, 0.96)


def _get_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="CandidatName",
        fontSize=20,
        fontName="Helvetica-Bold",
        textColor=colors.white,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="CandidatContact",
        fontSize=9,
        fontName="Helvetica",
        textColor=colors.white,
        alignment=TA_CENTER,
        spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        spaceAfter=4,
        spaceBefore=8,
    ))
    styles.add(ParagraphStyle(
        name="CompanyInfo",
        fontSize=10,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="DateLine",
        fontSize=10,
        fontName="Helvetica-Oblique",
        textColor=colors.gray,
        alignment=TA_RIGHT,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="Subject",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        backColor=LIGHT_GRAY,
        spaceAfter=10,
        spaceBefore=6,
        leftIndent=6,
        rightIndent=6,
    ))
    styles.add(ParagraphStyle(
        name="LMBodyText",
        fontSize=10.5,
        fontName="Helvetica",
        textColor=DARK,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
        leading=16,
    ))
    styles.add(ParagraphStyle(
        name="Signature",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        spaceBefore=12,
    ))
    styles.add(ParagraphStyle(
        name="SignatureDetail",
        fontSize=10,
        fontName="Helvetica",
        textColor=DARK,
        spaceAfter=2,
    ))
    return styles


def generate_cover_letter_pdf(
    job: dict,
    cover_letter_text: str,
    output_dir: str = "output/letters",
) -> str:
    """
    Génère un PDF professionnel pour une lettre de motivation.
    Returns: chemin absolu vers le PDF généré.
    """
    os.makedirs(output_dir, exist_ok=True)

    company_safe = "".join(c if c.isalnum() else "_" for c in job.get("company", "Entreprise"))
    title_safe = "".join(c if c.isalnum() else "_" for c in job.get("title", "Stage")[:30])
    filename = f"LM_{PROFILE['first_name']}_{company_safe}_{title_safe}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        topMargin=0,
        bottomMargin=2*cm,
        leftMargin=2.5*cm,
        rightMargin=2.5*cm,
    )

    styles = _get_styles()
    story = []

    # ── En-tête coloré (simulé avec un tableau) ───────────────────────────────
    name = f"{PROFILE['first_name']} {PROFILE.get('last_name', '')}".strip()
    contact_parts = []
    if PROFILE.get("phone"):
        contact_parts.append(PROFILE["phone"])
    if PROFILE.get("email"):
        contact_parts.append(PROFILE["email"])
    contact_parts.append(PROFILE.get("address", "Paris, France"))
    if PROFILE.get("github"):
        contact_parts.append(PROFILE["github"])
    contact_str = "  |  ".join(contact_parts)

    header_data = [
        [Paragraph(name, styles["CandidatName"])],
        [Paragraph(contact_str, styles["CandidatContact"])],
    ]
    header_table = Table(header_data, colWidths=[doc.width + 5*cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING", (0, 0), (-1, 0), 14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width="100%", thickness=2, color=STEEL))
    story.append(Spacer(1, 0.4*cm))

    # ── Destinataire ──────────────────────────────────────────────────────────
    story.append(Paragraph(job.get("company", ""), styles["CompanyInfo"]))
    story.append(Paragraph(job.get("location", ""), styles["LMBodyText"]))
    story.append(Spacer(1, 0.3*cm))

    # ── Date ─────────────────────────────────────────────────────────────────
    date_str = datetime.now().strftime("%d %B %Y")
    story.append(Paragraph(f"Paris, le {date_str}", styles["DateLine"]))

    # ── Objet ────────────────────────────────────────────────────────────────
    story.append(Paragraph(
        f"Objet : Candidature – {job.get('title', 'Stage / Alternance')}",
        styles["Subject"],
    ))

    # ── Corps ─────────────────────────────────────────────────────────────────
    paragraphs = cover_letter_text.strip().split("\n")
    for para in paragraphs:
        para = para.strip()
        if not para:
            story.append(Spacer(1, 0.25*cm))
            continue
        story.append(Paragraph(para, styles["LMBodyText"]))

    # ── Signature ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(name, styles["Signature"]))
    if PROFILE.get("phone"):
        story.append(Paragraph(PROFILE["phone"], styles["SignatureDetail"]))
    if PROFILE.get("email"):
        story.append(Paragraph(PROFILE["email"], styles["SignatureDetail"]))

    doc.build(story)
    logger.info(f"[PDF] Lettre générée : {filepath}")
    return filepath


def generate_applications_summary_pdf(applications: list[dict], output_dir: str = "output") -> str:
    """Génère un PDF récapitulatif de toutes les candidatures."""
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, "recap_candidatures.pdf")

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        topMargin=0,
        bottomMargin=2*cm,
        leftMargin=2*cm,
        rightMargin=2*cm,
    )

    styles = _get_styles()
    story = []

    # En-tête
    header_data = [[Paragraph("Récapitulatif des candidatures", styles["CandidatName"])]]
    header_table = Table(header_data, colWidths=[doc.width + 4*cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("TOPPADDING", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 12),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5*cm))

    meta_style = ParagraphStyle("meta", fontSize=10, fontName="Helvetica", textColor=DARK)
    story.append(Paragraph(
        f"Généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} — "
        f"{len(applications)} candidature(s)",
        meta_style,
    ))
    story.append(Spacer(1, 0.4*cm))

    # Tableau récap
    headers = ["Score", "Poste", "Entreprise", "Lieu", "Lien"]
    data = [headers]
    for app in applications:
        data.append([
            f"{app.get('score', 0):.1f}/10",
            app.get("title", "")[:40],
            app.get("company", "")[:25],
            app.get("location", "")[:20],
            app.get("apply_url", "")[:35],
        ])

    col_w = [1.5*cm, 5.5*cm, 4*cm, 3.5*cm, 5.5*cm]
    t = Table(data, colWidths=col_w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)

    doc.build(story)
    logger.info(f"[PDF] Récapitulatif généré : {filepath}")
    return filepath
