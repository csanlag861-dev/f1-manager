'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '../application/store/gameStore';

export default function HomePage() {
  const gameState = useGameStore((state) => state.gameState);
  const loadGame = useGameStore((state) => state.loadGame);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    loadGame().finally(() => {
      setCheckedStorage(true);
    });
  }, [loadGame]);

  const activeTeam = gameState?.teams.find((t) => t.id === gameState.playerTeamId);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 30%, #1a2234 0%, #0a0c10 70%)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', width: '100%' }}>
        <div className="f1-badge f1-badge-red" style={{ marginBottom: '1rem' }}>
          Temporada Oficial F1 Arcade
        </div>
        
        <h1 style={{
          fontSize: '3.25rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          F1 Manager
        </h1>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.125rem',
          marginBottom: '2.5rem',
        }}>
          Simulador táctico y arcade de gestión de Fórmula 1 en el navegador. Gestiona escuderías oficiales, desarrolla tu monoplaza y compite por la gloria.
        </p>

        {checkedStorage && gameState && (
          <div className="f1-card" style={{ marginBottom: '2rem', textAlign: 'left', border: '1px solid var(--accent-red)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Partida en Curso Detectada
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{activeTeam?.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Temporada {gameState.season.seasonNumber} — Ronda {gameState.season.currentRaceIndex + 1} de 24
                </p>
              </div>
              <Link
                id="continue-game-btn"
                href="/dashboard"
                className="f1-btn f1-btn-primary"
                style={{ padding: '0.875rem 1.75rem' }}
              >
                Continuar Partida
              </Link>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            id="new-game-btn"
            href="/new-game"
            className={gameState ? 'f1-btn f1-btn-secondary' : 'f1-btn f1-btn-primary'}
            style={{ padding: '1rem 2.25rem', fontSize: '1rem' }}
          >
            Nueva Partida
          </Link>
        </div>
      </div>
    </main>
  );
}
