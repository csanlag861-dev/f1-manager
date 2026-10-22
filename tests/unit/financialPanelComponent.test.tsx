import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FinancialPanel } from '@/presentation/components/FinancialPanel';
import { FinancialOverview } from '@/domain/economy';

describe('Tarea 3.5: Componente Visual FinancialPanel (AC-02.1)', () => {
  const dummyOverview: FinancialOverview = {
    currentBudget: 35_000_000,
    baseBudget: 40_000_000,
    currentDebt: 0,
    maxAllowedDebt: 10_000_000,
    remainingDebtMargin: 10_000_000,
    debtUsagePercentage: 0,
    isBankrupt: false,
    projectedIncome: {
      sponsorName: 'Apex Global',
      baseIncome: 2_000_000,
      bonusIncome: 500_000,
      bonusTargetDescription: 'Al menos un monoplaza en el Top 10',
      maxPotentialIncome: 2_500_000,
    },
    fixedExpenses: {
      driversSalariesCost: 750_000,
      engineerSalaryCost: 100_000,
      totalSalariesCost: 850_000,
      factoryMaintenanceCost: 500_000,
      simulatorMaintenanceCost: 150_000,
      totalMaintenanceCost: 650_000,
      totalFixedExpenses: 1_500_000,
    },
    projectedNet: {
      guaranteed: 500_000,
      potentialWithBonus: 1_000_000,
    },
  };

  it('renderiza con precisión todos los indicadores requeridos por AC-02.1', () => {
    const html = renderToString(<FinancialPanel overview={dummyOverview} />);

    // 1. Título y Solvencia
    expect(html).toContain('Panel de Control Financiero');
    expect(html).toContain('Solvente');

    // 2. Saldo actual y Presupuesto Base
    expect(html).toContain('financial-current-balance');
    expect(html).toContain('$35.00M');
    expect(html).toContain('$40.00M');

    // 3. Margen de deuda antes de bancarrota
    expect(html).toContain('financial-debt-margin');
    expect(html).toContain('Margen antes de Bancarrota');
    expect(html).toContain('$10.00M');

    // 4. Ingresos proyectados
    expect(html).toContain('financial-projected-income');
    expect(html).toContain('Apex Global');
    expect(html).toContain('+$2.00M');
    expect(html).toContain('+$500K');
    expect(html).toContain('Al menos un monoplaza en el Top 10');
    expect(html).toContain('+$2.50M');

    // 5. Desglose de costes fijos
    expect(html).toContain('financial-fixed-expenses');
    expect(html).toContain('-$750K'); // Salarios pilotos
    expect(html).toContain('-$100K'); // Salario ingeniero
    expect(html).toContain('-$500K'); // Mantenimiento fábrica
    expect(html).toContain('-$150K'); // Mantenimiento simulador
    expect(html).toContain('-$1.50M'); // Total fijos

    // 6. Balance operativo neto proyectado
    expect(html).toContain('financial-net-projection');
    expect(html).toContain('+$500K');
    expect(html).toContain('+$1.00M');
  });

  it('renderiza indicadores de alerta y estado de quiebra cuando la escudería está en bancarrota', () => {
    const bankruptOverview: FinancialOverview = {
      ...dummyOverview,
      currentBudget: -12_000_000,
      currentDebt: 12_000_000,
      remainingDebtMargin: 0,
      debtUsagePercentage: 100,
      isBankrupt: true,
    };

    const html = renderToString(<FinancialPanel overview={bankruptOverview} />);

    expect(html).toContain('BANCARROTA DECLARADA');
    expect(html).toContain('-$12.00M');
    expect(html).toContain('$0');
  });
});
