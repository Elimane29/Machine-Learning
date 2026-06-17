import React, { useMemo, useState } from 'react';
import { BuildingRecord } from '../../types';

interface Props {
  data: BuildingRecord[];
}

// SVG paths for French regions (simplified)
const REGION_PATHS: { id: string; nom: string; cx: number; cy: number; path: string }[] = [
  { id: 'hdf', nom: 'Hauts-de-France', cx: 250, cy: 80, path: 'M220,55 L295,55 L305,90 L270,110 L220,100 Z' },
  { id: 'nor', nom: 'Normandie', cx: 165, cy: 95, path: 'M120,70 L210,70 L215,110 L165,120 L120,105 Z' },
  { id: 'bre', nom: 'Bretagne', cx: 90, cy: 145, path: 'M50,130 L145,125 L150,165 L95,175 L50,160 Z' },
  { id: 'pdl', nom: 'Pays de la Loire', cx: 145, cy: 190, path: 'M100,170 L195,165 L200,215 L145,225 L100,210 Z' },
  { id: 'cvl', nom: 'Centre-Val de Loire', cx: 220, cy: 185, path: 'M190,160 L270,155 L275,215 L225,225 L190,210 Z' },
  { id: 'idf', nom: 'Île-de-France', cx: 255, cy: 140, path: 'M235,125 L285,125 L290,165 L250,170 L235,160 Z' },
  { id: 'ges', nom: 'Grand Est', cx: 330, cy: 130, path: 'M295,90 L385,90 L395,175 L300,180 L290,135 Z' },
  { id: 'bfc', nom: 'Bourgogne-Franche-Comté', cx: 295, cy: 215, path: 'M265,175 L355,175 L360,260 L275,265 L260,220 Z' },
  { id: 'ara', nom: 'Auvergne-Rhône-Alpes', cx: 300, cy: 295, path: 'M260,260 L380,255 L390,350 L305,360 L255,315 Z' },
  { id: 'naq', nom: 'Nouvelle-Aquitaine', cx: 170, cy: 305, path: 'M110,250 L240,245 L250,380 L170,390 L110,355 Z' },
  { id: 'occ', nom: 'Occitanie', cx: 250, cy: 390, path: 'M175,365 L355,360 L365,435 L255,445 L175,430 Z' },
  { id: 'pac', nom: "Provence-Alpes-Côte d'Azur", cx: 355, cy: 375, path: 'M340,345 L420,345 L425,415 L355,425 L335,390 Z' },
  { id: 'cor', nom: 'Corse', cx: 400, cy: 430, path: 'M385,415 L415,415 L418,460 L390,462 Z' },
];

function getColor(value: number, min: number, max: number): string {
  if (max === min) return '#7ec8e3';
  const t = (value - min) / (max - min);
  const r = Math.round(26 + t * (231 - 26));
  const g = Math.round(45 + t * (76 - 45));
  const b = Math.round(90 + t * (60 - 90));
  return `rgb(${r},${g},${b})`;
}

export default function RegionMap({ data }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [metric, setMetric] = useState<'conso' | 'ges' | 'sub'>('conso');

  const regionStats = useMemo(() => {
    const stats: Record<string, { totalConso: number; totalSub: number; totalGES: number; count: number }> = {};
    data.forEach(d => {
      const key = d.region;
      if (!stats[key]) stats[key] = { totalConso: 0, totalSub: 0, totalGES: 0, count: 0 };
      stats[key].totalConso += d.consoEFkWh;
      stats[key].totalSub += d.sub;
      stats[key].totalGES += d.gesKgCO2;
      stats[key].count++;
    });

    return Object.entries(stats).reduce((acc, [nom, s]) => {
      acc[nom] = {
        consoParSub: s.totalSub > 0 ? s.totalConso / s.totalSub : 0,
        gesParSub: s.totalSub > 0 ? s.totalGES / s.totalSub : 0,
        sub: s.totalSub,
        count: s.count,
      };
      return acc;
    }, {} as Record<string, { consoParSub: number; gesParSub: number; sub: number; count: number }>);
  }, [data]);

  const values = REGION_PATHS.map(r => {
    const s = regionStats[r.nom] || { consoParSub: 0, gesParSub: 0, sub: 0, count: 0 };
    return metric === 'conso' ? s.consoParSub : metric === 'ges' ? s.gesParSub : s.sub / 1e6;
  }).filter(v => v > 0);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  const getVal = (nom: string) => {
    const s = regionStats[nom];
    if (!s) return 0;
    return metric === 'conso' ? s.consoParSub : metric === 'ges' ? s.gesParSub : s.sub / 1e6;
  };

  const unitLabel = metric === 'conso' ? 'kWh/m²' : metric === 'ges' ? 'kgCO₂/m²' : 'M m²';
  const hoverRegion = hovered ? (regionStats[REGION_PATHS.find(r => r.id === hovered)?.nom || '']) : null;
  const hoverNom = REGION_PATHS.find(r => r.id === hovered)?.nom;

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1.2, minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a' }}>Carte choroplèthe</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>Intensité par région — cliquez pour zoomer</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {([['conso', '⚡ Conso/SUB'], ['ges', '🌿 GES/SUB'], ['sub', '📐 SUB']] as [typeof metric, string][]).map(([m, label]) => (
            <button key={m} onClick={() => setMetric(m)} style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
              border: `1px solid ${metric === m ? '#1a2d5a' : '#ddd'}`,
              background: metric === m ? '#1a2d5a' : '#fff',
              color: metric === m ? '#fff' : '#555',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg viewBox="40 50 410 430" style={{ width: '100%', maxHeight: 340 }}>
            {REGION_PATHS.map(r => {
              const val = getVal(r.nom);
              const fill = val > 0 ? getColor(val, minV, maxV) : '#e8edf4';
              const isHov = hovered === r.id;
              return (
                <g key={r.id}>
                  <path
                    d={r.path}
                    fill={fill}
                    stroke={isHov ? '#f39c12' : '#fff'}
                    strokeWidth={isHov ? 2 : 1}
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                    fillOpacity={isHov ? 1 : 0.85}
                    onMouseEnter={() => setHovered(r.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {val > 0 && (
                    <text x={r.cx} y={r.cy} textAnchor="middle" fontSize={8} fill="#fff" fontWeight={600} style={{ pointerEvents: 'none' }}>
                      {val.toFixed(0)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend gradient */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: '#aaa' }}>Faible</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: `linear-gradient(to right, rgb(26,45,90), rgb(231,76,60))` }} />
            <span style={{ fontSize: 10, color: '#aaa' }}>Élevé</span>
            <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>{unitLabel}</span>
          </div>
        </div>

        {hovered && hoverRegion && hoverNom && (
          <div style={{
            width: 160, background: '#f8fafc', borderRadius: 8, padding: '12px 14px',
            border: '1px solid #e8edf4', flexShrink: 0, alignSelf: 'flex-start',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2d5a', marginBottom: 8 }}>{hoverNom}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              <div>
                <div style={{ color: '#aaa', fontSize: 10 }}>Conso EF/SUB</div>
                <div style={{ fontWeight: 700, color: '#1a2d5a' }}>{hoverRegion.consoParSub.toFixed(1)} kWh/m²</div>
              </div>
              <div>
                <div style={{ color: '#aaa', fontSize: 10 }}>GES/SUB</div>
                <div style={{ fontWeight: 700, color: '#27ae60' }}>{hoverRegion.gesParSub.toFixed(1)} kgCO₂/m²</div>
              </div>
              <div>
                <div style={{ color: '#aaa', fontSize: 10 }}>SUB total</div>
                <div style={{ fontWeight: 700 }}>{(hoverRegion.sub / 1e6).toFixed(2)} M m²</div>
              </div>
              <div>
                <div style={{ color: '#aaa', fontSize: 10 }}>Bâtiments</div>
                <div style={{ fontWeight: 700 }}>{hoverRegion.count}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
