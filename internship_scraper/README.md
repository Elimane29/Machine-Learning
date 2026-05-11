# Scraper Alternances / Stages — Trading & Marchés de l'Énergie

Pipeline automatisé pour **Elimane DIALLO** :
1. Scrape les offres sur Welcome to the Jungle, Indeed et les pages carrières de TotalEnergies, Engie, EDF, RTE, Axpo
2. Filtre et score les offres par pertinence (trading/énergie)
3. Génère une lettre de motivation personnalisée via **Claude (Anthropic)** pour chaque offre
4. Produit un PDF par lettre + un récapitulatif CSV/PDF

---

## Prérequis

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY="sk-ant-..."   # obligatoire pour la génération LM
```

## Utilisation

```bash
# Mode complet : scraping + génération des lettres (top 20 offres)
python main.py

# Scraping seulement (sans générer les lettres, pour tester)
python main.py --dry-run

# Recharger les offres déjà scrapées et générer les lettres
python main.py --load

# Limiter à N lettres générées
python main.py --max 10

# Forcer des mots-clés spécifiques
python main.py --keywords-only "alternance energy trading" "alternance analyste marché énergie"
```

## Structure des sorties (`output/`)

```
output/
├── jobs_found.json          # Toutes les offres trouvées (JSON)
├── applications_log.csv     # Log CSV de toutes les candidatures
├── recap_candidatures.pdf   # Récapitulatif PDF
├── scraper.log              # Logs détaillés
└── letters/
    ├── LM_Elimane_TotalEnergies_Alternance_Trading.pdf
    ├── LM_Elimane_TotalEnergies_Alternance_Trading_email.txt
    ├── LM_Elimane_Engie_Energy_Market_Analyst.pdf
    └── ...
```

## Personnalisation

- **`config.py`** : profil candidat, mots-clés de recherche, entreprises cibles
- **`scrapers/company_pages.py`** : ajouter des scrapers pour d'autres entreprises
- **`cover_letter_generator.py`** : modifier le prompt de génération

## Entreprises ciblées

| Entreprise | Source | Type |
|---|---|---|
| TotalEnergies Trading & Shipping | Page carrière | Trading house |
| Engie Global Markets | Page carrière | Trading house |
| EDF Trading | Page carrière | Utility |
| RTE | Page carrière | Gestionnaire réseau |
| Axpo | Page carrière | Trading house CH |
| + toutes les offres WTTJ & Indeed | Multi-plateforme | — |
