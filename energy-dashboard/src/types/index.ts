export interface BuildingRecord {
  annee: number;
  region: string;
  departement: string;
  ville: string;
  codeBatiment: string;
  codeSite: string;
  libelleBatiment: string;
  libelleSite: string;
  typeDeBien: string;
  usageDetaille: string;
  etatOuOperateur: string;
  statutOccupation: string;
  ministere: string;
  numeroGestionnaire: string;
  libelleGestionnaire: string;
  extrapolation: boolean;
  sub: number;
  consoEFkWh: number;
  consoEFkWhBrut: number;
  consoEFkWhParSubBrut: number;
  consoEFkWhParSub: number;
  gesKgCO2Brut: number;
  gesKgCO2: number;
  gesKgCO2ParSubBrut: number;
  gesKgCO2ParSub: number;
}

export interface RegionGeoData {
  code: string;
  nom: string;
  consoParSub: number;
  gesParSub: number;
  sub: number;
  nbBatiments: number;
}

export interface YearlyKPI {
  annee: number;
  consoEFkWhParSub: number;
  gesKgCO2ParSub: number;
  sub: number;
  nbBatiments: number;
  tauxRaccordement: number;
}

export type ActiveSection = 'synthese' | 'classement' | 'carte' | 'donnees' | 'surfaces';
export type MetricType = 'consoEF' | 'ges' | 'sub' | 'nbBatiments';
