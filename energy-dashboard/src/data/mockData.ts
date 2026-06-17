import { BuildingRecord, YearlyKPI } from '../types';

const regions = [
  'Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine',
  'Occitanie', 'Hauts-de-France', 'Provence-Alpes-Côte d\'Azur',
  'Grand Est', 'Pays de la Loire', 'Normandie', 'Bretagne',
  'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 'Corse',
  'Collectivités et territoires d\'Outre-Mer'
];

const departements: Record<string, string[]> = {
  'Île-de-France': ['Paris (75)', 'Seine-et-Marne (77)', 'Yvelines (78)', 'Essonne (91)', 'Hauts-de-Seine (92)', 'Seine-Saint-Denis (93)', 'Val-de-Marne (94)', 'Val-d\'Oise (95)'],
  'Auvergne-Rhône-Alpes': ['Ain (01)', 'Allier (03)', 'Haute-Loire (43)', 'Puy-de-Dôme (63)', 'Rhône (69)', 'Isère (38)', 'Drôme (26)', 'Savoie (73)'],
  'Nouvelle-Aquitaine': ['Gironde (33)', 'Dordogne (24)', 'Charente (16)', 'Landes (40)', 'Pyrénées-Atlantiques (64)', 'Corrèze (19)', 'Creuse (23)', 'Haute-Vienne (87)'],
  'Occitanie': ['Hérault (34)', 'Gard (30)', 'Haute-Garonne (31)', 'Pyrénées-Orientales (66)', 'Aude (11)', 'Aveyron (12)', 'Lot (46)', 'Tarn (81)'],
  'Hauts-de-France': ['Nord (59)', 'Pas-de-Calais (62)', 'Somme (80)', 'Oise (60)', 'Aisne (02)'],
  'Provence-Alpes-Côte d\'Azur': ['Bouches-du-Rhône (13)', 'Var (83)', 'Alpes-Maritimes (06)', 'Vaucluse (84)', 'Alpes-de-Haute-Provence (04)', 'Hautes-Alpes (05)'],
  'Grand Est': ['Bas-Rhin (67)', 'Haut-Rhin (68)', 'Moselle (57)', 'Marne (51)', 'Meuse (55)', 'Haute-Marne (52)', 'Aube (10)', 'Ardennes (08)', 'Meurthe-et-Moselle (54)', 'Vosges (88)'],
  'Pays de la Loire': ['Loire-Atlantique (44)', 'Maine-et-Loire (49)', 'Sarthe (72)', 'Mayenne (53)', 'Vendée (85)'],
  'Normandie': ['Seine-Maritime (76)', 'Calvados (14)', 'Manche (50)', 'Orne (61)', 'Eure (27)'],
  'Bretagne': ['Finistère (29)', 'Ille-et-Vilaine (35)', 'Morbihan (56)', 'Côtes-d\'Armor (22)'],
  'Bourgogne-Franche-Comté': ['Côte-d\'Or (21)', 'Saône-et-Loire (71)', 'Yonne (89)', 'Nièvre (58)', 'Doubs (25)', 'Haute-Saône (70)', 'Jura (39)', 'Territoire de Belfort (90)'],
  'Centre-Val de Loire': ['Loiret (45)', 'Indre-et-Loire (37)', 'Loir-et-Cher (41)', 'Cher (18)', 'Indre (36)', 'Eure-et-Loir (28)'],
  'Corse': ['Haute-Corse (2B)', 'Corse-du-Sud (2A)'],
  'Collectivités et territoires d\'Outre-Mer': ['Martinique (972)', 'Guadeloupe (971)', 'Guyane (973)', 'La Réunion (974)', 'Nouvelle-Calédonie', 'Polynésie française']
};

const ministeres = [
  'Ministère de l\'Intérieur',
  'Ministère de l\'Éducation Nationale',
  'Ministère de la Défense',
  'Ministère de la Justice',
  'Ministère des Finances',
  'Ministère de la Transition Écologique',
  'Ministère de la Santé',
  'Ministère de l\'Agriculture',
  'Ministère de la Culture',
  'Ministère des Affaires Étrangères',
  'Ministère du Travail',
  'Ministère de l\'Enseignement Supérieur',
  'Services du Premier Ministre',
  'Ministère des Sports',
];

const typesDeBien = ['Bureau', 'Logement de service', 'Bâtiment militaire', 'Établissement scolaire', 'Établissement judiciaire', 'Infrastructure technique', 'Entrepôt / Stockage', 'Bâtiment culturel'];
const usagesDetailles = ['Administration centrale', 'Administration déconcentrée', 'Hébergement agents', 'Formation', 'Stockage archives', 'Laboratoire', 'Accueil du public', 'Opérationnel défense'];
const statuts = ['Occupé', 'Partiellement occupé', 'Vacant', 'En travaux'];
const operateurs = ['État propriétaire', 'Locataire privé', 'Pris à bail', 'Mis à disposition'];

const gestionnaires = [
  { num: 'G001', lib: 'DIR IMM ILE-DE-FRANCE' },
  { num: 'G002', lib: 'DIR IMM SUD-OUEST' },
  { num: 'G003', lib: 'DIR IMM NORD' },
  { num: 'G004', lib: 'DIR IMM EST' },
  { num: 'G005', lib: 'DIR IMM RHÔNE-ALPES' },
  { num: 'G006', lib: 'DIR IMM MÉDITERRANÉE' },
  { num: 'G007', lib: 'DIR IMM OUEST' },
  { num: 'G008', lib: 'DIR IMM CENTRE' },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateBuildings(): BuildingRecord[] {
  const records: BuildingRecord[] = [];
  let seed = 42;

  for (let annee = 2020; annee <= 2025; annee++) {
    let bId = 0;
    for (const region of regions) {
      const depts = departements[region] || [];
      const nbDepts = Math.min(depts.length, 3 + Math.floor(seededRandom(seed++) * 3));
      for (let di = 0; di < nbDepts; di++) {
        const dept = depts[di % depts.length];
        const nbBuildings = 2 + Math.floor(seededRandom(seed++) * 6);
        for (let bi = 0; bi < nbBuildings; bi++) {
          bId++;
          const ministere = ministeres[Math.floor(seededRandom(seed++) * ministeres.length)];
          const typeBien = typesDeBien[Math.floor(seededRandom(seed++) * typesDeBien.length)];
          const sub = 500 + Math.floor(seededRandom(seed++) * 15000);
          const gestIdx = Math.floor(seededRandom(seed++) * gestionnaires.length);
          const gest = gestionnaires[gestIdx];

          // Base consumption in 2010 (reference year for PPG -40%)
          const baseConsoParSub2010 = 250 + seededRandom(seed++) * 300;
          // Apply yearly reduction trend (-4% per year since 2020, progressive)
          const yearsSince2010 = annee - 2010;
          const reductionFactor = 1 - (yearsSince2010 * 0.033) + (seededRandom(seed++) * 0.04 - 0.02);
          const consoParSub = Math.max(80, baseConsoParSub2010 * reductionFactor);
          const consoParSubBrut = consoParSub * (1 + seededRandom(seed++) * 0.15);

          const gesParSub = consoParSub * (0.18 + seededRandom(seed++) * 0.12);
          const gesParSubBrut = gesParSub * (1 + seededRandom(seed++) * 0.1);

          const consoEFkWh = Math.round(consoParSub * sub);
          const consoEFkWhBrut = Math.round(consoParSubBrut * sub);
          const gesKgCO2 = Math.round(gesParSub * sub);
          const gesKgCO2Brut = Math.round(gesParSubBrut * sub);

          records.push({
            annee,
            region,
            departement: dept,
            ville: dept.split(' (')[0],
            codeBatiment: `BAT-${String(bId).padStart(5, '0')}`,
            codeSite: `SITE-${String(Math.ceil(bId / 3)).padStart(4, '0')}`,
            libelleBatiment: `${typeBien} ${dept.split(' (')[0]} ${bi + 1}`,
            libelleSite: `Site ${dept.split(' (')[0]}`,
            typeDeBien: typeBien,
            usageDetaille: usagesDetailles[Math.floor(seededRandom(seed++) * usagesDetailles.length)],
            etatOuOperateur: operateurs[Math.floor(seededRandom(seed++) * operateurs.length)],
            statutOccupation: statuts[Math.floor(seededRandom(seed++) * statuts.length)],
            ministere,
            numeroGestionnaire: gest.num,
            libelleGestionnaire: gest.lib,
            extrapolation: seededRandom(seed++) < 0.12,
            sub,
            consoEFkWh,
            consoEFkWhBrut,
            consoEFkWhParSubBrut: Math.round(consoParSubBrut * 10) / 10,
            consoEFkWhParSub: Math.round(consoParSub * 10) / 10,
            gesKgCO2Brut,
            gesKgCO2,
            gesKgCO2ParSubBrut: Math.round(gesParSubBrut * 10) / 10,
            gesKgCO2ParSub: Math.round(gesParSub * 10) / 10,
          });
        }
      }
    }
  }
  return records;
}

export const mockData: BuildingRecord[] = generateBuildings();

export function getYearlyKPIs(): YearlyKPI[] {
  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  return years.map(annee => {
    const yearData = mockData.filter(d => d.annee === annee);
    const totalSub = yearData.reduce((s, d) => s + d.sub, 0);
    const totalConso = yearData.reduce((s, d) => s + d.consoEFkWh, 0);
    const totalGES = yearData.reduce((s, d) => s + d.gesKgCO2, 0);
    return {
      annee,
      consoEFkWhParSub: Math.round((totalConso / totalSub) * 10) / 10,
      gesKgCO2ParSub: Math.round((totalGES / totalSub) * 100) / 100,
      sub: Math.round(totalSub),
      nbBatiments: yearData.length,
      tauxRaccordement: 72 + (annee - 2020) * 3.5,
    };
  });
}

export const PPG_TARGET_2030 = { consoEFkWhParSub: 150 }; // -40% vs ~250 in 2010
export const REFERENCE_2010 = { consoEFkWhParSub: 250 };
