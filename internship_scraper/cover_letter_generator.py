"""
Générateur de lettres de motivation personnalisées via Claude (Anthropic API).
Chaque lettre est adaptée à l'offre ET au profil du candidat.
"""

import anthropic
import logging
import re
from config import PROFILE, ANTHROPIC_API_KEY

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        if not ANTHROPIC_API_KEY:
            raise ValueError(
                "ANTHROPIC_API_KEY manquant. "
                "Définis la variable d'environnement : export ANTHROPIC_API_KEY='sk-ant-...'"
            )
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client


def _build_profile_summary() -> str:
    edu = PROFILE["education"]
    edu_str = "\n".join(
        f"  - {e['degree']} — {e['school']} ({e['year']}) | {e['field']}"
        for e in edu
    )

    exp_parts = []
    for exp in PROFILE["experiences"]:
        bullets = "\n".join(f"      • {b}" for b in exp["bullets"])
        exp_parts.append(
            f"  [{exp['period']}] {exp['title']} @ {exp['company']}\n{bullets}"
        )
    exp_str = "\n".join(exp_parts)

    skills_str = "\n".join(f"  - {s}" for s in PROFILE["skills"])
    langs_str = ", ".join(PROFILE["languages"])

    return f"""
PROFIL DU CANDIDAT
------------------
Nom complet : {PROFILE['first_name']} {PROFILE['last_name']}
Localisation : {PROFILE['address']}
Email : {PROFILE['email']} | Tél : {PROFILE['phone']}
Cible : {PROFILE['contract_target']}

Formation :
{edu_str}

Expériences professionnelles :
{exp_str}

Compétences techniques :
{skills_str}

Langues : {langs_str}
"""


def generate_cover_letter(job: dict, language: str = "fr") -> str:
    """
    Génère une lettre de motivation personnalisée pour une offre donnée.

    Args:
        job: dictionnaire de l'offre (title, company, location, description, profile)
        language: 'fr' (défaut) ou 'en'

    Returns:
        Lettre de motivation en texte brut (prête à être mise en forme PDF)
    """
    client = _get_client()

    profile_summary = _build_profile_summary()

    title = job.get("title", "N/A")
    company = job.get("company", "N/A")
    location = job.get("location", "N/A")
    description = (job.get("description", "") + "\n" + job.get("profile", "")).strip()
    description = description[:3000] if description else "Non fournie"

    lang_instruction = (
        "Rédige la lettre en français, dans un style professionnel et dynamique."
        if language == "fr"
        else "Write the letter in English, in a professional and dynamic style."
    )

    prompt = f"""Tu es un expert en recrutement spécialisé dans les marchés de l'énergie et la finance quantitative.

Rédige une lettre de motivation COMPLÈTE et PERSONNALISÉE pour le poste suivant.

OFFRE :
- Poste : {title}
- Entreprise : {company}
- Lieu : {location}
- Description de l'offre :
{description}

{profile_summary}

CONSIGNES STRICTES :
1. {lang_instruction}
2. La lettre doit faire 4 paragraphes bien distincts (environ 380-450 mots).
3. Commence par "Madame, Monsieur,"
4. Paragraphe 1 — Accroche : montre ta connaissance de l'entreprise et du secteur (marchés SPOT, FCR, mécanisme de capacité, volatilité prix énergie, dispatch, etc.)
5. Paragraphe 2 — Expériences clés : relie EXPLICITEMENT Boralex (FCR, modélisation batterie, arbitrage SPOT), Ministère des Finances (modèles stats énergie 200k bâtiments) et la formation Mines Paris PSL (Data for Finance, ML) à ce que cherche l'entreprise.
6. Paragraphe 3 — Valeur ajoutée : Python/SQL/ML pour l'analyse de marchés, compétences en modélisation quantitative, alternance 4j/5 disponible dès septembre 2026.
7. Paragraphe 4 — Conclusion dynamique et formule de politesse professionnelle.
8. NE mets PAS de balises HTML, markdown, ni d'en-tête/pied de page (date, adresse) — juste le corps de la lettre.
9. Adapte le ton : sobre et institutionnel pour RTE/EDF/Ministère ; dynamique et ambitieux pour trading houses (Axpo, Engie Global Markets, TotalEnergies T&S) ; analytique pour postes quant.
10. Sois CONCRET, cite des chiffres du CV (200k bâtiments, 50-500 kWc, FCR), évite les généralités.

Génère UNIQUEMENT le texte de la lettre, rien d'autre."""

    logger.info(f"[Claude] Génération lettre pour : {title} @ {company}")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    letter = message.content[0].text.strip()
    logger.info(f"[Claude] Lettre générée ({len(letter)} caractères)")
    return letter


def generate_email_body(job: dict, cover_letter: str) -> str:
    """
    Génère un email d'accompagnement court (objet + corps) pour candidature directe.
    """
    client = _get_client()

    prompt = f"""Génère un email de candidature concis (5-7 lignes maximum) pour envoyer une lettre de motivation en pièce jointe.

Poste : {job.get('title', 'Stage')}
Entreprise : {job.get('company', '')}

Extraits de la lettre de motivation :
{cover_letter[:500]}

Format de réponse EXACT (ne change pas les labels) :
OBJET: [objet de l'email]
CORPS:
[corps de l'email]

Sois professionnel, direct et enthousiaste. Mentionne le stage et l'entreprise dès la première ligne."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()
