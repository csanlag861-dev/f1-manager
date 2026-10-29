import { Driver, ChiefEngineer, Team } from '../models';
import { SimulationConfig, defaultSimulationConfig } from '../../config/simulationConfig';

export interface HiringEligibility {
  canHire: boolean;
  reason?: string;
  requiredReputation: number;
  severancePay: number;
  totalFirstYearCost: number;
}

/**
 * Calculates the minimum reputation a team must possess to sign a driver.
 * Formula: Weighted average of pace and consistency.
 * Elite drivers (Verstappen, Hamilton, Leclerc) demand >= 90 reputation.
 */
export function calculateDriverRequiredReputation(driver: Driver): number {
  const overall = 0.6 * driver.pace + 0.4 * driver.consistency;
  return Math.max(50, Math.min(98, Math.round(overall)));
}

/**
 * Calculates the minimum reputation a team must possess to sign a chief engineer.
 * Formula: Weighted average of development efficiency and setup performance.
 */
export function calculateEngineerRequiredReputation(engineer: ChiefEngineer): number {
  const overall = 0.6 * engineer.developmentEfficiency + 0.4 * engineer.setupPerformance;
  return Math.max(50, Math.min(98, Math.round(overall)));
}

/**
 * Evaluates whether a team can sign a candidate (driver or engineer).
 * Validates reputation match, budget availability, and severance pay.
 * Satisfies AC-04.2 and game-rules.md §2.1.
 */
export function evaluateHiringEligibility(
  team: Team,
  candidate: Driver | ChiefEngineer,
  outgoingSalary = 0,
  outgoingContractYears = 0
): HiringEligibility {
  const isDriver = 'pace' in candidate;
  const requiredReputation = isDriver
    ? calculateDriverRequiredReputation(candidate as Driver)
    : calculateEngineerRequiredReputation(candidate as ChiefEngineer);

  // Severance pay for replacing an employee under contract
  const severancePay =
    outgoingContractYears > 0 ? Math.round(outgoingSalary * 0.5 * outgoingContractYears) : 0;
  const totalFirstYearCost = candidate.salary + severancePay;

  // 1. Check prestige / reputation requirement
  if (team.reputation < requiredReputation) {
    return {
      canHire: false,
      reason: `El candidato exige una escudería con al menos ${requiredReputation} de prestigio (la reputación actual es ${team.reputation}).`,
      requiredReputation,
      severancePay,
      totalFirstYearCost,
    };
  }

  // 2. Check financial capability
  if (team.budget < totalFirstYearCost) {
    return {
      canHire: false,
      reason: `Presupuesto insuficiente: se requieren $${totalFirstYearCost.toLocaleString()} para cubrir el salario y el finiquito.`,
      requiredReputation,
      severancePay,
      totalFirstYearCost,
    };
  }

  return {
    canHire: true,
    requiredReputation,
    severancePay,
    totalFirstYearCost,
  };
}

/**
 * Executes the hiring of a driver to a designated seat (1 or 2).
 * Deducts first year's cost and severance pay, replaces current seat holder (sending them to free agency).
 * Satisfies AC-04.2.
 */
export function hireDriver(
  team: Team,
  candidate: Driver,
  targetSeat: 1 | 2,
  drivers: Driver[],
  teams: Team[],
  offeredContractYears = 2
): {
  success: boolean;
  updatedTeam: Team;
  updatedDrivers: Driver[];
  updatedTeams: Team[];
  error?: string;
  severancePaid: number;
} {
  const currentDriverId = team.driverIds[targetSeat - 1];
  const currentDriver = drivers.find((d) => d.id === currentDriverId);

  const eligibility = evaluateHiringEligibility(
    team,
    candidate,
    currentDriver?.salary ?? 0,
    currentDriver?.contractYears ?? 0
  );

  if (!eligibility.canHire) {
    return {
      success: false,
      updatedTeam: team,
      updatedDrivers: drivers,
      updatedTeams: teams,
      error: eligibility.reason,
      severancePaid: 0,
    };
  }

  // Deduct cost from team budget
  const updatedTeam: Team = {
    ...team,
    budget: team.budget - eligibility.totalFirstYearCost,
    driverIds:
      targetSeat === 1
        ? [candidate.id, team.driverIds[1]]
        : [team.driverIds[0], candidate.id],
  };

  // If candidate was previously at another team, remove from that team
  let updatedTeams = teams.map((t) => {
    if (t.id === team.id) return updatedTeam;
    if (t.id === candidate.teamId) {
      const isSeat1 = t.driverIds[0] === candidate.id;
      return {
        ...t,
        driverIds: isSeat1
          ? (['', t.driverIds[1]] as [string, string])
          : ([t.driverIds[0], ''] as [string, string]),
      };
    }
    return t;
  });

  // Update drivers catalog:
  // - Replaced driver becomes free agent (teamId: null, contractYears: 0)
  // - Candidate gets new team and contract duration
  const updatedDrivers = drivers.map((d) => {
    if (d.id === candidate.id) {
      return {
        ...d,
        teamId: team.id,
        contractYears: offeredContractYears,
      };
    }
    if (currentDriver && d.id === currentDriver.id) {
      return {
        ...d,
        teamId: null,
        contractYears: 0,
      };
    }
    return d;
  });

  return {
    success: true,
    updatedTeam,
    updatedDrivers,
    updatedTeams,
    severancePaid: eligibility.severancePay,
  };
}

/**
 * Executes the hiring of a chief engineer.
 * Replaces current engineer, sending them to free agency.
 * Satisfies AC-04.2.
 */
export function hireChiefEngineer(
  team: Team,
  candidate: ChiefEngineer,
  engineers: ChiefEngineer[],
  teams: Team[],
  offeredContractYears = 2
): {
  success: boolean;
  updatedTeam: Team;
  updatedEngineers: ChiefEngineer[];
  updatedTeams: Team[];
  error?: string;
  severancePaid: number;
} {
  const currentEngineer = engineers.find((e) => e.id === team.chiefEngineerId);

  const eligibility = evaluateHiringEligibility(
    team,
    candidate,
    currentEngineer?.salary ?? 0,
    currentEngineer?.contractYears ?? 0
  );

  if (!eligibility.canHire) {
    return {
      success: false,
      updatedTeam: team,
      updatedEngineers: engineers,
      updatedTeams: teams,
      error: eligibility.reason,
      severancePaid: 0,
    };
  }

  const updatedTeam: Team = {
    ...team,
    budget: team.budget - eligibility.totalFirstYearCost,
    chiefEngineerId: candidate.id,
  };

  // If candidate was previously at another team, clear that team's chief engineer
  let updatedTeams = teams.map((t) => {
    if (t.id === team.id) return updatedTeam;
    if (t.id === candidate.teamId) {
      return {
        ...t,
        chiefEngineerId: '',
      };
    }
    return t;
  });

  const updatedEngineers = engineers.map((e) => {
    if (e.id === candidate.id) {
      return {
        ...e,
        teamId: team.id,
        contractYears: offeredContractYears,
      };
    }
    if (currentEngineer && e.id === currentEngineer.id) {
      return {
        ...e,
        teamId: null,
        contractYears: 0,
      };
    }
    return e;
  });

  return {
    success: true,
    updatedTeam,
    updatedEngineers,
    updatedTeams,
    severancePaid: eligibility.severancePay,
  };
}

/**
 * Evaluates if an employee is eligible for contract renewal.
 * Condition: Has 1 year or less remaining on current contract.
 * Satisfies AC-04.3.
 */
export function canRenewContract(employee: Driver | ChiefEngineer): {
  canRenew: boolean;
  reason?: string;
} {
  if (employee.contractYears > 1) {
    return {
      canRenew: false,
      reason: `El empleado dispone de ${employee.contractYears} años de contrato; solo puede renovarse con 1 año o menos restante.`,
    };
  }
  return { canRenew: true };
}

/**
 * Renews an employee's contract with extended duration and agreed salary.
 * Satisfies AC-04.3.
 */
export function renewContract<T extends Driver | ChiefEngineer>(
  employee: T,
  addedYears = 2,
  salaryMultiplier = 1.05
): {
  success: boolean;
  updatedEmployee: T;
  error?: string;
} {
  const check = canRenewContract(employee);
  if (!check.canRenew) {
    return {
      success: false,
      updatedEmployee: employee,
      error: check.reason,
    };
  }

  const updated = {
    ...employee,
    contractYears: employee.contractYears + addedYears,
    salary: Math.round(employee.salary * salaryMultiplier),
  };

  return {
    success: true,
    updatedEmployee: updated as T,
  };
}

/**
 * Processes annual contract expiration between seasons:
 * - Decrements 1 year from all active contracts.
 * - Employees reaching 0 contract years leave the team and pass to free agency (teamId: null).
 * Satisfies AC-04.4.
 */
export function processContractExpirations(
  drivers: Driver[],
  engineers: ChiefEngineer[],
  teams: Team[]
): {
  updatedDrivers: Driver[];
  updatedEngineers: ChiefEngineer[];
  updatedTeams: Team[];
  expiredDriverIds: string[];
  expiredEngineerIds: string[];
} {
  const expiredDriverIds: string[] = [];
  const expiredEngineerIds: string[] = [];

  const updatedDrivers = drivers.map((d) => {
    if (!d.teamId) return d;
    const remaining = Math.max(0, d.contractYears - 1);
    if (remaining === 0) {
      expiredDriverIds.push(d.id);
      return {
        ...d,
        contractYears: 0,
        teamId: null,
      };
    }
    return {
      ...d,
      contractYears: remaining,
    };
  });

  const updatedEngineers = engineers.map((e) => {
    if (!e.teamId) return e;
    const remaining = Math.max(0, e.contractYears - 1);
    if (remaining === 0) {
      expiredEngineerIds.push(e.id);
      return {
        ...e,
        contractYears: 0,
        teamId: null,
      };
    }
    return {
      ...e,
      contractYears: remaining,
    };
  });

  const updatedTeams = teams.map((team) => {
    const seat1Expired = expiredDriverIds.includes(team.driverIds[0]);
    const seat2Expired = expiredDriverIds.includes(team.driverIds[1]);
    const engineerExpired = expiredEngineerIds.includes(team.chiefEngineerId);

    return {
      ...team,
      driverIds: [
        seat1Expired ? '' : team.driverIds[0],
        seat2Expired ? '' : team.driverIds[1],
      ] as [string, string],
      chiefEngineerId: engineerExpired ? '' : team.chiefEngineerId,
    };
  });

  return {
    updatedDrivers,
    updatedEngineers,
    updatedTeams,
    expiredDriverIds,
    expiredEngineerIds,
  };
}
