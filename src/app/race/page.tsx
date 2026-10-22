'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';
import { simulateQualySession, simulateRaceSession } from '../../domain/simulation';
import { QualyResultEntry, RaceResultEntry, RaceWeekendResult } from '../../domain/models';

type RaceStage = 'pre_weekend' | 'qualy_finished' | 'race_finished';

export default function RacePage() {
  const router = useRouter();
  const gameState = useGameStore((state) => state.gameState);
  const loadGame = useGameStore((state) => state.loadGame);
  const applyRaceResults = useGameStore((state) => state.applyRaceResults);
  const advanceToNextRound = useGameStore((state) => state.advanceToNextRound);
  const isSaving = useGameStore((state) => state.isSaving);

  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [stage, setStage] = useState<RaceStage>('pre_weekend');
  const [qualyResults, setQualyResults] = useState<QualyResultEntry[]>([]);
  const [raceResults, setRaceResults] = useState<RaceResultEntry[]>([]);

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
        <p style={{ color: 'var(--text-muted)' }}>Cargando fin de semana de carreras...</p>
      </div>
    );
  }

  const currentRoundIndex = gameState.season.currentRaceIndex;
  const currentCircuit = gameState.circuits[currentRoundIndex];
  const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
  const driverMap = new Map(gameState.drivers.map((d) => [d.id, d]));
  const teamMap = new Map(gameState.teams.map((t) => [t.id, t]));

  // Season completion check
  if (currentRoundIndex >= gameState.circuits.length || !currentCircuit) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Temporada completada</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>Has disputado las 24 carreras de la temporada.</p>
          <button className="f1-btn f1-btn-primary" onClick={() => router.push('/dashboard')}>
            Volver al Panel
          </button>
        </main>
      </div>
    );
  }

  const handleSimulateQualy = () => {
    const qResults = simulateQualySession(
      gameState.drivers,
      gameState.teams,
      gameState.cars,
      gameState.chiefEngineers,
      currentCircuit
    );
    setQualyResults(qResults);
    setStage('qualy_finished');
  };

  const handleSimulateRace = async () => {
    const rResults = simulateRaceSession(
      qualyResults,
      gameState.drivers,
      gameState.teams,
      gameState.cars,
      gameState.chiefEngineers,
      currentCircuit
    );
    setRaceResults(rResults);

    const weekendResult: RaceWeekendResult = {
      round: currentCircuit.round,
      circuitId: currentCircuit.id,
      qualyResults,
      raceResults: rResults,
    };

    await applyRaceResults(weekendResult);
    setStage('race_finished');
  };

  const handleContinueNextRound = async () => {
    try {
      await advanceToNextRound();
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Circuit Banner */}
        <div className="f1-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="f1-badge f1-badge-gold" style={{ marginBottom: '0.5rem' }}>
              Ronda {currentCircuit.round} de 24 — {currentCircuit.country}
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase' }}>
              {currentCircuit.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {currentCircuit.laps} vueltas | Vel. Punta: {(currentCircuit.topSpeedDemand * 100).toFixed(0)}% | Carga Aero: {(currentCircuit.downforceDemand * 100).toFixed(0)}%
            </p>
          </div>

          <div>
            {stage === 'pre_weekend' && (
              <button
                id="start-qualy-btn"
                className="f1-btn f1-btn-primary"
                onClick={handleSimulateQualy}
                style={{ padding: '1rem 2rem', fontSize: '1rem' }}
              >
                Disputar Clasificación (Qualy)
              </button>
            )}

            {stage === 'qualy_finished' && (
              <button
                id="start-race-btn"
                className="f1-btn f1-btn-primary"
                onClick={handleSimulateRace}
                disabled={isSaving}
                style={{ padding: '1rem 2rem', fontSize: '1rem' }}
              >
                {isSaving ? 'Simulando...' : 'Ir a Carrera'}
              </button>
            )}

            {stage === 'race_finished' && (
              gameState.isBankrupt ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    id="bankrupt-new-game-btn"
                    className="f1-btn f1-btn-primary"
                    onClick={() => router.push('/new-game')}
                  >
                    Nueva Partida
                  </button>
                </div>
              ) : (
                <button
                  id="continue-next-round-btn"
                  className="f1-btn f1-btn-primary"
                  onClick={handleContinueNextRound}
                  disabled={isSaving}
                  style={{ padding: '1rem 2rem', fontSize: '1rem' }}
                >
                  {isSaving ? 'Guardando...' : 'Continuar al Siguiente GP'}
                </button>
              )
            )}
          </div>
        </div>

        {/* STAGE 1: PRE-WEEKEND */}
        {stage === 'pre_weekend' && (
          <div className="f1-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <div className="f1-badge f1-badge-red" style={{ marginBottom: '1rem' }}>
              Sesión de Clasificación Pendiente
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Preparados para la Clasificación
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2rem' }}>
              Los 20 monoplazas saldrán a pista para luchar por la Pole Position. El rendimiento de tu monoplaza y la destreza de tus pilotos determinarán su posición en la parrilla de salida.
            </p>
            <button
              id="disputar-gp-btn"
              className="f1-btn f1-btn-primary"
              onClick={handleSimulateQualy}
              style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}
            >
              Disputar Fin de Semana
            </button>
          </div>
        )}

        {/* STAGE 2: QUALY GRID */}
        {stage === 'qualy_finished' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>
                Parrilla de Salida Oficial (Qualy)
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Posiciones 1 a 20 definidas
              </span>
            </div>

            <div className="f1-card" style={{ padding: '0.5rem 0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1.25rem' }}>POS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>PILOTO</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ESCUDERÍA</th>
                    <th style={{ padding: '0.75rem 1rem' }}>TIEMPO</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>DIFERENCIA</th>
                  </tr>
                </thead>
                <tbody>
                  {qualyResults.map((entry) => {
                    const driver = driverMap.get(entry.driverId);
                    const team = teamMap.get(entry.teamId);
                    const isPlayer = entry.teamId === gameState.playerTeamId;

                    return (
                      <tr
                        key={entry.driverId}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isPlayer ? 'rgba(225, 6, 0, 0.08)' : 'transparent',
                          fontWeight: isPlayer ? 700 : 400,
                        }}
                      >
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: entry.position === 1 ? 'var(--accent-gold)' : 'var(--text-main)' }}>
                          {entry.position}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {driver?.name} {isPlayer && <span className="f1-badge f1-badge-red" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>TU COCHE</span>}
                          {entry.hasIncident && (
                            <span
                              className="f1-badge"
                              style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.625rem',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                              }}
                              title={entry.incidentReason}
                            >
                              Incidente Qualy
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          {team?.name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-family-mono)' }}>
                          {entry.lapTimeSeconds.toFixed(3)}s
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontFamily: 'var(--font-family-mono)', color: entry.position === 1 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                          {entry.timeGap}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAGE 3: RACE RESULTS */}
        {stage === 'race_finished' && (
          <div>
            {/* Podium Bar */}
            {raceResults.length >= 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {/* 2nd place */}
                <div className="f1-card" style={{ textAlign: 'center', borderColor: '#a0aec0', order: 1 }}>
                  <span className="f1-badge" style={{ background: '#718096', color: '#fff', marginBottom: '0.5rem' }}>2º PUESTO</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{driverMap.get(raceResults[1].driverId)?.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{teamMap.get(raceResults[1].teamId)?.name}</p>
                  <strong style={{ color: 'var(--accent-gold)', marginTop: '0.5rem', display: 'block' }}>+18 Puntos</strong>
                </div>

                {/* 1st place */}
                <div className="f1-card" style={{ textAlign: 'center', borderColor: 'var(--accent-gold)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)', order: 2 }}>
                  <span className="f1-badge f1-badge-gold" style={{ marginBottom: '0.5rem' }}>1º GANADOR</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{driverMap.get(raceResults[0].driverId)?.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{teamMap.get(raceResults[0].teamId)?.name}</p>
                  <strong style={{ color: 'var(--accent-gold)', marginTop: '0.5rem', display: 'block', fontSize: '1.125rem' }}>+25 Puntos</strong>
                </div>

                {/* 3rd place */}
                <div className="f1-card" style={{ textAlign: 'center', borderColor: '#cd7f32', order: 3 }}>
                  <span className="f1-badge" style={{ background: '#b7791f', color: '#fff', marginBottom: '0.5rem' }}>3º PUESTO</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{driverMap.get(raceResults[2].driverId)?.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{teamMap.get(raceResults[2].teamId)?.name}</p>
                  <strong style={{ color: 'var(--accent-gold)', marginTop: '0.5rem', display: 'block' }}>+15 Puntos</strong>
                </div>
              </div>
            )}

            {/* Bankruptcy Game Over Banner (AC-02.4) */}
            {gameState.isBankrupt && (
              <div
                id="bankruptcy-game-over-banner"
                className="f1-card"
                style={{
                  marginBottom: '2rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'var(--accent-red)',
                  borderWidth: '2px',
                  textAlign: 'center',
                  padding: '2.5rem 2rem',
                }}
              >
                <div className="f1-badge f1-badge-red" style={{ fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                  GAME OVER — BANCARROTA TÉCNICA
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#ff4d4d' }}>
                  Quiebra Financiera Declarada
                </h2>
                <p style={{ color: 'var(--text-main)', maxWidth: '650px', margin: '0 auto 1.5rem', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  La deuda acumulada (${((gameState.bankruptcyDetails?.debt ?? 0) / 1000000).toFixed(2)}M) ha superado el límite máximo reglamentario permitido (${((gameState.bankruptcyDetails?.maxAllowedDebt ?? 0) / 1000000).toFixed(2)}M). La junta directiva y la FIA han intervenido la escudería, declarando el fin de la trayectoria deportiva.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    id="restart-new-game-btn"
                    className="f1-btn f1-btn-primary"
                    onClick={() => router.push('/new-game')}
                  >
                    Comenzar Nueva Partida
                  </button>
                  <button
                    id="return-home-btn"
                    className="f1-btn f1-btn-secondary"
                    onClick={() => router.push('/')}
                  >
                    Menú Principal
                  </button>
                </div>
              </div>
            )}

            {/* Financial summary breakdown card */}
            {playerTeam && gameState.lastRaceResult?.playerFinancials && (
              <div className="f1-card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.6875rem' }}>
                      Liquidación Financiera Oficial
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                      Balance Económico del GP — {playerTeam.name}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Saldo en Cuenta Actual
                    </span>
                    <strong style={{ fontSize: '1.35rem', color: playerTeam.budget >= 0 ? 'var(--accent-green)' : '#f87171' }}>
                      ${(playerTeam.budget / 1000000).toFixed(2)}M
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>INGRESOS PATROCINIO</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span>Fijo:</span>
                      <strong>+${(gameState.lastRaceResult.playerFinancials.baseSponsorIncome / 1000000).toFixed(2)}M</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bonus {gameState.lastRaceResult.playerFinancials.bonusAchieved ? '✓' : '✗'}:</span>
                      <strong style={{ color: gameState.lastRaceResult.playerFinancials.bonusAchieved ? 'var(--accent-green)' : 'var(--text-dim)' }}>
                        {gameState.lastRaceResult.playerFinancials.bonusAchieved
                          ? `+$${(gameState.lastRaceResult.playerFinancials.bonusSponsorIncome / 1000000).toFixed(2)}M`
                          : '$0.00M'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>GASTOS OPERATIVOS</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span>Salarios:</span>
                      <strong style={{ color: '#f87171' }}>-${(gameState.lastRaceResult.playerFinancials.salariesCost / 1000000).toFixed(2)}M</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Mantenimiento:</span>
                      <strong style={{ color: '#f87171' }}>-${(gameState.lastRaceResult.playerFinancials.maintenanceCost / 1000000).toFixed(2)}M</strong>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>REPARACIÓN POR DNF</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span>Sanción daños:</span>
                      <strong style={{ color: gameState.lastRaceResult.playerFinancials.dnfRepairCost > 0 ? '#f87171' : 'var(--text-muted)' }}>
                        {gameState.lastRaceResult.playerFinancials.dnfRepairCost > 0
                          ? `-$${(gameState.lastRaceResult.playerFinancials.dnfRepairCost / 1000000).toFixed(2)}M`
                          : '$0.00M'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Balance neto GP:</span>
                      <strong style={{ color: gameState.lastRaceResult.playerFinancials.netIncome >= 0 ? 'var(--accent-green)' : '#f87171' }}>
                        {gameState.lastRaceResult.playerFinancials.netIncome >= 0 ? '+' : ''}
                        ${(gameState.lastRaceResult.playerFinancials.netIncome / 1000000).toFixed(2)}M
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Race Table 1 to 20 */}
            <div className="f1-card" style={{ padding: '0.5rem 0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1.25rem' }}>POS</th>
                    <th style={{ padding: '0.75rem 1rem' }}>PILOTO</th>
                    <th style={{ padding: '0.75rem 1rem' }}>ESCUDERÍA</th>
                    <th style={{ padding: '0.75rem 1rem' }}>SALIDA</th>
                    <th style={{ padding: '0.75rem 1rem' }}>DIFERENCIA</th>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>PUNTOS</th>
                  </tr>
                </thead>
                <tbody>
                  {raceResults.map((entry) => {
                    const driver = driverMap.get(entry.driverId);
                    const team = teamMap.get(entry.teamId);
                    const isPlayer = entry.teamId === gameState.playerTeamId;
                    const posDelta = entry.gridPosition - entry.finishPosition;

                    return (
                      <tr
                        key={entry.driverId}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isPlayer ? 'rgba(225, 6, 0, 0.08)' : 'transparent',
                          fontWeight: isPlayer ? 700 : 400,
                        }}
                      >
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: entry.isDnf ? 'var(--text-dim)' : entry.finishPosition <= 3 ? 'var(--accent-gold)' : 'var(--text-main)' }}>
                          {entry.isDnf ? 'DNF' : entry.finishPosition}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {driver?.name} {isPlayer && <span className="f1-badge f1-badge-red" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>TU COCHE</span>}
                          {entry.isDnf && entry.dnfReason && (
                            <span
                              className="f1-badge"
                              style={{
                                marginLeft: '0.5rem',
                                fontSize: '0.6875rem',
                                background: entry.dnfReason === 'Fallo mecánico' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: entry.dnfReason === 'Fallo mecánico' ? '#f87171' : '#fbbf24',
                                border: `1px solid ${entry.dnfReason === 'Fallo mecánico' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                              }}
                            >
                              {entry.dnfReason}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          {team?.name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
                          {entry.isDnf ? (
                            <span style={{ color: 'var(--text-dim)' }}>P{entry.gridPosition} (Retirado)</span>
                          ) : (
                            <>
                              P{entry.gridPosition}{' '}
                              {posDelta > 0 && <span style={{ color: 'var(--accent-green)' }}>(+{posDelta})</span>}
                              {posDelta < 0 && <span style={{ color: 'var(--accent-red)' }}>({posDelta})</span>}
                              {posDelta === 0 && <span style={{ color: 'var(--text-dim)' }}>(=)</span>}
                            </>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-family-mono)', color: entry.isDnf ? '#f87171' : 'var(--text-muted)', fontWeight: entry.isDnf ? 700 : 400 }}>
                          {entry.timeGap}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 800, color: entry.points > 0 ? 'var(--accent-gold)' : 'var(--text-dim)' }}>
                          {entry.points > 0 ? `+${entry.points}` : '0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
