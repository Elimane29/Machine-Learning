import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface Props {
  currentValue: number;
  referenceValue: number;
  targetValue: number;
  targetYear: number;
}

export default function PPGProgressCard({ currentValue, referenceValue, targetValue, targetYear }: Props) {
  const totalReduction = referenceValue - targetValue;
  const achievedReduction = referenceValue - currentValue;
  const progressPct = Math.min(100, Math.max(0, (achievedReduction / totalReduction) * 100));
  const remainingPct = 100 - progressPct;
  const targetPct = Math.round(((referenceValue - targetValue) / referenceValue) * 100);
  const currentPct = Math.round(((referenceValue - currentValue) / referenceValue) * 100);

  const gaugeColor = progressPct >= 70 ? '#27ae60' : progressPct >= 40 ? '#f39c12' : '#e74c3c';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderTop: '4px solid #1a2d5a',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 11, color: '#7f8c8d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Objectif PPG {targetYear}
      </div>
      <div style={{ fontSize: 10, color: '#aaa' }}>Réduction Conso EF/SUB vs 2010</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 100, height: 100, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="60%"
              innerRadius="60%" outerRadius="85%"
              startAngle={180} endAngle={0}
              data={[{ value: progressPct, fill: gaugeColor }]}
            >
              <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#f0f4f8' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: gaugeColor, lineHeight: 1 }}>
            {progressPct.toFixed(0)}<span style={{ fontSize: 14 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: '#7f8c8d', marginBottom: 8 }}>de l'objectif atteint</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#7f8c8d' }}>Réf. 2010 :</span>
              <span style={{ fontWeight: 600 }}>{referenceValue} kWh/m²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#7f8c8d' }}>Actuel 2025 :</span>
              <span style={{ fontWeight: 600, color: '#1a2d5a' }}>{currentValue.toFixed(0)} kWh/m²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#7f8c8d' }}>Cible 2030 :</span>
              <span style={{ fontWeight: 600, color: gaugeColor }}>{targetValue} kWh/m² (-{targetPct}%)</span>
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: 10, color: '#e74c3c', fontWeight: 600 }}>
            {remainingPct > 0 && `Effort restant : -${remainingPct.toFixed(0)}% à réaliser d'ici ${targetYear}`}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: 6, background: '#f0f4f8', borderRadius: 3, marginTop: 4 }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: gaugeColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
        <div style={{
          position: 'absolute', top: -1, left: `${targetPct}%`,
          width: 2, height: 8, background: '#e74c3c',
          transform: 'translateX(-50%)',
        }} title={`Cible : -${targetPct}%`} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa' }}>
        <span>0%</span>
        <span style={{ color: '#e74c3c' }}>▲ cible -{targetPct}%</span>
        <span>-100%</span>
      </div>
    </div>
  );
}
