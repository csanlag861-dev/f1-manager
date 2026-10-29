'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';
import { getFinancialOverview } from '../../domain/economy';
import { FinancialPanel } from '../../presentation/components/FinancialPanel';
import { FactoryPanel } from '../../presentation/components/FactoryPanel';
import { SeasonTransitionModal } from '../../presentation/components/SeasonTransitionModal';

export default function DashboardPage() {
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
        <p style={{ color: 'var(--text-muted)' }}>Cargando datos de la escudería...</p>
      </div>
    );
  }

  const team = gameState.teams.find((t) => t.id === gameState.playerTeamId);
  const car = gameState.cars.find((c) => c.id === team?.carId);
  const driverIds: string[] = team ? [team.driverIds[0], team.driverIds[1]] : [];
  const drivers = gameState.drivers.filter((d) => driverIds.includes(d.id));
  const engineer = gameState.chiefEngineers.find((e) => e.id === team?.chiefEngineerId);
  const currentCircuit = gameState.circuits[gameState.season.currentRaceIndex];
  const financialOverview = team ? getFinancialOverview(team, drivers, engineer) : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Season Transition Modal (AC-08.1 to AC-08.6) */}
      {gameState.seasonTransitionSummary && (
        <SeasonTransitionModal summary={gameState.seasonTransitionSummary} />
      )}

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Top Hero Banner */}
        <div className="f1-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className="f1-badge f1-badge-red">
                Temporada {gameState.season.seasonNumber} — Ronda {gameState.season.currentRaceIndex + 1} de 24
              </span>
              {gameState.isBankrupt && (
                <span id="dashboard-bankruptcy-badge" className="f1-badge f1-badge-red" style={{ fontWeight: 800 }}>
                  QUIEBRA FINANCIERA (GAME OVER)
                </span>
              )}
              {gameState.isGameOver && gameState.gameOverReason === 'dismissal_no_offers' && (
                <span id="dashboard-dismissal-badge" className="f1-badge f1-badge-red" style={{ fontWeight: 800 }}>
                  DESTITUCIÓN SIN OFERTAS (GAME OVER)
                </span>
              )}
              {gameState.isCareerCompleted && (
                <span id="dashboard-legacy-badge" className="f1-badge f1-badge-gold" style={{ fontWeight: 800 }}>
                  10 TEMPORADAS COMPLETADAS (LEGADO)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              {team?.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Director: <strong style={{ color: 'var(--text-main)' }}>{gameState.managerProfile.name}</strong> | Rating TP: <strong style={{ color: 'var(--accent-gold)' }}>{gameState.managerProfile.tpRating}/100</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {gameState.isCareerCompleted ? (
              <Link
                id="career-legacy-btn"
                href="/legacy"
                className="f1-btn f1-btn-primary"
                style={{ padding: '1rem 2.25rem', fontSize: '1rem', border: '1px solid var(--accent-gold)' }}
              >
                Ver Pantalla de Legado
              </Link>
            ) : gameState.isBankrupt || gameState.isGameOver ? (
              <Link
                id="bankruptcy-new-game-btn"
                href="/new-game"
                className="f1-btn f1-btn-primary"
                style={{ padding: '1rem 2.25rem', fontSize: '1rem', background: 'var(--accent-red)' }}
              >
                Comenzar Nueva Partida
              </Link>
            ) : (
              <Link
                id="race-weekend-btn"
                href="/race"
                className="f1-btn f1-btn-primary"
                style={{ padding: '1rem 2.25rem', fontSize: '1rem' }}
              >
                Disputar Fin de Semana GP
              </Link>
            )}
          </div>
        </div>

        {/* 2-Column Info Grid: Próximo GP + Monoplaza */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Card 1: Próximo Gran Premio */}
          <div className="f1-card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--accent-gold)' }}>
              Próximo Gran Premio
            </h2>
            {currentCircuit ? (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {currentCircuit.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {currentCircuit.country} — {currentCircuit.laps} vueltas
                </p>

                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Demanda Vel. Punta:</span>
                    <strong>{(currentCircuit.topSpeedDemand * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Demanda Aerodinámica:</span>
                    <strong>{(currentCircuit.downforceDemand * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Severidad Mecánica:</span>
                    <strong>{(currentCircuit.reliabilityDemand * 100).toFixed(0)}%</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Temporada finalizada.</p>
            )}
          </div>

          {/* Card 2: Monoplaza y Fábrica */}
          <div className="f1-card">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
              Monoplaza e Instalaciones
            </h2>
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Velocidad Punta:</span>
                <strong>{car?.topSpeed}/100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Carga Aerodinámica:</span>
                <strong>{car?.downforce}/100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fiabilidad:</span>
                <strong>{car?.reliability}/100</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Fábrica: <strong>Nivel {team?.factoryLevel}</strong> | Simulador: <strong>Nivel {team?.simulatorLevel}</strong>
            </div>
          </div>

        </div>

        {/* Factory & Car Development Panel (AC-03.1 - AC-03.6) */}
        {team && car && <FactoryPanel team={team} car={car} engineer={engineer} />}

        {/* Financial Control Panel (AC-02.1) */}
        {financialOverview && <FinancialPanel overview={financialOverview} />}

        {/* Drivers & Engineer section */}
        <div className="f1-card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>
            Plantilla Deportiva y Técnica
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {drivers.map((driver, index) => (
              <div key={driver.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.6875rem', marginBottom: '0.25rem' }}>
                  Piloto {index + 1}
                </span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{driver.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  {driver.nationality} — {driver.age} años
                </p>
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Ritmo: <strong>{driver.pace}</strong></span>
                  <span>Consistencia: <strong>{driver.consistency}</strong></span>
                  <span>Moral: <strong>{driver.morale}%</strong></span>
                </div>
              </div>
            ))}

            {engineer && (
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <span className="f1-badge f1-badge-red" style={{ fontSize: '0.6875rem', marginBottom: '0.25rem' }}>
                  Jefe de Ingenieros
                </span>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{engineer.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                  Contrato: {engineer.contractYears} años
                </p>
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Eficiencia I+D: <strong>{engineer.developmentEfficiency}</strong></span>
                  <span>Setup: <strong>{engineer.setupPerformance}</strong></span>
                  <span>Moral: <strong>{engineer.morale}%</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
