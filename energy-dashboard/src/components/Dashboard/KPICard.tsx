import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  label: string;
  value: string;
  unit: string;
  trend: number;
  sparkData: { v: number }[];
  color: string;
  icon: string;
  subtitle?: string;
}

export default function KPICard({ label, value, unit, trend, sparkData, color, icon, subtitle }: Props) {
  const isPositiveTrend = trend < 0;
  const trendColor = isPositiveTrend ? '#27ae60' : '#e74c3c';
  const trendArrow = trend < 0 ? '▼' : '▲';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderTop: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#7f8c8d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {label}
          </div>
          {subtitle && <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#1a2d5a', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 12, color: '#7f8c8d' }}>{unit}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: isPositiveTrend ? '#eafaf1' : '#fdedec',
          borderRadius: 4, padding: '2px 7px',
        }}>
          <span style={{ color: trendColor, fontSize: 11, fontWeight: 700 }}>{trendArrow} {Math.abs(trend).toFixed(1)}%</span>
          <span style={{ fontSize: 10, color: '#aaa' }}>vs N-1</span>
        </div>
        <div style={{ width: 80, height: 32 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, padding: '2px 6px' }}
                formatter={(v: any) => [Number(v).toFixed(1), unit]}
                labelFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
