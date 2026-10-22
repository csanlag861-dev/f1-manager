import React from 'react';
import { FinancialOverview } from '../../domain/economy';

interface FinancialPanelProps {
  overview: FinancialOverview;
}

function formatMoney(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted: string;
  if (absAmount >= 1_000_000) {
    formatted = `$${(absAmount / 1_000_000).toFixed(2)}M`;
  } else if (absAmount >= 1_000) {
    formatted = `$${Math.round(absAmount / 1_000)}K`;
  } else {
    formatted = `$${absAmount.toLocaleString('es-ES')}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

export function FinancialPanel({ overview }: FinancialPanelProps) {
  const isPositiveBudget = overview.currentBudget >= 0;
  const isWarningDebt = overview.debtUsagePercentage >= 50 && overview.debtUsagePercentage < 80;
  const isCriticalDebt = overview.debtUsagePercentage >= 80;

  return (
    <div id="financial-control-panel" className="f1-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span className="f1-badge f1-badge-gold" style={{ marginBottom: '0.35rem' }}>
            Auditoría Económica Oficial
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Panel de Control Financiero
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {overview.isBankrupt ? (
            <span className="f1-badge f1-badge-red" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}>
              BANCARROTA DECLARADA
            </span>
          ) : isPositiveBudget ? (
            <span className="f1-badge f1-badge-green" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}>
              Solvente
            </span>
          ) : (
            <span className="f1-badge f1-badge-red" style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}>
              Saldo Negativo (Crédito Activo)
            </span>
          )}
        </div>
      </div>

      {/* Primary Financial Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Metric 1: Current Balance */}
        <div
          id="financial-current-balance"
          style={{
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            borderLeft: `4px solid ${isPositiveBudget ? 'var(--accent-green)' : 'var(--accent-red)'}`,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
            Saldo Actual en Cuenta
          </span>
          <div style={{ fontSize: '1.875rem', fontWeight: 900, color: isPositiveBudget ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {formatMoney(overview.currentBudget)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Presupuesto base de escudería: {formatMoney(overview.baseBudget)}
          </span>
        </div>

        {/* Metric 2: Debt & Margin before Bankruptcy */}
        <div
          id="financial-debt-margin"
          style={{
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            borderLeft: `4px solid ${isCriticalDebt ? 'var(--accent-red)' : isWarningDebt ? 'var(--accent-gold)' : 'var(--accent-blue)'}`,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
            Margen antes de Bancarrota
          </span>
          <div style={{ fontSize: '1.875rem', fontWeight: 900, color: isCriticalDebt ? 'var(--accent-red)' : 'var(--text-main)' }}>
            {formatMoney(overview.remainingDebtMargin)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            <span>Deuda: {formatMoney(overview.currentDebt)}</span>
            <span>Límite máx: {formatMoney(overview.maxAllowedDebt)}</span>
          </div>

          {/* Credit limit usage bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
            <div
              style={{
                width: `${overview.debtUsagePercentage}%`,
                height: '100%',
                background: isCriticalDebt ? 'var(--accent-red)' : isWarningDebt ? 'var(--accent-gold)' : 'var(--accent-green)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Metric 3: Guaranteed Net per GP */}
        <div
          id="financial-net-projection"
          style={{
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            borderLeft: `4px solid ${overview.projectedNet.guaranteed >= 0 ? 'var(--accent-green)' : 'var(--accent-gold)'}`,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
            Balance Neto Proyectado / GP
          </span>
          <div style={{ fontSize: '1.875rem', fontWeight: 900, color: overview.projectedNet.guaranteed >= 0 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>
            {overview.projectedNet.guaranteed >= 0 ? `+${formatMoney(overview.projectedNet.guaranteed)}` : formatMoney(overview.projectedNet.guaranteed)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Con bonus de objetivo: <strong style={{ color: 'var(--accent-gold)' }}>{overview.projectedNet.potentialWithBonus >= 0 ? `+${formatMoney(overview.projectedNet.potentialWithBonus)}` : formatMoney(overview.projectedNet.potentialWithBonus)}</strong>
          </span>
        </div>
      </div>

      {/* Details Grid: Projected Income vs Fixed Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Box 1: Projected Income */}
        <div id="financial-projected-income" style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--accent-green)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Ingresos Proyectados por GP</span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>{overview.projectedIncome.sponsorName}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Pago Fijo Base (Garantizado):</span>
              <strong style={{ color: 'var(--accent-green)' }}>{`+${formatMoney(overview.projectedIncome.baseIncome)}`}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Bonus por Objetivo:</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>{overview.projectedIncome.bonusTargetDescription}</span>
              </div>
              <strong style={{ color: 'var(--accent-gold)' }}>{`+${formatMoney(overview.projectedIncome.bonusIncome)}`}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.35rem', fontWeight: 800 }}>
              <span>Ingreso Máximo Potencial:</span>
              <span style={{ color: 'var(--accent-green)' }}>{`+${formatMoney(overview.projectedIncome.maxPotentialIncome)}`}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Fixed Expenses Breakdown */}
        <div id="financial-fixed-expenses" style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--accent-red)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Desglose de Costes Fijos por GP</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Prorrateo 1/24</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Salarios Pilotos Titulares:</span>
              <strong style={{ color: 'var(--accent-red)' }}>{`-${formatMoney(overview.fixedExpenses.driversSalariesCost)}`}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Salario Jefe de Ingenieros:</span>
              <strong style={{ color: 'var(--accent-red)' }}>{`-${formatMoney(overview.fixedExpenses.engineerSalaryCost)}`}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mantenimiento Fábrica:</span>
              <strong style={{ color: 'var(--accent-red)' }}>{`-${formatMoney(overview.fixedExpenses.factoryMaintenanceCost)}`}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Mantenimiento Simulador:</span>
              <strong style={{ color: 'var(--accent-red)' }}>{`-${formatMoney(overview.fixedExpenses.simulatorMaintenanceCost)}`}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.35rem', fontWeight: 800 }}>
              <span>Total Costes Fijos / GP:</span>
              <span style={{ color: 'var(--accent-red)' }}>{`-${formatMoney(overview.fixedExpenses.totalFixedExpenses)}`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
