import { describe, it, expect } from 'vitest';
import {
  evaluateBoardExpectations,
  calculateUpdatedTpRating,
} from '../../src/domain/season/seasonEnd';
import { defaultSimulationConfig } from '../../src/config/simulationConfig';
import { Team, ConstructorStanding } from '../../src/domain/models';

describe('Tarea 7.2: Evaluación de Objetivos y Recálculo del tpRating (AC-08.2)', () => {
  const baseTeam: Team = {
    id: 'my-team',
    name: 'My Team',
    budget: 50000000,
    baseBudget: 50000000,
    reputation: 80,
    factoryLevel: 3,
    simulatorLevel: 3,
    carId: 'car-1',
    driverIds: ['d1', 'd2'],
    chiefEngineerId: 'eng-1',
    youthDriverIds: [],
    sponsor: {} as any,
    boardExpectations: {
      targetConstructorsPosition: 4,
      description: 'Terminar 4º o mejor en Constructores',
    },
  };

  const createStandingsWithPosition = (teamId: string, position: number): ConstructorStanding[] => {
    // 10 teams, position is 1-indexed
    const standings: ConstructorStanding[] = [];
    for (let i = 1; i <= 10; i++) {
      if (i === position) {
        standings.push({ teamId, points: (11 - i) * 10, wins: 0, podiums: 0 });
      } else {
        const otherId = `other-${i}`;
        standings.push({ teamId: otherId, points: (11 - i) * 10, wins: 0, podiums: 0 });
      }
    }
    return standings;
  };

  it('incrementa el tpRating entre +10 y +15 al superar el objetivo fijado por la directiva', () => {
    // Target is 4, finishes 2nd (positionDeficit = -2)
    const standings = createStandingsWithPosition('my-team', 2);
    const evalResult = evaluateBoardExpectations(baseTeam, standings, defaultSimulationConfig);

    expect(evalResult.metTarget).toBe(true);
    expect(evalResult.actualPosition).toBe(2);
    expect(evalResult.positionDeficit).toBe(-2);
    expect(evalResult.tpRatingDelta).toBeGreaterThanOrEqual(10);
    expect(evalResult.tpRatingDelta).toBeLessThanOrEqual(15);
    expect(evalResult.isDismissed).toBe(false);

    // Initial rating 60 -> should become 74
    const newRating = calculateUpdatedTpRating(60, evalResult.tpRatingDelta);
    expect(newRating).toBe(60 + evalResult.tpRatingDelta);
  });

  it('incrementa el tpRating en +5 al cumplir exactamente el objetivo', () => {
    // Target is 4, finishes 4th (positionDeficit = 0)
    const standings = createStandingsWithPosition('my-team', 4);
    const evalResult = evaluateBoardExpectations(baseTeam, standings, defaultSimulationConfig);

    expect(evalResult.metTarget).toBe(true);
    expect(evalResult.actualPosition).toBe(4);
    expect(evalResult.positionDeficit).toBe(0);
    expect(evalResult.tpRatingDelta).toBe(5);
    expect(evalResult.isDismissed).toBe(false);

    const newRating = calculateUpdatedTpRating(60, evalResult.tpRatingDelta);
    expect(newRating).toBe(65);
  });

  it('penaliza proporcionalmente el tpRating (-10 a -20) al no cumplir el objetivo', () => {
    // Target is 4, finishes 5th (deficit +1 -> minor failure)
    const standingsSmallDeficit = createStandingsWithPosition('my-team', 5);
    const evalSmall = evaluateBoardExpectations(baseTeam, standingsSmallDeficit, defaultSimulationConfig);

    expect(evalSmall.metTarget).toBe(false);
    expect(evalSmall.positionDeficit).toBe(1);
    expect(evalSmall.tpRatingDelta).toBe(-10); // Minimum failure penalty
    expect(evalSmall.isDismissed).toBe(false); // Deficit 1 < threshold 2

    // Target is 4, finishes 8th (deficit +4 -> major failure)
    const standingsLargeDeficit = createStandingsWithPosition('my-team', 8);
    const evalLarge = evaluateBoardExpectations(baseTeam, standingsLargeDeficit, defaultSimulationConfig);

    expect(evalLarge.metTarget).toBe(false);
    expect(evalLarge.positionDeficit).toBe(4);
    expect(evalLarge.tpRatingDelta).toBeLessThanOrEqual(-15);
    expect(evalLarge.tpRatingDelta).toBeGreaterThanOrEqual(-20);
    expect(evalLarge.isDismissed).toBe(true); // Deficit 4 >= threshold 2
  });

  it('mantiene el tpRating acotado estrictamente entre 0 y 100', () => {
    expect(calculateUpdatedTpRating(95, 15)).toBe(100);
    expect(calculateUpdatedTpRating(5, -20)).toBe(0);
  });
});
