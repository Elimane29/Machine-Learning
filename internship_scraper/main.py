"""
Pipeline principal : scraping → déduplication → génération LM → export PDF.
Usage :
    python main.py              # scrape + génère les lettres
    python main.py --dry-run    # scrape seulement, sans générer de lettres
    python main.py --load       # charge un fichier jobs existant (output/jobs_found.json)
"""

import argparse
import json
import logging
import os
import csv
import sys
import time
from datetime import datetime

from config import SEARCH_CONFIG, OUTPUT_DIR, JOBS_FILE, APPLICATIONS_LOG, ANTHROPIC_API_KEY
from scrapers.wttj import scrape_wttj
from scrapers.indeed_scraper import scrape_indeed
from scrapers.company_pages import scrape_company_pages
from cover_letter_generator import generate_cover_letter, generate_email_body
from pdf_generator import generate_cover_letter_pdf, generate_applications_summary_pdf

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("output/scraper.log", mode="a", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def deduplicate(jobs: list[dict]) -> list[dict]:
    """Supprime les doublons en se basant sur (titre, entreprise)."""
    seen = set()
    unique = []
    for job in jobs:
        key = (job["title"].lower().strip(), job["company"].lower().strip())
        if key not in seen:
            seen.add(key)
            unique.append(job)
    return unique


def score_job(job: dict) -> float:
    """
    Score de pertinence 0-10 pour prioriser les offres.
    Basé sur la correspondance avec le profil cible.
    """
    text = (
        job.get("title", "") + " " +
        job.get("description", "") + " " +
        job.get("profile", "")
    ).lower()

    score = 0.0

    # Trading / marchés de l'énergie
    high_value = ["trading", "trader", "énergie", "energy", "marché", "market",
                  "commodit", "power", "electricity", "fcr", "spot", "dispatch"]
    for term in high_value:
        if term in text:
            score += 1.0

    # Quant / data
    quant_terms = ["quantitat", "data", "python", "modéli", "analys", "pricing",
                   "structur", "portfolio", "machine learning", "statistique"]
    for term in quant_terms:
        if term in text:
            score += 0.5

    # Type de contrat visé
    contract_terms = ["alternance", "apprentissage", "stage", "internship"]
    for term in contract_terms:
        if term in text or term in job.get("contract_type", "").lower():
            score += 1.5

    # Entreprises cibles premium
    premium = ["engie", "totalenergies", "edf", "rte", "axpo", "statkraft",
               "bnp", "société générale", "natixis", "macquarie", "shell",
               "boralex", "neoen", "vattenfall"]
    company_lower = job.get("company", "").lower()
    if any(p in company_lower for p in premium):
        score += 2.0

    return min(score, 10.0)


def run_scraping(keywords: list[str]) -> list[dict]:
    """Lance tous les scrapers et retourne les offres dédupliquées triées par score."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_jobs = []

    logger.info("=" * 60)
    logger.info("PHASE 1 : Scraping Welcome to the Jungle")
    logger.info("=" * 60)
    try:
        wttj_jobs = scrape_wttj(keywords[:6], max_per_keyword=15)
        all_jobs.extend(wttj_jobs)
    except Exception as e:
        logger.error(f"WTTJ scraper failed: {e}")

    logger.info("\n" + "=" * 60)
    logger.info("PHASE 2 : Scraping Indeed France")
    logger.info("=" * 60)
    try:
        indeed_jobs = scrape_indeed(keywords[:5], max_results=20)
        all_jobs.extend(indeed_jobs)
    except Exception as e:
        logger.error(f"Indeed scraper failed: {e}")

    logger.info("\n" + "=" * 60)
    logger.info("PHASE 3 : Scraping pages carrières entreprises")
    logger.info("=" * 60)
    try:
        company_jobs = scrape_company_pages()
        all_jobs.extend(company_jobs)
    except Exception as e:
        logger.error(f"Company pages scraper failed: {e}")

    # Score + tri
    for job in all_jobs:
        job["score"] = score_job(job)
    all_jobs.sort(key=lambda j: j["score"], reverse=True)

    unique_jobs = deduplicate(all_jobs)

    # Sauvegarde JSON
    with open(JOBS_FILE, "w", encoding="utf-8") as f:
        json.dump(unique_jobs, f, ensure_ascii=False, indent=2)
    logger.info(f"\n✓ {len(unique_jobs)} offres uniques sauvegardées dans {JOBS_FILE}")

    return unique_jobs


def run_applications(jobs: list[dict], max_jobs: int = 20) -> list[dict]:
    """
    Pour chaque offre :
    1. Génère une lettre de motivation personnalisée via Claude
    2. Crée le PDF
    3. Génère le corps d'email
    4. Log la candidature
    """
    if not ANTHROPIC_API_KEY:
        logger.error(
            "ANTHROPIC_API_KEY non défini ! "
            "Lance : export ANTHROPIC_API_KEY='sk-ant-...' puis relance."
        )
        return []

    os.makedirs("output/letters", exist_ok=True)
    applications = []
    top_jobs = jobs[:max_jobs]

    logger.info(f"\n{'=' * 60}")
    logger.info(f"PHASE 4 : Génération des lettres de motivation ({len(top_jobs)} offres)")
    logger.info("=" * 60)

    for i, job in enumerate(top_jobs, 1):
        logger.info(f"\n[{i}/{len(top_jobs)}] {job['title']} @ {job['company']}")

        try:
            # Détecte la langue (anglais si entreprise internationale ou titre en anglais)
            title_lower = job["title"].lower()
            lang = "en" if any(w in title_lower for w in ["intern", "analyst", "trader", "market"]) else "fr"

            cover_letter = generate_cover_letter(job, language=lang)
            pdf_path = generate_cover_letter_pdf(job, cover_letter)
            email_draft = generate_email_body(job, cover_letter)

            app = {
                "title": job["title"],
                "company": job["company"],
                "location": job["location"],
                "source": job["source"],
                "apply_url": job["apply_url"],
                "score": job["score"],
                "language": lang,
                "cover_letter_path": pdf_path,
                "email_draft": email_draft,
                "status": "Prête",
                "applied_at": datetime.utcnow().isoformat(),
            }
            applications.append(app)

            # Sauvegarde email draft
            email_file = pdf_path.replace(".pdf", "_email.txt")
            with open(email_file, "w", encoding="utf-8") as f:
                f.write(f"=== OFFRE : {job['title']} @ {job['company']} ===\n")
                f.write(f"Lien : {job['apply_url']}\n\n")
                f.write(email_draft)
            logger.info(f"  ✓ PDF : {os.path.basename(pdf_path)}")
            logger.info(f"  ✓ Email : {os.path.basename(email_file)}")

            time.sleep(1)  # Respecte les limites de rate Claude

        except Exception as e:
            logger.error(f"  ✗ Erreur pour {job['title']}: {e}")

    # Log CSV
    if applications:
        with open(APPLICATIONS_LOG, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["title", "company", "location", "source",
                            "apply_url", "score", "language",
                            "cover_letter_path", "status", "applied_at"],
                extrasaction="ignore",
            )
            writer.writeheader()
            writer.writerows(applications)
        logger.info(f"\n✓ Log CSV : {APPLICATIONS_LOG}")

        # PDF récap
        summary_path = generate_applications_summary_pdf(applications)
        logger.info(f"✓ Récapitulatif PDF : {summary_path}")

    return applications


def print_summary(jobs: list[dict], applications: list[dict]) -> None:
    print("\n" + "=" * 60)
    print("RÉSUMÉ DE LA SESSION")
    print("=" * 60)
    print(f"  Offres trouvées (total)     : {len(jobs)}")
    print(f"  Lettres générées            : {len(applications)}")
    if applications:
        print(f"\n  TOP 5 OFFRES :")
        for app in applications[:5]:
            print(f"    [{app['score']:.1f}/10] {app['title']} @ {app['company']} ({app['location']})")
            print(f"            → {app['apply_url']}")
    print("\n  Fichiers générés dans ./output/")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Scraper de stages/alternances trading énergie")
    parser.add_argument("--dry-run", action="store_true",
                        help="Scrape uniquement, sans générer de lettres")
    parser.add_argument("--load", action="store_true",
                        help="Charge les offres depuis output/jobs_found.json")
    parser.add_argument("--max", type=int, default=20,
                        help="Nombre max de lettres à générer (défaut: 20)")
    parser.add_argument("--keywords-only", nargs="+",
                        help="Restreindre la recherche à ces mots-clés")
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if args.load and os.path.exists(JOBS_FILE):
        logger.info(f"Chargement des offres depuis {JOBS_FILE}")
        with open(JOBS_FILE, encoding="utf-8") as f:
            jobs = json.load(f)
        logger.info(f"{len(jobs)} offres chargées")
    else:
        keywords = args.keywords_only or SEARCH_CONFIG["keywords"]
        jobs = run_scraping(keywords)

    if not jobs:
        logger.warning("Aucune offre trouvée. Vérifie ta connexion ou élargis les mots-clés.")
        return

    applications = []
    if not args.dry_run:
        applications = run_applications(jobs, max_jobs=args.max)

    print_summary(jobs, applications)


if __name__ == "__main__":
    main()
