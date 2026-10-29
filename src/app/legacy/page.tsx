'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';
import { calculateHonoraryTitle } from '../../domain/season';

export default function LegacyPage() {
  const router = useRouter();
  const gameState = useGameStore((state) => state.gameState);
  const loadGame = useGameStore((state) => state.loadGame);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    if (!gameState && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      loadGame().then((loaded) => {
        if (!loaded) {
          router.push('/new-game');
        }
      });
    }
  }, [gameState, hasAttemptedLoad, loadGame, router]);

  if (!gameState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando legado histórico...</p>
      </div>
    );
  }

  const manager = gameState.managerProfile;
  const trophy = manager.trophyCabinet;
  const title = manager.honoraryTitle || calculateHonoraryTitle(trophy);
  const teamsManagedIds = manager.teamsManaged && manager.teamsManaged.length > 0
    ? manager.teamsManaged
    : [gameState.playerTeamId];
  const teamsManaged = gameState.teams.filter((t) => teamsManagedIds.includes(t.id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {/* Legacy Hero Banner */}
        <div
          id="legacy-container"
          className="f1-card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            marginBottom: '2rem',
            background: 'linear-gradient(180deg, rgba(234, 179, 8, 0.12) 0%, rgba(20, 20, 20, 0.95) 100%)',
            border: '2px solid var(--accent-gold)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}
        >
          <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.875rem', padding: '0.35rem 1rem', marginBottom: '1rem' }}>
            HALL OF FAME — 10 TEMPORADAS DE FÓRMULA 1
          </span>

          <h1 style={{ fontSize: '3rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            {manager.name}
          </h1>

          <div style={{ display: 'inline-block', margin: '0.75rem 0 1.5rem', padding: '0.5rem 1.5rem', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
              {title}
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '650px', margin: '0 auto' }}>
            Valoración final de Team Principal: <strong style={{ color: 'var(--text-main)' }}>{manager.tpRating}/100</strong> | Temporadas disputadas: <strong style={{ color: 'var(--accent-gold)' }}>{manager.seasonsCompleted} de 10</strong>
          </p>
        </div>

        {/* 4 Grand Trophy Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          {/* Card 1: Constructores */}
          <div className="f1-card" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-gold)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Mundiales de Constructores
            </span>
            <div id="legacy-constructors-titles" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-gold)', margin: '0.5rem 0' }}>
              {trophy.constructorsChampionships}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
              Títulos de escudería conquistados
            </p>
          </div>

          {/* Card 2: Pilotos */}
          <div className="f1-card" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-gold)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Mundiales de Pilotos
            </span>
            <div id="legacy-drivers-titles" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-gold)', margin: '0.5rem 0' }}>
              {trophy.driversChampionships}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
              Campeonatos de pilotos dirigidos
            </p>
          </div>

          {/* Card 3: Victorias */}
          <div className="f1-card" style={{ textAlign: 'center', borderTop: '4px solid var(--accent-red)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Victorias en Grandes Premios
            </span>
            <div id="legacy-total-wins" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', margin: '0.5rem 0' }}>
              {trophy.totalWins}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
              Triunfos totales en carrera
            </p>
          </div>

          {/* Card 4: Podios */}
          <div className="f1-card" style={{ textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Podios Totales
            </span>
            <div id="legacy-total-podiums" style={{ fontSize: '3rem', fontWeight: 900, color: '#60a5fa', margin: '0.5rem 0' }}>
              {trophy.totalPodiums}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
              Presencias en el cajón
            </p>
          </div>

        </div>

        {/* Escuderías Dirigidas */}
        <div className="f1-card" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--text-main)' }}>
            Escuderías Dirigidas durante la Trayectoria
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {teamsManaged.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '4px solid var(--accent-red)',
                }}
              >
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  Reputación Oficial: {t.reputation}/100
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            id="legacy-new-game-btn"
            href="/new-game"
            className="f1-btn f1-btn-primary"
            style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
          >
            Comenzar Nueva Trayectoria
          </Link>
          <Link
            id="legacy-dashboard-btn"
            href="/dashboard"
            className="f1-btn f1-btn-secondary"
            style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
          >
            Volver al Panel Principal
          </Link>
        </div>
      </main>
    </div>
  );
}
