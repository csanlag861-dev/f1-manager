'use client';

import React from 'react';
import Link from 'next/link';
import { useGameStore } from '../../application/store/gameStore';

export function Header() {
  const gameState = useGameStore((state) => state.gameState);

  if (!gameState) {
    return (
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(10, 12, 16, 0.9)',
        backdropFilter: 'blur(10px)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '12px',
            height: '24px',
            background: 'var(--accent-red)',
            borderRadius: '2px',
            transform: 'skewX(-15deg)',
          }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.05em' }}>
            F1 MANAGER <span style={{ color: 'var(--accent-red)' }}>ARCADE</span>
          </span>
        </Link>
      </header>
    );
  }

  const currentTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
  const currentCircuit = gameState.circuits[gameState.season.currentRaceIndex];

  return (
    <header className="f1-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 2rem',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 12, 16, 0.95)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      flexWrap: 'wrap',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', maxWidth: '100%' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          <div style={{
            width: '10px',
            height: '22px',
            background: 'var(--accent-red)',
            borderRadius: '2px',
            transform: 'skewX(-15deg)',
          }} />
          <span style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '0.05em' }}>
            {currentTeam?.name.toUpperCase() ?? 'F1 TEAM'}
          </span>
        </Link>

        <nav className="f1-nav-scroll" style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          alignItems: 'center',
          maxWidth: '100%',
        }}>
          <Link href="/dashboard" style={{ color: 'var(--text-main)', opacity: 0.9, flexShrink: 0 }}>
            Panel Principal
          </Link>
          <Link href="/market" style={{ color: 'var(--text-main)', opacity: 0.9, flexShrink: 0 }}>
            Mercado
          </Link>
          <Link href="/academy" style={{ color: 'var(--text-main)', opacity: 0.9, flexShrink: 0 }}>
            Academia
          </Link>
          <Link href="/standings" style={{ color: 'var(--text-main)', opacity: 0.9, flexShrink: 0 }}>
            Clasificación
          </Link>
          <Link href="/legacy" style={{ color: gameState.isCareerCompleted ? 'var(--accent-gold)' : 'var(--text-main)', opacity: 0.9, flexShrink: 0 }}>
            Legado
          </Link>
          <Link href="/settings" style={{ color: 'var(--text-main)', opacity: 0.9, flexShrink: 0 }}>
            Ajustes
          </Link>
          <Link href="/race" style={{ color: 'var(--accent-red)', fontWeight: 700, flexShrink: 0 }}>
            Fin de Semana GP
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
        <div style={{ whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)' }}>Temporada: </span>
          <strong style={{ color: 'var(--text-main)' }}>{gameState.season.seasonNumber}</strong>
          <span style={{ color: 'var(--text-dim)', margin: '0 0.5rem' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>Ronda: </span>
          <strong style={{ color: 'var(--text-main)' }}>
            {gameState.season.currentRaceIndex + 1} / 24
          </strong>
        </div>

        {currentCircuit && (
          <div className="f1-badge f1-badge-gold" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            {currentCircuit.name}
          </div>
        )}

        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-green)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}>
          ${((currentTeam?.budget ?? 0) / 1000000).toFixed(1)}M
        </div>
      </div>
    </header>
  );
}
