"""
Scraper direct sur les pages Carrières des grandes entreprises du trading d'énergie.
Chaque fonction cible une entreprise spécifique.
"""

import requests
import time
import logging
import re
from bs4 import BeautifulSoup
from datetime import datetime

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}

STAGE_TERMS = re.compile(
    r"stage|internship|intern|stagiaire|apprenti|alternance", re.I
)
ENERGY_TRADING_TERMS = re.compile(
    r"trading|trader|marché|market|énergie|energy|commodit|power|électricité|"
    r"electricity|gaz|structur|pricing|quantitat|portfolio|portefeuille|"
    r"analys|dispatch|optimis", re.I
)


def _normalize(job_id, title, company, location, url, description, source):
    return {
        "source": source,
        "id": job_id,
        "title": title,
        "company": company,
        "location": location,
        "contract_type": "Stage",
        "description": description,
        "profile": "",
        "apply_url": url,
        "posted_at": "",
        "salary": "",
        "scraped_at": datetime.utcnow().isoformat(),
        "keyword": "direct_scrape",
    }


def _is_relevant(title: str, description: str = "") -> bool:
    text = title + " " + description
    return bool(STAGE_TERMS.search(text)) and bool(ENERGY_TRADING_TERMS.search(text))


# ── TotalEnergies ─────────────────────────────────────────────────────────────

def scrape_totalenergies() -> list[dict]:
    """Scrape TotalEnergies careers API."""
    results = []
    url = (
        "https://jobs.totalenergies.com/api/jobs/search"
        "?country=France&category=Trading%20%26%20Shipping&contract=Internship&lang=fr"
    )
    fallback_url = (
        "https://jobs.totalenergies.com/fr_FR/careers/SearchJobs/"
        "?523=%5B182685%5D&523_format=4495&524=%5B182693%5D"
    )

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            try:
                data = resp.json()
                jobs = data.get("jobs") or data.get("results") or []
                for job in jobs:
                    title = job.get("title", "")
                    if not _is_relevant(title, job.get("description", "")):
                        continue
                    results.append(_normalize(
                        job_id=str(job.get("id", "")),
                        title=title,
                        company="TotalEnergies",
                        location=job.get("location", "Paris"),
                        url=job.get("url", "https://jobs.totalenergies.com"),
                        description=job.get("description", ""),
                        source="TotalEnergies Careers",
                    ))
            except Exception:
                pass

        if not results:
            resp = requests.get(fallback_url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "lxml")
            for row in soup.find_all(["li", "tr", "div"], class_=re.compile("job|offer|posting")):
                title_el = row.find(["h3", "h4", "a", "span"], class_=re.compile("title|name"))
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                link_el = row.find("a", href=True)
                href = link_el["href"] if link_el else ""
                url_full = href if href.startswith("http") else f"https://jobs.totalenergies.com{href}"
                if _is_relevant(title):
                    results.append(_normalize(
                        job_id=href,
                        title=title,
                        company="TotalEnergies",
                        location="France",
                        url=url_full,
                        description="",
                        source="TotalEnergies Careers",
                    ))

    except Exception as e:
        logger.error(f"[TotalEnergies] Erreur : {e}")

    logger.info(f"[TotalEnergies] {len(results)} offre(s) trouvée(s)")
    return results


# ── Engie ─────────────────────────────────────────────────────────────────────

def scrape_engie() -> list[dict]:
    """Scrape Engie careers pour les stages trading."""
    results = []
    urls = [
        "https://jobs.engie.com/fr/job-search/?job_type=internship&keywords=trading+energie",
        "https://jobs.engie.com/fr/job-search/?job_type=internship&keywords=energy+market",
        "https://jobs.engie.com/fr/job-search/?job_type=internship&keywords=marche+energie",
    ]

    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.find_all(["article", "li", "div"],
                                       class_=re.compile("job|offer|card|result")):
                title_el = card.find(["h2", "h3", "h4", "a"],
                                      class_=re.compile("title|name|job"))
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                link_el = card.find("a", href=True)
                href = link_el["href"] if link_el else ""
                url_full = href if href.startswith("http") else f"https://jobs.engie.com{href}"
                location_el = card.find(class_=re.compile("location|city"))
                location = location_el.get_text(strip=True) if location_el else "France"
                desc_el = card.find(class_=re.compile("desc|snippet|excerpt"))
                desc = desc_el.get_text(strip=True) if desc_el else ""

                if _is_relevant(title, desc):
                    results.append(_normalize(
                        job_id=href,
                        title=title,
                        company="Engie",
                        location=location,
                        url=url_full,
                        description=desc,
                        source="Engie Careers",
                    ))

            time.sleep(1.5)

        except Exception as e:
            logger.error(f"[Engie] Erreur : {e}")

    logger.info(f"[Engie] {len(results)} offre(s) trouvée(s)")
    return results


# ── EDF ───────────────────────────────────────────────────────────────────────

def scrape_edf() -> list[dict]:
    """Scrape EDF recrutement pour les stages trading/énergie."""
    results = []
    urls = [
        "https://recrutement.edf.com/nos-offres/offres-de-stage/?keywords=trading",
        "https://recrutement.edf.com/nos-offres/offres-de-stage/?keywords=marche+energie",
        "https://recrutement.edf.com/nos-offres/offres-de-stage/?keywords=energy+market",
    ]

    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.find_all(["article", "div", "li"],
                                       class_=re.compile("job|offer|card|result|posting")):
                title_el = card.find(["h2", "h3", "h4", "span"],
                                      class_=re.compile("title|name"))
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                link_el = card.find("a", href=True)
                href = link_el["href"] if link_el else ""
                url_full = href if href.startswith("http") else f"https://recrutement.edf.com{href}"
                location_el = card.find(class_=re.compile("location|lieu|city"))
                location = location_el.get_text(strip=True) if location_el else "France"
                desc_el = card.find(class_=re.compile("desc|snippet"))
                desc = desc_el.get_text(strip=True) if desc_el else ""

                if _is_relevant(title, desc):
                    results.append(_normalize(
                        job_id=href,
                        title=title,
                        company="EDF",
                        location=location,
                        url=url_full,
                        description=desc,
                        source="EDF Recrutement",
                    ))

            time.sleep(1.5)

        except Exception as e:
            logger.error(f"[EDF] Erreur : {e}")

    logger.info(f"[EDF] {len(results)} offre(s) trouvée(s)")
    return results


# ── RTE ───────────────────────────────────────────────────────────────────────

def scrape_rte() -> list[dict]:
    """Scrape RTE (Réseau de Transport d'Électricité) careers."""
    results = []
    urls = [
        "https://www.rte-france.com/carrieres/nos-offres?type=stage&keywords=marche",
        "https://www.rte-france.com/carrieres/nos-offres?type=stage&keywords=trading",
    ]

    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "lxml")

            for card in soup.find_all(["article", "div", "li"],
                                       class_=re.compile("job|offer|card|result")):
                title_el = card.find(["h2", "h3", "h4", "a"])
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                link_el = card.find("a", href=True)
                href = link_el["href"] if link_el else ""
                url_full = href if href.startswith("http") else f"https://www.rte-france.com{href}"

                if _is_relevant(title):
                    results.append(_normalize(
                        job_id=href,
                        title=title,
                        company="RTE",
                        location="Paris / La Défense",
                        url=url_full,
                        description="",
                        source="RTE Carrières",
                    ))

            time.sleep(1.5)

        except Exception as e:
            logger.error(f"[RTE] Erreur : {e}")

    logger.info(f"[RTE] {len(results)} offre(s) trouvée(s)")
    return results


# ── Axpo ──────────────────────────────────────────────────────────────────────

def scrape_axpo() -> list[dict]:
    """Scrape Axpo careers (energy trader suisse actif en France)."""
    results = []
    url = "https://www.axpo.com/group/en/about-axpo/careers/job-search.html?jobType=Intern"

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")

        for card in soup.find_all(["article", "div", "li"],
                                   class_=re.compile("job|offer|card|position")):
            title_el = card.find(["h2", "h3", "h4", "a"])
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            link_el = card.find("a", href=True)
            href = link_el["href"] if link_el else ""
            url_full = href if href.startswith("http") else f"https://www.axpo.com{href}"
            location_el = card.find(class_=re.compile("location|city"))
            location = location_el.get_text(strip=True) if location_el else "Europe"

            if _is_relevant(title):
                results.append(_normalize(
                    job_id=href,
                    title=title,
                    company="Axpo",
                    location=location,
                    url=url_full,
                    description="",
                    source="Axpo Careers",
                ))

    except Exception as e:
        logger.error(f"[Axpo] Erreur : {e}")

    logger.info(f"[Axpo] {len(results)} offre(s) trouvée(s)")
    return results


# ── Orchestrateur ─────────────────────────────────────────────────────────────

def scrape_company_pages() -> list[dict]:
    """Lance tous les scrapers de pages carrière entreprise."""
    all_results = []
    scrapers = [
        ("TotalEnergies", scrape_totalenergies),
        ("Engie", scrape_engie),
        ("EDF", scrape_edf),
        ("RTE", scrape_rte),
        ("Axpo", scrape_axpo),
    ]

    for name, fn in scrapers:
        logger.info(f"\n=== Scraping {name} ===")
        try:
            jobs = fn()
            all_results.extend(jobs)
        except Exception as e:
            logger.error(f"[{name}] Erreur globale : {e}")
        time.sleep(2)

    return all_results
