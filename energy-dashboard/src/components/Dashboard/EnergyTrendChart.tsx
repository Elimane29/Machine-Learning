import React, { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { YearlyKPI } from '../../types';
import { REFERENCE_2010, PPG_TARGET_2030 } from '../../data/mockData';

interface Props {
  data: YearlyKPI[];
}

type Metric = 'consoEFkWhParSub' | 'gesKgCO2ParSub';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: '#1a2d5a', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{Number(p.value).toFixed(1)} {p.unit}</span>
        </div>
      ))}
    </div>
  );
};

export default function EnergyTrendChart({ data }: Props) {
  const [metric, setMetric] = useState<Metric>('consoEFkWhParSub');

  const isEF = metric === 'consoEFkWhParSub';
  const unit = isEF ? 'kWh/m²' : 'kgCO₂/m²';
  const refVal = isEF ? REFERENCE_2010.consoEFkWhParSub : 62;
  const targetVal = isEF ? PPG_TARGET_2030.consoEFkWhParSub : 31;
  const color = isEF ? '#1a2d5a' : '#27ae60';

  const chartData = data.map(d => ({
    annee: d.annee,
    valeur: isEF ? d.consoEFkWhParSub : d.gesKgCO2ParSub,
  }));

  const projectionData = [
    { annee: 2025, valeur: chartData[chartData.length - 1]?.valeur },
    { annee: 2030, valeur: targetVal },
  ];

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a' }}>Évolution pluriannuelle</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>2020 → 2025 + projection 2030</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['consoEFkWhParSub', 'gesKgCO2ParSub'] as Metric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                border: `1px solid ${metric === m ? '#1a2d5a' : '#ddd'}`,
                background: metric === m ? '#1a2d5a' : '#fff',
                color: metric === m ? '#fff' : '#555',
                fontWeight: metric === m ? 600 : 400,
              }}
            >
              {m === 'consoEFkWhParSub' ? '⚡ Conso EF' : '🌿 GES'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
          <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit={` ${unit}`} width={75} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={refVal} stroke="#aaa" strokeDasharray="4 4" label={{ value: `Réf. 2010: ${refVal}`, position: 'right', fontSize: 10, fill: '#aaa' }} />
          <ReferenceLine y={targetVal} stroke="#e74c3c" strokeDasharray="6 2" label={{ value: `Cible 2030: ${targetVal}`, position: 'right', fontSize: 10, fill: '#e74c3c' }} />
          <Area
            type="monotone" dataKey="valeur" name={isEF ? 'Conso EF/SUB' : 'GES/SUB'}
            fill={color + '20'} stroke={color} strokeWidth={2.5}
            dot={{ r: 4, fill: color }} unit={` ${unit}`}
          />
          <Line
            type="monotone" data={projectionData} dataKey="valeur" name="Projection 2030"
            stroke="#e74c3c" strokeWidth={1.5} strokeDasharray="6 3"
            dot={false} unit={` ${unit}`}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
