'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { INITIAL_TEAMS, INITIAL_CARS, INITIAL_DRIVERS } from '../../config/initialTeamsData';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';

export default function NewGamePage() {
  const router = useRouter();
  const initGame = useGameStore((state) => state.initGame);
  const isLoading = useGameStore((state) => state.isLoading);

  const [selectedTeamId, setSelectedTeamId] = useState<string>('ferrari');
  const [managerName, setManagerName] = useState<string>('Carlos Sainz Padre');

  const selectedTeam = INITIAL_TEAMS.find((t) => t.id === selectedTeamId) ?? INITIAL_TEAMS[0];
  const selectedDriverIds: string[] = [selectedTeam.driverIds[0], selectedTeam.driverIds[1]];
  const teamDrivers = INITIAL_DRIVERS.filter((d) => selectedDriverIds.includes(d.id));

  const handleStartGame = async () => {
    try {
      await initGame(selectedTeamId, managerName.trim() || 'Team Principal');
      router.push('/dashboard');
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '0.5rem',
          }}>
            Selección de Escudería Oficial
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Elige qué escudería dirigirás durante la Temporada 1. Cada equipo tiene diferentes presupuestos, expectativas y nivel técnico.
          </p>
        </div>

        {/* Manager Details Bar */}
        <div className="f1-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              NOMBRE DEL TEAM PRINCIPAL
            </label>
            <input
              id="manager-name-input"
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Tu nombre o alias"
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: '2 1 400px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>
                Escudería Seleccionada
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                {selectedTeam.name}
              </strong>
            </div>
            <div>
              <button
                id="confirm-team-btn"
                className="f1-btn f1-btn-primary"
                onClick={handleStartGame}
                disabled={isLoading}
                style={{ padding: '0.75rem 2rem' }}
              >
                {isLoading ? 'Iniciando...' : 'Confirmar y Comenzar'}
              </button>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.25rem',
        }}>
          {INITIAL_TEAMS.map((team) => {
            const isSelected = team.id === selectedTeamId;
            const car = INITIAL_CARS.find((c) => c.id === team.carId);
            const teamDriverIds: string[] = [team.driverIds[0], team.driverIds[1]];
            const drivers = INITIAL_DRIVERS.filter((d) => teamDriverIds.includes(d.id));

            return (
              <div
                key={team.id}
                id={`team-card-${team.id}`}
                onClick={() => setSelectedTeamId(team.id)}
                className="f1-card"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-red)' : 'var(--border-subtle)',
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'var(--accent-red)',
                    color: '#fff',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                    borderBottomLeftRadius: 'var(--radius-sm)',
                    textTransform: 'uppercase',
                  }}>
                    Seleccionado
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                    {team.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="f1-badge f1-badge-gold">
                      ${(team.budget / 1000000).toFixed(0)}M Presupuesto
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Rating TP base: {team.reputation}
                    </span>
                  </div>
                </div>

                {/* Board objective */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}>
                  <strong style={{ color: 'var(--accent-gold)', display: 'block', marginBottom: '0.2rem' }}>
                    Objetivo de la Directiva:
                  </strong>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {team.boardExpectations.description}
                  </span>
                </div>

                {/* Car Stats */}
                <div style={{ marginBottom: '1rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Velocidad Punta:</span>
                    <strong>{car?.topSpeed ?? 80}/100</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Carga Aerodinámica:</span>
                    <strong>{car?.downforce ?? 80}/100</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Fiabilidad Mecánica:</span>
                    <strong>{car?.reliability ?? 80}/100</strong>
                  </div>
                </div>

                {/* Facilities & Drivers */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}>
                  <div>
                    Fábrica: <strong>Niv. {team.factoryLevel}</strong> | Sim: <strong>Niv. {team.simulatorLevel}</strong>
                  </div>
                  <div>
                    Pilotos: <strong>{drivers.map((d) => d.name.split(' ').pop()).join(' & ')}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
