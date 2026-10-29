'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../application/store/gameStore';
import { Header } from '../../presentation/components/Header';

export default function SettingsPage() {
  const router = useRouter();
  const gameState = useGameStore((state) => state.gameState);
  const loadGame = useGameStore((state) => state.loadGame);
  const exportGameToJson = useGameStore((state) => state.exportGameToJson);
  const importGameFromJson = useGameStore((state) => state.importGameFromJson);
  const resetGame = useGameStore((state) => state.resetGame);

  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPwaActive, setIsPwaActive] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!gameState && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      loadGame().then((loaded) => {
        if (!loaded) {
          router.push('/new-game');
        }
      });
    }
  }, [gameState, hasAttemptedLoad, loadGame, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        setIsPwaActive(true);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleExport = () => {
    try {
      const jsonString = exportGameToJson();
      if (!jsonString) {
        setFeedbackMessage({
          type: 'error',
          text: 'No hay ninguna partida activa disponible para exportar.',
        });
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `f1manager_save_${timestamp}.json`;

      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedbackMessage({
        type: 'success',
        text: `Partida exportada correctamente en el archivo ${filename}. Puedes conservarlo o transferirlo a otro navegador o dispositivo.`,
      });
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: 'Ocurrió un error inesperado al generar el archivo JSON de guardado.',
      });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setFeedbackMessage(null);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('No se pudo leer el archivo seleccionado.');
        }

        const result = await importGameFromJson(text);

        if (result.success) {
          setFeedbackMessage({
            type: 'success',
            text: 'Partida importada con éxito. Los datos se han restaurado e indexado en IndexedDB.',
          });
        } else {
          setFeedbackMessage({
            type: 'error',
            text: result.error || 'Archivo de guardado no válido: la estructura del JSON no cumple el esquema reglamentario.',
          });
        }
      } catch (err) {
        setFeedbackMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Error al procesar el archivo de partida.',
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setFeedbackMessage({
        type: 'error',
        text: 'Error de lectura al cargar el archivo desde el dispositivo.',
      });
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  const handleResetGame = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar la partida actual? Todos los datos locales se borrarán permanentemente de IndexedDB.'
    );
    if (!confirmed) return;

    await resetGame();
    router.push('/new-game');
  };

  if (!gameState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando ajustes del sistema...</p>
      </div>
    );
  }

  const currentTeam = gameState.teams.find((t) => t.id === gameState.playerTeamId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="f1-badge f1-badge-gold" style={{ marginBottom: '0.5rem' }}>
            Ajustes del Sistema & Portabilidad
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase' }}>
            Configuración y Guardado
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Gestiona la portabilidad multiplataforma de tus partidas guardadas, modo offline PWA y almacenamiento local.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            id={feedbackMessage.type === 'error' ? 'import-save-error' : 'import-save-success'}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: feedbackMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedbackMessage.type === 'success' ? '#10B981' : '#EF4444'}`,
              color: feedbackMessage.type === 'success' ? '#10B981' : '#EF4444',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{feedbackMessage.type === 'success' ? '✓' : '⚠'}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* SECTION 1: JSON SAVE PORTABILITY */}
        <section className="f1-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Portabilidad de Partida (Formato JSON)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Exporta tu progreso completo para realizar copias de seguridad o transferirlo a cualquier otro navegador o dispositivo móvil. Las partidas importadas son validadas estrictamente con el esquema <strong>Zod</strong> para prevenir corrupción de datos.
          </p>

          <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Escudería en Curso:</span>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{currentTeam?.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Temporada / Ronda:</span>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>
                  T{gameState.season.seasonNumber} — {gameState.season.currentRaceIndex} / 24 GPs
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Presupuesto:</span>
                <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '1rem' }}>
                  ${((currentTeam?.budget ?? 0) / 1000000).toFixed(1)}M
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Última Actualización:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {new Date(gameState.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              id="export-save-btn"
              onClick={handleExport}
              className="f1-btn f1-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              <span>📥</span>
              <span>Exportar Partida (.JSON)</span>
            </button>

            <button
              id="import-save-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="f1-btn f1-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              <span>📤</span>
              <span>{isImporting ? 'Validando archivo...' : 'Importar Partida (.JSON)'}</span>
            </button>

            <input
              id="import-save-input"
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </section>

        {/* SECTION 2: PWA & OFFLINE-FIRST (SERWIST) */}
        <section className="f1-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            PWA Offline-First & Almacenamiento Local
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Esta aplicación utiliza <strong>Serwist Service Worker</strong> y <strong>IndexedDB</strong> para garantizar funcionamiento 100% autónomo sin conexión a internet ni dependencia de servidores externos.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Conexión de Red
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? '#10B981' : '#EF4444' }} />
                <span>{isOnline ? 'En línea (Online)' : 'Modo Avión / Sin Conexión (Offline)'}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Puedes continuar jugando y simulando carreras incluso sin acceso a internet.
              </p>
            </div>

            <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Service Worker (Serwist)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isPwaActive ? '#10B981' : '#F59E0B' }} />
                <span>{isPwaActive ? 'Activo y Precacheado ✓' : 'Instalado / Registrado'}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Código, estilos, circuitos y assets están cacheados localmente en el dispositivo.
              </p>
            </div>

            <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Persistencia
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                IndexedDB (idb v8)
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                Base de datos local en el navegador con guardado automático tras cada GP o mejora.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: DANGER ZONE (RESET SAVE) */}
        <section className="f1-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: '#EF4444' }}>
            Zona de Peligro
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Si deseas reiniciar por completo tu carrera deportiva y comenzar una nueva trayectoria desde cero, puedes eliminar la partida almacenada localmente.
          </p>

          <button
            id="reset-save-btn"
            onClick={handleResetGame}
            className="f1-btn"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#EF4444',
              fontSize: '0.85rem',
            }}
          >
            Borrar Partida Local y Comenzar de Nuevo
          </button>
        </section>
      </main>
    </div>
  );
}
