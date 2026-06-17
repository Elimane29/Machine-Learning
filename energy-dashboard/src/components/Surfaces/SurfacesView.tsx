import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { BuildingRecord } from '../../types';

interface Props {
  data: BuildingRecord[];
}

const COLORS = ['#1a2d5a', '#2980b9', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad', '#16a085', '#d35400'];

export default function SurfacesView({ data }: Props) {
  const { regionData, typeDeBienData, statutData, varByRegion } = useMemo(() => {
    const byRegion: Record<string, { sub2024: number; sub2025: number }> = {};
    const byType: Record<string, number> = {};
    const byStatut: Record<string, number> = {};

    data.forEach(d => {
      if (d.annee === 2025 || d.annee === 2024) {
        if (!byRegion[d.region]) byRegion[d.region] = { sub2024: 0, sub2025: 0 };
        if (d.annee === 2025) byRegion[d.region].sub2025 += d.sub;
        if (d.annee === 2024) byRegion[d.region].sub2024 += d.sub;
      }
      if (d.annee === 2025) {
        byType[d.typeDeBien] = (byType[d.typeDeBien] || 0) + d.sub;
        byStatut[d.statutOccupation] = (byStatut[d.statutOccupation] || 0) + d.sub;
      }
    });

    const regionData = Object.entries(byRegion)
      .map(([nom, v]) => ({
        nom: nom.length > 18 ? nom.slice(0, 18) + '…' : nom,
        sub2024: Math.round(v.sub2024 / 1000),
        sub2025: Math.round(v.sub2025 / 1000),
      }))
      .filter(r => r.sub2025 > 0)
      .sort((a, b) => b.sub2025 - a.sub2025);

    const varByRegion = Object.entries(byRegion)
      .filter(([, v]) => v.sub2024 > 0 && v.sub2025 > 0)
      .map(([nom, v]) => ({
        nom: nom.length > 20 ? nom.slice(0, 20) + '…' : nom,
        variation: Math.round(((v.sub2025 - v.sub2024) / v.sub2024) * 1000) / 10,
      }))
      .sort((a, b) => b.variation - a.variation);

    const typeDeBienData = Object.entries(byType)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000) }))
      .sort((a, b) => b.value - a.value);

    const statutData = Object.entries(byStatut)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000) }));

    return { regionData, typeDeBienData, statutData, varByRegion };
  }, [data]);

  const totalSub = data.filter(d => d.annee === 2025).reduce((s, d) => s + d.sub, 0);
  const tauxVacance = data.filter(d => d.annee === 2025 && d.statutOccupation === 'Vacant').reduce((s, d) => s + d.sub, 0) / totalSub * 100;

  const kpis = [
    { label: 'SUB totale 2025', value: (totalSub / 1e6).toFixed(2), unit: 'M m²', color: '#1a2d5a', icon: '📐' },
    { label: 'Taux de vacance', value: tauxVacance.toFixed(1), unit: '%', color: tauxVacance > 10 ? '#e74c3c' : '#27ae60', icon: '🏚' },
    { label: 'Nb bâtiments', value: String(data.filter(d => d.annee === 2025).length), unit: 'bâtiments', color: '#2980b9', icon: '🏢' },
    { label: 'SUB moy./bâtiment', value: (totalSub / data.filter(d => d.annee === 2025).length).toFixed(0), unit: 'm²', color: '#8e44ad', icon: '📊' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px', background: '#f0f4f8', minHeight: '100%' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2d5a' }}>Surfaces (SUB) — Vue 2025</div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `4px solid ${k.color}` }}>
            <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{k.icon} {k.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: k.color }}>{k.value}</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 2, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a', marginBottom: 4 }}>SUB par région (milliers m²)</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>Comparaison 2024 vs 2025</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionData} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="nom" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} unit=" k" />
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} k m²`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="sub2024" name="2024" fill="#b0c4de" radius={[2, 2, 0, 0]} />
              <Bar dataKey="sub2025" name="2025" fill="#1a2d5a" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a', marginBottom: 4 }}>Répartition par type</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>SUB 2025 par type de bien</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeDeBienData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                {typeDeBienData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} k m²`]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1.5, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a', marginBottom: 4 }}>Taux de variation SUB 2024→2025 par région</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>Positif = augmentation de surface, négatif = réduction (optimisation)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={varByRegion} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f4f8" />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="nom" tick={{ fontSize: 10 }} width={130} />
              <Tooltip formatter={(v: any) => [`${v > 0 ? '+' : ''}${v.toFixed(1)}%`, 'Variation SUB']} />
              <Bar dataKey="variation" radius={[0, 3, 3, 0]}
                label={{ position: 'right', fontSize: 10, formatter: (v: any) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` }}>
                {varByRegion.map((entry, i) => (
                  <Cell key={i} fill={entry.variation > 0 ? '#e74c3c' : '#27ae60'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a', marginBottom: 4 }}>Répartition par statut d'occupation</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>SUB 2025</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                label={({ name, percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                {statutData.map((entry, i) => {
                  const colors: Record<string, string> = { 'Occupé': '#27ae60', 'Partiellement occupé': '#f39c12', 'Vacant': '#e74c3c', 'En travaux': '#8e44ad' };
                  return <Cell key={i} fill={colors[entry.name] || COLORS[i]} />;
                })}
              </Pie>
              <Tooltip formatter={(v: any) => [`${v.toLocaleString()} k m²`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
