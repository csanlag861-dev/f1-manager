'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '../../application/store/gameStore';
import { SeasonTransitionSummary, TeamPrincipalOffer } from '../../domain/models';

interface SeasonTransitionModalProps {
  summary: SeasonTransitionSummary;
}

export function SeasonTransitionModal({ summary }: SeasonTransitionModalProps) {
  const gameState = useGameStore((state) => state.gameState);
  const acceptOffer = useGameStore((state) => state.acceptTeamPrincipalOffer);
  const startNextSeason = useGameStore((state) => state.startNextSeason);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    gameState?.playerTeamId || summary.availableOffers[0]?.teamId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const currentTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);

  const handleSelectOffer = async (offer: TeamPrincipalOffer) => {
    setSelectedTeamId(offer.teamId);
    try {
      await acceptOffer(offer.teamId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNextSeason = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await startNextSeason();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar la nueva temporada');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="season-transition-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="f1-card"
        style={{
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--accent-gold)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
            CIERRE DE TEMPORADA {summary.seasonNumber}
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
            {summary.isCareerCompleted
              ? '¡10 Temporadas Completadas!'
              : summary.isGameOverDismissal
              ? 'Destitución de Team Principal'
              : 'Balance y Evaluación Anual'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Escudería: <strong>{currentTeam?.name}</strong> | Director: <strong>{gameState.managerProfile.name}</strong>
          </p>
        </div>

        {/* 3 Metric Cards: Premios FIA, Posición y TP Rating */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          
          {/* Card 1: Posición & Objetivo */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Mundial Constructores
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0.25rem 0', color: summary.playerTargetMet ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              P{summary.playerConstructorPosition}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Objetivo Junta: <strong>P{summary.playerTargetPosition}</strong>
            </span>
          </div>

          {/* Card 2: Premio FIA */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Premio Oficial FIA
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0.25rem 0', color: 'var(--accent-gold)' }}>
              +{(summary.fiaPrizeEarned / 1000000).toFixed(0)}M €
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Ingresado en presupuesto
            </span>
          </div>

          {/* Card 3: Rating TP */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Rating de Team Principal
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0.25rem 0', color: 'var(--text-main)' }}>
              {summary.newTpRating}{' '}
              <span style={{ fontSize: '1rem', color: summary.tpRatingDelta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                ({summary.tpRatingDelta >= 0 ? `+${summary.tpRatingDelta}` : summary.tpRatingDelta})
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Anterior: {summary.previousTpRating}/100
            </span>
          </div>
        </div>

        {/* Case 1: 10 Seasons Career Completed */}
        {summary.isCareerCompleted && (
          <div style={{ textAlign: 'center', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--accent-gold)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
              HAS COMPLETADO LAS 10 TEMPORADAS REGLAMENTARIAS
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Tu trayectoria como Team Principal en la máxima categoría ha finalizado. Consulta la pantalla de legado para contemplar tu palmarés, equipos dirigidos y reconocimiento honorífico.
            </p>
            <Link
              id="view-legacy-btn"
              href="/legacy"
              className="f1-btn f1-btn-primary"
              style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
            >
              Ver Pantalla de Legado
            </Link>
          </div>
        )}

        {/* Case 2: Game Over by Dismissal without Offers */}
        {!summary.isCareerCompleted && summary.isGameOverDismissal && (
          <div style={{ textAlign: 'center', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-red)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f87171', marginBottom: '0.5rem' }}>
              GAME OVER — DESTITUCIÓN SIN OFERTAS DE RESCATE
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              La directiva ha rescindido tu contrato debido al incumplimiento de objetivos y tu valoración de mercado (Rating: {summary.newTpRating}) no cumple los requisitos mínimos de ninguna escudería de la parrilla. Tu carrera deportiva en la Fórmula 1 ha terminado.
            </p>
            <Link
              id="game-over-new-game-btn"
              href="/new-game"
              className="f1-btn f1-btn-primary"
              style={{ background: 'var(--accent-red)', padding: '0.875rem 2rem', fontSize: '1rem' }}
            >
              Comenzar Nueva Partida
            </Link>
          </div>
        )}

        {/* Case 3: Available Contract Offers (Renewal or Rescue/Movement) */}
        {!summary.isCareerCompleted && !summary.isGameOverDismissal && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              {summary.playerIsDismissed ? 'Ofertas de Rescate de Escuderías' : 'Ofertas de Contrato para la Próxima Temporada'}
            </h3>

            {summary.playerIsDismissed && (
              <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Has sido cesado de tu escudería. Debes seleccionar una de las siguientes ofertas de rescate para asumir la dirección de un nuevo equipo:
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {summary.availableOffers.map((offer) => {
                const isSelected = selectedTeamId === offer.teamId;
                return (
                  <div
                    key={offer.teamId}
                    onClick={() => handleSelectOffer(offer)}
                    style={{
                      background: isSelected ? 'rgba(225, 6, 0, 0.12)' : 'var(--bg-secondary)',
                      border: `1.5px solid ${isSelected ? 'var(--accent-red)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong style={{ fontSize: '1.125rem' }}>{offer.teamName}</strong>
                        {offer.isCurrentTeam && (
                          <span className="f1-badge f1-badge-gold" style={{ fontSize: '0.625rem' }}>
                            RENOVACIÓN ACTUAL
                          </span>
                        )}
                        {offer.isRescueOffer && (
                          <span className="f1-badge f1-badge-red" style={{ fontSize: '0.625rem' }}>
                            OFERTA DE RESCATE
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {offer.message}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        <span>Reputación: <strong>{offer.reputation}/100</strong></span>
                        <span>Objetivo de Temporada: <strong>P{offer.targetConstructorsPosition}</strong></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`f1-btn ${isSelected ? 'f1-btn-primary' : 'f1-btn-secondary'}`}
                      style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOffer(offer);
                      }}
                    >
                      {isSelected ? 'Seleccionado' : 'Elegir Escudería'}
                    </button>
                  </div>
                );
              })}
            </div>

            {errorMessage && (
              <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                {errorMessage}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                id="start-next-season-btn"
                type="button"
                className="f1-btn f1-btn-primary"
                disabled={isSubmitting || (summary.playerIsDismissed && !selectedTeamId)}
                onClick={handleStartNextSeason}
                style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}
              >
                {isSubmitting ? 'Iniciando...' : `Comenzar Temporada ${summary.seasonNumber + 1}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
