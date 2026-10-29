import { create } from 'zustand';
import {
  GameState,
  RaceWeekendResult,
  CarAttribute,
  GameUpgradeDeliverySummary,
  SeasonTransitionSummary,
} from '../../domain/models';
import { createInitialGameState } from '../../config/initialTeamsData';
import { storageAdapter, StorageAdapter } from '../../infrastructure/storage/indexedDbAdapter';
import { updateSeasonStandings, processSeasonEnd } from '../../domain/season';
import { calculateRaceFinancialSettlement } from '../../domain/economy';
import {
  orderUpgrade,
  processUpgradesDelivery,
  upgradeFacility as domainUpgradeFacility,
  updatePostRaceMorale,
  FacilityType,
} from '../../domain/development';
import {
  hireDriver as domainHireDriver,
  hireChiefEngineer as domainHireChiefEngineer,
  renewContract as domainRenewContract,
  processContractExpirations,
  processRivalAiDecisionCycle,
} from '../../domain/market';
import {
  signYouthDriver as domainSignYouthDriver,
  releaseYouthDriver as domainReleaseYouthDriver,
  promoteYouthDriver as domainPromoteYouthDriver,
  trainYouthDriversAnnual,
  generateYouthDriverPool,
} from '../../domain/academy';
import { serializeGameState, validateAndParseSaveGame } from '../../domain/serialization/saveGameSchema';

export interface GameStoreState {
  gameState: GameState | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  initGame: (playerTeamId: string, managerName?: string, customAdapter?: StorageAdapter) => Promise<GameState>;
  loadGame: (customAdapter?: StorageAdapter) => Promise<GameState | null>;
  saveCurrentGame: (customAdapter?: StorageAdapter) => Promise<void>;
  applyRaceResults: (result: RaceWeekendResult, customAdapter?: StorageAdapter) => Promise<void>;
  advanceToNextRound: (customAdapter?: StorageAdapter) => Promise<void>;
  processSeasonEnd: (customAdapter?: StorageAdapter) => Promise<SeasonTransitionSummary | null>;
  acceptTeamPrincipalOffer: (targetTeamId: string, customAdapter?: StorageAdapter) => Promise<boolean>;
  startNextSeason: (customAdapter?: StorageAdapter) => Promise<boolean>;
  orderCarUpgrade: (attribute: CarAttribute, isRetry?: boolean, customAdapter?: StorageAdapter) => Promise<boolean>;
  upgradeFacility: (type: FacilityType, customAdapter?: StorageAdapter) => Promise<boolean>;
  hireDriver: (driverId: string, targetSeat: 1 | 2, offeredYears?: number, customAdapter?: StorageAdapter) => Promise<boolean>;
  hireChiefEngineer: (engineerId: string, offeredYears?: number, customAdapter?: StorageAdapter) => Promise<boolean>;
  renewContract: (employeeId: string, isDriver: boolean, addedYears?: number, customAdapter?: StorageAdapter) => Promise<boolean>;
  signYouthDriver: (youthDriverId: string, customAdapter?: StorageAdapter) => Promise<boolean>;
  releaseYouthDriver: (youthDriverId: string, customAdapter?: StorageAdapter) => Promise<boolean>;
  promoteYouthDriver: (youthDriverId: string, targetSeat: 1 | 2, startingSalary?: number, contractYears?: number, customAdapter?: StorageAdapter) => Promise<boolean>;
  resetGame: (customAdapter?: StorageAdapter) => Promise<void>;
  exportGameToJson: () => string | null;
  importGameFromJson: (jsonString: string, customAdapter?: StorageAdapter) => Promise<{ success: boolean; error?: string }>;
}


export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  isLoading: false,
  isSaving: false,
  error: null,

  initGame: async (playerTeamId: string, managerName = 'Team Principal', customAdapter?: StorageAdapter) => {
    const adapter = customAdapter || storageAdapter;
    set({ isLoading: true, error: null });
    try {
      const newState = createInitialGameState(playerTeamId, managerName);
      await adapter.saveGameState(newState);
      set({ gameState: newState, isLoading: false });
      return newState;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al inicializar la partida';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loadGame: async (customAdapter?: StorageAdapter) => {
    const adapter = customAdapter || storageAdapter;
    set({ isLoading: true, error: null });
    try {
      const loaded = await adapter.loadGameState();
      set({ gameState: loaded, isLoading: false });
      return loaded;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar la partida';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  saveCurrentGame: async (customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return;

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true });
    try {
      await adapter.saveGameState(gameState);
      set({ isSaving: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      set({ error: message, isSaving: false });
    }
  },

  applyRaceResults: async (result: RaceWeekendResult, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return;

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true });

    try {
      const updatedSeason = updateSeasonStandings(gameState.season, result.raceResults);

      // Financial Settlement
      const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
      const playerCar = gameState.cars.find((c) => c.id === playerTeam?.carId);
      const playerEngineer = gameState.chiefEngineers.find((e) => e.id === playerTeam?.chiefEngineerId);

      let isBankrupt = false;
      let bankruptcyDetails: { debt: number; maxAllowedDebt: number } | undefined = undefined;
      let updatedTeams = gameState.teams;

      if (playerTeam && playerCar) {
        const settlement = calculateRaceFinancialSettlement(
          playerTeam,
          playerCar,
          gameState.drivers,
          playerEngineer,
          result.raceResults
        );

        result.playerFinancials = {
          baseSponsorIncome: settlement.sponsor.baseIncome,
          bonusSponsorIncome: settlement.sponsor.bonusIncome,
          bonusAchieved: settlement.sponsor.bonusAchieved,
          salariesCost: settlement.expenses.salariesCost,
          maintenanceCost: settlement.expenses.maintenanceCost,
          dnfRepairCost: settlement.dnfRepairCost,
          netIncome: settlement.netIncome,
        };

        updatedTeams = gameState.teams.map((t) =>
          t.id === playerTeam.id ? { ...t, budget: settlement.newBudget } : t
        );

        if (settlement.isBankrupt) {
          isBankrupt = true;
          bankruptcyDetails = {
            debt: settlement.currentDebt,
            maxAllowedDebt: settlement.maxAllowedDebt,
          };
        }
      }

      // 3. Post-race Morale Fluctuation (spec/game-rules.md 5.3, RF-6.6)
      const sponsorBonusAchievedByTeamId: Record<string, boolean> = {};
      if (playerTeam && result.playerFinancials?.bonusAchieved) {
        sponsorBonusAchievedByTeamId[playerTeam.id] = true;
      }
      const moraleOutcome = updatePostRaceMorale(
        gameState.drivers,
        gameState.chiefEngineers,
        updatedTeams,
        result.raceResults,
        sponsorBonusAchievedByTeamId
      );

      // 4. Progress active car upgrades and evaluate delivery (AC-03.4, AC-03.5)
      let allUpdatedEngineers = [...moraleOutcome.updatedEngineers];
      const deliverySummaries: GameUpgradeDeliverySummary[] = [];
      const updatedFailedRetries = [...(gameState.failedUpgradesToRetry || [])];

      const allUpdatedCars = gameState.cars.map((carItem) => {
        if (carItem.upgradesInProgress.length === 0) return carItem;

        const matchingTeam = updatedTeams.find((t) => t.carId === carItem.id);
        const matchingEng = allUpdatedEngineers.find((e) => e.id === matchingTeam?.chiefEngineerId);
        const delivery = processUpgradesDelivery(carItem, matchingEng);

        if (matchingEng && delivery.updatedEngineer) {
          allUpdatedEngineers = allUpdatedEngineers.map((e) =>
            e.id === matchingEng.id ? delivery.updatedEngineer! : e
          );
        }

        if (matchingTeam?.id === gameState.playerTeamId) {
          delivery.deliveryResults.forEach((r) => {
            deliverySummaries.push({
              projectId: r.projectId,
              attribute: r.attribute,
              success: r.success,
              improvement: r.improvement,
              message: r.message,
            });
          });

          delivery.failedAttributes.forEach((attr) => {
            if (!updatedFailedRetries.includes(attr)) {
              updatedFailedRetries.push(attr);
            }
          });
        }

        return delivery.updatedCar;
      });

      // 5. Autonomous Rival AI decision cycle (AC-07.1, AC-07.2)
      const rivalOutcome = processRivalAiDecisionCycle(
        gameState.playerTeamId,
        updatedTeams,
        allUpdatedCars,
        moraleOutcome.updatedDrivers,
        allUpdatedEngineers
      );

      const nextState: GameState = {
        ...gameState,
        season: updatedSeason,
        teams: rivalOutcome.updatedTeams,
        drivers: rivalOutcome.updatedDrivers,
        chiefEngineers: rivalOutcome.updatedEngineers,
        cars: rivalOutcome.updatedCars,
        lastRaceResult: result,
        lastUpgradeResults: deliverySummaries.length > 0 ? deliverySummaries : undefined,
        failedUpgradesToRetry: updatedFailedRetries.length > 0 ? updatedFailedRetries : undefined,
        isBankrupt: Boolean(isBankrupt || gameState.isBankrupt),
        bankruptcyDetails: bankruptcyDetails || gameState.bankruptcyDetails,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar resultados de carrera';
      set({ error: message, isSaving: false });
      throw err;
    }
  },

  orderCarUpgrade: async (attribute: CarAttribute, isRetry = false, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
    const playerCar = gameState.cars.find((c) => c.id === playerTeam?.carId);
    const playerEngineer = gameState.chiefEngineers.find((e) => e.id === playerTeam?.chiefEngineerId);

    if (!playerTeam || !playerCar) {
      set({ error: 'No se encontró el monoplaza o la escudería del jugador' });
      return false;
    }

    const result = orderUpgrade(playerCar, playerTeam, playerEngineer, attribute, isRetry);
    if (!result.success) {
      set({ error: result.error || 'Error al encargar la mejora' });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const updatedCars = gameState.cars.map((c) => (c.id === playerCar.id ? result.updatedCar : c));
      const updatedTeams = gameState.teams.map((t) => (t.id === playerTeam.id ? result.updatedTeam : t));

      let updatedFailedRetries = gameState.failedUpgradesToRetry;
      if (isRetry && updatedFailedRetries) {
        updatedFailedRetries = updatedFailedRetries.filter((attr) => attr !== attribute);
      }

      const nextState: GameState = {
        ...gameState,
        cars: updatedCars,
        teams: updatedTeams,
        failedUpgradesToRetry: updatedFailedRetries && updatedFailedRetries.length > 0 ? updatedFailedRetries : undefined,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la mejora';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  upgradeFacility: async (type: FacilityType, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
    if (!playerTeam) {
      set({ error: 'No se encontró la escudería del jugador' });
      return false;
    }

    const result = domainUpgradeFacility(playerTeam, type);
    if (!result.success) {
      set({ error: result.error || 'Error al ampliar la instalación' });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const updatedTeams = gameState.teams.map((t) => (t.id === playerTeam.id ? result.updatedTeam : t));
      const nextState: GameState = {
        ...gameState,
        teams: updatedTeams,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la ampliación de instalaciones';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  advanceToNextRound: async (customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return;

    if (gameState.isBankrupt || (gameState.isGameOver && gameState.gameOverReason === 'bankruptcy')) {
      const errorMsg = 'Partida bloqueada: La escudería se encuentra en bancarrota (Game Over).';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }

    if (gameState.isGameOver) {
      const errorMsg = 'Partida bloqueada: La partida ha finalizado (Game Over).';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }

    if (gameState.isCareerCompleted) {
      const errorMsg = 'Partida bloqueada: Has completado las 10 temporadas reglamentarias.';
      set({ error: errorMsg });
      throw new Error(errorMsg);
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true });

    try {
      const nextIndex = gameState.season.currentRaceIndex + 1;
      let nextDrivers = gameState.drivers;
      let nextEngineers = gameState.chiefEngineers;
      let nextTeams = gameState.teams;
      let nextYouthDrivers = gameState.youthDrivers;
      let updatedManager = gameState.managerProfile;
      let seasonSummary: SeasonTransitionSummary | undefined = undefined;
      let isGameOver: boolean | undefined = gameState.isGameOver;
      let gameOverReason: 'bankruptcy' | 'dismissal_no_offers' | undefined = gameState.gameOverReason;
      let isCareerCompleted: boolean | undefined = gameState.isCareerCompleted;

      // When the season reaches the end, decrement contract years, move 0-year employees to free agency (AC-04.4),
      // train youth drivers (AC-05.3), and distribute FIA prizes, board evaluation and TP offers (AC-08.1 to AC-08.6).
      if (nextIndex >= (gameState.circuits?.length ?? 24)) {
        const expirations = processContractExpirations(nextDrivers, nextEngineers, nextTeams);
        nextDrivers = expirations.updatedDrivers;
        nextEngineers = expirations.updatedEngineers;
        nextTeams = expirations.updatedTeams;

        nextYouthDrivers = trainYouthDriversAnnual(nextYouthDrivers, nextTeams);
        const newIntake = generateYouthDriverPool(8, gameState.season.seasonNumber + 1);
        nextYouthDrivers = [...nextYouthDrivers, ...newIntake];

        const intermediateState: GameState = {
          ...gameState,
          teams: nextTeams,
          drivers: nextDrivers,
          chiefEngineers: nextEngineers,
          youthDrivers: nextYouthDrivers,
        };

        const seasonEndResult = processSeasonEnd(intermediateState);
        nextTeams = seasonEndResult.updatedTeams;
        updatedManager = seasonEndResult.updatedManager;
        seasonSummary = seasonEndResult.summary;

        if (seasonEndResult.isGameOverDismissal) {
          isGameOver = true;
          gameOverReason = 'dismissal_no_offers';
        }
        if (seasonEndResult.isCareerCompleted) {
          isCareerCompleted = true;
        }
      }

      const nextState: GameState = {
        ...gameState,
        season: {
          ...gameState.season,
          currentRaceIndex: nextIndex,
        },
        teams: nextTeams,
        drivers: nextDrivers,
        chiefEngineers: nextEngineers,
        youthDrivers: nextYouthDrivers,
        managerProfile: updatedManager,
        seasonTransitionSummary: seasonSummary,
        isGameOver,
        gameOverReason,
        isCareerCompleted,
        lastRaceResult: null,
        lastUpgradeResults: undefined,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al avanzar de ronda';
      set({ error: message, isSaving: false });
      throw err;
    }
  },

  processSeasonEnd: async (customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return null;

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const seasonEndResult = processSeasonEnd(gameState);
      const isGameOver: boolean | undefined = seasonEndResult.isGameOverDismissal ? true : gameState.isGameOver;
      const gameOverReason: 'bankruptcy' | 'dismissal_no_offers' | undefined = seasonEndResult.isGameOverDismissal ? 'dismissal_no_offers' : gameState.gameOverReason;
      const isCareerCompleted: boolean | undefined = seasonEndResult.isCareerCompleted ? true : gameState.isCareerCompleted;

      const nextState: GameState = {
        ...gameState,
        teams: seasonEndResult.updatedTeams,
        managerProfile: seasonEndResult.updatedManager,
        seasonTransitionSummary: seasonEndResult.summary,
        isGameOver,
        gameOverReason,
        isCareerCompleted,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return seasonEndResult.summary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar fin de temporada';
      set({ error: message, isSaving: false });
      return null;
    }
  },

  acceptTeamPrincipalOffer: async (targetTeamId: string, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const offer = gameState.seasonTransitionSummary?.availableOffers.find((o) => o.teamId === targetTeamId);
    if (!offer) {
      set({ error: 'Oferta no válida o no disponible' });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const currentTeamsManaged = gameState.managerProfile.teamsManaged ?? [];
      const updatedTeamsManaged = currentTeamsManaged.includes(targetTeamId)
        ? currentTeamsManaged
        : [...currentTeamsManaged, targetTeamId];

      const nextState: GameState = {
        ...gameState,
        playerTeamId: targetTeamId,
        managerProfile: {
          ...gameState.managerProfile,
          teamsManaged: updatedTeamsManaged,
        },
        seasonTransitionSummary: gameState.seasonTransitionSummary
          ? {
              ...gameState.seasonTransitionSummary,
              playerIsDismissed: false,
            }
          : undefined,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al aceptar la oferta';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  startNextSeason: async (customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    if (gameState.isCareerCompleted || gameState.managerProfile.seasonsCompleted >= 10) {
      const msg = 'Trayectoria completada: Has alcanzado el límite de 10 temporadas. Consulta tu legado histórico.';
      set({ error: msg });
      throw new Error(msg);
    }

    if (gameState.isGameOver) {
      const msg = 'Partida finalizada (Game Over).';
      set({ error: msg });
      throw new Error(msg);
    }

    if (gameState.seasonTransitionSummary?.playerIsDismissed) {
      const msg = 'Debes aceptar una oferta de rescate antes de iniciar la nueva temporada.';
      set({ error: msg });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const nextSeasonNumber = gameState.season.seasonNumber + 1;
      const nextState: GameState = {
        ...gameState,
        season: {
          seasonNumber: nextSeasonNumber,
          currentRaceIndex: 0,
          driverStandings: gameState.drivers.map((d) => ({
            driverId: d.id,
            points: 0,
            wins: 0,
            podiums: 0,
          })),
          constructorStandings: gameState.teams.map((t) => ({
            teamId: t.id,
            points: 0,
            wins: 0,
            podiums: 0,
          })),
        },
        seasonTransitionSummary: undefined,
        lastRaceResult: null,
        lastUpgradeResults: undefined,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar nueva temporada';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  hireDriver: async (driverId: string, targetSeat: 1 | 2, offeredYears = 2, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
    const candidate = gameState.drivers.find((d) => d.id === driverId);
    if (!playerTeam || !candidate) {
      set({ error: 'No se encontró la escudería o el piloto seleccionado' });
      return false;
    }

    const result = domainHireDriver(playerTeam, candidate, targetSeat, gameState.drivers, gameState.teams, offeredYears);
    if (!result.success) {
      set({ error: result.error || 'Error al fichar al piloto' });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const nextState: GameState = {
        ...gameState,
        teams: result.updatedTeams,
        drivers: result.updatedDrivers,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar el fichaje';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  hireChiefEngineer: async (engineerId: string, offeredYears = 2, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
    const candidate = gameState.chiefEngineers.find((e) => e.id === engineerId);
    if (!playerTeam || !candidate) {
      set({ error: 'No se encontró la escudería o el ingeniero seleccionado' });
      return false;
    }

    const result = domainHireChiefEngineer(playerTeam, candidate, gameState.chiefEngineers, gameState.teams, offeredYears);
    if (!result.success) {
      set({ error: result.error || 'Error al contratar al jefe de ingenieros' });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const nextState: GameState = {
        ...gameState,
        teams: result.updatedTeams,
        chiefEngineers: result.updatedEngineers,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la contratación';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  renewContract: async (employeeId: string, isDriver: boolean, addedYears = 2, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      if (isDriver) {
        const driver = gameState.drivers.find((d) => d.id === employeeId);
        if (!driver) {
          set({ error: 'Piloto no encontrado', isSaving: false });
          return false;
        }
        const result = domainRenewContract(driver, addedYears);
        if (!result.success) {
          set({ error: result.error || 'Error al renovar contrato', isSaving: false });
          return false;
        }
        const updatedDrivers = gameState.drivers.map((d) => (d.id === employeeId ? result.updatedEmployee : d));
        const nextState: GameState = {
          ...gameState,
          drivers: updatedDrivers,
          updatedAt: new Date().toISOString(),
        };
        await adapter.saveGameState(nextState);
        set({ gameState: nextState, isSaving: false });
        return true;
      } else {
        const engineer = gameState.chiefEngineers.find((e) => e.id === employeeId);
        if (!engineer) {
          set({ error: 'Ingeniero no encontrado', isSaving: false });
          return false;
        }
        const result = domainRenewContract(engineer, addedYears);
        if (!result.success) {
          set({ error: result.error || 'Error al renovar contrato', isSaving: false });
          return false;
        }
        const updatedEngineers = gameState.chiefEngineers.map((e) => (e.id === employeeId ? result.updatedEmployee : e));
        const nextState: GameState = {
          ...gameState,
          chiefEngineers: updatedEngineers,
          updatedAt: new Date().toISOString(),
        };
        await adapter.saveGameState(nextState);
        set({ gameState: nextState, isSaving: false });
        return true;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la renovación';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  signYouthDriver: async (youthDriverId: string, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
    const candidate = gameState.youthDrivers.find((y) => y.id === youthDriverId);
    if (!playerTeam || !candidate) {
      set({ error: 'No se encontró la escudería o la joven promesa' });
      return false;
    }

    const result = domainSignYouthDriver(playerTeam, candidate);
    if (!result.success) {
      set({ error: result.error || 'Error al incorporar a la joven promesa' });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const updatedTeams = gameState.teams.map((t) => (t.id === playerTeam.id ? result.updatedTeam : t));
      const updatedYouthDrivers = gameState.youthDrivers.map((y) =>
        y.id === candidate.id ? result.updatedYouthDriver : y
      );

      const nextState: GameState = {
        ...gameState,
        teams: updatedTeams,
        youthDrivers: updatedYouthDrivers,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar incorporación en la academia';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  releaseYouthDriver: async (youthDriverId: string, customAdapter?: StorageAdapter) => {
    const { gameState } = get();
    if (!gameState) return false;

    const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
    if (!playerTeam) {
      set({ error: 'No se encontró la escudería' });
      return false;
    }

    const result = domainReleaseYouthDriver(playerTeam, youthDriverId, gameState.youthDrivers);
    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const updatedTeams = gameState.teams.map((t) => (t.id === playerTeam.id ? result.updatedTeam : t));
      const nextState: GameState = {
        ...gameState,
        teams: updatedTeams,
        youthDrivers: result.updatedYouthDrivers,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al liberar piloto de la academia';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  promoteYouthDriver: async (
    youthDriverId: string,
    targetSeat: 1 | 2,
    startingSalary = 2000000,
    contractYears = 2,
    customAdapter?: StorageAdapter
  ) => {
    const { gameState } = get();
    if (!gameState) return false;

    const playerTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);
    const candidate = gameState.youthDrivers.find((y) => y.id === youthDriverId);
    if (!playerTeam || !candidate) {
      set({ error: 'No se encontró la escudería o la joven promesa' });
      return false;
    }

    const result = domainPromoteYouthDriver(
      playerTeam,
      candidate,
      targetSeat,
      gameState.drivers,
      gameState.youthDrivers,
      startingSalary,
      contractYears
    );

    if (!result.success) {
      set({ error: result.error || 'Error al ascender al piloto' });
      return false;
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      const updatedTeams = gameState.teams.map((t) => (t.id === playerTeam.id ? result.updatedTeam : t));
      const nextState: GameState = {
        ...gameState,
        teams: updatedTeams,
        drivers: result.updatedDrivers,
        youthDrivers: result.updatedYouthDrivers,
        updatedAt: new Date().toISOString(),
      };

      await adapter.saveGameState(nextState);
      set({ gameState: nextState, isSaving: false });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la promoción del piloto';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  resetGame: async (customAdapter?: StorageAdapter) => {
    const adapter = customAdapter || storageAdapter;
    set({ isLoading: true });
    try {
      await adapter.clearGameState();
      set({ gameState: null, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al resetear la partida';
      set({ error: message, isLoading: false });
    }
  },

  exportGameToJson: () => {
    const { gameState } = get();
    if (!gameState) return null;
    return serializeGameState(gameState);
  },

  importGameFromJson: async (jsonString: string, customAdapter?: StorageAdapter) => {
    const validation = validateAndParseSaveGame(jsonString);
    if (!validation.success || !validation.data) {
      const err = validation.error || 'Archivo de guardado no válido';
      set({ error: err });
      return { success: false, error: err };
    }

    const adapter = customAdapter || storageAdapter;
    set({ isSaving: true, error: null });

    try {
      await adapter.saveGameState(validation.data);
      set({ gameState: validation.data, isSaving: false });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la partida importada';
      set({ error: message, isSaving: false });
      return { success: false, error: message };
    }
  },
}));

