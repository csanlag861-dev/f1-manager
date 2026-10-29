'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';
import { Driver, ChiefEngineer } from '../../domain/models';
import {
  calculateDriverRequiredReputation,
  calculateEngineerRequiredReputation,
  evaluateHiringEligibility,
  canRenewContract,
} from '../../domain/market';

type MarketTab = 'drivers' | 'engineers';
type FilterStatus = 'all' | 'free_agents' | 'contracted';

export default function MarketPage() {
  const router = useRouter();
  const gameState = useGameStore((state) => state.gameState);
  const loadGame = useGameStore((state) => state.loadGame);
  const hireDriver = useGameStore((state) => state.hireDriver);
  const hireChiefEngineer = useGameStore((state) => state.hireChiefEngineer);
  const renewContract = useGameStore((state) => state.renewContract);

  const [activeTab, setActiveTab] = useState<MarketTab>('drivers');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Hiring modal state
  const [hiringDriverCandidate, setHiringDriverCandidate] = useState<Driver | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<1 | 2>(1);
  const [hiringEngineerCandidate, setHiringEngineerCandidate] = useState<ChiefEngineer | null>(null);

  // Status/feedback messages
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
        <p style={{ color: 'var(--text-muted)' }}>Cargando mercado de personal de Fórmula 1...</p>
      </div>
    );
  }

  const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
  if (!playerTeam) {
    return null;
  }

  const teamMap = new Map(gameState.teams.map((t) => [t.id, t]));
  const driverMap = new Map(gameState.drivers.map((d) => [d.id, d]));
  const playerDriver1 = driverMap.get(playerTeam.driverIds[0]);
  const playerDriver2 = driverMap.get(playerTeam.driverIds[1]);
  const playerEngineer = gameState.chiefEngineers.find((e) => e.id === playerTeam.chiefEngineerId);

  // Filter drivers
  const filteredDrivers = gameState.drivers.filter((d) => {
    if (filterStatus === 'free_agents') return d.teamId === null;
    if (filterStatus === 'contracted') return d.teamId !== null;
    return true;
  });

  // Filter engineers
  const filteredEngineers = gameState.chiefEngineers.filter((e) => {
    if (filterStatus === 'free_agents') return e.teamId === null;
    if (filterStatus === 'contracted') return e.teamId !== null;
    return true;
  });

  const handleHireDriver = async () => {
    if (!hiringDriverCandidate) return;
    const ok = await hireDriver(hiringDriverCandidate.id, selectedSeat, 2);
    if (ok) {
      setActionMessage({
        text: `¡Fichaje exitoso! ${hiringDriverCandidate.name} se incorpora como piloto del Asiento ${selectedSeat}.`,
        type: 'success',
      });
      setHiringDriverCandidate(null);
    } else {
      setActionMessage({
        text: 'Error al realizar el fichaje. Revisa el presupuesto o las condiciones.',
        type: 'error',
      });
    }
  };

  const handleHireEngineer = async () => {
    if (!hiringEngineerCandidate) return;
    const ok = await hireChiefEngineer(hiringEngineerCandidate.id, 2);
    if (ok) {
      setActionMessage({
        text: `¡Fichaje exitoso! ${hiringEngineerCandidate.name} es el nuevo Jefe de Ingenieros.`,
        type: 'success',
      });
      setHiringEngineerCandidate(null);
    } else {
      setActionMessage({
        text: 'Error al contratar al jefe de ingenieros.',
        type: 'error',
      });
    }
  };

  const handleRenew = async (employeeId: string, isDriver: boolean) => {
    const ok = await renewContract(employeeId, isDriver, 2);
    if (ok) {
      setActionMessage({
        text: '¡Contrato renovado con éxito por 2 temporadas adicionales (+5% salario)!',
        type: 'success',
      });
    } else {
      setActionMessage({
        text: 'No fue posible renovar el contrato.',
        type: 'error',
      });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Title Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="f1-badge f1-badge-gold" style={{ marginBottom: '0.5rem' }}>
              Mercado Oficial FIA — Temporada {gameState.season.seasonNumber}
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase' }}>
              Mercado de Personal y Fichajes
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Negocia con pilotos y jefes de ingenieros. Respeta los requisitos de reputación y las cláusulas de rescisión.
            </p>
          </div>

          {/* Player Team Prestige & Budget Summary */}
          <div style={{
            background: 'var(--surface-raised)',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '1.5rem',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tu Escudería</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{playerTeam.name}</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reputación</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                {playerTeam.reputation} / 100
              </div>
            </div>
            <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Presupuesto</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981' }}>
                ${(playerTeam.budget / 1_000_000).toFixed(2)}M
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
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

        {/* Current Team Roster Summary */}
        <section style={{
          background: 'var(--surface-raised)',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Plantilla Actual de {playerTeam.name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Seat 1 */}
            <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 800 }}>ASIENTO 1</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.25rem 0' }}>{playerDriver1?.name || 'Vacante'}</div>
              {playerDriver1 && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Ritmo: <strong style={{ color: 'var(--text-main)' }}>{playerDriver1.pace}</strong> | Cons: <strong style={{ color: 'var(--text-main)' }}>{playerDriver1.consistency}</strong> | Moral: <strong style={{ color: 'var(--text-main)' }}>{playerDriver1.morale}</strong>
                  <br />
                  Sueldo: ${(playerDriver1.salary / 1_000_000).toFixed(1)}M/año | Contrato: {playerDriver1.contractYears} año(s)
                  <div style={{ marginTop: '0.5rem' }}>
                    {canRenewContract(playerDriver1).canRenew ? (
                      <button
                        onClick={() => handleRenew(playerDriver1.id, true)}
                        className="f1-btn f1-btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Renovar (+2 años, +5%)
                      </button>
                    ) : (
                      <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.7rem' }}>
                        Contrato en vigor (&gt;1 año)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Seat 2 */}
            <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', fontWeight: 800 }}>ASIENTO 2</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.25rem 0' }}>{playerDriver2?.name || 'Vacante'}</div>
              {playerDriver2 && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Ritmo: <strong style={{ color: 'var(--text-main)' }}>{playerDriver2.pace}</strong> | Cons: <strong style={{ color: 'var(--text-main)' }}>{playerDriver2.consistency}</strong> | Moral: <strong style={{ color: 'var(--text-main)' }}>{playerDriver2.morale}</strong>
                  <br />
                  Sueldo: ${(playerDriver2.salary / 1_000_000).toFixed(1)}M/año | Contrato: {playerDriver2.contractYears} año(s)
                  <div style={{ marginTop: '0.5rem' }}>
                    {canRenewContract(playerDriver2).canRenew ? (
                      <button
                        onClick={() => handleRenew(playerDriver2.id, true)}
                        className="f1-btn f1-btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Renovar (+2 años, +5%)
                      </button>
                    ) : (
                      <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.7rem' }}>
                        Contrato en vigor (&gt;1 año)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chief Engineer */}
            <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 800 }}>JEFE DE INGENIEROS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.25rem 0' }}>{playerEngineer?.name || 'Vacante'}</div>
              {playerEngineer && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Efic. I+D: <strong style={{ color: 'var(--text-main)' }}>{playerEngineer.developmentEfficiency}</strong> | Setup: <strong style={{ color: 'var(--text-main)' }}>{playerEngineer.setupPerformance}</strong> | Moral: <strong style={{ color: 'var(--text-main)' }}>{playerEngineer.morale}</strong>
                  <br />
                  Sueldo: ${(playerEngineer.salary / 1_000_000).toFixed(1)}M/año | Contrato: {playerEngineer.contractYears} año(s)
                  <div style={{ marginTop: '0.5rem' }}>
                    {canRenewContract(playerEngineer).canRenew ? (
                      <button
                        onClick={() => handleRenew(playerEngineer.id, false)}
                        className="f1-btn f1-btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Renovar (+2 años, +5%)
                      </button>
                    ) : (
                      <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.7rem' }}>
                        Contrato en vigor (&gt;1 año)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Market Controls & Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {/* Main Category Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-raised)', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`f1-btn ${activeTab === 'drivers' ? 'f1-btn-primary' : 'f1-btn-secondary'}`}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
            >
              Pilotos ({gameState.drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('engineers')}
              className={`f1-btn ${activeTab === 'engineers' ? 'f1-btn-primary' : 'f1-btn-secondary'}`}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
            >
              Jefes de Ingenieros ({gameState.chiefEngineers.length})
            </button>
          </div>

          {/* Filter Status Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Filtro:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className="f1-badge"
              style={{
                background: filterStatus === 'all' ? 'var(--accent-red)' : 'var(--surface-raised)',
                color: '#FFFFFF',
                cursor: 'pointer',
                border: filterStatus === 'all' ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('free_agents')}
              className="f1-badge"
              style={{
                background: filterStatus === 'free_agents' ? '#10B981' : 'var(--surface-raised)',
                color: '#FFFFFF',
                cursor: 'pointer',
                border: filterStatus === 'free_agents' ? '1px solid #10B981' : '1px solid var(--border-subtle)',
              }}
            >
              Agentes Libres
            </button>
            <button
              onClick={() => setFilterStatus('contracted')}
              className="f1-badge"
              style={{
                background: filterStatus === 'contracted' ? 'var(--accent-gold)' : 'var(--surface-raised)',
                color: '#FFFFFF',
                cursor: 'pointer',
                border: filterStatus === 'contracted' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              }}
            >
              Con Contrato
            </button>
          </div>
        </div>

        {/* Tab 1: DRIVERS LIST */}
        {activeTab === 'drivers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {filteredDrivers.map((driver) => {
              const reqRep = calculateDriverRequiredReputation(driver);
              const repSatisfied = playerTeam.reputation >= reqRep;
              const isPlayerDriver = driver.teamId === playerTeam.id;
              const currentTeam = driver.teamId ? teamMap.get(driver.teamId) : null;

              return (
                <div
                  key={driver.id}
                  style={{
                    background: 'var(--surface-raised)',
                    borderRadius: '10px',
                    border: isPlayerDriver ? '2px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* Header: Name, Country, Team */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>{driver.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {currentTeam ? currentTeam.name : <span style={{ color: '#10B981', fontWeight: 700 }}>Agente Libre</span>}
                        </div>
                      </div>
                      {isPlayerDriver ? (
                        <span className="f1-badge f1-badge-red" style={{ fontSize: '0.7rem' }}>En tu equipo</span>
                      ) : !currentTeam ? (
                        <span className="f1-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontSize: '0.7rem' }}>Libre</span>
                      ) : (
                        <span className="f1-badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Contrato {driver.contractYears}a</span>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem', background: 'var(--surface-sunken)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ritmo</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-red)' }}>{driver.pace}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consistencia</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{driver.consistency}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Moral</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{driver.morale}</div>
                      </div>
                    </div>

                    {/* Salary & Prestige Check */}
                    <div style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sueldo Anual:</span>
                        <strong style={{ color: '#10B981' }}>${(driver.salary / 1_000_000).toFixed(1)}M / año</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Reputación requerida:</span>
                        <strong style={{ color: repSatisfied ? '#10B981' : '#EF4444' }}>
                          {reqRep} / 100 {repSatisfied ? '✓' : `(Tu equipo: ${playerTeam.reputation})`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isPlayerDriver ? (
                      canRenewContract(driver).canRenew ? (
                        <button
                          onClick={() => handleRenew(driver.id, true)}
                          className="f1-btn f1-btn-secondary"
                          style={{ width: '100%', fontSize: '0.85rem', padding: '0.625rem 1rem' }}
                        >
                          Renovar Contrato (+2 años)
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Contrato vigente ({driver.contractYears} años)
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          setHiringDriverCandidate(driver);
                          setSelectedSeat(1);
                        }}
                        disabled={!repSatisfied}
                        className="f1-btn f1-btn-primary"
                        style={{
                          width: '100%',
                          fontSize: '0.85rem',
                          padding: '0.625rem 1rem',
                          opacity: repSatisfied ? 1 : 0.5,
                          cursor: repSatisfied ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {repSatisfied ? 'Iniciar Negociación de Fichaje' : `Rechaza negociar (Exige rep ${reqRep})`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: ENGINEERS LIST */}
        {activeTab === 'engineers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {filteredEngineers.map((eng) => {
              const reqRep = calculateEngineerRequiredReputation(eng);
              const repSatisfied = playerTeam.reputation >= reqRep;
              const isPlayerEng = eng.teamId === playerTeam.id;
              const currentTeam = eng.teamId ? teamMap.get(eng.teamId) : null;

              return (
                <div
                  key={eng.id}
                  style={{
                    background: 'var(--surface-raised)',
                    borderRadius: '10px',
                    border: isPlayerEng ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
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
                        <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>{eng.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {currentTeam ? currentTeam.name : <span style={{ color: '#10B981', fontWeight: 700 }}>Agente Libre</span>}
                        </div>
                      </div>
                      {isPlayerEng ? (
                        <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.7rem' }}>En tu equipo</span>
                      ) : !currentTeam ? (
                        <span className="f1-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontSize: '0.7rem' }}>Libre</span>
                      ) : (
                        <span className="f1-badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Contrato {eng.contractYears}a</span>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem', background: 'var(--surface-sunken)', padding: '0.75rem', borderRadius: '6px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Efic. I+D</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{eng.developmentEfficiency}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Setup</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>{eng.setupPerformance}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Moral</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-red)' }}>{eng.morale}</div>
                      </div>
                    </div>

                    {/* Salary & Prestige */}
                    <div style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Sueldo Anual:</span>
                        <strong style={{ color: '#10B981' }}>${(eng.salary / 1_000_000).toFixed(1)}M / año</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Reputación requerida:</span>
                        <strong style={{ color: repSatisfied ? '#10B981' : '#EF4444' }}>
                          {reqRep} / 100 {repSatisfied ? '✓' : `(Tu equipo: ${playerTeam.reputation})`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isPlayerEng ? (
                      canRenewContract(eng).canRenew ? (
                        <button
                          onClick={() => handleRenew(eng.id, false)}
                          className="f1-btn f1-btn-secondary"
                          style={{ width: '100%', fontSize: '0.85rem', padding: '0.625rem 1rem' }}
                        >
                          Renovar Contrato (+2 años)
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Contrato vigente ({eng.contractYears} años)
                        </div>
                      )
                    ) : (
                      <button
                        onClick={() => setHiringEngineerCandidate(eng)}
                        disabled={!repSatisfied}
                        className="f1-btn f1-btn-primary"
                        style={{
                          width: '100%',
                          fontSize: '0.85rem',
                          padding: '0.625rem 1rem',
                          opacity: repSatisfied ? 1 : 0.5,
                          cursor: repSatisfied ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {repSatisfied ? 'Contratar Jefe de Ingenieros' : `Rechaza negociar (Exige rep ${reqRep})`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: HIRE DRIVER CONFIRMATION & SEAT SELECTION */}
        {hiringDriverCandidate && (() => {
          const incumbent = selectedSeat === 1 ? playerDriver1 : playerDriver2;
          const eligibility = evaluateHiringEligibility(
            playerTeam,
            hiringDriverCandidate,
            incumbent?.salary ?? 0,
            incumbent?.contractYears ?? 0
          );

          return (
            <div
              id="hire-driver-modal-overlay"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '1rem',
              }}
            >
              <div
                id="hire-driver-modal-content"
                style={{
                  background: 'var(--surface-modal, #131722)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '520px',
                  width: '100%',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
                }}
              >
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>
                  Contrato de Piloto: {hiringDriverCandidate.name}
                </h2>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Selecciona el Asiento a reemplazar en {playerTeam.name}:
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedSeat(1)}
                      className={`f1-btn ${selectedSeat === 1 ? 'f1-btn-primary' : 'f1-btn-secondary'}`}
                      style={{
                        flex: 1,
                        fontSize: '0.8125rem',
                        padding: '0.625rem 0.75rem',
                      }}
                    >
                      Asiento 1 ({playerDriver1?.name || 'Vacante'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSeat(2)}
                      className={`f1-btn ${selectedSeat === 2 ? 'f1-btn-primary' : 'f1-btn-secondary'}`}
                      style={{
                        flex: 1,
                        fontSize: '0.8125rem',
                        padding: '0.625rem 0.75rem',
                      }}
                    >
                      Asiento 2 ({playerDriver2?.name || 'Vacante'})
                    </button>
                  </div>
                </div>

                {/* Financial breakdown */}
                <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sueldo del nuevo piloto (1º año):</span>
                    <strong>${(hiringDriverCandidate.salary / 1_000_000).toFixed(2)}M</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Indemnización piloto saliente:</span>
                    <strong style={{ color: eligibility.severancePay > 0 ? '#EF4444' : 'var(--text-main)' }}>
                      ${(eligibility.severancePay / 1_000_000).toFixed(2)}M
                    </strong>
                  </div>
                  {eligibility.severancePay > 0 && incumbent && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      (50% de ${(incumbent.salary / 1_000_000).toFixed(1)}M × {incumbent.contractYears} año(s) restante(s))
                    </div>
                  )}
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
                    <span>Coste Total Inmediato:</span>
                    <span style={{ color: eligibility.canHire ? '#10B981' : '#EF4444' }}>
                      ${(eligibility.totalFirstYearCost / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Presupuesto disponible:</span>
                    <span>${(playerTeam.budget / 1_000_000).toFixed(2)}M</span>
                  </div>
                </div>

                {!eligibility.canHire && (
                  <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    ⚠ {eligibility.reason}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setHiringDriverCandidate(null)}
                    className="f1-btn f1-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleHireDriver}
                    disabled={!eligibility.canHire}
                    className="f1-btn f1-btn-primary"
                  >
                    Confirmar Fichaje (2 Años)
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL: HIRE CHIEF ENGINEER CONFIRMATION */}
        {hiringEngineerCandidate && (() => {
          const eligibility = evaluateHiringEligibility(
            playerTeam,
            hiringEngineerCandidate,
            playerEngineer?.salary ?? 0,
            playerEngineer?.contractYears ?? 0
          );

          return (
            <div
              id="hire-engineer-modal-overlay"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                padding: '1rem',
              }}
            >
              <div
                id="hire-engineer-modal-content"
                style={{
                  background: 'var(--surface-modal, #131722)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '520px',
                  width: '100%',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
                }}
              >
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>
                  Contrato de Jefe de Ingenieros: {hiringEngineerCandidate.name}
                </h2>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Sustituirá al actual jefe de ingenieros ({playerEngineer?.name || 'Vacante'}), quien pasará a ser agente libre.
                </p>

                {/* Financial breakdown */}
                <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sueldo nuevo ingeniero (1º año):</span>
                    <strong>${(hiringEngineerCandidate.salary / 1_000_000).toFixed(2)}M</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Indemnización saliente:</span>
                    <strong style={{ color: eligibility.severancePay > 0 ? '#EF4444' : 'var(--text-main)' }}>
                      ${(eligibility.severancePay / 1_000_000).toFixed(2)}M
                    </strong>
                  </div>
                  {eligibility.severancePay > 0 && playerEngineer && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      (50% de ${(playerEngineer.salary / 1_000_000).toFixed(1)}M × {playerEngineer.contractYears} año(s) restante(s))
                    </div>
                  )}
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.5rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
                    <span>Coste Total Inmediato:</span>
                    <span style={{ color: eligibility.canHire ? '#10B981' : '#EF4444' }}>
                      ${(eligibility.totalFirstYearCost / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Presupuesto disponible:</span>
                    <span>${(playerTeam.budget / 1_000_000).toFixed(2)}M</span>
                  </div>
                </div>

                {!eligibility.canHire && (
                  <div style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    ⚠ {eligibility.reason}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setHiringEngineerCandidate(null)}
                    className="f1-btn f1-btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleHireEngineer}
                    disabled={!eligibility.canHire}
                    className="f1-btn f1-btn-primary"
                  >
                    Confirmar Contratación (2 Años)
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
