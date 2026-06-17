import React from 'react';

interface Props {
  filters: {
    annee: string;
    region: string;
    ministere: string;
    typeDeBien: string;
  };
  onFilterChange: (key: string, value: string) => void;
  annees: string[];
  regions: string[];
  ministeres: string[];
  typesDeBien: string[];
  tauxExtrap: number;
}

export default function Header({ filters, onFilterChange, annees, regions, ministeres, typesDeBien, tauxExtrap }: Props) {
  const selectStyle: React.CSSProperties = {
    padding: '5px 10px',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    outline: 'none',
    minWidth: 130,
  };

  return (
    <header style={{
      backgroundColor: '#1a2d5a',
      color: '#fff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      height: 56,
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ width: 12, height: 10, background: '#002395' }} />
            <div style={{ width: 12, height: 10, background: '#fff' }} />
            <div style={{ width: 12, height: 10, background: '#ED2939' }} />
          </div>
          <span style={{ fontSize: 7, color: '#ddd', letterSpacing: 0.5, marginTop: 2, fontFamily: 'serif' }}>RÉPUBLIQUE</span>
          <span style={{ fontSize: 7, color: '#ddd', letterSpacing: 0.5, fontFamily: 'serif' }}>FRANÇAISE</span>
        </div>
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
          Transition Écologique — Parc Immobilier de l'État
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>Filtres :</span>

        <select style={selectStyle} value={filters.annee} onChange={e => onFilterChange('annee', e.target.value)}>
          <option value="Tout">Toutes années</option>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select style={selectStyle} value={filters.region} onChange={e => onFilterChange('region', e.target.value)}>
          <option value="Tout">Toutes régions</option>
          {regions.map(r => <option key={r} value={r}>{r.length > 22 ? r.slice(0, 22) + '…' : r}</option>)}
        </select>

        <select style={selectStyle} value={filters.ministere} onChange={e => onFilterChange('ministere', e.target.value)}>
          <option value="Tout">Tous ministères</option>
          {ministeres.map(m => <option key={m} value={m}>{m.replace('Ministère de ', 'Min. ').replace('Ministère du ', 'Min. ').replace('Ministère des ', 'Min. ')}</option>)}
        </select>

        <select style={selectStyle} value={filters.typeDeBien} onChange={e => onFilterChange('typeDeBien', e.target.value)}>
          <option value="Tout">Tous types</option>
          {typesDeBien.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          backgroundColor: tauxExtrap > 15 ? '#e67e22' : '#27ae60',
          borderRadius: 4,
          padding: '3px 8px',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>{tauxExtrap > 15 ? '⚠' : '✓'}</span>
          <span>{tauxExtrap.toFixed(0)}% extrapolé</span>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
          MAJ: 31/12/2025
        </div>
      </div>
    </header>
  );
}
