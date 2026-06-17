import React, { useMemo, useState } from 'react';
import { BuildingRecord } from '../../types';
import { PPG_TARGET_2030 } from '../../data/mockData';

interface Props {
  data: BuildingRecord[];
}

type SortKey = keyof Pick<BuildingRecord, 'libelleBatiment' | 'ville' | 'ministere' | 'sub' | 'consoEFkWhParSub' | 'gesKgCO2ParSub'>;

function ScoreBadge({ value }: { value: number }) {
  const target = PPG_TARGET_2030.consoEFkWhParSub;
  const color = value > target * 1.5 ? '#e74c3c' : value > target ? '#f39c12' : '#27ae60';
  const label = value > target * 1.5 ? '🔴' : value > target ? '🟡' : '🟢';
  return (
    <span title={`${value > target ? 'Au-dessus' : 'Sous'} l'objectif PPG (${target} kWh/m²)`}
      style={{ fontSize: 14, cursor: 'help' }}>{label}</span>
  );
}

export default function DataTable({ data }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('consoEFkWhParSub');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [showBrut, setShowBrut] = useState(false);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data
      .filter(d => !q || d.libelleBatiment.toLowerCase().includes(q) || d.ville.toLowerCase().includes(q) || d.ministere.toLowerCase().includes(q) || d.departement.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = a[sortKey] as number | string;
        const vb = b[sortKey] as number | string;
        const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [data, search, sortKey, sortDir]);

  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const thStyle = (key: SortKey): React.CSSProperties => ({
    padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: sortKey === key ? '#1a2d5a' : '#7f8c8d',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
    background: sortKey === key ? '#f0f4f8' : '#f8fafc',
    borderBottom: '2px solid #e8edf4',
  });

  const tdStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 11, borderBottom: '1px solid #f0f4f8', verticalAlign: 'middle' };

  const exportCSV = () => {
    const headers = ['Bâtiment', 'Ville', 'Dép.', 'Ministère', 'SUB (m²)', 'Conso EF/SUB', 'GES/SUB', 'Extrapolation', 'Statut'];
    const rows = filtered.map(d => [
      d.libelleBatiment, d.ville, d.departement, d.ministere,
      d.sub, d.consoEFkWhParSub, d.gesKgCO2ParSub,
      d.extrapolation ? 'Oui' : 'Non', d.statutOccupation,
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'donnees_energie.csv'; a.click();
  };

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2d5a' }}>Données détaillées bâtiments</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>{filtered.length} bâtiments • {pageData.filter(d => d.extrapolation).length > 0 && `dont ${pageData.filter(d => d.extrapolation).length} extrapolés cette page`}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="🔍  Rechercher bâtiment, ville, ministère…"
            style={{ padding: '6px 12px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, width: 260, outline: 'none' }}
          />
          <button onClick={() => setShowBrut(b => !b)} style={{
            padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 11,
            background: showBrut ? '#1a2d5a' : '#fff', color: showBrut ? '#fff' : '#555', cursor: 'pointer',
          }}>
            {showBrut ? '▶ Brut activé' : 'Afficher brut'}
          </button>
          <button onClick={exportCSV} style={{
            padding: '6px 12px', border: '1px solid #1a2d5a', borderRadius: 6, fontSize: 11,
            background: '#fff', color: '#1a2d5a', cursor: 'pointer', fontWeight: 600,
          }}>⬇ Export CSV</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle('libelleBatiment') }} onClick={() => toggleSort('libelleBatiment')}>
                Bâtiment {sortKey === 'libelleBatiment' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th style={{ ...thStyle('ville') }} onClick={() => toggleSort('ville')}>
                Ville {sortKey === 'ville' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#7f8c8d', background: '#f8fafc', borderBottom: '2px solid #e8edf4' }}>
                Ministère
              </th>
              <th style={{ ...thStyle('sub') }} onClick={() => toggleSort('sub')}>
                SUB (m²) {sortKey === 'sub' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th style={{ ...thStyle('consoEFkWhParSub') }} onClick={() => toggleSort('consoEFkWhParSub')}>
                Conso EF/SUB {sortKey === 'consoEFkWhParSub' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                {showBrut && <span style={{ fontWeight: 400, color: '#aaa' }}> / brut</span>}
              </th>
              <th style={{ ...thStyle('gesKgCO2ParSub') }} onClick={() => toggleSort('gesKgCO2ParSub')}>
                GES/SUB {sortKey === 'gesKgCO2ParSub' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                {showBrut && <span style={{ fontWeight: 400, color: '#aaa' }}> / brut</span>}
              </th>
              <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#7f8c8d', background: '#f8fafc', borderBottom: '2px solid #e8edf4', textAlign: 'center' }}>
                Score
              </th>
              <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#7f8c8d', background: '#f8fafc', borderBottom: '2px solid #e8edf4' }}>
                Statut
              </th>
              <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#7f8c8d', background: '#f8fafc', borderBottom: '2px solid #e8edf4', textAlign: 'center' }}>
                Extrap.
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((d, i) => (
              <tr key={d.codeBatiment + i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f4f8')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}>
                <td style={{ ...tdStyle, fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.libelleBatiment}>
                  {d.libelleBatiment}
                </td>
                <td style={tdStyle}>{d.ville.split(' (')[0]}</td>
                <td style={{ ...tdStyle, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#555' }} title={d.ministere}>
                  {d.ministere.replace('Ministère de l\'', '').replace('Ministère de la ', '').replace('Ministère du ', '').replace('Ministère des ', '')}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{d.sub.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: d.consoEFkWhParSub > PPG_TARGET_2030.consoEFkWhParSub ? '#e74c3c' : '#27ae60' }}>
                    {d.consoEFkWhParSub.toFixed(1)}
                  </span>
                  {showBrut && <span style={{ color: '#aaa', fontSize: 10 }}> / {d.consoEFkWhParSubBrut.toFixed(1)}</span>}
                  <span style={{ fontSize: 10, color: '#aaa' }}> kWh/m²</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <span style={{ fontWeight: 600 }}>{d.gesKgCO2ParSub.toFixed(1)}</span>
                  {showBrut && <span style={{ color: '#aaa', fontSize: 10 }}> / {d.gesKgCO2ParSubBrut.toFixed(1)}</span>}
                  <span style={{ fontSize: 10, color: '#aaa' }}> kgCO₂/m²</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}><ScoreBadge value={d.consoEFkWhParSub} /></td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 500,
                    background: d.statutOccupation === 'Occupé' ? '#eafaf1' : d.statutOccupation === 'Vacant' ? '#fdf2f8' : '#fef9e7',
                    color: d.statutOccupation === 'Occupé' ? '#27ae60' : d.statutOccupation === 'Vacant' ? '#8e44ad' : '#f39c12',
                  }}>{d.statutOccupation}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', color: d.extrapolation ? '#f39c12' : '#bdc3c7', fontSize: 14 }}>
                  {d.extrapolation ? '⚠' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <div style={{ fontSize: 11, color: '#aaa' }}>
          Page {page + 1} / {totalPages} · {filtered.length} résultats
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={page === 0} onClick={() => setPage(0)} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #ddd', borderRadius: 4, cursor: page === 0 ? 'default' : 'pointer', background: '#fff', color: page === 0 ? '#ddd' : '#555' }}>«</button>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #ddd', borderRadius: 4, cursor: page === 0 ? 'default' : 'pointer', background: '#fff', color: page === 0 ? '#ddd' : '#555' }}>‹</button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
            return (
              <button key={pg} onClick={() => setPage(pg)} style={{ padding: '4px 8px', fontSize: 11, border: `1px solid ${page === pg ? '#1a2d5a' : '#ddd'}`, borderRadius: 4, cursor: 'pointer', background: page === pg ? '#1a2d5a' : '#fff', color: page === pg ? '#fff' : '#555' }}>{pg + 1}</button>
            );
          })}
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #ddd', borderRadius: 4, cursor: page >= totalPages - 1 ? 'default' : 'pointer', background: '#fff', color: page >= totalPages - 1 ? '#ddd' : '#555' }}>›</button>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} style={{ padding: '4px 8px', fontSize: 11, border: '1px solid #ddd', borderRadius: 4, cursor: page >= totalPages - 1 ? 'default' : 'pointer', background: '#fff', color: page >= totalPages - 1 ? '#ddd' : '#555' }}>»</button>
        </div>
      </div>
    </div>
  );
}
