import React from 'react';
import { ActiveSection } from '../../types';

interface Props {
  active: ActiveSection;
  onChange: (s: ActiveSection) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { id: ActiveSection; icon: string; label: string }[] = [
  { id: 'synthese', icon: '⚡', label: 'Synthèse Énergie' },
  { id: 'classement', icon: '🏆', label: 'Classement' },
  { id: 'carte', icon: '🗺', label: 'Carte' },
  { id: 'donnees', icon: '📋', label: 'Données détaillées' },
  { id: 'surfaces', icon: '📐', label: 'Surfaces' },
];

export default function Sidebar({ active, onChange, collapsed, onToggle }: Props) {
  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        minHeight: '100vh',
        backgroundColor: '#0f1f4b',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
        onClick={onToggle}
        title={collapsed ? 'Déplier' : 'Replier'}
      >
        <span style={{ fontSize: 20, color: '#7ec8e3', flexShrink: 0 }}>🏛</span>
        {!collapsed && (
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 1, lineHeight: 1.3 }}>
            DIE — 1A
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: 14, flexShrink: 0 }}>
          {collapsed ? '›' : '‹'}
        </span>
      </div>

      <nav style={{ flex: 1, paddingTop: 12 }}>
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px 16px' : '12px 20px',
                background: isActive ? 'rgba(126,200,227,0.15)' : 'none',
                border: 'none',
                borderLeft: isActive ? '3px solid #7ec8e3' : '3px solid transparent',
                cursor: 'pointer',
                color: isActive ? '#7ec8e3' : 'rgba(255,255,255,0.6)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            Réalisé par DIE-1A<br />Version 1.2
          </div>
        </div>
      )}
    </aside>
  );
}
