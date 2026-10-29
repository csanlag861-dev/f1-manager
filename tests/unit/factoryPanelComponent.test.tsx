import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FactoryPanel } from '@/presentation/components/FactoryPanel';
import { Car, ChiefEngineer, Team } from '@/domain/models';
import { useGameStore } from '@/application/store/gameStore';

describe('FactoryPanel Component (Hito 4)', () => {
  const dummyTeam: Team = {
    id: 'team-test',
    name: 'Scuderia Test',
    budget: 50_000_000,
    baseBudget: 50_000_000,
    boardExpectations: { targetConstructorsPosition: 4, description: 'Top 4' },
    reputation: 85,
    factoryLevel: 3,
    simulatorLevel: 2,
    carId: 'car-test',
    driverIds: ['d1', 'd2'],
    chiefEngineerId: 'eng-test',
    youthDriverIds: [],
    sponsor: {
      id: 'sp1',
      name: 'Apex Sponsor',
      baseIncomePerRace: 2000000,
      bonusTarget: 'top_10',
      bonusTargetDescription: 'Top 10',
      bonusIncome: 1000000,
      remainingRaces: 24,
    },
  };

  const dummyCar: Car = {
    id: 'car-test',
    teamId: 'team-test',
    topSpeed: 84,
    downforce: 86,
    reliability: 88,
    upgradesInProgress: [],
  };

  const dummyEngineer: ChiefEngineer = {
    id: 'eng-test',
    name: 'Mario Isola',
    developmentEfficiency: 88,
    setupPerformance: 85,
    morale: 82,
    salary: 4000000,
    contractYears: 2,
    teamId: 'team-test',
  };

  beforeEach(() => {
    useGameStore.setState({ gameState: null });
  });

  it('renderiza correctamente los atributos del coche, niveles de instalaciones y botones de mejora', () => {
    const html = renderToString(
      <FactoryPanel team={dummyTeam} car={dummyCar} engineer={dummyEngineer} />
    );

    // Car attributes rendered
    expect(html).toContain('Velocidad Punta');
    expect(html).toContain('84/100');
    expect(html).toContain('Carga Aerodinámica');
    expect(html).toContain('86/100');
    expect(html).toContain('Fiabilidad Mecánica');
    expect(html).toContain('88/100');

    // Concurrency badge
    expect(html).toContain('Mejoras Activas: 0 / 2');

    // Upgrade buttons
    expect(html).toContain('order-upgrade-btn-topSpeed');
    expect(html).toContain('order-upgrade-btn-downforce');
    expect(html).toContain('order-upgrade-btn-reliability');

    // Facility levels and buttons
    expect(html).toContain('Nivel 3 / 5');
    expect(html).toContain('upgrade-factory-btn');
    expect(html).toContain('Nivel 2 / 5');
    expect(html).toContain('upgrade-simulator-btn');

    // Engineer info
    expect(html).toContain('Mario Isola');
    expect(html).toContain('88/100');
    expect(html).toContain('82%');
  });

  it('renderiza proyectos activos y badge de concurrencia máxima cuando existen 2 proyectos', () => {
    const carWith2Upgrades: Car = {
      ...dummyCar,
      upgradesInProgress: [
        { id: 'u1', attribute: 'topSpeed', racesRemaining: 2, cost: 3000000, improvement: 2 },
        { id: 'u2', attribute: 'downforce', racesRemaining: 3, cost: 3200000, improvement: 2 },
      ],
    };

    const html = renderToString(
      <FactoryPanel team={dummyTeam} car={carWith2Upgrades} engineer={dummyEngineer} />
    );

    expect(html).toContain('Mejoras Activas: 2 / 2');
    expect(html).toContain('active-project-topSpeed');
    expect(html).toContain('active-project-downforce');
    expect(html).toContain('2 GPs restantes');
    expect(html).toContain('3 GPs restantes');
    expect(html).toContain('Fábrica Ocupada (Máx 2)');
  });

  it('muestra la sección de reintento con 50% de descuento si hay mejoras fallidas registradas', () => {
    useGameStore.setState({
      gameState: {
        managerProfile: { name: 'Director', tpRating: 70, seasonsCompleted: 0, careerHistory: [] },
        playerTeamId: dummyTeam.id,
        season: { seasonNumber: 1, currentRaceIndex: 0, calendar: [], standings: { drivers: [], constructors: [] } },
        teams: [dummyTeam],
        drivers: [],
        chiefEngineers: [dummyEngineer],
        cars: [dummyCar],
        circuits: [],
        youthDrivers: [],
        lastRaceResult: null,
        failedUpgradesToRetry: ['downforce'],
        updatedAt: new Date().toISOString(),
      },
    });

    const html = renderToString(
      <FactoryPanel team={dummyTeam} car={dummyCar} engineer={dummyEngineer} failedRetries={['downforce']} />
    );

    expect(html).toContain('failed-upgrades-retry-section');
    expect(html).toContain('Reintentar Carga Aerodinámica');
    expect(html).toContain('retry-upgrade-btn-downforce');
  });
});
