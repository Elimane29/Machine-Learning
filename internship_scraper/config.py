"""
User profile and search configuration.
Update PROFILE with your real details before running.
"""

PROFILE = {
    "first_name": "Elimane",
    "last_name": "DIALLO",
    "email": "elimane568@gmail.com",
    "phone": "+33 6 61 82 72 84",
    "address": "Paris, France",
    "linkedin": "",           # à compléter si tu as un profil LinkedIn
    "github": "https://github.com/Elimane29",

    # Cible : alternance 4j/5 en entreprise, septembre 2026
    "contract_target": "Alternance – 4 jours/5 en entreprise – à partir de septembre 2026",

    "education": [
        {
            "degree": "MSc Data for Finance (en anglais)",
            "school": "Albert School – Mines Paris PSL",
            "field": "Mathématiques, ML pour la Finance, Energy Data Analytics, Capital Markets",
            "year": "2025 – en cours",
        },
        {
            "degree": "Master 2 Énergies renouvelables",
            "school": "CYU Cergy Paris Université",
            "field": "Énergie éolienne, photovoltaïque, réseaux électriques, économie de l'énergie",
            "year": "2023",
        },
        {
            "degree": "Licence 3 Physique et Applications",
            "school": "Université Paris-Saclay",
            "field": "Physique statistique, mécanique des fluides, méthodes numériques Python",
            "year": "2020",
        },
    ],

    "experiences": [
        {
            "title": "Energy Management Data Scientist",
            "company": "Ministère de l'Économie et des Finances (DIE)",
            "period": "09/2025 – aujourd'hui",
            "bullets": [
                "Développement de modèles statistiques (régression, extrapolation surfacique) pour estimer la consommation énergétique de plus de 200k bâtiments publics.",
                "Détection d'anomalies dans les données via pipelines Python (pandas, SQL) pour nettoyage et visualisation interactive.",
                "Production d'indicateurs clés sur les coûts, l'efficacité énergétique et l'exposition aux variations de prix de l'énergie.",
            ],
        },
        {
            "title": "Ingénieur d'études Photovoltaïques AMOE",
            "company": "GENERGIES ANTILLES GUYANE",
            "period": "09/2024 – 11/2024",
            "bullets": [
                "Évaluation de productible et de surplus via PVSyst pour des projets 50-500 kWc.",
                "Modélisation financière des projets d'autoconsommation solaire.",
                "Rédaction de livrables clients intégrant les aspects techniques, financiers et réglementaires.",
            ],
        },
        {
            "title": "Ingénieur d'études Stockage & Innovations",
            "company": "BORALEX SAS",
            "period": "03/2023 – 09/2023",
            "bullets": [
                "Veille réglementaire sur les sources de rémunération : régulation de fréquence (FCR), arbitrage SPOT, mécanisme de capacité (France & Royaume-Uni).",
                "Analyse SWOT et modèle technico-économique des batteries Li-ion pour l'intégration sur les marchés de l'électricité.",
                "Développement d'un outil de modélisation des coûts de stockage en valorisation FCR (ROI, rentabilité, volatilité prix, sensibilité).",
            ],
        },
    ],

    "skills": [
        "Python (pandas, seaborn, scikit-learn, matplotlib, plotly)",
        "SQL, Git",
        "Machine Learning pour la Finance (régression, clustering, anomaly detection)",
        "Marchés de l'énergie : FCR, SPOT, mécanisme de capacité, modélisation de prix",
        "Energy Data Analytics, modélisation statistique",
        "LLM & RAG (Retrieval-Augmented Generation)",
        "Matlab, Tableau, Dataiku, C#, Pack Office",
        "Modélisation financière (ROI, DCF, sensibilité)",
    ],

    "languages": [
        "Français (maternel)",
        "Anglais (courant – formation dispensée en anglais)",
        "Wolof (maternel)",
        "Japonais (débutant)",
    ],

    "interests": "Géopolitique, Musculation, Lecture, Football/Basketball",

    "cv_path": "",  # chemin vers ton CV PDF si disponible localement
}

# ── Paramètres de recherche ──────────────────────────────────────────────────

SEARCH_CONFIG = {
    "keywords": [
        "alternance trading énergie",
        "alternance energy market analyst",
        "alternance analyste marché énergie",
        "alternance trader énergie électricité",
        "alternance pricing énergie",
        "alternance structureur énergie",
        "alternance quantitatif énergie",
        "energy trading internship alternance",
        "alternance power market analyst",
        "alternance data analyst énergie marché",
        "stage trading énergie",
        "stage energy market",
        "stage analyste quantitatif énergie",
    ],
    "locations": ["Paris", "La Défense", "Lyon", "London"],
    "contract_types": ["alternance", "apprentissage", "stage", "internship"],
    "target_companies": [
        "EDF Trading",
        "TotalEnergies",
        "Engie Global Markets",
        "RTE",
        "GRTgaz",
        "Axpo",
        "Alpiq",
        "Statkraft",
        "Vattenfall",
        "Shell Energy",
        "BNP Paribas CIB",
        "Société Générale CIB",
        "Natixis CIB",
        "Macquarie Energy",
        "Vitol",
        "Gunvor",
        "Trafigura",
        "Voltalia",
        "Neoen",
        "Hydrogène de France",
    ],
}

# ── Anthropic API ────────────────────────────────────────────────────────────
import os
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# ── Fichiers de sortie ───────────────────────────────────────────────────────
OUTPUT_DIR = "output"
JOBS_FILE = "output/jobs_found.json"
APPLICATIONS_LOG = "output/applications_log.csv"
