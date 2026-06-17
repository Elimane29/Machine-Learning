import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BuildingRecord } from '../../types';
import { PPG_TARGET_2030 } from '../../data/mockData';

interface Props {
  data: BuildingRecord[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '10px 14px', fontSize: 11, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 220 }}>
      <div style={{ fontWeight: 700, color: '#1a2d5a', marginBottom: 6 }}>{d.name}</div>
      <div style={{ color: '#666' }}>{d.dept}</div>
      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>SUB : <strong>{d.sub.toLocaleString()} m²</strong></span>
        <span>Conso : <strong style={{ color: d.conso > PPG_TARGET_2030.consoEFkWhParSub ? '#e74c3c' : '#27ae60' }}>{d.conso.toFixed(1)} kWh/m²</strong></span>
        <span>GES : <strong>{d.ges.toFixed(1)} kgCO₂/m²</strong></span>
        <span style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{d.ministere}</span>
      </div>
    </div>
  );
};

export default function ScatterBuildingsChart({ data }: Props) {
  const [highlight, setHighlight] = useState<'all' | 'outliers'>('all');

  const scatterData = useMemo(() => {
    const latest = data.filter(d => d.annee === 2025);
    const pts = latest.map(d => ({
      sub: d.sub,
      conso: d.consoEFkWhParSub,
      ges: d.gesKgCO2ParSub,
      name: d.libelleBatiment,
      dept: d.departement,
      ministere: d.ministere.replace('Ministère de l\'', '').replace('Ministère de la ', '').replace('Ministère du ', '').replace('Ministère des ', ''),
      isOutlier: d.sub > 5000 && d.consoEFkWhParSub > PPG_TARGET_2030.consoEFkWhParSub * 1.5,
    }));
    return highlight === 'outliers' ? pts.filter(p => p.isOutlier) : pts;
  }, [data, highlight]);

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a' }}>Analyse bâtiments — SUB vs Intensité</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>Identifier les grands bâtiments très énergivores (haut-droite = priorité)</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'outliers'] as const).map(m => (
            <button key={m} onClick={() => setHighlight(m)} style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
              border: `1px solid ${highlight === m ? '#1a2d5a' : '#ddd'}`,
              background: highlight === m ? '#1a2d5a' : '#fff',
              color: highlight === m ? '#fff' : '#555',
            }}>
              {m === 'all' ? 'Tous' : '⚠ Prioritaires'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
          <XAxis dataKey="sub" name="SUB" unit=" m²" tick={{ fontSize: 10 }} label={{ value: 'Surface (m²)', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis dataKey="conso" name="Conso EF/SUB" unit=" kWh/m²" tick={{ fontSize: 10 }} label={{ value: 'kWh/m²', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={PPG_TARGET_2030.consoEFkWhParSub} stroke="#e74c3c" strokeDasharray="5 3" label={{ value: 'Cible PPG', position: 'right', fontSize: 10, fill: '#e74c3c' }} />
          <Scatter
            data={scatterData}
            fill="#1a2d5a"
            fillOpacity={0.6}
            shape={(props: any) => {
              const isOut = props.isOutlier ?? (props.conso > PPG_TARGET_2030.consoEFkWhParSub * 1.5 && props.sub > 5000);
              return <circle cx={props.cx} cy={props.cy} r={props.sub > 8000 ? 7 : props.sub > 3000 ? 5 : 3} fill={isOut ? '#e74c3c' : '#1a2d5a'} fillOpacity={0.55} stroke={isOut ? '#c0392b' : 'none'} strokeWidth={1} />;
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, color: '#666' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e74c3c' }} />
          Grands bâtiments énergivores (priorité intervention)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a2d5a', opacity: 0.55 }} />
          Parc standard
        </div>
      </div>
    </div>
  );
}
