import React from 'react';

/**
 * TutorialOverlay — Tutorial guiado de 6 pasos para nuevos jugadores.
 *
 * IMPORTANTE: todos los elementos usan position:fixed, vive FUERA
 * del .game-container sin afectar el layout flex.
 *
 * Técnica de highlight: el componente Spotlight usa box-shadow de 9999px
 * para oscurecer toda la pantalla EXCEPTO su propio área, sin overlay extra.
 */
export default function TutorialOverlay({
  step,
  gold,
  characters,
  squad,
  activeTab,
  onNext,
  onComplete,
}) {
  const cruelTalon = characters?.[0];
  const cruelTalonUnlocked = cruelTalon?.level > 0;
  const cruelTalonDeployed = squad?.includes('c1');

  return (
    <>
      {/* ── PASO 0: Toca al enemigo ── Highlight: zona de batalla */}
      {step === 0 && (
        <>
          <Spotlight
            top="18%"
            left="max(0px, calc(50vw - 240px))"
            width="min(480px, 100vw)"
            height="calc(82vh - 70px)"
            borderRadius="16px 16px 0 0"
          />
          <TutorialBubble
            position={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}
          >
            <BubbleTitle><img src="/icons/biomasa.png" alt="" style={{width:'18px', verticalAlign:'middle', marginRight:'6px'}}/>INICIACIÓN</BubbleTitle>
            <p>¡Bienvenido, Operativo! <b>Toca el área iluminada</b> para extraer Biomasa. Necesitas al menos <b>10 unidades</b>.</p>
            <ProgressBar value={gold} max={10} />
            {gold >= 10 && (
              <TutorialButton onClick={onNext}>Continuar →</TutorialButton>
            )}
          </TutorialBubble>
        </>
      )}

      {/* ── PASO 1: Abrir el Laboratorio ── Highlight: primer botón nav bar */}
      {step === 1 && (
        <>
          <Spotlight
            bottom="0"
            left="max(0px, calc(50vw - 240px))"
            width="min(96px, calc(100vw / 5))"
            height="70px"
            borderRadius="12px 12px 0 0"
          />
          <TutorialBubble
            position={{ bottom: '85px', left: '50%', transform: 'translateX(-50%)' }}
            arrowDir="bottom"
          >
            <BubbleTitle>🧬 EL LABORATORIO</BubbleTitle>
            <p>Pulsa el botón <b>Laboratorio</b> iluminado en la esquina inferior izquierda.</p>
            {activeTab === 'heroes' && (
              <TutorialButton onClick={onNext}>Estoy dentro →</TutorialButton>
            )}
          </TutorialBubble>
        </>
      )}

      {/* ── PASO 2: Incubar Cruel Talon ── Highlight: zona del panel inferior */}
      {step === 2 && (
        <>
          <Spotlight
            top="35%"
            left="max(0px, calc(50vw - 240px))"
            width="min(480px, 100vw)"
            height="55%"
            borderRadius="16px 16px 0 0"
          />
          <TutorialBubble
            position={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}
          >
            <BubbleTitle>🔬 INCUBACIÓN</BubbleTitle>
            <p>Localiza a <b>Cruel Talon</b> y pulsa <b>Incubar/Sobrecarga</b> para subirla al nivel 1.</p>
            {cruelTalonUnlocked && (
              <TutorialButton onClick={onNext}>Incubada →</TutorialButton>
            )}
          </TutorialBubble>
        </>
      )}

      {/* ── PASO 3: Desplegar al escuadrón ── Highlight: zona del panel inferior */}
      {step === 3 && (
        <>
          <Spotlight
            top="35%"
            left="max(0px, calc(50vw - 240px))"
            width="min(480px, 100vw)"
            height="55%"
            borderRadius="16px 16px 0 0"
          />
          <TutorialBubble
            position={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}
          >
            <BubbleTitle>🛡️ DESPLIEGUE</BubbleTitle>
            <p>Un aliado en el laboratorio <b>no ataca</b>. Pulsa <b>Desplegar</b> en la ficha de Cruel Talon para enviarla al combate.</p>
            {cruelTalonDeployed && (
              <TutorialButton onClick={onNext}>Desplegada →</TutorialButton>
            )}
          </TutorialBubble>
        </>
      )}

      {/* ── PASO 4: Info Sectores y Jefes ── Sin spotlight (info pura) */}
      {step === 4 && (
        <>
          {/* Overlay plano sin spotlight para pasos informativos */}
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9000, pointerEvents: 'none' }} />
          <TutorialBubble
            position={{ top: '25%', left: '50%', transform: 'translateX(-50%)' }}
          >
            <BubbleTitle>🎯 SECTORES Y JEFES</BubbleTitle>
            <p>Cada <b>5 sectores</b> enfrentarás a un Jefe con temporizador. Si el tiempo se agota, <b>retrocederás</b> un nivel. ¡Mantente activo!</p>
            <TutorialButton onClick={onNext}>Entendido →</TutorialButton>
          </TutorialBubble>
        </>
      )}

      {/* ── PASO 5: Completado ── */}
      {step === 5 && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, pointerEvents: 'none' }} />
          <TutorialBubble
            position={{ top: '28%', left: '50%', transform: 'translateX(-50%)' }}
            wide
          >
            <BubbleTitle><img src="/icons/biomasa.png" alt="" style={{width:'18px', verticalAlign:'middle', marginRight:'6px'}}/>PROTOCOLO COMPLETO</BubbleTitle>
            <p>Has demostrado aptitud, Comandante. La Colmena te recompensa por tu iniciativa.</p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0.8rem 0',
              padding: '0.6rem 1rem',
              background: 'rgba(132,204,22,0.1)',
              border: '1px solid rgba(132,204,22,0.4)',
              borderRadius: '8px',
              color: '#84cc16',
              fontWeight: '800',
              fontSize: '1.1rem',
            }}>
              🎁 +50 🌌 Materia Oscura
            </div>
            <TutorialButton onClick={onComplete} primary>
              EMPEZAR BIO-EXODUS
            </TutorialButton>
          </TutorialBubble>
        </>
      )}
    </>
  );
}

/* ─── Spotlight ──────────────────────────────────────────────────────── */
/**
 * Crea un "recorte" iluminado en la pantalla oscura.
 * La técnica: box-shadow de 9999px de spread cubre toda la pantalla
 * excepto el propio elemento, que permanece transparente (= zona clickeable visible).
 */
function Spotlight({ top, left, bottom, right, width, height, borderRadius = '16px' }) {
  return (
    <div
      style={{
        position: 'fixed',
        top, left, bottom, right,
        width, height,
        borderRadius,
        // Este box-shadow actúa como el overlay oscuro de toda la pantalla
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
        // Borde brillante para indicar que es la zona activa
        border: '2px solid rgba(6,182,212,0.85)',
        outline: '0px solid rgba(6,182,212,0)',
        animation: 'tutorialSpotlight 2s ease-in-out infinite',
        zIndex: 9000,
        pointerEvents: 'none', // los clicks pasan al juego en la zona iluminada
      }}
    />
  );
}

/* ─── Burbuja de diálogo ─────────────────────────────────────────────── */
function TutorialBubble({ children, position, arrowDir, wide }) {
  return (
    <div
      style={{
        position: 'fixed',
        ...position,
        width: wide ? '320px' : '270px',
        background: 'linear-gradient(135deg, #170d22 0%, #0a0a14 100%)',
        border: '1px solid rgba(6,182,212,0.6)',
        borderRadius: '14px',
        padding: '1.1rem 1.2rem',
        color: '#e2e8f0',
        fontSize: '0.88rem',
        lineHeight: '1.5',
        zIndex: 9001,
        boxShadow: '0 0 25px rgba(6,182,212,0.25), 0 8px 32px rgba(0,0,0,0.6)',
        pointerEvents: 'auto',
        animation: 'tutorialBubbleIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}
    >
      {children}
      {arrowDir === 'bottom' && (
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '10px solid rgba(6,182,212,0.6)',
        }} />
      )}
    </div>
  );
}

/* ─── Título de burbuja ──────────────────────────────────────────────── */
function BubbleTitle({ children }) {
  return (
    <div style={{
      fontWeight: '800',
      fontSize: '0.9rem',
      color: '#06b6d4',
      marginBottom: '0.5rem',
      letterSpacing: '0.5px',
    }}>
      {children}
    </div>
  );
}

/* ─── Botón de tutorial ──────────────────────────────────────────────── */
function TutorialButton({ children, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        marginTop: '0.9rem',
        padding: '0.5rem 1rem',
        background: primary
          ? 'linear-gradient(135deg, #06b6d4, #7c3aed)'
          : 'rgba(6,182,212,0.15)',
        border: '1px solid rgba(6,182,212,0.5)',
        borderRadius: '8px',
        color: 'white',
        fontFamily: 'inherit',
        fontSize: '0.82rem',
        fontWeight: '800',
        cursor: 'pointer',
        letterSpacing: primary ? '1px' : '0',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Barra de progreso ──────────────────────────────────────────────── */
function ProgressBar({ value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginTop: '0.7rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', alignItems: 'center' }}>
        <span><img src="/icons/biomasa.png" alt="" style={{width:'14px', verticalAlign:'middle', marginRight:'4px'}}/>Biomasa</span>
        <span>{Math.floor(value)} / {max}</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #06b6d4, #84cc16)', borderRadius: '10px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
