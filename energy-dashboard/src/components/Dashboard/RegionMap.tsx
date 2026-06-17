import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { BuildingRecord } from '../../types';
import { PPG_TARGET_2030 } from '../../data/mockData';

const GEO_URL = '/regions-france.geojson';

interface Props {
  data: BuildingRecord[];
}

type Metric = 'conso' | 'ges' | 'sub';

function interpolateColor(t: number): string {
  // light blue → deep navy
  const r = Math.round(214 - t * (214 - 26));
  const g = Math.round(228 - t * (228 - 45));
  const b = Math.round(240 - t * (240 - 90));
  return `rgb(${r},${g},${b})`;
}

export default function RegionMap({ data }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>('conso');
  const [position, setPosition] = useState({ coordinates: [2.5, 46.5] as [number, number], zoom: 1 });

  const regionStats = useMemo(() => {
    const acc: Record<string, { totalConso: number; totalSub: number; totalGES: number; count: number }> = {};
    data.forEach(d => {
      if (!acc[d.region]) acc[d.region] = { totalConso: 0, totalSub: 0, totalGES: 0, count: 0 };
      acc[d.region].totalConso += d.consoEFkWh;
      acc[d.region].totalSub += d.sub;
      acc[d.region].totalGES += d.gesKgCO2;
      acc[d.region].count++;
    });
    return Object.fromEntries(
      Object.entries(acc).map(([nom, s]) => [nom, {
        consoParSub: s.totalSub > 0 ? s.totalConso / s.totalSub : 0,
        gesParSub: s.totalSub > 0 ? s.totalGES / s.totalSub : 0,
        sub: s.totalSub,
        count: s.count,
      }])
    );
  }, [data]);

  const metricValues = Object.values(regionStats).map(s =>
    metric === 'conso' ? s.consoParSub : metric === 'ges' ? s.gesParSub : s.sub / 1e6
  ).filter(v => v > 0);
  const minV = Math.min(...metricValues);
  const maxV = Math.max(...metricValues);

  const getVal = (nom: string) => {
    const s = regionStats[nom];
    if (!s) return null;
    return metric === 'conso' ? s.consoParSub : metric === 'ges' ? s.gesParSub : s.sub / 1e6;
  };

  const unitLabel = metric === 'conso' ? 'kWh/m²' : metric === 'ges' ? 'kgCO₂/m²' : 'M m²';
  const hoverStats = hovered ? regionStats[hovered] : null;

  const metricButtons: [Metric, string][] = [['conso', '⚡ Conso/SUB'], ['ges', '🌿 GES/SUB'], ['sub', '📐 SUB']];

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a' }}>Carte choroplèthe des régions</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>Scroll pour zoomer · Glisser pour naviguer</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {metricButtons.map(([m, label]) => (
            <button key={m} onClick={() => setMetric(m)} style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
              border: `1px solid ${metric === m ? '#1a2d5a' : '#ddd'}`,
              background: metric === m ? '#1a2d5a' : '#fff',
              color: metric === m ? '#fff' : '#555',
              fontWeight: metric === m ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Map */}
        <div style={{ flex: 1, border: '1px solid #f0f4f8', borderRadius: 8, overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [2.5, 46.5], scale: 2600 }}
            style={{ width: '100%', height: 420 }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={({ zoom, coordinates }) => setPosition({ zoom, coordinates })}
              minZoom={0.9}
              maxZoom={6}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const nom: string = geo.properties.nom;
                    const val = getVal(nom);
                    const t = val !== null && maxV > minV ? (val - minV) / (maxV - minV) : -1;
                    const fill = t >= 0 ? interpolateColor(t) : '#e8edf4';
                    const isHov = hovered === nom;
                    const isAboveTarget = metric === 'conso' && val !== null && val > PPG_TARGET_2030.consoEFkWhParSub;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={isHov ? '#f39c12' : '#fff'}
                        strokeWidth={isHov ? 1.5 / position.zoom : 0.8 / position.zoom}
                        style={{
                          default: { outline: 'none', opacity: 0.92 },
                          hover: { outline: 'none', opacity: 1, cursor: 'pointer' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={() => setHovered(nom)}
                        onMouseLeave={() => setHovered(null)}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Reset zoom button */}
          {position.zoom !== 1 && (
            <button
              onClick={() => setPosition({ coordinates: [2.5, 46.5], zoom: 1 })}
              style={{ position: 'absolute', bottom: 10, right: 10, padding: '4px 10px', fontSize: 11, background: '#fff', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
            >↺ Réinitialiser</button>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Hovered region info */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', border: '1px solid #e8edf4', minHeight: 160 }}>
            {hoverStats && hovered ? (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2d5a', marginBottom: 10, lineHeight: 1.3 }}>{hovered}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Conso EF/SUB', value: `${hoverStats.consoParSub.toFixed(1)} kWh/m²`, color: hoverStats.consoParSub > PPG_TARGET_2030.consoEFkWhParSub ? '#e74c3c' : '#27ae60' },
                    { label: 'GES/SUB', value: `${hoverStats.gesParSub.toFixed(1)} kgCO₂/m²`, color: '#1a2d5a' },
                    { label: 'SUB totale', value: `${(hoverStats.sub / 1e6).toFixed(2)} M m²`, color: '#555' },
                    { label: 'Bâtiments', value: String(hoverStats.count), color: '#555' },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{row.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</div>
                    </div>
                  ))}
                  {hoverStats.consoParSub > PPG_TARGET_2030.consoEFkWhParSub && (
                    <div style={{ marginTop: 4, padding: '4px 8px', background: '#fdf2f2', borderRadius: 4, fontSize: 10, color: '#e74c3c', fontWeight: 600 }}>
                      ⚠ Au-dessus cible PPG ({PPG_TARGET_2030.consoEFkWhParSub} kWh/m²)
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: '#bbb', fontSize: 11, textAlign: 'center', marginTop: 40 }}>
                Survolez une région pour voir le détail
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e8edf4' }}>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Légende</div>
            <div style={{ height: 10, borderRadius: 4, background: 'linear-gradient(to right, #d6e4f0, #1a2d5a)', marginBottom: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888' }}>
              <span>{minV.toFixed(0)}</span>
              <span>{((minV + maxV) / 2).toFixed(0)}</span>
              <span>{maxV.toFixed(0)}</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: 9, color: '#aaa', marginTop: 2 }}>{unitLabel}</div>

            {metric === 'conso' && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
                <div style={{ color: '#aaa', fontWeight: 600 }}>Cible PPG 2030</div>
                <div style={{ color: '#e74c3c', fontWeight: 700 }}>{PPG_TARGET_2030.consoEFkWhParSub} kWh/m²</div>
              </div>
            )}
          </div>

          {/* Top 3 regions */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e8edf4', flex: 1 }}>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Top 3 énergivores</div>
            {Object.entries(regionStats)
              .sort((a, b) => (metric === 'sub' ? b[1].sub - a[1].sub : metric === 'ges' ? b[1].gesParSub - a[1].gesParSub : b[1].consoParSub - a[1].consoParSub))
              .slice(0, 3)
              .map(([nom, s], i) => {
                const val = metric === 'conso' ? s.consoParSub : metric === 'ges' ? s.gesParSub : s.sub / 1e6;
                return (
                  <div key={nom}
                    onMouseEnter={() => setHovered(nom)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'default', background: hovered === nom ? '#e8f0fe' : 'transparent', borderRadius: 4, padding: '2px 4px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ['#e74c3c', '#f39c12', '#f39c12'][i], minWidth: 16 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#1a2d5a' }}>{val.toFixed(1)} {unitLabel}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
