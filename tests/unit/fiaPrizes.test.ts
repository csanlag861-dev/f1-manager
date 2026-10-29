import { describe, it, expect } from 'vitest';
import { distributeFiaConstructorPrizes } from '../../src/domain/season/seasonEnd';
import { defaultSimulationConfig } from '../../src/config/simulationConfig';
import { Team, ConstructorStanding } from '../../src/domain/models';

describe('Tarea 7.1: Reparto de Premios Oficiales FIA de Constructores (AC-08.1)', () => {
  const dummyTeams: Team[] = [
    { id: 'team-1', name: 'Alpha', budget: 10000000, baseBudget: 10000000, reputation: 90, factoryLevel: 3, simulatorLevel: 3, carId: 'c1', driverIds: ['d1', 'd2'], chiefEngineerId: 'e1', youthDriverIds: [], sponsor: {} as any, boardExpectations: { targetConstructorsPosition: 1, description: '' } },
    { id: 'team-2', name: 'Beta', budget: 15000000, baseBudget: 15000000, reputation: 80, factoryLevel: 3, simulatorLevel: 3, carId: 'c2', driverIds: ['d3', 'd4'], chiefEngineerId: 'e2', youthDriverIds: [], sponsor: {} as any, boardExpectations: { targetConstructorsPosition: 2, description: '' } },
    { id: 'team-3', name: 'Gamma', budget: 5000000, baseBudget: 5000000, reputation: 70, factoryLevel: 2, simulatorLevel: 2, carId: 'c3', driverIds: ['d5', 'd6'], chiefEngineerId: 'e3', youthDriverIds: [], sponsor: {} as any, boardExpectations: { targetConstructorsPosition: 3, description: '' } },
  ];

  const dummyStandings: ConstructorStanding[] = [
    { teamId: 'team-2', points: 300, wins: 10, podiums: 18 }, // 1st
    { teamId: 'team-1', points: 200, wins: 5, podiums: 12 },  // 2nd
    { teamId: 'team-3', points: 50, wins: 0, podiums: 1 },    // 3rd
  ];

  it('asigna a cada escudería el importe reglamentario exacto según su posición final', () => {
    const { updatedTeams, allocations } = distributeFiaConstructorPrizes(
      dummyTeams,
      dummyStandings,
      defaultSimulationConfig
    );

    // 1st place should be team-2 (Prize: 65,000,000)
    const allocTeam2 = allocations.find((a) => a.teamId === 'team-2');
    expect(allocTeam2?.position).toBe(1);
    expect(allocTeam2?.prize).toBe(defaultSimulationConfig.fiaConstructorPrizeDistribution[0]);
    const updatedTeam2 = updatedTeams.find((t) => t.id === 'team-2');
    expect(updatedTeam2?.budget).toBe(15000000 + defaultSimulationConfig.fiaConstructorPrizeDistribution[0]);

    // 2nd place should be team-1 (Prize: 55,000,000)
    const allocTeam1 = allocations.find((a) => a.teamId === 'team-1');
    expect(allocTeam1?.position).toBe(2);
    expect(allocTeam1?.prize).toBe(defaultSimulationConfig.fiaConstructorPrizeDistribution[1]);
    const updatedTeam1 = updatedTeams.find((t) => t.id === 'team-1');
    expect(updatedTeam1?.budget).toBe(10000000 + defaultSimulationConfig.fiaConstructorPrizeDistribution[1]);

    // 3rd place should be team-3 (Prize: 48,000,000)
    const allocTeam3 = allocations.find((a) => a.teamId === 'team-3');
    expect(allocTeam3?.position).toBe(3);
    expect(allocTeam3?.prize).toBe(defaultSimulationConfig.fiaConstructorPrizeDistribution[2]);
    const updatedTeam3 = updatedTeams.find((t) => t.id === 'team-3');
    expect(updatedTeam3?.budget).toBe(5000000 + defaultSimulationConfig.fiaConstructorPrizeDistribution[2]);
  });

  it('asigna correctamente las 10 posiciones con la escala oficial de 10 equipos', () => {
    const full10Teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
      id: `t-${i + 1}`,
      name: `Team ${i + 1}`,
      budget: 0,
      baseBudget: 50000000,
      reputation: 80,
      factoryLevel: 3,
      simulatorLevel: 3,
      carId: `c-${i + 1}`,
      driverIds: [`d-${i * 2 + 1}`, `d-${i * 2 + 2}`],
      chiefEngineerId: `e-${i + 1}`,
      youthDriverIds: [],
      sponsor: {} as any,
      boardExpectations: { targetConstructorsPosition: i + 1, description: '' },
    }));

    const full10Standings: ConstructorStanding[] = Array.from({ length: 10 }, (_, i) => ({
      teamId: `t-${i + 1}`,
      points: (10 - i) * 10,
      wins: 10 - i,
      podiums: 10 - i,
    }));

    const { updatedTeams, allocations } = distributeFiaConstructorPrizes(
      full10Teams,
      full10Standings,
      defaultSimulationConfig
    );

    expect(allocations).toHaveLength(10);
    allocations.forEach((alloc, index) => {
      expect(alloc.position).toBe(index + 1);
      expect(alloc.prize).toBe(defaultSimulationConfig.fiaConstructorPrizeDistribution[index]);
      const team = updatedTeams.find((t) => t.id === alloc.teamId);
      expect(team?.budget).toBe(defaultSimulationConfig.fiaConstructorPrizeDistribution[index]);
    });
  });
});
