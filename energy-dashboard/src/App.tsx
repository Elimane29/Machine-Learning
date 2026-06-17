import React, { useMemo, useState } from 'react';
import { mockData, getYearlyKPIs, PPG_TARGET_2030, REFERENCE_2010 } from './data/mockData';
import { ActiveSection, BuildingRecord } from './types';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import KPICard from './components/Dashboard/KPICard';
import PPGProgressCard from './components/Dashboard/PPGProgressCard';
import EnergyTrendChart from './components/Dashboard/EnergyTrendChart';
import MinistryRankingChart from './components/Dashboard/MinistryRankingChart';
import ScatterBuildingsChart from './components/Dashboard/ScatterBuildingsChart';
import RegionMap from './components/Dashboard/RegionMap';
import DataTable from './components/Dashboard/DataTable';
import SurfacesView from './components/Surfaces/SurfacesView';

function unique(arr: string[]): string[] {
  return arr.filter((v, i, a) => a.indexOf(v) === i).sort();
}
const allYears = unique(mockData.map(d => String(d.annee)));
const allRegions = unique(mockData.map(d => d.region));
const allMinisteres = unique(mockData.map(d => d.ministere));
const allTypesDeBien = unique(mockData.map(d => d.typeDeBien));

export default function App() {
  const [section, setSection] = useState<ActiveSection>('synthese');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({ annee: 'Tout', region: 'Tout', ministere: 'Tout', typeDeBien: 'Tout' });

  const yearlyKPIs = useMemo(() => getYearlyKPIs(), []);

  const filteredData = useMemo(() => {
    return mockData.filter((d: BuildingRecord) => {
      if (filters.annee !== 'Tout' && String(d.annee) !== filters.annee) return false;
      if (filters.region !== 'Tout' && d.region !== filters.region) return false;
      if (filters.ministere !== 'Tout' && d.ministere !== filters.ministere) return false;
      if (filters.typeDeBien !== 'Tout' && d.typeDeBien !== filters.typeDeBien) return false;
      return true;
    });
  }, [filters]);

  const tauxExtrap = useMemo(() => {
    const extrap = filteredData.filter(d => d.extrapolation).length;
    return filteredData.length > 0 ? (extrap / filteredData.length) * 100 : 0;
  }, [filteredData]);

  const latestKPI = yearlyKPIs[yearlyKPIs.length - 1];
  const prevKPI = yearlyKPIs[yearlyKPIs.length - 2];

  const kpiCards = [
    {
      label: 'Conso EF / SUB', value: latestKPI.consoEFkWhParSub.toFixed(1), unit: 'kWh/m²',
      trend: ((latestKPI.consoEFkWhParSub - prevKPI.consoEFkWhParSub) / prevKPI.consoEFkWhParSub) * 100,
      sparkData: yearlyKPIs.map(k => ({ v: k.consoEFkWhParSub })),
      color: '#1a2d5a', icon: '⚡', subtitle: 'Énergie finale normalisée',
    },
    {
      label: 'GES / SUB', value: latestKPI.gesKgCO2ParSub.toFixed(2), unit: 'kgCO₂/m²',
      trend: ((latestKPI.gesKgCO2ParSub - prevKPI.gesKgCO2ParSub) / prevKPI.gesKgCO2ParSub) * 100,
      sparkData: yearlyKPIs.map(k => ({ v: k.gesKgCO2ParSub })),
      color: '#27ae60', icon: '🌿', subtitle: 'Émissions scope 1+2',
    },
    {
      label: 'SUB totale', value: (latestKPI.sub / 1e6).toFixed(2), unit: 'M m²',
      trend: ((latestKPI.sub - prevKPI.sub) / prevKPI.sub) * 100,
      sparkData: yearlyKPIs.map(k => ({ v: k.sub / 1e6 })),
      color: '#8e44ad', icon: '📐', subtitle: 'Surface Utile Brute',
    },
    {
      label: 'Bâtiments suivis', value: String(latestKPI.nbBatiments), unit: 'bâtiments',
      trend: ((latestKPI.nbBatiments - prevKPI.nbBatiments) / prevKPI.nbBatiments) * 100,
      sparkData: yearlyKPIs.map(k => ({ v: k.nbBatiments })),
      color: '#2980b9', icon: '🏢', subtitle: 'Périmètre REFX',
    },
    {
      label: 'Taux raccordement', value: latestKPI.tauxRaccordement.toFixed(1), unit: '%',
      trend: ((latestKPI.tauxRaccordement - prevKPI.tauxRaccordement) / prevKPI.tauxRaccordement) * 100,
      sparkData: yearlyKPIs.map(k => ({ v: k.tauxRaccordement })),
      color: '#f39c12', icon: '🔌', subtitle: 'Raccordement OSFI',
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <Sidebar active={section} onChange={setSection} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          filters={filters}
          onFilterChange={handleFilterChange}
          annees={allYears}
          regions={allRegions}
          ministeres={allMinisteres}
          typesDeBien={allTypesDeBien}
          tauxExtrap={tauxExtrap}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {section === 'synthese' && (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2d5a', display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚡ Synthèse Énergie
                <span style={{ fontSize: 12, fontWeight: 400, color: '#aaa' }}>— {filteredData.length} bâtiments · {filters.annee !== 'Tout' ? filters.annee : 'Toutes années'}</span>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {kpiCards.map(k => (
                  <KPICard key={k.label} {...k} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: '0 0 340px' }}>
                  <PPGProgressCard
                    currentValue={latestKPI.consoEFkWhParSub}
                    referenceValue={REFERENCE_2010.consoEFkWhParSub}
                    targetValue={PPG_TARGET_2030.consoEFkWhParSub}
                    targetYear={2030}
                  />
                </div>
                <EnergyTrendChart data={yearlyKPIs} />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <MinistryRankingChart data={filteredData} />
                <ScatterBuildingsChart data={filteredData} />
              </div>
            </div>
          )}

          {section === 'carte' && (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2d5a', marginBottom: 16 }}>🗺 Carte régionale</div>
              <RegionMap data={filteredData} />
            </div>
          )}

          {section === 'classement' && (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2d5a' }}>🏆 Classement détaillé</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <MinistryRankingChart data={filteredData} />
                <ScatterBuildingsChart data={filteredData} />
              </div>
            </div>
          )}

          {section === 'donnees' && (
            <div style={{ padding: 24 }}>
              <DataTable data={filteredData} />
            </div>
          )}

          {section === 'surfaces' && (
            <SurfacesView data={filteredData} />
          )}
        </main>

        <footer style={{ background: '#1a2d5a', color: 'rgba(255,255,255,0.5)', fontSize: 10, padding: '8px 24px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Direction de l'Immobilier de l'État — DIE-1A</span>
          <span>Version 1.2 · {new Date().toLocaleDateString('fr-FR')}</span>
        </footer>
      </div>
    </div>
  );
}
