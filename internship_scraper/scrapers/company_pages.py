"""
Scraper des pages carrières des grandes entreprises trading énergie, via Playwright.
"""

import time
import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

STAGE_TERMS = re.compile(
    r"stage|internship|intern|stagiaire|apprenti|alternance", re.I
)
ENERGY_TRADING_TERMS = re.compile(
    r"trading|trader|marché|market|énergie|energy|commodit|power|électricité|"
    r"electricity|gaz|structur|pricing|quantitat|portfolio|portefeuille|"
    r"analys|dispatch|optimis|fcr|spot", re.I
)


def _is_relevant(title: str, description: str = "") -> bool:
    text = title + " " + description
    return bool(STAGE_TERMS.search(text)) and bool(ENERGY_TRADING_TERMS.search(text))


def _normalize(job_id, title, company, location, url, description, source):
    return {
        "source": source,
        "id": str(job_id),
        "title": title,
        "company": company,
        "location": location,
        "contract_type": "Stage/Alternance",
        "description": description,
        "profile": "",
        "apply_url": url,
        "posted_at": "",
        "salary": "",
        "scraped_at": datetime.utcnow().isoformat(),
        "keyword": "direct_scrape",
    }


def _scrape_with_playwright(url: str, job_selectors: list[str], base_url: str, company_name: str, source: str) -> list[dict]:
    """Scrape générique d'une page carrière via Playwright."""
    from playwright.sync_api import sync_playwright

    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path=CHROMIUM_PATH,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        ctx = browser.new_context(ignore_https_errors=True)
        page = ctx.new_page()

        try:
            page.goto(url, timeout=30000, wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Accepte cookies
            for btn_text in ["Accepter", "Accept", "Tout accepter", "J'accepte"]:
                try:
                    page.click(f"button:has-text('{btn_text}')", timeout=1500)
                    page.wait_for_timeout(500)
                    break
                except Exception:
                    pass

            for selector in job_selectors:
                cards = page.query_selector_all(selector)
                if not cards:
                    continue

                for card in cards:
                    title_el = card.query_selector(
                        "h2, h3, h4, [class*='title'], [class*='Title'], [class*='name']"
                    )
                    title = title_el.inner_text().strip() if title_el else ""
                    if not title:
                        continue

                    link_el = card.query_selector("a[href]")
                    href = link_el.get_attribute("href") if link_el else ""
                    apply_url = href if href.startswith("http") else f"{base_url}{href}"

                    location_el = card.query_selector(
                        "[class*='location'], [class*='city'], [class*='lieu']"
                    )
                    location = location_el.inner_text().strip() if location_el else "France"

                    desc_el = card.query_selector("p, [class*='desc'], [class*='snippet']")
                    desc = desc_el.inner_text().strip() if desc_el else ""

                    if _is_relevant(title, desc):
                        results.append(_normalize(
                            job_id=href or title,
                            title=title,
                            company=company_name,
                            location=location,
                            url=apply_url,
                            description=desc,
                            source=source,
                        ))
                        logger.info(f"  ✓ {title} — {company_name}")
                break  # Arrête dès qu'un sélecteur fonctionne

        except Exception as e:
            logger.error(f"[{company_name}] Erreur : {e}")
        finally:
            browser.close()

    return results


# ── TotalEnergies ─────────────────────────────────────────────────────────────

def scrape_totalenergies() -> list[dict]:
    logger.info("[TotalEnergies] Scraping...")
    urls = [
        "https://jobs.totalenergies.com/fr_FR/careers/SearchJobs/?523=%5B182685%5D&523_format=4495",
        "https://jobs.totalenergies.com/fr_FR/careers/SearchJobs/?keyword=trading&category=Trading",
    ]
    results = []
    for url in urls:
        r = _scrape_with_playwright(
            url=url,
            job_selectors=["li.opportunity", "div.opportunity", "tr.eRecruitmentJobsRow",
                           "[class*='job-item']", "[class*='JobCard']", "article"],
            base_url="https://jobs.totalenergies.com",
            company_name="TotalEnergies",
            source="TotalEnergies Careers",
        )
        results.extend(r)
        if results:
            break
        time.sleep(2)
    logger.info(f"[TotalEnergies] {len(results)} offre(s)")
    return results


# ── Engie ─────────────────────────────────────────────────────────────────────

def scrape_engie() -> list[dict]:
    logger.info("[Engie] Scraping...")
    urls = [
        "https://jobs.engie.com/fr/recherche-doffres/?search_api_fulltext=trading+energie&field_contract_type=All",
        "https://jobs.engie.com/fr/recherche-doffres/?search_api_fulltext=energy+market&field_contract_type=All",
    ]
    results = []
    for url in urls:
        r = _scrape_with_playwright(
            url=url,
            job_selectors=["article.job-card", "div.job-card", "li.job-result",
                           "[class*='JobCard']", "[class*='job-item']", "article"],
            base_url="https://jobs.engie.com",
            company_name="Engie",
            source="Engie Careers",
        )
        results.extend(r)
        time.sleep(2)
    logger.info(f"[Engie] {len(results)} offre(s)")
    return results


# ── EDF ───────────────────────────────────────────────────────────────────────

def scrape_edf() -> list[dict]:
    logger.info("[EDF] Scraping...")
    urls = [
        "https://recrutement.edf.com/nos-offres/?type=stage&keywords=trading",
        "https://recrutement.edf.com/nos-offres/?type=alternance&keywords=marche+energie",
    ]
    results = []
    for url in urls:
        r = _scrape_with_playwright(
            url=url,
            job_selectors=["article.job", "div.job-offer", "li.offer-item",
                           "[class*='offer']", "[class*='job']", "article"],
            base_url="https://recrutement.edf.com",
            company_name="EDF",
            source="EDF Recrutement",
        )
        results.extend(r)
        time.sleep(2)
    logger.info(f"[EDF] {len(results)} offre(s)")
    return results


# ── RTE ───────────────────────────────────────────────────────────────────────

def scrape_rte() -> list[dict]:
    logger.info("[RTE] Scraping...")
    urls = [
        "https://www.rte-france.com/carrieres/nos-offres?type=stage&keywords=marche",
        "https://www.rte-france.com/carrieres/nos-offres?type=alternance&keywords=energie",
    ]
    results = []
    for url in urls:
        r = _scrape_with_playwright(
            url=url,
            job_selectors=["article", "div.job-card", "li.offer",
                           "[class*='offer']", "[class*='job']"],
            base_url="https://www.rte-france.com",
            company_name="RTE",
            source="RTE Carrieres",
        )
        results.extend(r)
        time.sleep(2)
    logger.info(f"[RTE] {len(results)} offre(s)")
    return results


# ── Axpo ──────────────────────────────────────────────────────────────────────

def scrape_axpo() -> list[dict]:
    logger.info("[Axpo] Scraping...")
    results = _scrape_with_playwright(
        url="https://www.axpo.com/group/en/about-axpo/careers/job-search.html?jobType=Intern&location=France",
        job_selectors=["div.job-item", "article.position", "li.job",
                       "[class*='job']", "[class*='position']", "article"],
        base_url="https://www.axpo.com",
        company_name="Axpo",
        source="Axpo Careers",
    )
    logger.info(f"[Axpo] {len(results)} offre(s)")
    return results


# ── GRTgaz ────────────────────────────────────────────────────────────────────

def scrape_grtgaz() -> list[dict]:
    logger.info("[GRTgaz] Scraping...")
    results = _scrape_with_playwright(
        url="https://www.grtgaz.com/nous-rejoindre/offres-emploi?type=stage",
        job_selectors=["article", "div.offer", "li.job",
                       "[class*='offer']", "[class*='job']"],
        base_url="https://www.grtgaz.com",
        company_name="GRTgaz",
        source="GRTgaz Carrieres",
    )
    logger.info(f"[GRTgaz] {len(results)} offre(s)")
    return results


# ── Orchestrateur ─────────────────────────────────────────────────────────────

def scrape_company_pages() -> list[dict]:
    all_results = []
    scrapers = [
        ("TotalEnergies", scrape_totalenergies),
        ("Engie",         scrape_engie),
        ("EDF",           scrape_edf),
        ("RTE",           scrape_rte),
        ("Axpo",          scrape_axpo),
        ("GRTgaz",        scrape_grtgaz),
    ]
    for name, fn in scrapers:
        logger.info(f"\n=== Scraping {name} ===")
        try:
            jobs = fn()
            all_results.extend(jobs)
        except Exception as e:
            logger.error(f"[{name}] Erreur globale : {e}")
        time.sleep(3)
    return all_results
