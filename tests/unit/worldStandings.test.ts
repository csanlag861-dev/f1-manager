import { describe, it, expect } from 'vitest';
import { updateSeasonStandings, sortDriverStandings, sortConstructorStandings } from '@/domain/season/standings';
import { Season, RaceResultEntry, DriverStanding, ConstructorStanding } from '@/domain/models';

describe('Tarea 2.4: Gestión del Mundial de Pilotos y Constructores (AC-06.7)', () => {
  it('debe aplicar criterios oficiales de desempate por victorias y podios cuando hay empate a puntos', () => {
    const drivers: DriverStanding[] = [
      { driverId: 'd-equal-low', points: 50, wins: 0, podiums: 2 },
      { driverId: 'd-equal-winner', points: 50, wins: 2, podiums: 2 },
      { driverId: 'd-equal-podium', points: 50, wins: 0, podiums: 3 },
      { driverId: 'd-leader', points: 75, wins: 3, podiums: 3 },
    ];

    const sorted = sortDriverStandings(drivers);

    expect(sorted[0].driverId).toBe('d-leader'); // 75 pts
    expect(sorted[1].driverId).toBe('d-equal-winner'); // 50 pts, 2 wins
    expect(sorted[2].driverId).toBe('d-equal-podium'); // 50 pts, 0 wins, 3 podiums
    expect(sorted[3].driverId).toBe('d-equal-low'); // 50 pts, 0 wins, 2 podiums
  });

  it('debe acumular la suma exacta de puntos a lo largo de 5 carreras consecutivas', () => {
    let season: Season = {
      seasonNumber: 1,
      currentRaceIndex: 0,
      driverStandings: [
        { driverId: 'verstappen', points: 0, wins: 0, podiums: 0 },
        { driverId: 'leclerc', points: 0, wins: 0, podiums: 0 },
        { driverId: 'norris', points: 0, wins: 0, podiums: 0 },
      ],
      constructorStandings: [
        { teamId: 'red-bull', points: 0, wins: 0, podiums: 0 },
        { teamId: 'ferrari', points: 0, wins: 0, podiums: 0 },
        { teamId: 'mclaren', points: 0, wins: 0, podiums: 0 },
      ],
    };

    // 5 simulated races with predetermined finishes
    // Race 1: Verstappen P1 (25), Leclerc P2 (18), Norris P3 (15)
    const race1: RaceResultEntry[] = [
      { driverId: 'verstappen', teamId: 'red-bull', gridPosition: 1, finishPosition: 1, points: 25, isDnf: false, timeGap: 'WINNER' },
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 2, finishPosition: 2, points: 18, isDnf: false, timeGap: '+2.0s' },
      { driverId: 'norris', teamId: 'mclaren', gridPosition: 3, finishPosition: 3, points: 15, isDnf: false, timeGap: '+4.0s' },
    ];

    // Race 2: Leclerc P1 (25), Norris P2 (18), Verstappen DNF (0)
    const race2: RaceResultEntry[] = [
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 1, finishPosition: 1, points: 25, isDnf: false, timeGap: 'WINNER' },
      { driverId: 'norris', teamId: 'mclaren', gridPosition: 3, finishPosition: 2, points: 18, isDnf: false, timeGap: '+1.5s' },
      { driverId: 'verstappen', teamId: 'red-bull', gridPosition: 2, finishPosition: 20, points: 0, isDnf: true, dnfReason: 'Fallo mecánico', timeGap: 'DNF' },
    ];

    // Race 3: Verstappen P1 (25), Norris P2 (18), Leclerc P3 (15)
    const race3: RaceResultEntry[] = [
      { driverId: 'verstappen', teamId: 'red-bull', gridPosition: 1, finishPosition: 1, points: 25, isDnf: false, timeGap: 'WINNER' },
      { driverId: 'norris', teamId: 'mclaren', gridPosition: 2, finishPosition: 2, points: 18, isDnf: false, timeGap: '+3.1s' },
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 3, finishPosition: 3, points: 15, isDnf: false, timeGap: '+5.0s' },
    ];

    // Race 4: Norris P1 (25), Verstappen P2 (18), Leclerc P4 (12)
    const race4: RaceResultEntry[] = [
      { driverId: 'norris', teamId: 'mclaren', gridPosition: 1, finishPosition: 1, points: 25, isDnf: false, timeGap: 'WINNER' },
      { driverId: 'verstappen', teamId: 'red-bull', gridPosition: 2, finishPosition: 2, points: 18, isDnf: false, timeGap: '+0.8s' },
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 3, finishPosition: 4, points: 12, isDnf: false, timeGap: '+6.2s' },
    ];

    // Race 5: Verstappen P1 (25), Leclerc P2 (18), Norris DNF (0)
    const race5: RaceResultEntry[] = [
      { driverId: 'verstappen', teamId: 'red-bull', gridPosition: 1, finishPosition: 1, points: 25, isDnf: false, timeGap: 'WINNER' },
      { driverId: 'leclerc', teamId: 'ferrari', gridPosition: 2, finishPosition: 2, points: 18, isDnf: false, timeGap: '+4.5s' },
      { driverId: 'norris', teamId: 'mclaren', gridPosition: 3, finishPosition: 20, points: 0, isDnf: true, dnfReason: 'Accidente', timeGap: 'DNF' },
    ];

    season = updateSeasonStandings(season, race1);
    season = updateSeasonStandings(season, race2);
    season = updateSeasonStandings(season, race3);
    season = updateSeasonStandings(season, race4);
    season = updateSeasonStandings(season, race5);

    // Points calculation:
    // Verstappen: 25 + 0 + 25 + 18 + 25 = 93 points, 3 wins, 4 podiums
    // Norris: 15 + 18 + 18 + 25 + 0 = 76 points, 1 win, 4 podiums
    // Leclerc: 18 + 25 + 15 + 12 + 18 = 88 points, 1 win, 4 podiums

    const vStanding = season.driverStandings.find((s) => s.driverId === 'verstappen');
    expect(vStanding?.points).toBe(93);
    expect(vStanding?.wins).toBe(3);
    expect(vStanding?.podiums).toBe(4);

    const lStanding = season.driverStandings.find((s) => s.driverId === 'leclerc');
    expect(lStanding?.points).toBe(88);
    expect(lStanding?.wins).toBe(1);
    expect(lStanding?.podiums).toBe(4);

    const nStanding = season.driverStandings.find((s) => s.driverId === 'norris');
    expect(nStanding?.points).toBe(76);
    expect(nStanding?.wins).toBe(1);
    expect(nStanding?.podiums).toBe(4);

    // Leader is Verstappen (93), followed by Leclerc (88), followed by Norris (76)
    expect(season.driverStandings[0].driverId).toBe('verstappen');
    expect(season.driverStandings[1].driverId).toBe('leclerc');
    expect(season.driverStandings[2].driverId).toBe('norris');

    // Constructors:
    // Red Bull: 93
    // Ferrari: 88
    // McLaren: 76
    expect(season.constructorStandings[0].teamId).toBe('red-bull');
    expect(season.constructorStandings[0].points).toBe(93);
    expect(season.constructorStandings[1].teamId).toBe('ferrari');
    expect(season.constructorStandings[1].points).toBe(88);
    expect(season.constructorStandings[2].teamId).toBe('mclaren');
    expect(season.constructorStandings[2].points).toBe(76);
  });
});
