import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BuildingRecord } from '../../types';
import { PPG_TARGET_2030 } from '../../data/mockData';

interface Props {
  data: BuildingRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  const target = PPG_TARGET_2030.consoEFkWhParSub;
  const delta = v - target;
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 240 }}>
      <div style={{ fontWeight: 700, color: '#1a2d5a', marginBottom: 6, fontSize: 11 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>Conso EF/SUB</span>
        <span style={{ fontWeight: 700, color: v > target ? '#e74c3c' : '#27ae60' }}>{v?.toFixed(1)} kWh/m²</span>
      </div>
      <div style={{ fontSize: 10, color: delta > 0 ? '#e74c3c' : '#27ae60', marginTop: 4 }}>
        {delta > 0 ? `▲ +${delta.toFixed(0)} au-dessus de l'objectif` : `▼ ${Math.abs(delta).toFixed(0)} sous l'objectif`}
      </div>
    </div>
  );
};

export default function MinistryRankingChart({ data }: Props) {
  const ranking = useMemo(() => {
    const byMin: Record<string, { totalConso: number; totalSub: number }> = {};
    data.forEach(d => {
      if (!byMin[d.ministere]) byMin[d.ministere] = { totalConso: 0, totalSub: 0 };
      byMin[d.ministere].totalConso += d.consoEFkWh;
      byMin[d.ministere].totalSub += d.sub;
    });
    return Object.entries(byMin)
      .map(([name, vals]) => ({
        name: name.replace('Ministère de l\'', 'Min. ').replace('Ministère de la ', 'Min. ').replace('Ministère du ', 'Min. du ').replace('Ministère des ', 'Min. des ').replace('Services du ', '').replace('Ministère de ', 'Min. '),
        fullName: name,
        value: Math.round((vals.totalConso / vals.totalSub) * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const getBarColor = (value: number) => {
    if (value > PPG_TARGET_2030.consoEFkWhParSub * 1.5) return '#e74c3c';
    if (value > PPG_TARGET_2030.consoEFkWhParSub) return '#f39c12';
    return '#27ae60';
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1, minWidth: 0,
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a' }}>Classement ministères</div>
        <div style={{ fontSize: 11, color: '#aaa' }}>Consommation EF / SUB — du plus énergivore au plus sobre</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {[{ color: '#e74c3c', label: 'Très énergivore (>225)' }, { color: '#f39c12', label: 'À améliorer (150-225)' }, { color: '#27ae60', label: 'Dans l\'objectif (<150)' }].map(l => (
          <div key={l.color} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#666' }}>
            <div style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
            {l.label}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f4f8" />
          <XAxis type="number" tick={{ fontSize: 10 }} unit=" kWh/m²" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={115} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={PPG_TARGET_2030.consoEFkWhParSub} stroke="#e74c3c" strokeDasharray="5 3" label={{ value: 'Cible PPG', position: 'top', fontSize: 10, fill: '#e74c3c' }} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} name="kWh/m²"
            fill="#1a2d5a"
            label={{ position: 'right', fontSize: 10, formatter: (v: any) => `${Number(v).toFixed(0)}` }}
          >
            {ranking.map((entry, index) => (
              <rect key={index} fill={getBarColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
