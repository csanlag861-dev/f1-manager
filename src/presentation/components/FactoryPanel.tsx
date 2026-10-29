'use client';

import React, { useState } from 'react';
import { useGameStore } from '../../application/store/gameStore';
import { Car, CarAttribute, ChiefEngineer, Team, GameUpgradeDeliverySummary } from '../../domain/models';
import {
  calculateUpgradeQuote,
  calculateFacilityUpgradeCost,
  calculateUpgradeSuccessProbability,
  FacilityType,
} from '../../domain/development';
import { defaultSimulationConfig } from '../../config/simulationConfig';

interface FactoryPanelProps {
  team: Team;
  car: Car;
  engineer?: ChiefEngineer;
  failedRetries?: CarAttribute[];
  lastUpgradeResults?: GameUpgradeDeliverySummary[];
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  return `$${amount.toLocaleString('es-ES')}`;
}

const ATTRIBUTE_LABELS: Record<CarAttribute, { name: string; desc: string; color: string }> = {
  topSpeed: {
    name: 'Velocidad Punta',
    desc: 'Mayor rendimiento en rectas y circuitos de alta velocidad.',
    color: '#00d2be',
  },
  downforce: {
    name: 'Carga Aerodinámica',
    desc: 'Mayor agarre en curvas y estabilidad en sectores técnicos.',
    color: '#3671c6',
  },
  reliability: {
    name: 'Fiabilidad Mecánica',
    desc: 'Reduce drásticamente la probabilidad de averías y DNF mecánicos.',
    color: '#27f05b',
  },
};

export function FactoryPanel({
  team,
  car,
  engineer,
  failedRetries: propFailedRetries,
  lastUpgradeResults: propLastUpgradeResults,
}: FactoryPanelProps) {
  const orderCarUpgrade = useGameStore((state) => state.orderCarUpgrade);
  const upgradeFacility = useGameStore((state) => state.upgradeFacility);
  const gameState = useGameStore((state) => state.gameState);

  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeProjects = car.upgradesInProgress || [];
  const maxUpgrades = defaultSimulationConfig.maxConcurrentUpgrades; // 2
  const isAtMaxConcurrency = activeProjects.length >= maxUpgrades;
  const failedRetries = propFailedRetries ?? gameState?.failedUpgradesToRetry ?? [];
  const lastUpgradeResults = propLastUpgradeResults ?? gameState?.lastUpgradeResults ?? [];

  const engineerMorale = engineer?.morale ?? 70;
  const successProb = calculateUpgradeSuccessProbability(engineerMorale);

  const handleOrderUpgrade = async (attribute: CarAttribute, isRetry = false) => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const ok = await orderCarUpgrade(attribute, isRetry);
      if (ok) {
        setActionMessage({
          text: isRetry
            ? `¡Reintento de mejora de ${ATTRIBUTE_LABELS[attribute].name} iniciado con 50% de descuento!`
            : `¡Proyecto de mejora de ${ATTRIBUTE_LABELS[attribute].name} encargado con éxito!`,
          type: 'success',
        });
      } else {
        const error = useGameStore.getState().error;
        setActionMessage({
          text: error || 'No se pudo encargar la mejora.',
          type: 'error',
        });
      }
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Error inesperado al encargar la mejora.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradeFacility = async (type: FacilityType) => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const ok = await upgradeFacility(type);
      if (ok) {
        const label = type === 'factory' ? 'Fábrica' : 'Simulador';
        setActionMessage({
          text: `¡Instalaciones de ${label} ampliadas con éxito!`,
          type: 'success',
        });
      } else {
        const error = useGameStore.getState().error;
        setActionMessage({
          text: error || 'No se pudo ampliar la instalación.',
          type: 'error',
        });
      }
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : 'Error inesperado al ampliar instalación.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const factoryCost = calculateFacilityUpgradeCost('factory', team.factoryLevel);
  const simulatorCost = calculateFacilityUpgradeCost('simulator', team.simulatorLevel);

  return (
    <div id="factory-car-development-panel" className="f1-card" style={{ marginBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span className="f1-badge f1-badge-red" style={{ marginBottom: '0.35rem' }}>
            Departamento Técnico & I+D
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Fábrica y Desarrollo del Monoplaza
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            id="upgrade-concurrency-badge"
            className={`f1-badge ${isAtMaxConcurrency ? 'f1-badge-red' : 'f1-badge-gold'}`}
            style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}
          >
            {`Mejoras Activas: ${activeProjects.length} / ${maxUpgrades}`}
          </span>
        </div>
      </div>

      {/* Action / Error Banner */}
      {actionMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            background: actionMessage.type === 'success' ? 'rgba(39, 240, 91, 0.15)' : 'rgba(235, 0, 41, 0.15)',
            border: `1px solid ${actionMessage.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Last Delivery Results Notification */}
      {lastUpgradeResults.length > 0 && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {lastUpgradeResults.map((r) => (
            <div
              key={r.projectId}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: r.success ? 'rgba(39, 240, 91, 0.12)' : 'rgba(235, 0, 41, 0.12)',
                border: `1px solid ${r.success ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
              }}
            >
              <span>{r.message}</span>
              <span className={`f1-badge ${r.success ? 'f1-badge-green' : 'f1-badge-red'}`}>
                {r.success ? 'Éxito' : 'Fallo Técnico'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Failed Upgrades Retry Alert (AC-03.5) */}
      {failedRetries.length > 0 && (
        <div
          id="failed-upgrades-retry-section"
          style={{
            background: 'rgba(255, 184, 0, 0.12)',
            border: '1px solid var(--accent-gold)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong style={{ color: 'var(--accent-gold)', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                Oportunidad de Reintento con Descuento (50% Dto.)
              </strong>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Una o más piezas fallaron recientemente en I+D. Aprovecha el trabajo técnico previo para reiniciar el proyecto a mitad de precio.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {failedRetries.map((attr) => {
                const retryQuote = calculateUpgradeQuote(attr, team, engineer, true);
                const canAfford = team.budget >= retryQuote.cost;
                const canOrder = !isAtMaxConcurrency && canAfford && !isProcessing;

                return (
                  <button
                    key={attr}
                    id={`retry-upgrade-btn-${attr}`}
                    onClick={() => handleOrderUpgrade(attr, true)}
                    disabled={!canOrder}
                    className="f1-btn f1-btn-primary"
                    style={{
                      background: 'var(--accent-gold)',
                      color: '#000',
                      fontSize: '0.8125rem',
                      padding: '0.5rem 1rem',
                    }}
                  >
                    {`Reintentar ${ATTRIBUTE_LABELS[attr].name} (${formatMoney(retryQuote.cost)})`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Car Attributes & Upgrade Ordering Grid */}
      <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
        Evolución y Rendimiento del Monoplaza
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {(['topSpeed', 'downforce', 'reliability'] as CarAttribute[]).map((attr) => {
          const val = car[attr];
          const info = ATTRIBUTE_LABELS[attr];
          const quote = calculateUpgradeQuote(attr, team, engineer, false);
          const canAfford = team.budget >= quote.cost;
          const isMaxed = val >= 100;
          const isDeveloping = activeProjects.some((p) => p.attribute === attr);
          const canOrder = !isAtMaxConcurrency && canAfford && !isMaxed && !isProcessing;

          return (
            <div
              key={attr}
              style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{info.name}</h4>
                  <strong style={{ color: info.color, fontSize: '1.125rem' }}>{`${val}/100`}</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {info.desc}
                </p>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: `${val}%`,
                      height: '100%',
                      background: info.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Commission Upgrade Controls */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  <span>Coste estimado:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{formatMoney(quote.cost)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Plazo de entrega:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{quote.racesRequired} GP{quote.racesRequired > 1 ? 's' : ''}</strong>
                </div>

                <button
                  id={`order-upgrade-btn-${attr}`}
                  onClick={() => handleOrderUpgrade(attr, false)}
                  disabled={!canOrder}
                  className="f1-btn f1-btn-primary"
                  style={{
                    width: '100%',
                    fontSize: '0.8125rem',
                    padding: '0.6rem',
                    opacity: canOrder ? 1 : 0.6,
                    cursor: canOrder ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isMaxed
                    ? 'Nivel Máximo (100)'
                    : isAtMaxConcurrency
                    ? 'Fábrica Ocupada (Máx 2)'
                    : !canAfford
                    ? 'Fondos Insuficientes'
                    : `Encargar Mejora (+${quote.improvement} pts)`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Projects in Progress */}
      <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--accent-gold)' }}>
          {`Proyectos Técnicos en Curso en la Fábrica (${activeProjects.length} / ${maxUpgrades})`}
        </h3>

        {activeProjects.length === 0 ? (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            No hay desarrollos activos actualmente. La fábrica tiene 2 puestos disponibles para iniciar mejoras.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeProjects.map((project, index) => (
              <div
                key={project.id}
                id={`active-project-${project.attribute}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.6875rem', marginRight: '0.5rem' }}>
                    {`Proyecto ${index + 1}`}
                  </span>
                  <strong>{ATTRIBUTE_LABELS[project.attribute].name} (+{project.improvement} pts)</strong>
                  {project.isRetry && (
                    <span className="f1-badge f1-badge-green" style={{ fontSize: '0.6875rem', marginLeft: '0.5rem' }}>
                      Reintento 50%
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    Coste: {formatMoney(project.cost)}
                  </span>
                  <span className="f1-badge f1-badge-blue">
                    {`Entrega: ${project.racesRemaining} GP${project.racesRemaining > 1 ? 's' : ''} restante${project.racesRemaining > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Facilities & Engineer Section (AC-03.6) */}
      <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
        Instalaciones y Departamento de Ingeniería
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {/* Facility 1: Factory */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Fábrica de Monoplazas</h4>
            <span id="factory-level-badge" className="f1-badge f1-badge-gold">
              {`Nivel ${team.factoryLevel} / 5`}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Acelera los plazos de entrega y reduce el coste económico de cada paquete técnico en I+D.
          </p>

          <button
            id="upgrade-factory-btn"
            onClick={() => handleUpgradeFacility('factory')}
            disabled={team.factoryLevel >= 5 || team.budget < factoryCost || isProcessing}
            className="f1-btn f1-btn-primary"
            style={{ width: '100%', fontSize: '0.8125rem', padding: '0.6rem' }}
          >
            {team.factoryLevel >= 5
              ? 'Nivel Máximo (5)'
              : team.budget < factoryCost
              ? `Requiere ${formatMoney(factoryCost)}`
              : `Ampliar a Nivel ${team.factoryLevel + 1} (${formatMoney(factoryCost)})`}
          </button>
        </div>

        {/* Facility 2: Simulator */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Simulador de Conducción</h4>
            <span id="simulator-level-badge" className="f1-badge f1-badge-blue">
              {`Nivel ${team.simulatorLevel} / 5`}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Optimiza la progresión de ritmo de los pilotos y potencia el desarrollo anual de las jóvenes promesas.
          </p>

          <button
            id="upgrade-simulator-btn"
            onClick={() => handleUpgradeFacility('simulator')}
            disabled={team.simulatorLevel >= 5 || team.budget < simulatorCost || isProcessing}
            className="f1-btn f1-btn-primary"
            style={{ width: '100%', fontSize: '0.8125rem', padding: '0.6rem' }}
          >
            {team.simulatorLevel >= 5
              ? 'Nivel Máximo (5)'
              : team.budget < simulatorCost
              ? `Requiere ${formatMoney(simulatorCost)}`
              : `Ampliar a Nivel ${team.simulatorLevel + 1} (${formatMoney(simulatorCost)})`}
          </button>
        </div>

        {/* Engineer Morale & Success Influence */}
        {engineer && (
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Jefe de Ingenieros</h4>
              <span className="f1-badge f1-badge-red">{engineer.name}</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {`Eficiencia I+D: `}<strong>{`${engineer.developmentEfficiency}/100`}</strong>{` | Setup: `}<strong>{`${engineer.setupPerformance}/100`}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
              <span>Moral del Ingeniero:</span>
              <strong style={{ color: engineerMorale >= 75 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
                {`${engineerMorale}%`}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span>Probabilidad Éxito I+D:</span>
              <strong style={{ color: 'var(--text-main)' }}>{`${(successProb * 100).toFixed(1)}%`}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
