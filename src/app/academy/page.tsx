'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';
import { YouthDriver } from '../../domain/models';
import { calculateTrainingGain } from '../../domain/academy';

export default function AcademyPage() {
  const router = useRouter();
  const gameState = useGameStore((state) => state.gameState);
  const loadGame = useGameStore((state) => state.loadGame);
  const signYouthDriver = useGameStore((state) => state.signYouthDriver);
  const releaseYouthDriver = useGameStore((state) => state.releaseYouthDriver);
  const promoteYouthDriver = useGameStore((state) => state.promoteYouthDriver);

  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Promotion modal state
  const [promotedCandidate, setPromotedCandidate] = useState<YouthDriver | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<1 | 2>(1);

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
        <p style={{ color: 'var(--text-muted)' }}>Cargando academia de jóvenes promesas...</p>
      </div>
    );
  }

  const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
  if (!playerTeam) return null;

  const driverMap = new Map(gameState.drivers.map((d) => [d.id, d]));
  const seat1Driver = playerTeam.driverIds[0] ? driverMap.get(playerTeam.driverIds[0]) : null;
  const seat2Driver = playerTeam.driverIds[1] ? driverMap.get(playerTeam.driverIds[1]) : null;

  const seat1IsVacant = !playerTeam.driverIds[0] || playerTeam.driverIds[0].trim() === '';
  const seat2IsVacant = !playerTeam.driverIds[1] || playerTeam.driverIds[1].trim() === '';
  const hasAnyVacancy = seat1IsVacant || seat2IsVacant;

  const teamYouthDrivers = gameState.youthDrivers.filter((y) => playerTeam.youthDriverIds.includes(y.id));
  const availableScouts = gameState.youthDrivers.filter((y) => y.teamId === null);
  const isAcademyFull = teamYouthDrivers.length >= 2;

  const handleSign = async (youth: YouthDriver) => {
    const ok = await signYouthDriver(youth.id);
    if (ok) {
      setActionMessage({
        text: `¡Fichaje completado! ${youth.name} se incorpora a la academia de ${playerTeam.name}.`,
        type: 'success',
      });
    } else {
      setActionMessage({
        text: 'No fue posible incorporar a la joven promesa.',
        type: 'error',
      });
    }
  };

  const handleRelease = async (youthId: string, name: string) => {
    const ok = await releaseYouthDriver(youthId);
    if (ok) {
      setActionMessage({
        text: `${name} ha sido liberado de la academia. Se ha abierto una plaza libre.`,
        type: 'success',
      });
    } else {
      setActionMessage({
        text: 'Error al liberar al piloto de la academia.',
        type: 'error',
      });
    }
  };

  const handlePromote = async () => {
    if (!promotedCandidate) return;
    const ok = await promoteYouthDriver(promotedCandidate.id, selectedSeat, 2_000_000, 2);
    if (ok) {
      setActionMessage({
        text: `¡Promoción histórica! ${promotedCandidate.name} asciende al equipo oficial como piloto del Asiento ${selectedSeat}.`,
        type: 'success',
      });
      setPromotedCandidate(null);
    } else {
      setActionMessage({
        text: 'Error al promocionar al piloto. Verifica que el asiento esté vacante.',
        type: 'error',
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Title & Overview Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="f1-badge f1-badge-gold" style={{ marginBottom: '0.5rem' }}>
              Cantera de Talentos y Desarrollo a Largo Plazo
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase' }}>
              Academia de Jóvenes Promesas
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Capta promesas de entre 16 y 19 años con alto potencial. Entrénalos con el Simulador y promuévelos al equipo oficial ante vacantes.
            </p>
          </div>

          {/* Simulator & Slots Status Card */}
          <div style={{
            background: 'var(--surface-raised)',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '1.5rem',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Plazas Academia</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isAcademyFull ? 'var(--accent-red)' : '#10B981' }}>
                {teamYouthDrivers.length} / 2
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nivel Simulador</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                Nivel {playerTeam.simulatorLevel} / 5
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Salarios Academia</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>
                $0 / año
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cubierto por Simulador</div>
            </div>
          </div>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div style={{
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionMessage.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: actionMessage.type === 'success' ? '#10B981' : '#EF4444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* SECTION 1: ACTIVE ACADEMY DRIVERS */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>
              Pilotos en la Academia de {playerTeam.name} ({teamYouthDrivers.length} / 2)
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Progresión anual automática impulsada por el Simulador Nivel {playerTeam.simulatorLevel}
            </span>
          </div>

          {teamYouthDrivers.length === 0 ? (
            <div style={{
              background: 'var(--surface-raised)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '10px',
              padding: '2.5rem',
              textAlign: 'center',
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Actualmente no tienes ninguna joven promesa en tu academia.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Dispones de 2 plazas libres. Consulta la lista de jóvenes talentos disponibles abajo para incorporar pilotos a tu cantera.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {teamYouthDrivers.map((youth) => {
                const estGainPace = calculateTrainingGain(youth.pace, youth.potential, playerTeam.simulatorLevel);
                const estGainCons = calculateTrainingGain(youth.consistency, youth.potential, playerTeam.simulatorLevel);

                return (
                  <div
                    key={youth.id}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '2px solid var(--accent-gold)',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {/* Name & Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{youth.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {youth.nationality} • {youth.age} años
                          </div>
                        </div>
                        <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.7rem' }}>
                          Cantera Oficial
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.5rem',
                        background: 'var(--surface-sunken)',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ritmo</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-red)' }}>{youth.pace}</div>
                          <div style={{ fontSize: '0.65rem', color: '#10B981' }}>+{estGainPace}/año</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consist.</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{youth.consistency}</div>
                          <div style={{ fontSize: '0.65rem', color: '#10B981' }}>+{estGainCons}/año</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Potencial</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{youth.potential}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Moral</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{youth.morale}</div>
                        </div>
                      </div>

                      {/* Maintenance info */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Entrenamiento diario activo en el simulador. Coste salarial absorbido al 100%.
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => {
                          setPromotedCandidate(youth);
                          setSelectedSeat(seat1IsVacant ? 1 : 2);
                        }}
                        className="f1-btn f1-btn-primary"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                      >
                        Promocionar a Titular
                      </button>
                      <button
                        onClick={() => handleRelease(youth.id, youth.name)}
                        className="f1-btn f1-btn-secondary"
                        style={{ fontSize: '0.85rem' }}
                      >
                        Liberar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: PROSPECTIVE TALENT POOL (AVAILABLE FOR SIGNING) */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>
                Bolsa Anual de Jóvenes Talentos Ficticios
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Jóvenes pilotos descubiertos por la red de ojeadores. Se renuevan al inicio de cada temporada.
              </p>
            </div>
            {isAcademyFull && (
              <span className="f1-badge f1-badge-red" style={{ fontSize: '0.75rem' }}>
                Academia llena (2/2) — Libera una plaza para fichar
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {availableScouts.map((scout) => {
              const estGainPace = calculateTrainingGain(scout.pace, scout.potential, playerTeam.simulatorLevel);
              const estGainCons = calculateTrainingGain(scout.consistency, scout.potential, playerTeam.simulatorLevel);

              return (
                <div
                  key={scout.id}
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>{scout.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {scout.nationality} • {scout.age} años
                        </div>
                      </div>
                      <span className="f1-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.7rem' }}>
                        Libre
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.5rem',
                      background: 'var(--surface-sunken)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ritmo</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-red)' }}>{scout.pace}</div>
                        <div style={{ fontSize: '0.65rem', color: '#10B981' }}>+{estGainPace}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consist.</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{scout.consistency}</div>
                        <div style={{ fontSize: '0.65rem', color: '#10B981' }}>+{estGainCons}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Potencial</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{scout.potential}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Moral</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{scout.morale}</div>
                      </div>
                    </div>
                  </div>

                  {/* Sign Action Button */}
                  <button
                    onClick={() => handleSign(scout)}
                    disabled={isAcademyFull}
                    className="f1-btn f1-btn-primary"
                    style={{
                      width: '100%',
                      fontSize: '0.85rem',
                      opacity: isAcademyFull ? 0.5 : 1,
                      cursor: isAcademyFull ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isAcademyFull ? 'Academia Llena (Máx 2)' : 'Fichar para la Academia ($0 Sueldo)'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* PROMOTION MODAL */}
        {promotedCandidate && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}>
            <div style={{
              background: 'var(--surface-modal, #131722)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
            }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                Promocionar a Titular: {promotedCandidate.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                El piloto ascenderá al equipo oficial de Fórmula 1, liberando automáticamente su plaza en la academia.
              </p>

              {/* Vacancy & Seat Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Selecciona el Asiento Vacante en {playerTeam.name}:
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setSelectedSeat(1)}
                    disabled={!seat1IsVacant}
                    className="f1-btn"
                    style={{
                      flex: 1,
                      background: selectedSeat === 1 ? 'var(--accent-red)' : 'var(--surface-sunken)',
                      color: '#FFFFFF',
                      border: '1px solid var(--border-strong)',
                      opacity: seat1IsVacant ? 1 : 0.4,
                      cursor: seat1IsVacant ? 'pointer' : 'not-allowed',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                    }}
                  >
                    Asiento 1 {seat1IsVacant ? '(Vacante ✓)' : `(${seat1Driver?.name || 'Ocupado'})`}
                  </button>
                  <button
                    onClick={() => setSelectedSeat(2)}
                    disabled={!seat2IsVacant}
                    className="f1-btn"
                    style={{
                      flex: 1,
                      background: selectedSeat === 2 ? 'var(--accent-red)' : 'var(--surface-sunken)',
                      color: '#FFFFFF',
                      border: '1px solid var(--border-strong)',
                      opacity: seat2IsVacant ? 1 : 0.4,
                      cursor: seat2IsVacant ? 'pointer' : 'not-allowed',
                      padding: '0.65rem 0.75rem',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                    }}
                  >
                    Asiento 2 {seat2IsVacant ? '(Vacante ✓)' : `(${seat2Driver?.name || 'Ocupado'})`}
                  </button>
                </div>
              </div>

              {/* Warning if no vacancy */}
              {!hasAnyVacancy && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  marginBottom: '1rem',
                }}>
                  ⚠ Ambos asientos del equipo oficial están ocupados por pilotos titulares con contrato. Para promocionar a una promesa debes rescindir el contrato de un titular o no renovarlo.
                </div>
              )}

              {/* Novice Contract Terms */}
              <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contrato Novato Oficial:</span>
                  <strong>2 Temporadas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Salario de Entrada F1:</span>
                  <strong style={{ color: '#10B981' }}>$2.00M / año</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Efecto en la Academia:</span>
                  <span style={{ color: '#10B981' }}>Libera 1 plaza inmediatamente</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setPromotedCandidate(null)}
                  className="f1-btn f1-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePromote}
                  disabled={!hasAnyVacancy || (selectedSeat === 1 && !seat1IsVacant) || (selectedSeat === 2 && !seat2IsVacant)}
                  className="f1-btn f1-btn-primary"
                  style={{
                    opacity: hasAnyVacancy ? 1 : 0.5,
                  }}
                >
                  Confirmar Promoción a Titular
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
