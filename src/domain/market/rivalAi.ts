import { Team, Car, Driver, ChiefEngineer, CarAttribute } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';
import { orderUpgrade } from '../development/upgrades';
import { canRenewContract, renewContract, hireDriver, hireChiefEngineer, calculateDriverRequiredReputation, calculateEngineerRequiredReputation } from './market';

export interface RivalAiActionResult {
  updatedTeams: Team[];
  updatedCars: Car[];
  updatedDrivers: Driver[];
  updatedEngineers: ChiefEngineer[];
  logs: string[];
}

/**
 * Autonomous decision cycle for the 9 rival teams.
 * 1. Car Development: Autonomous teams invest in upgrades on their weakest attributes (AC-07.1).
 * 2. Contract Renewals: Autonomous teams renew key talent whose contract has <= 1 year remaining (AC-07.2).
 * 3. Market Signings: Autonomous teams fill vacant seats by hiring suitable free agents (AC-07.2).
 */
export function processRivalAiDecisionCycle(
  playerTeamId: string,
  teams: Team[],
  cars: Car[],
  drivers: Driver[],
  engineers: ChiefEngineer[],
  config: SimulationConfig = defaultSimulationConfig
): RivalAiActionResult {
  let currentTeams = [...teams];
  let currentCars = [...cars];
  let currentDrivers = [...drivers];
  let currentEngineers = [...engineers];
  const logs: string[] = [];

  const rivalTeams = currentTeams.filter((t) => t.id !== playerTeamId);

  for (const rival of rivalTeams) {
    let team = currentTeams.find((t) => t.id === rival.id)!;
    let car = currentCars.find((c) => c.id === team.carId)!;
    let engineer = currentEngineers.find((e) => e.id === team.chiefEngineerId);

    // 1. CAR DEVELOPMENT (AC-07.1)
    // If rival has budget margin and fewer than 2 concurrent upgrades, commission an upgrade
    if (car && car.upgradesInProgress.length < config.maxConcurrentUpgrades && team.budget >= 15_000_000) {
      // Find weakest attribute not already being upgraded
      const inProgressAttrs = car.upgradesInProgress.map((u) => u.attribute);
      const attributes: CarAttribute[] = ['topSpeed', 'downforce', 'reliability'];
      const candidateAttrs = attributes.filter((a) => !inProgressAttrs.includes(a) && car[a] < 100);

      if (candidateAttrs.length > 0) {
        // Pick the attribute with the lowest score
        candidateAttrs.sort((a, b) => car[a] - car[b]);
        const targetAttr = candidateAttrs[0];

        const upgradeResult = orderUpgrade(car, team, engineer, targetAttr, false, config);
        if (upgradeResult.success) {
          car = upgradeResult.updatedCar;
          team = upgradeResult.updatedTeam;
          currentCars = currentCars.map((c) => (c.id === car.id ? car : c));
          currentTeams = currentTeams.map((t) => (t.id === team.id ? team : t));
          logs.push(`[IA Rivales] ${team.name} inició desarrollo en ${targetAttr}.`);
        }
      }
    }

    // 2. CONTRACT RENEWALS (AC-07.2)
    // Check drivers in rival team
    for (const driverId of team.driverIds) {
      if (!driverId) continue;
      const driver = currentDrivers.find((d) => d.id === driverId);
      if (driver && canRenewContract(driver).canRenew && team.budget >= driver.salary * 1.5) {
        const renewed = renewContract(driver, 2);
        if (renewed.success) {
          currentDrivers = currentDrivers.map((d) => (d.id === driver.id ? renewed.updatedEmployee : d));
          logs.push(`[IA Rivales] ${team.name} renovó a ${driver.name} por 2 temporadas.`);
        }
      }
    }

    // Check chief engineer in rival team
    if (engineer && canRenewContract(engineer).canRenew && team.budget >= engineer.salary * 1.5) {
      const renewed = renewContract(engineer, 2);
      if (renewed.success) {
        engineer = renewed.updatedEmployee;
        currentEngineers = currentEngineers.map((e) => (e.id === engineer!.id ? renewed.updatedEmployee : e));
        logs.push(`[IA Rivales] ${team.name} renovó al Jefe de Ingenieros ${engineer.name}.`);
      }
    }

    // 3. FILLING VACANCIES (AC-07.2)
    // Check seat 1
    if (!team.driverIds[0]) {
      const availableFreeDrivers = currentDrivers.filter(
        (d) => d.teamId === null && calculateDriverRequiredReputation(d) <= team.reputation && d.salary <= team.budget * 0.4
      );
      if (availableFreeDrivers.length > 0) {
        availableFreeDrivers.sort((a, b) => b.pace + b.consistency - (a.pace + a.consistency));
        const chosen = availableFreeDrivers[0];
        const hireRes = hireDriver(team, chosen, 1, currentDrivers, currentTeams, 2);
        if (hireRes.success) {
          team = hireRes.updatedTeam;
          currentTeams = hireRes.updatedTeams;
          currentDrivers = hireRes.updatedDrivers;
          logs.push(`[IA Rivales] ${team.name} fichó al agente libre ${chosen.name} para Asiento 1.`);
        }
      }
    }

    // Check seat 2
    if (!team.driverIds[1]) {
      const availableFreeDrivers = currentDrivers.filter(
        (d) => d.teamId === null && calculateDriverRequiredReputation(d) <= team.reputation && d.salary <= team.budget * 0.4
      );
      if (availableFreeDrivers.length > 0) {
        availableFreeDrivers.sort((a, b) => b.pace + b.consistency - (a.pace + a.consistency));
        const chosen = availableFreeDrivers[0];
        const hireRes = hireDriver(team, chosen, 2, currentDrivers, currentTeams, 2);
        if (hireRes.success) {
          team = hireRes.updatedTeam;
          currentTeams = hireRes.updatedTeams;
          currentDrivers = hireRes.updatedDrivers;
          logs.push(`[IA Rivales] ${team.name} fichó al agente libre ${chosen.name} para Asiento 2.`);
        }
      }
    }

    // Check engineer vacancy
    if (!team.chiefEngineerId) {
      const availableEngineers = currentEngineers.filter(
        (e) => e.teamId === null && calculateEngineerRequiredReputation(e) <= team.reputation && e.salary <= team.budget * 0.3
      );
      if (availableEngineers.length > 0) {
        availableEngineers.sort((a, b) => b.developmentEfficiency - a.developmentEfficiency);
        const chosen = availableEngineers[0];
        const hireRes = hireChiefEngineer(team, chosen, currentEngineers, currentTeams, 2);
        if (hireRes.success) {
          team = hireRes.updatedTeam;
          currentTeams = hireRes.updatedTeams;
          currentEngineers = hireRes.updatedEngineers;
          logs.push(`[IA Rivales] ${team.name} contrató al Jefe de Ingenieros ${chosen.name}.`);
        }
      }
    }
  }

  return {
    updatedTeams: currentTeams,
    updatedCars: currentCars,
    updatedDrivers: currentDrivers,
    updatedEngineers: currentEngineers,
    logs,
  };
}
