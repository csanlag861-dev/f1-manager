'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';

type StandingsTab = 'drivers' | 'constructors';

export default function StandingsPage() {
  const router = useRouter();
  const gameState = useGameStore((state) => state.gameState);
  const loadGame = useGameStore((state) => state.loadGame);
  const [activeTab, setActiveTab] = useState<StandingsTab>('drivers');
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
        <p style={{ color: 'var(--text-muted)' }}>Cargando clasificaciones mundiales...</p>
      </div>
    );
  }

  const driverMap = new Map(gameState.drivers.map((d) => [d.id, d]));
  const teamMap = new Map(gameState.teams.map((t) => [t.id, t]));
  const playerTeam = teamMap.get(gameState.playerTeamId);
  const playerDriverIds = playerTeam ? [playerTeam.driverIds[0], playerTeam.driverIds[1]] : [];

  const { driverStandings, constructorStandings, seasonNumber, currentRaceIndex } = gameState.season;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        {/* Title Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="f1-badge f1-badge-gold" style={{ marginBottom: '0.5rem' }}>
              Temporada {seasonNumber} — {currentRaceIndex} / 24 Carreras Disputadas
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase' }}>
              Clasificación del Campeonato Mundial
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Criterios de desempate oficiales: 1º Puntos totales, 2º Victorias (1º), 3º Podios (Top 3).
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              id="tab-drivers"
              onClick={() => setActiveTab('drivers')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.875rem',
                background: activeTab === 'drivers' ? 'var(--accent-red)' : 'transparent',
                color: activeTab === 'drivers' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              Mundial de Pilotos
            </button>
            <button
              id="tab-constructors"
              onClick={() => setActiveTab('constructors')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.875rem',
                background: activeTab === 'constructors' ? 'var(--accent-red)' : 'transparent',
                color: activeTab === 'constructors' ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              Mundial de Constructores
            </button>
          </div>
        </div>

        {/* TAB 1: DRIVER STANDINGS */}
        {activeTab === 'drivers' && (
          <div className="f1-card" style={{ padding: '0.5rem 0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', width: '60px' }}>POS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>PILOTO</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ESCUDERÍA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '90px' }}>VICTORIAS</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '90px' }}>PODIOS</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', width: '100px' }}>PUNTOS</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.map((entry, index) => {
                  const position = index + 1;
                  const driver = driverMap.get(entry.driverId);
                  const team = driver?.teamId ? teamMap.get(driver.teamId) : undefined;
                  const isPlayerDriver = playerDriverIds.includes(entry.driverId);

                  return (
                    <tr
                      key={entry.driverId}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isPlayerDriver ? 'rgba(225, 6, 0, 0.08)' : 'transparent',
                        fontWeight: isPlayerDriver ? 700 : 400,
                      }}
                    >
                      <td style={{
                        padding: '0.75rem 1.25rem',
                        fontWeight: 800,
                        color: position === 1 ? 'var(--accent-gold)' : position <= 3 ? 'var(--text-main)' : 'var(--text-muted)',
                      }}>
                        {position === 1 ? (
                          <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.6875rem' }}>1º LÍDER</span>
                        ) : (
                          `${position}º`
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {driver?.name}{' '}
                        {isPlayerDriver && (
                          <span className="f1-badge f1-badge-red" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>
                            TU COCHE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {team?.name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'var(--font-family-mono)' }}>
                        {entry.wins}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'var(--font-family-mono)' }}>
                        {entry.podiums}
                      </td>
                      <td style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: 'right',
                        fontWeight: 900,
                        fontSize: '1rem',
                        color: entry.points > 0 ? 'var(--accent-gold)' : 'var(--text-dim)',
                        fontFamily: 'var(--font-family-mono)',
                      }}>
                        {entry.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CONSTRUCTOR STANDINGS */}
        {activeTab === 'constructors' && (
          <div className="f1-card" style={{ padding: '0.5rem 0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', width: '60px' }}>POS</th>
                  <th style={{ padding: '0.75rem 1rem' }}>ESCUDERÍA</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '90px' }}>VICTORIAS</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '90px' }}>PODIOS</th>
                  <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', width: '100px' }}>PUNTOS</th>
                </tr>
              </thead>
              <tbody>
                {constructorStandings.map((entry, index) => {
                  const position = index + 1;
                  const team = teamMap.get(entry.teamId);
                  const isPlayerTeam = entry.teamId === gameState.playerTeamId;

                  return (
                    <tr
                      key={entry.teamId}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isPlayerTeam ? 'rgba(225, 6, 0, 0.08)' : 'transparent',
                        fontWeight: isPlayerTeam ? 700 : 400,
                      }}
                    >
                      <td style={{
                        padding: '0.75rem 1.25rem',
                        fontWeight: 800,
                        color: position === 1 ? 'var(--accent-gold)' : position <= 3 ? 'var(--text-main)' : 'var(--text-muted)',
                      }}>
                        {position === 1 ? (
                          <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.6875rem' }}>1º LÍDER</span>
                        ) : (
                          `${position}º`
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {team?.name}{' '}
                        {isPlayerTeam && (
                          <span className="f1-badge f1-badge-red" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>
                            TU EQUIPO
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'var(--font-family-mono)' }}>
                        {entry.wins}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontFamily: 'var(--font-family-mono)' }}>
                        {entry.podiums}
                      </td>
                      <td style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: 'right',
                        fontWeight: 900,
                        fontSize: '1rem',
                        color: entry.points > 0 ? 'var(--accent-gold)' : 'var(--text-dim)',
                        fontFamily: 'var(--font-family-mono)',
                      }}>
                        {entry.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
