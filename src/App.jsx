import React, { useState, useCallback } from 'react';
import './index.css';
import { useGameEngine } from './hooks/useGameEngine';
import { BOXES, ITEMS, RARITY_NAMES, RARITY_COLORS } from './data/lootboxes';
import TutorialOverlay from './components/TutorialOverlay';

const SYNERGY_DATA = {
  sangreYHueso: {
    name: 'Sangre y Hueso',
    role: 'carnicero',
    icon: '🪚',
    desc: 'La brutalidad física de tus cepas aumenta la fuerza de impacto.',
    bonus: '+15% Daño Click, +10% Inercia Global',
    req: '2+ Carniceros',
    short: '+15% Click, +10% Inercia'
  },
  contaminacionCruzada: {
    name: 'Contaminación Cruzada',
    role: 'toxico',
    icon: '🧪',
    desc: 'Los residuos químicos permiten una extracción más eficiente de biomasa.',
    bonus: '+25% Biomasa obtenida de enemigos',
    req: '2+ Tóxicos',
    short: '+25% Biomasa'
  },
  menteColmena: {
    name: 'Mente Colmena',
    role: 'psionico',
    icon: '⚡',
    desc: 'La conexión neuronal sincroniza los ataques de todo el escuadrón.',
    bonus: '+15% Velocidad de Ataque Global',
    req: '2+ Psiónicos',
    short: '+15% Vel. Ataque'
  },
  depredadoresApex: {
    name: 'Depredadores Apex',
    role: 'asesino',
    icon: '🔪',
    desc: 'La precisión quirúrgica revela puntos débiles en los Sentinel.',
    bonus: '+15% Probabilidad de Crítico Global',
    req: '2+ Asesinos',
    short: '+15% Prob. Crítico'
  },
  mutacionPerfecta: {
    name: 'Mutación Perfecta',
    role: 'especialista',
    icon: '🌟',
    desc: 'El equilibrio biológico definitivo desata el potencial viral.',
    bonus: '+30% Inercia Global, +30% Biomasa',
    req: '1 de cada Rol distinto',
    short: '+30% DPS, +30% Biomasa'
  }
};

function App() {
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCepa, setSelectedCepa] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(null); // null = no activo, 0-5 = paso activo
  const [selectedBox, setSelectedBox] = useState(null);
  const [revealedItem, setRevealedItem] = useState(null);
  const [pickingSlot, setPickingSlot] = useState(null);
  const [filterStar, setFilterStar] = useState(null);
  const [filterStat, setFilterStat] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [boxesTab, setBoxesTab] = useState('capsules');
  const [inventoryTab, setInventoryTab] = useState('list');
  const [damageTexts, setDamageTexts] = useState([]);
  const [dpsTexts, setDpsTexts] = useState([]);
  const [statsOpen, setStatsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [multiRevealItems, setMultiRevealItems] = useState(null);
  const [heroAnimations, setHeroAnimations] = useState({});
  const [fusionModalOpen, setFusionModalOpen] = useState(false);
  const [fusionItems, setFusionItems] = useState([]);
  const [fusionConfirmData, setFusionConfirmData] = useState(null);
  const [fusionAnimating, setFusionAnimating] = useState(false);
  const [fusionResultItem, setFusionResultItem] = useState(null);
  const [scrapConfirmData, setScrapConfirmData] = useState(null);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adResult, setAdResult] = useState(null);
  const [synergyHelpOpen, setSynergyHelpOpen] = useState(false);
  const [, setTick] = useState(0);

  // Force re-render every second for timers
  React.useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const squadRef = React.useRef([]);

  const handleHeroAttack = useCallback((char, damageHit, isCrit = false) => {
    const id = Date.now() + Math.random();
    const x = (40 + Math.random() * 20) + '%';
    const y = (25 + Math.random() * 15) + '%';
    setHeroAnimations(prev => ({ ...prev, [char.id]: true }));
    setTimeout(() => setHeroAnimations(prev => ({ ...prev, [char.id]: false })), 150);
    setDpsTexts(prev => [...prev, { id, x, y, color: char.color, val: damageHit, isCrit }]);
    setTimeout(() => setDpsTexts(prev => prev.filter(t => t.id !== id)), 1000);
    const enemyEl = document.getElementById('main-enemy');
    if (enemyEl) {
      enemyEl.classList.remove('enemy-hit');
      void enemyEl.offsetWidth;
      enemyEl.classList.add('enemy-hit');
    }
  }, []);

  const game = useGameEngine(handleHeroAttack);
  squadRef.current = game.squad;

  React.useEffect(() => {
    if (game.isLoaded) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        // Activar tutorial si es la primera vez
        if (!game.tutorialCompleted) {
          setTutorialStep(0);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [game.isLoaded, game.tutorialCompleted]);

  const hpPercent = Math.max(0, (game.enemy.hp / game.enemy.maxHp) * 100);

  const onZoneTap = (e) => {
    const { damage, isCrit } = game.handleTap();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 20;
    const id = Date.now() + Math.random();
    setDamageTexts(prev => [...prev, { id, x, y, val: game.formatNumber(damage), isCrit }]);
    setTimeout(() => setDamageTexts(prev => prev.filter(t => t.id !== id)), 800);
  };

  const handleTabClick = (tab) => {
    if (activeTab === tab) { setActiveTab(null); }
    else { setActiveTab(tab); setSelectedCepa(null); setPickingSlot(null); setFilterStar(null); setFilterStat(null); }
  };

  const handleOpenBox = (boxId, qty = 1) => {
    if (qty === 1) {
      const item = game.openBox(boxId);
      if (item) setRevealedItem(item);
    } else {
      const items = game.openBoxMulti(boxId, qty);
      if (items && items.length > 0) setMultiRevealItems(items);
    }
  };

  // Helper: ítems equipados en una cepa (máx 3 slots)
  const getEquippedItems = (charId) =>
    game.inventory.filter(i => i.equippedTo === charId);

  // Helper: ítems sin equipar disponibles (con filtros)
  const getAvailableItems = (applyFilters = false) => {
    let items = game.inventory.filter(i => !i.equippedTo);
    if (applyFilters) {
      if (filterStar) items = items.filter(i => i.stars === filterStar);
      if (filterStat) items = items.filter(i => i.stat === filterStat);
      if (filterType) items = items.filter(i => i.type === filterType);
    }
    return items;
  };

  // Helper: todos los ítems del inventario (con filtros)
  const getAllInventoryItems = () => {
    let items = [...game.inventory];
    if (inventoryTab === 'scrap') items = items.filter(i => i.stars < 6);
    if (filterStar) items = items.filter(i => i.stars === filterStar);
    if (filterStat) items = items.filter(i => i.stat === filterStat);
    if (filterType) items = items.filter(i => i.type === filterType);
    return items;
  };

  const starStr = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));

  return (
    <>
      {/* ── SPLASH SCREEN ── */}
      <div className={`splash-screen ${!showSplash ? 'hidden' : ''}`}>
        <div className="splash-logo-container">
          <img src="/icon.png" alt="Bio-Exodus" className="splash-logo" />
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar-fill"></div>
        </div>
        <p className="loading-text">Sincronizando Cepas...</p>
      </div>

      <div className="game-container">
        {/* ── Offline Gold Alert ── */}
        {game.offlineGoldEarned > 0 && (
          <div className="fullscreen-overlay">
            <div className="glass offline-card">
              <h2 style={{ color: 'var(--accent-gold)' }}>¡Ciclo de Incubación Completo!</h2>
              <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>La colmena asimiló biomasa mientras dormías:</p>
              <h3 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', textShadow: '0 0 10px rgba(132, 204, 22, 0.5)' }}>
                <img src="/icons/biomasa.png" alt="" style={{ width: '14px', verticalAlign: 'middle' }} /> {game.formatNumber(game.offlineGoldEarned)}
              </h3>
              <button className="upgrade-btn" onClick={game.clearOfflineGold}>Asimilar</button>
            </div>
          </div>
        )}

        {/* ── Item Reveal Modal ── */}
        {/* ── Synergy Help Modal ── */}
        {synergyHelpOpen && (
          <div className="fullscreen-overlay" onClick={() => setSynergyHelpOpen(false)}>
            <div className="stats-panel glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div className="stats-panel-header">
                <h3>🧬 Archivo de Sinergias</h3>
                <button className="sheet-close-btn" onClick={() => setSynergyHelpOpen(false)}>✖</button>
              </div>
              <div className="stats-body" style={{ padding: '1rem', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
                  El despliegue táctico de diferentes cepas activa bonos de resonancia. Combina roles para maximizar tu Inercia Viral.
                </p>
                
                {Object.entries(SYNERGY_DATA).map(([key, data]) => {
                  const isActive = game.squadSynergies[key];
                  const contributingHeroes = game.squad.map(id => game.characters.find(c => c.id === id)).filter(c => {
                    if (key === 'mutacionPerfecta') return true; 
                    return c.role === data.role;
                  });

                  let progressText = "";
                  let statusDetail = null;
                  if (key === 'mutacionPerfecta') {
                    const rolesInSquad = Array.from(new Set(game.squad.map(id => game.characters.find(c => c.id === id)?.role).filter(Boolean)));
                    progressText = `${rolesInSquad.length} / 4 roles`;
                    if (!isActive) {
                      const allRoles = ['asesino', 'toxico', 'psionico', 'carnicero'];
                      const missingRoles = allRoles.filter(r => !rolesInSquad.includes(r));
                      statusDetail = `Faltan: ${missingRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')}`;
                    }
                  } else {
                    progressText = `${contributingHeroes.length} / 2`;
                    if (!isActive && contributingHeroes.length < 2) {
                      statusDetail = `Falta ${2 - contributingHeroes.length} ${data.role}`;
                    }
                  }

                  return (
                    <div key={key} className={`synergy-help-card ${isActive ? 'active' : ''}`} style={{ 
                      background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                      padding: '1rem',
                      borderRadius: '12px',
                      marginBottom: '1rem',
                      position: 'relative'
                    }}>
                      {isActive && <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent-cyan)', color: 'black', fontSize: '0.6rem', padding: '2px 8px', fontWeight: 'bold', borderBottomLeftRadius: '8px' }}>ACTIVA</div>}
                      
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', filter: isActive ? 'drop-shadow(0 0 5px white)' : 'grayscale(1)' }}>{data.icon}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: isActive ? 'white' : 'var(--text-secondary)' }}>{data.name}</h4>
                          <span style={{ fontSize: '0.7rem', color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>{data.req} • <strong>{progressText}</strong></span>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontStyle: 'italic', lineHeight: '1.3' }}>{data.desc}</p>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem', borderLeft: `3px solid ${isActive ? '#84cc16' : '#555'}` }}>
                        <strong style={{ color: isActive ? '#84cc16' : 'var(--text-secondary)' }}>BONUS:</strong> {data.bonus}
                      </div>

                      {statusDetail && !isActive && <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '6px', fontWeight: 'bold' }}>⚠️ {statusDetail}</div>}

                      {contributingHeroes.length > 0 && (
                        <div style={{ marginTop: '0.8rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {contributingHeroes.map(h => (
                            <span key={h.id} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: '12px', border: `1px solid ${h.color}44` }}>
                              {h.emoji} {h.name.split(': ')[1]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {revealedItem && (
          <div className="fullscreen-overlay" onClick={() => setRevealedItem(null)}>
            <div className="item-reveal-modal" onClick={e => e.stopPropagation()}>
              <div className="reveal-glow" style={{ color: RARITY_COLORS[revealedItem.stars - 1], position: 'relative' }}>
                {revealedItem.img ? (
                  <img src={revealedItem.img} alt={revealedItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 15px ${RARITY_COLORS[revealedItem.stars - 1]})` }} />
                ) : (
                  revealedItem.emoji
                )}
                <div style={{ position: 'absolute', bottom: '0', right: '0', fontSize: '1.2rem', background: 'rgba(0,0,0,0.6)', padding: '5px', borderRadius: '50%', border: '2px solid currentColor' }}>
                  {revealedItem.type === 'head' ? '🧠' : revealedItem.type === 'chest' ? '🛡️' : '🗡️'}
                </div>
              </div>
              <div className="reveal-stars" style={{ color: RARITY_COLORS[revealedItem.stars - 1] }}>
                {starStr(revealedItem.stars)}
              </div>
              <div className="reveal-rarity" style={{ color: RARITY_COLORS[revealedItem.stars - 1] }}>
                {RARITY_NAMES[revealedItem.stars - 1]}
              </div>
              <h3 className="reveal-name">
                {revealedItem.img ? <img src={revealedItem.img} alt="" style={{ width: '24px', height: '24px', verticalAlign: 'middle', marginRight: '8px' }} /> : revealedItem.emoji + ' '}
                {revealedItem.name}
              </h3>
              <p className="reveal-stat">{revealedItem.desc}</p>
              <button className="upgrade-btn" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setRevealedItem(null)}>
                ¡Obtener Implante!
              </button>
            </div>
          </div>
        )}

        {/* ── Odds Modal ── */}
        {selectedBox && (
          <div className="fullscreen-overlay" onClick={() => setSelectedBox(null)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
                {selectedBox.emoji} {selectedBox.name} — Probabilidades
              </h3>
              <table className="odds-table">
                <thead>
                  <tr>
                    <th>Rareza</th>
                    <th>%</th>
                    <th>Ítems posibles</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBox.weights.map((w, i) => w > 0 && (
                    <tr key={i}>
                      <td style={{ color: RARITY_COLORS[i] }}>{'★'.repeat(i + 1)} {RARITY_NAMES[i]}</td>
                      <td style={{ color: RARITY_COLORS[i], fontWeight: 'bold' }}>{w}%</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ITEMS.filter(item => item.stars === i + 1).map(it => it.name).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="sheet-close-btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setSelectedBox(null)}>
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* ── Inventory Picker Modal ── */}
        {pickingSlot && (
          <div className="fullscreen-overlay" onClick={() => setPickingSlot(null)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
                Seleccionar {pickingSlot.slotType === 'head' ? 'Cabeza' : pickingSlot.slotType === 'chest' ? 'Pecho' : 'Arma'}
              </h3>

              {/* Filtros del picker */}
              <div className="filter-bar">
                <div className="filter-group">
                  {[1, 2, 3, 4, 5, 6].map(s => (
                    <button key={s}
                      className={`filter-chip star-chip ${filterStar === s ? 'active' : ''}`}
                      style={filterStar === s ? { borderColor: RARITY_COLORS[s - 1], color: RARITY_COLORS[s - 1] } : {}}
                      onClick={() => setFilterStar(prev => prev === s ? null : s)}>
                      {s} <span style={{ fontSize: '0.7rem' }}>★</span>
                    </button>
                  ))}
                </div>
                <div className="filter-group">
                  {[['dps', '🦠 Inercia'], ['attackSpeed', '⚡ Vel.'], ['gold', <span key="gold-icon"><img src="/icons/biomasa.png" alt="" style={{ width: '14px', verticalAlign: 'middle' }} /> Biomasa</span>], ['crit', '🎯 Crítico']].map(([stat, label]) => (
                    <button key={stat}
                      className={`filter-chip ${filterStat === stat ? 'active' : ''}`}
                      onClick={() => setFilterStat(prev => prev === stat ? null : stat)}>
                      {label}
                    </button>
                  ))}
                </div>
                {!pickingSlot && (
                  <div className="filter-group">
                    {[['head', '🧠 Cab.'], ['chest', '🛡️ Pec.'], ['weapon', '🗡️ Arm.']].map(([type, label]) => (
                      <button key={type}
                        className={`filter-chip ${filterType === type ? 'active' : ''}`}
                        onClick={() => setFilterType(prev => prev === type ? null : type)}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {getAvailableItems(true).length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                  {game.inventory.filter(i => !i.equippedTo).length === 0
                    ? '¡Abre una Caja primero!'
                    : 'Sin resultados con estos filtros.'}
                </p>
              ) : (
                <div className="item-picker-list">
                  {getAvailableItems(true).map(item => (
                    <div key={item.uid} className="item-picker-row"
                      onClick={() => { game.equipItem(item.uid, pickingSlot.charId); setPickingSlot(null); setFilterType(null); }}>
                      <div className="item-picker-emoji">
                        {item.img ? (
                          <img src={item.img} alt="" />
                        ) : (
                          item.emoji
                        )}
                        <span style={{ position: 'absolute', bottom: '-5px', right: '-5px', fontSize: '0.6rem', background: 'rgba(0,0,0,0.8)', padding: '2px', borderRadius: '4px' }}>
                          {item.type === 'head' ? '🧠' : item.type === 'chest' ? '🛡️' : '🗡️'}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: RARITY_COLORS[item.stars - 1], fontWeight: 'bold' }}>
                          {starStr(item.stars)} {item.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="sheet-close-btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => { setPickingSlot(null); setFilterType(null); }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Multi-Reveal Modal (bulk box open) ── */}
        {multiRevealItems && (
          <div className="fullscreen-overlay" onClick={() => setMultiRevealItems(null)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>📦 {multiRevealItems.length} Implantes</h3>
                <span style={{ color: '#c084fc', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  +{multiRevealItems.reduce((acc, i) => acc + ({ 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 })[i.stars], 0)} 🌌 si desguazas
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <button className="upgrade-btn" style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem', background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                  onClick={() => { multiRevealItems.forEach(i => game.scrapItem(i.uid)); setMultiRevealItems(null); }}>
                  🌌 Desguazar Todo
                </button>
                <button className="upgrade-btn" style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                  onClick={() => setMultiRevealItems(null)}>
                  ✅ Guardar Todo
                </button>
                <button className="upgrade-btn" style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem', background: 'linear-gradient(135deg, #06b6d4, #7c3aed)' }}
                  onClick={() => { setMultiRevealItems(null); setActiveTab('inventory'); setInventoryTab('lab'); }}>
                  🧬 Ir a Fusión
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {[...multiRevealItems].sort((a, b) => b.stars - a.stars).map(item => (
                  <div key={item.uid} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ position: 'relative', flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.img ? (
                        <img src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                      )}
                      <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', fontSize: '0.6rem', background: 'rgba(0,0,0,0.8)', padding: '1px', borderRadius: '3px' }}>
                        {item.type === 'head' ? '🧠' : item.type === 'chest' ? '🛡️' : '🗡️'}
                      </span>
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ color: RARITY_COLORS[item.stars - 1], fontWeight: 'bold', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {'★'.repeat(item.stars)} {item.name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</div>
                    </div>
                    <button className="tactical-btn withdraw" style={{ padding: '0.25rem 0.45rem', fontSize: '0.68rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                      onClick={() => {
                        game.scrapItem(item.uid);
                        setMultiRevealItems(prev => {
                          const next = prev.filter(i => i.uid !== item.uid);
                          return next.length === 0 ? null : next;
                        });
                      }}>
                      +{({ 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 })[item.stars]} 🌌
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Fusion Selection Modal ── */}
        {fusionModalOpen && (
          <div className="fullscreen-overlay" onClick={() => setFusionModalOpen(false)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>Selecciona un Implante</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                {fusionItems.length > 0
                  ? `Rareza fijada: ${'★'.repeat(fusionItems[0].stars)} — Selecciona ${5 - fusionItems.length} más`
                  : 'Elige 5 implantes de la misma rareza (máx. ★4) para fusionar'}
              </p>

              {/* Filtros */}
              <div className="filter-bar" style={{ marginBottom: '0.8rem' }}>
                <div className="filter-group">
                  {[1, 2, 3, 4].map(s => (
                    <button key={s}
                      className={`filter-chip star-chip ${filterStar === s ? 'active' : ''}`}
                      style={filterStar === s ? { borderColor: RARITY_COLORS[s - 1], color: RARITY_COLORS[s - 1] } : {}}
                      onClick={() => setFilterStar(prev => prev === s ? null : s)}>
                      {'★'.repeat(s)}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const lockedStars = fusionItems.length > 0 ? fusionItems[0].stars : null;
                const available = game.inventory.filter(item => {
                  if (item.equippedTo) return false;
                  if (fusionItems.some(f => f.uid === item.uid)) return false;
                  if (item.stars >= 5) return false; // Can't fuse ★5+
                  if (lockedStars && item.stars !== lockedStars) return false;
                  if (filterStar && item.stars !== filterStar) return false;
                  return true;
                });
                return available.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                    {game.inventory.filter(i => !i.equippedTo && i.stars < 5).length === 0
                      ? '¡Abre más Cápsulas primero!'
                      : 'Sin implantes disponibles con este filtro.'}
                  </p>
                ) : (
                  <div className="item-picker-list">
                    {available.map(item => (
                      <div key={item.uid} className="item-picker-row"
                        onClick={() => {
                          const newList = [...fusionItems, item];
                          setFusionItems(newList);
                          if (newList.length >= 5) setFusionModalOpen(false);
                        }}>
                        <div className="item-picker-emoji">
                          {item.img ? <img src={item.img} alt="" /> : item.emoji}
                        </div>
                        <div>
                          <div style={{ color: RARITY_COLORS[item.stars - 1], fontWeight: 'bold' }}>
                            {'★'.repeat(item.stars)} {item.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <button className="sheet-close-btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setFusionModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Scrap Bulk Confirm Modal ── */}
        {scrapConfirmData && (
          <div className="fullscreen-overlay" onClick={() => setScrapConfirmData(null)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: '#f87171', marginBottom: '0.3rem' }}>⚠️ Confirmar Desguace</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Estos objetos <strong style={{ color: 'white' }}>no se podrán recuperar</strong>. ¿Seguro que quieres continuar?
              </p>
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '0.8rem', marginBottom: '1rem', maxHeight: '220px', overflowY: 'auto' }}>
                {scrapConfirmData.items.map(item => (
                  <div key={item.uid} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '1.1rem', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.img ? <img src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : item.emoji}
                    </span>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ color: RARITY_COLORS[item.stars - 1], fontSize: '0.85rem', fontWeight: 'bold' }}>{'★'.repeat(item.stars)} {item.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{item.desc}</div>
                    </div>
                    <span style={{ color: '#c084fc', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>+{({ 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 })[item.stars]} 🌌</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.6rem 0.8rem', background: 'rgba(192,132,252,0.1)', borderRadius: '8px', border: '1px solid rgba(192,132,252,0.3)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total a recibir:</span>
                <span style={{ color: '#c084fc', fontWeight: 'bold', fontSize: '1.1rem' }}>🌌 {scrapConfirmData.totalDm} Materia Oscura</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="sheet-close-btn" style={{ flex: 1 }} onClick={() => setScrapConfirmData(null)}>Cancelar</button>
                <button className="upgrade-btn" style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
                  onClick={() => { game.bulkScrapItems(scrapConfirmData.stars); setScrapConfirmData(null); }}>
                  Desguazar Todo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Fusion Confirm Modal ── */}
        {fusionConfirmData && !fusionAnimating && !fusionResultItem && (
          <div className="fullscreen-overlay" onClick={() => setFusionConfirmData(null)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>🧬 Confirmar Fusión</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Fusionando 5 implantes {'★'.repeat(fusionConfirmData.baseStars)} → {'★'.repeat(fusionConfirmData.baseStars + 1)}
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Probabilidades de Bonus:</p>
                {fusionConfirmData.statWeights.map(({ stat, pct }) => {
                  const statNames = { dps: '🦠 Inercia (DPS)', attackSpeed: '⚡ Vel. Ataque', gold: <span key="gold-name"><img src="/icons/biomasa.png" alt="" style={{ width: '14px', verticalAlign: 'middle' }} /> Biomasa</span>, crit: '🎯 Prob. Crítico' };
                  return (
                    <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>{statNames[stat] || stat}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px' }} />
                        </div>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '0.85rem' }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: '1rem' }}>
                Los 5 implantes sacrificados se eliminarán del inventario.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="sheet-close-btn" style={{ flex: 1 }} onClick={() => setFusionConfirmData(null)}>Cancelar</button>
                <button className="upgrade-btn" style={{ flex: 1, background: 'linear-gradient(135deg, #06b6d4, #7c3aed)' }}
                  onClick={() => {
                    const { uids, newItem } = fusionConfirmData;
                    setFusionConfirmData(null);
                    setFusionAnimating(true);
                    game.commitFusion(uids, newItem);
                    setFusionItems([]);
                    setTimeout(() => { setFusionAnimating(false); setFusionResultItem(newItem); }, 1800);
                  }}>
                  ⚡ FUSIONAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Fusion Animation Overlay ── */}
        {fusionAnimating && (
          <div className="fullscreen-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <div style={{ fontSize: '4rem', animation: 'spin 1s linear infinite' }}>🧬</div>
            <p style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', letterSpacing: '3px', textTransform: 'uppercase' }}>Fusionando...</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan)', opacity: 0.4, animation: `pulse 0.6s ease-in-out ${i * 0.12}s infinite alternate` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Mock Ad Player Overlay ── */}
        {adPlaying && (
          <div className="fullscreen-overlay" style={{ zIndex: 10000, background: '#000' }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ width: '60px', height: '60px', border: '4px solid #333', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
              <p style={{ letterSpacing: '2px', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Visualizando Anuncio...</p>
              <p style={{ fontSize: '0.6rem', marginTop: '0.5rem', opacity: 0.5 }}>(Simulación de Red Publicitaria)</p>
            </div>
            <div style={{ position: 'absolute', bottom: '2rem', width: '200px', height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent-cyan)', width: '0%', animation: 'fillProgress 5s linear forwards' }} />
            </div>
          </div>
        )}

        {/* ── Fusion Result Modal ── */}
        {fusionResultItem && (
          <div className="fullscreen-overlay" onClick={() => setFusionResultItem(null)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.8rem' }}>¡Fusión Completa!</p>
              <div style={{ fontSize: '4.5rem', width: '120px', height: '120px', marginBottom: '0.5rem', filter: `drop-shadow(0 0 24px ${RARITY_COLORS[fusionResultItem.stars - 1]})`, position: 'relative', display: 'inline-block' }}>
                {fusionResultItem.img ? (
                  <img src={fusionResultItem.img} alt={fusionResultItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  fusionResultItem.emoji
                )}
                <div style={{ position: 'absolute', bottom: '0', right: '0', fontSize: '1.5rem', background: 'rgba(0,0,0,0.6)', padding: '6px', borderRadius: '50%', border: `2px solid ${RARITY_COLORS[fusionResultItem.stars - 1]}` }}>
                  {fusionResultItem.type === 'head' ? '🧠' : fusionResultItem.type === 'chest' ? '🛡️' : '🗡️'}
                </div>
              </div>
              <div style={{ color: RARITY_COLORS[fusionResultItem.stars - 1], fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                {'★'.repeat(fusionResultItem.stars)} {RARITY_NAMES[fusionResultItem.stars - 1]}
              </div>
              <h3 style={{ color: 'white', margin: '0.3rem 0' }}>{fusionResultItem.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{fusionResultItem.desc}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="upgrade-btn" style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', fontSize: '0.8rem', padding: '0.6rem' }}
                  onClick={() => { game.scrapItem(fusionResultItem.uid); setFusionResultItem(null); }}>
                  Desguazar (+{({ 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 })[fusionResultItem.stars]} 🌌)
                </button>
                <button className="upgrade-btn" style={{ flex: 1 }} onClick={() => setFusionResultItem(null)}>
                  ✅ Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats Panel ── */}
        {statsOpen && (
          <div className="fullscreen-overlay" onClick={() => setStatsOpen(false)}>
            <div className="stats-panel glass" onClick={e => e.stopPropagation()}>
              <div className="stats-panel-header">
                <h3>📊 Estadísticas Actuales</h3>
                <button className="sheet-close-btn" onClick={() => setStatsOpen(false)}>✖</button>
              </div>

              <div className="stats-body">
                <div className="stats-section">
                  <div className="stats-section-title">⚔️ Combate</div>
                  <div className="stat-row">
                    <span>Inercia Total</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{game.formatNumber(game.totalDps)}/s</strong>
                  </div>
                  <div className="stat-row">
                    <span>Impacto Manual</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{game.formatNumber(game.tapDamage)}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Sector actual</span>
                    <strong>{game.level}</strong>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stats-section-title">🧬 Escuadrón ({game.squad.length}/4)</div>
                  {game.squad.length === 0
                    ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ninguna Cepa desplegada.</p>
                    : game.squad.map(id => {
                      const char = game.characters.find(c => c.id === id);
                      if (!char) return null;
                      const dpsBonus = game.getCharItemBonus(char.id, 'dps');
                      const speedBonus = game.getCharItemBonus(char.id, 'attackSpeed');
                      const critBonus = game.getCharItemBonus(char.id, 'crit') + game.getCharItemBonus(char.id, 'tap');
                      const charDps = game.calcCharDPS(char.baseDPS, char.dpsMult, char.level) * (1 + game.relics) * (1 + dpsBonus);

                      return (
                        <div key={id} className="stat-row squad-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem', margin: '0.5rem 0', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                            <span style={{ color: char.color, fontWeight: 'bold' }}>{char.emoji} {char.name.split(': ')[1]}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nv. <strong>{char.level}</strong></span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span style={{ whiteSpace: 'nowrap' }}>Inercia (DPS): <strong style={{ color: '#84cc16' }}>{game.formatNumber(charDps)}</strong></span>
                            {speedBonus > 0 && <span style={{ whiteSpace: 'nowrap' }}>Vel. Ataque: <strong style={{ color: '#f59e0b' }}>+{Math.round(speedBonus * 100)}%</strong></span>}
                            {critBonus > 0 && <span style={{ whiteSpace: 'nowrap' }}>Prob. Crítico: <strong style={{ color: '#ef4444' }}>+{Math.round(critBonus * 100)}%</strong></span>}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="stats-section">
                  <div className="stats-section-title"><img src="/icons/biomasa.png" alt="Biomasa" style={{ width: '15px', height: '15px', verticalAlign: 'bottom', filter: 'drop-shadow(0 0 5px rgba(132,204,22,0.8))' }} /> Economía</div>
                  <div className="stat-row">
                    <span>Biomasa acumulada</span>
                    <strong style={{ color: 'var(--accent-gold)' }}>{game.formatNumber(game.gold)}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Bonus de Biomasa (ítems)</span>
                    <strong style={{ color: '#84cc16' }}>+{Math.round(game.inventory.filter(i => i.stat === 'gold').reduce((a, i) => a + i.value, 0) * 100)}%</strong>
                  </div>
                  <div className="stat-row">
                    <span>Cadenas ADN (Prestigio)</span>
                    <strong style={{ color: 'var(--accent-purple)' }}>×{1 + game.relics} daño</strong>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stats-section-title">🧬 Sobrecarga Global</div>
                  <div className="stat-row">
                    <span>Impacto Cinético (Clicks)</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>Nv. {game.upgrades.tap} (+{game.upgrades.tap} base)</strong>
                  </div>
                  <div className="stat-row">
                    <span>Protocolo Recolección (Oro)</span>
                    <strong style={{ color: '#eab308' }}>+{game.upgrades.gold * 10}%</strong>
                  </div>
                  <div className="stat-row">
                    <span>Acelerador Metabólico (Vel.)</span>
                    <strong style={{ color: '#f59e0b' }}>+{game.upgrades.speed * 5}%</strong>
                  </div>
                  <div className="stat-row">
                    <span>Sobrecarga Sináptica (Crit.)</span>
                    <strong style={{ color: '#ef4444' }}>+{game.upgrades.crit * 1}%</strong>
                  </div>
                  <div className="stat-row">
                    <span>Inercia Viral (Global DPS)</span>
                    <strong style={{ color: '#84cc16' }}>+{game.upgrades.dps * 10}%</strong>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stats-section-title">🗃️ Implantes ({game.inventory.length} total)</div>
                  <div className="stat-row">
                    <span>Equipados</span>
                    <strong>{game.inventory.filter(i => i.equippedTo).length}</strong>
                  </div>
                  <div className="stat-row">
                    <span>En reserva</span>
                    <strong>{game.inventory.filter(i => !i.equippedTo).length}</strong>
                  </div>
                </div>

                <div className="stats-section">
                  <div className="stats-section-title">🌌 Sets de Reliquias (Progreso)</div>
                  {Object.entries(game.activeSets).some(([_, data]) => data.maxProgress > 0) ? (
                    Object.entries(game.activeSets).map(([type, data]) => {
                      if (data.maxProgress === 0) return null;
                      const isComplete = data.maxProgress >= 3;
                      const bonusInfo = {
                        dps: { name: 'Poder Absoluto', val: `+${data.completed * 100}% Inercia` },
                        speed: { name: 'Frenesí Temporal', val: `+${data.completed * 50}% Vel. Ataque` },
                        gold: { name: 'Asimilación', val: `+${data.completed * 100}% Biomasa` },
                        crit: { name: 'Aniquilación', val: `+${data.completed * 20}% Prob. Crítico` }
                      }[type];
                      
                      return (
                        <div key={type} className="stat-row" style={{ color: isComplete ? '#c084fc' : 'var(--text-secondary)', opacity: isComplete ? 1 : 0.7 }}>
                          <span>
                            {isComplete ? '✨' : '🧬'} {bonusInfo.name} ({data.maxProgress}/3)
                          </span>
                          <strong>{isComplete ? bonusInfo.val : 'Incompleto'}</strong>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.2rem 0' }}>Ninguna Reliquia equipada.</p>
                  )}
                </div>

                <div className="stats-section">
                  <div className="stats-section-title">🧬 Sinergias de Formación</div>
                  {Object.values(game.squadSynergies).some(v => v) ? (
                    <>
                      {game.squadSynergies.sangreYHueso && (
                        <div className="stat-row" style={{ color: '#f3f4f6' }}>
                          <span>🪚 Sangre y Hueso</span>
                          <strong>+15% Daño Click, +10% Inercia</strong>
                        </div>
                      )}
                      {game.squadSynergies.contaminacionCruzada && (
                        <div className="stat-row" style={{ color: '#84cc16' }}>
                          <span>🧪 Contaminación Cruzada</span>
                          <strong>+25% Biomasa</strong>
                        </div>
                      )}
                      {game.squadSynergies.menteColmena && (
                        <div className="stat-row" style={{ color: '#3b82f6' }}>
                          <span>⚡ Mente Colmena</span>
                          <strong>+15% Vel. Ataque</strong>
                        </div>
                      )}
                      {game.squadSynergies.depredadoresApex && (
                        <div className="stat-row" style={{ color: '#06b6d4' }}>
                          <span>🔪 Depredadores Apex</span>
                          <strong>+15% Prob. Crítico</strong>
                        </div>
                      )}
                      {game.squadSynergies.mutacionPerfecta && (
                        <div className="stat-row" style={{ color: '#9333ea' }}>
                          <span>🌟 Mutación Perfecta</span>
                          <strong>+30% Inercia, +30% Biomasa</strong>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.2rem 0' }}>Ninguna sinergia activa.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="header glass">
          <div className="header-top-row">
            <div className="gold-display"><span><img src="/icons/biomasa.png" alt="Biomasa" style={{ width: '42px', height: '42px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 5px rgba(132,204,22,0.8))' }} /></span> {game.formatNumber(game.gold)}</div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="stats-icon-btn" onClick={() => setShopOpen(true)} style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)' }} title="Tienda">
                🛒
              </button>
              <button className="stats-icon-btn" onClick={() => setStatsOpen(true)} title="Ver Estadísticas">
                📊
              </button>
            </div>
          </div>
          <div className="level-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span>Sector {game.level}</span>
            <span style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)', marginTop: '5px', textShadow: '0 0 5px var(--accent-cyan)' }}>
              {game.enemy.emoji} {game.enemy.name}
            </span>
          </div>
          <div className="hp-bar-container" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="hp-bar-fill" style={{ width: `${hpPercent}%`, position: 'absolute', left: 0, top: 0, height: '100%' }}></div>
            <span style={{ position: 'relative', zIndex: 1, fontSize: '0.85rem', fontWeight: 'bold', textShadow: '0px 0px 4px black', lineHeight: '24px' }}>
              {game.formatNumber(game.enemy.hp)} / {game.formatNumber(game.enemy.maxHp)}
            </span>
          </div>

          {/* Overdrive Bar */}
          <div className={`overdrive-bar-container ${game.overdriveActive ? 'active' : ''} ${game.overdriveCooldown > 0 ? 'cooldown' : ''}`}>
            <div className="overdrive-bar-fill" style={{ width: `${game.overdriveProgress}%` }}>
              {game.overdriveActive && <div className="overdrive-flame-fx" />}
            </div>
            <div className="overdrive-label">
              {game.overdriveActive ? '🔥 OVERDRIVE 🔥' : 
               game.overdriveCooldown > 0 ? `ENFRIANDO... (${Math.ceil(game.overdriveCooldown)}s)` : 
               'ADRENALINA'}
            </div>
          </div>
        </div>

        {/* ── Action Area ── */}
        <div className="action-area" onClick={onZoneTap} style={{ '--bg-image': `url('${game.bgImage}')` }}>
          {game.overdriveActive && <div className="overdrive-screen-fx" />}
          {game.enemy.isBoss && (
            <>
              <div className="boss-timer-badge" style={{ top: '1rem', left: '1rem', right: 'auto', background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--accent-red)' }}>
                ⚠️ JEFE
              </div>
              <div className="boss-timer-badge">
                ⏳ {Math.ceil(game.enemy.timeRemaining)}s
              </div>
            </>
          )}
          <div
            id="main-enemy"
            key={game.level}
            className={`enemy-sprite ${game.enemy.isBoss ? 'boss-sprite' : ''} ${game.enemy.img ? 'enemy-img-sprite' : ''} ${game.enemy.hp === 0 ? 'enemy-dying' : ''}`}
            style={game.enemy.img ? { background: 'transparent', border: 'none', boxShadow: 'none' } : {}}
          >
            {game.enemy.img
              ? <img src={game.enemy.img} alt={game.enemy.name}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  filter: game.enemy.isBoss
                    ? 'drop-shadow(0 0 20px rgba(239,68,68,0.8))'
                    : 'drop-shadow(0 0 12px rgba(6,182,212,0.6))'
                }} />
              : <span style={{ fontSize: '7rem' }}>{game.enemy.emoji}</span>
            }
          </div>

          {/* Indicadores de Boosters en Batalla */}
          <div className="battle-boosters">
            {(game.permanentVIP || game.boosters.damage.expires > Date.now()) && (
              <div className="battle-booster-tag">⚔️ x2</div>
            )}
            {(game.permanentVIP || game.boosters.gold.expires > Date.now()) && (
              <div className="battle-booster-tag gold">💰 x2</div>
            )}
          </div>

          {game.squad.map((charId, index) => {
            const char = game.characters.find(c => c.id === charId);
            if (!char) return null;
            const positions = [
              { left: '15%', top: '65%' },
              { left: '35%', top: '80%' },
              { left: '65%', top: '80%' },
              { left: '85%', top: '65%' }
            ];
            const pos = positions[index];
            const speedBonus = game.getCharItemBonus(char.id, 'attackSpeed');
            const finalSpeed = char.attackSpeed / (1 + speedBonus + (game.upgrades.speed * 0.05));

            return (
              <div key={char.id}
                className={`hero-sprite ${char.img ? 'hero-image-sprite' : ''} ${heroAnimations[char.id] ? 'hero-attacking' : ''}`}
                style={{ ...pos, border: char.img ? 'none' : `2px solid ${char.color}`, background: char.img ? 'transparent' : undefined }}>

                {/* Mini-Indicador de Ataque */}
                <div className="mini-attack-indicator">
                  <span className="mini-sword">🗡️</span>
                  <svg className="mini-ring-svg" viewBox="0 0 36 36">
                    <circle className="mini-ring-fill" cx="18" cy="18" r="16"
                      style={{
                        strokeDashoffset: 100 - (game.attackPercentages[char.id] || 0),
                        stroke: char.color,
                        transition: (game.attackPercentages[char.id] || 0) < 5 ? 'none' : 'stroke-dashoffset 0.1s linear'
                      }} />
                  </svg>
                </div>

                {char.img
                  ? <img src={char.img} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 8px ${char.color})` }} />
                  : <span className="hero-emoji">{char.emoji}</span>}
              </div>
            );
          })}

          {damageTexts.map(dt => (
            <div key={dt.id}
              className={`damage-text ${dt.isCrit ? 'is-crit' : ''}`}
              style={{
                left: dt.x,
                top: dt.y,
                color: dt.isCrit ? 'var(--accent-red)' : 'white',
                fontSize: dt.isCrit ? '2.5rem' : '1.5rem',
                fontWeight: '900',
                textShadow: dt.isCrit ? '0 0 20px var(--accent-red), 0 0 40px black' : '2px 2px 4px black',
                zIndex: dt.isCrit ? 30 : 20
              }}>
              {dt.isCrit ? '💥 ' : ''}-{dt.val}
            </div>
          ))}
          {dpsTexts.map(dt => (
            <div key={dt.id} className={`damage-text ${dt.isCrit ? 'is-crit' : 'dps-damage-text'}`} style={{
              left: dt.x,
              top: dt.y,
              color: dt.isCrit ? '#ff0000' : dt.color,
              textShadow: `0 0 ${dt.isCrit ? '15px' : '5px'} ${dt.isCrit ? '#ff0000' : dt.color}`,
              fontSize: dt.isCrit ? '1.8rem' : '1.2rem',
              zIndex: dt.isCrit ? 20 : 15
            }}>
              {dt.isCrit ? '🔥 ' : ''}-{game.formatNumber(dt.val)}
            </div>
          ))}
        </div>

        {/* ── Bottom Sheet ── */}
        <div className={`bottom-sheet glass ${activeTab ? 'open' : ''}`}>
          {activeTab && (
            <div className="sheet-header">
              <h2 className="sheet-title">
                {activeTab === 'heroes' && !selectedCepa && 'Laboratorio de Cepas'}
                {activeTab === 'heroes' && selectedCepa && 'Ficha Clínica'}
                {activeTab === 'boxes' && 'Protocolo de Extracción'}
                {activeTab === 'inventory' && 'Gestión de Inventario'}
                {activeTab === 'upgrades' && 'Sobrecarga Global'}
                {activeTab === 'prestige' && 'Mutación Cero'}
              </h2>
              <button className="sheet-close-btn"
                onClick={() => selectedCepa ? setSelectedCepa(null) : setActiveTab(null)}>
                {selectedCepa ? '⬅ Volver' : '✖ Cerrar'}
              </button>
            </div>
          )}

          <div className="sheet-content">

            {/* ═══ CAJAS ═══ */}
            {activeTab === 'boxes' && (
              <div className="boxes-view">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
                  <button className={`filter-chip ${boxesTab === 'capsules' ? 'active' : ''}`} style={{ flex: 1, padding: '0.5rem' }} onClick={() => setBoxesTab('capsules')}>Cápsulas</button>
                  <button className={`filter-chip ${boxesTab === 'market' ? 'active' : ''}`} style={{ flex: 1, padding: '0.5rem' }} onClick={() => setBoxesTab('market')}>Mercado Negro</button>
                </div>

                {boxesTab === 'capsules' && (
                  <>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      Abre Cápsulas de Incubación para conseguir Implantes Cibernéticos para tus Cepas.
                    </p>
                    {BOXES.map(box => {
                      const canAfford1 = game.gold >= box.cost;
                      const canAfford5 = game.gold >= box.cost * 5;
                      const canAfford10 = game.gold >= box.cost * 10;
                      const canAfford20 = game.gold >= box.cost * 20;
                      return (
                        <div key={box.id} className="box-card" style={{ '--box-color': box.color, '--box-glow': box.glowColor }}>
                          <div className="box-card-icon" style={{ width: '60px', height: '60px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {box.img
                              ? <img src={box.img} alt={box.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              : <span style={{ fontSize: '2rem' }}>{box.emoji}</span>}
                          </div>
                          <div className="box-card-info" style={{ flex: 1 }}>
                            <div className="box-card-name">{box.name}</div>
                            <div className="box-card-desc" style={{ marginBottom: '0.4rem' }}>{box.desc}</div>
                            <div className="box-card-weights">
                              {box.weights.map((w, i) => w > 0 && (
                                <span key={i} style={{ color: RARITY_COLORS[i], fontSize: '0.7rem', marginRight: '6px' }}>
                                  {'★'.repeat(i + 1)} {w}%
                                </span>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              {[[1, canAfford1], [5, canAfford5], [10, canAfford10], [20, canAfford20]].map(([qty, canAfford]) => (
                                <button key={qty}
                                  className="upgrade-btn"
                                  disabled={!canAfford}
                                  onClick={() => handleOpenBox(box.id, qty)}
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', flex: '1 1 40px', minWidth: '44px' }}>
                                  x{qty}
                                </button>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                              <img src="/icons/biomasa.png" alt="Biomasa" style={{ width: '15px', height: '15px', verticalAlign: 'bottom', filter: 'drop-shadow(0 0 5px rgba(132,204,22,0.8))' }} /> {game.formatNumber(box.cost)} / caja
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {boxesTab === 'market' && (() => {
                  // Countdown timer to free refresh
                  const now = Date.now();
                  const secsLeft = Math.max(0, Math.ceil((game.shopNextRefresh - now) / 1000));
                  const hh = String(Math.floor(secsLeft / 3600)).padStart(2, '0');
                  const mm = String(Math.floor((secsLeft % 3600) / 60)).padStart(2, '0');
                  const ss = String(secsLeft % 60).padStart(2, '0');
                  const isFreeReady = secsLeft === 0;

                  return (
                    <div className="black-market-view" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '1rem' }}>

                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#c084fc', margin: 0 }}>🌌 Mercado Negro</h3>
                        <div style={{ background: 'rgba(192,132,252,0.1)', border: '1px solid rgba(192,132,252,0.3)', padding: '0.35rem 0.7rem', borderRadius: '8px', color: '#c084fc', fontWeight: 'bold', fontSize: '0.95rem' }}>
                          🌌 {game.darkMatter}
                        </div>
                      </div>

                      {/* Refresh controls */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>Actualización de Stock</p>

                        {/* Free refresh countdown */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem', padding: '0.5rem 0.7rem', background: isFreeReady ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.2)', borderRadius: '8px', border: `1px solid ${isFreeReady ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: isFreeReady ? '#4ade80' : 'var(--text-secondary)' }}>
                              {isFreeReady ? '✅ Actualización gratuita disponible' : '⏳ Próxima gratuita en'}
                            </div>
                            {!isFreeReady && (
                              <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 'bold', color: 'white', marginTop: '0.1rem' }}>
                                {hh}:{mm}:{ss}
                              </div>
                            )}
                          </div>
                          <button
                            disabled={!isFreeReady}
                            onClick={() => game.refreshShop('auto')}
                            style={{ padding: '0.4rem 0.9rem', borderRadius: '8px', border: 'none', cursor: isFreeReady ? 'pointer' : 'not-allowed', background: isFreeReady ? 'linear-gradient(135deg, #4ade80, #16a34a)' : 'rgba(255,255,255,0.07)', color: isFreeReady ? 'white' : 'rgba(255,255,255,0.3)', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                            ↻ Gratis
                          </button>
                        </div>

                        {/* Manual (DM) + Ad buttons */}
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <button
                              disabled={game.darkMatter < 10 || game.shopManualRefreshes >= 3}
                              onClick={() => game.refreshShop('manual')}
                              style={{
                                width: '100%', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid rgba(192,132,252,0.2)',
                                cursor: game.darkMatter >= 10 && game.shopManualRefreshes < 3 ? 'pointer' : 'not-allowed',
                                background: game.darkMatter >= 10 && game.shopManualRefreshes < 3 ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'rgba(255,255,255,0.05)',
                                color: 'white', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: game.darkMatter >= 10 && game.shopManualRefreshes < 3 ? '0 0 10px rgba(124,58,237,0.3)' : 'none'
                              }}>
                              ↻ Reset DM
                            </button>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              <span style={{ color: '#c084fc' }}>10 🌌</span> ({3 - game.shopManualRefreshes} restantes)
                            </div>
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <button
                              disabled={game.shopAdRefreshes >= 5}
                              onClick={() => {
                                setAdPlaying(true);
                                setTimeout(() => {
                                  setAdPlaying(false);
                                  game.refreshShop('ad');
                                }, 5000);
                              }}
                              style={{
                                width: '100%', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)',
                                cursor: game.shopAdRefreshes < 5 ? 'pointer' : 'not-allowed',
                                background: game.shopAdRefreshes < 5 ? 'linear-gradient(135deg, #d97706, #92400e)' : 'rgba(255,255,255,0.05)',
                                color: 'white', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: game.shopAdRefreshes < 5 ? '0 0 10px rgba(217,119,6,0.3)' : 'none'
                              }}>
                              ▶ Reset Ad
                            </button>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                              <span style={{ color: '#f59e0b' }}>Gratis</span> ({5 - game.shopAdRefreshes} restantes)
                            </div>
                          </div>
                        </div>
                      </div>


                      <div className="shop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {Array.from({ length: 9 }).map((_, i) => {
                          if (i >= game.shopSlotsUnlocked) {
                            const isDMLocked = i < 6;
                            const dmCosts = { 3: 50, 4: 150, 5: 500 };
                            const cost = dmCosts[i];
                            const canAfford = isDMLocked ? game.darkMatter >= cost : false;

                            // Solo permitimos desbloquear el SIGUIENTE slot
                            const isNext = i === game.shopSlotsUnlocked;

                            return (
                              <div key={i} className="shop-slot locked" style={{ background: 'rgba(0,0,0,0.5)', padding: '0.6rem 0.2rem', borderRadius: '8px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>🔒 {isDMLocked ? 'Bloqueado' : 'PREMIUM'}</div>
                                {isNext ? (
                                  isDMLocked ? (
                                    <button className="upgrade-btn" style={{ width: '90%', margin: '0 auto', fontSize: '0.7rem', padding: '0.3rem' }} onClick={() => game.unlockShopSlot()} disabled={!canAfford}>
                                      🌌 {cost}
                                    </button>
                                  ) : (
                                    <button className="upgrade-btn" style={{ width: '90%', margin: '0 auto', fontSize: '0.7rem', padding: '0.3rem', background: 'linear-gradient(to right, #7c3aed, #9333ea)', border: '1px solid #c084fc' }} onClick={() => setShopOpen(true)}>
                                      VIP 💎
                                    </button>
                                  )
                                ) : (
                                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>{isDMLocked ? `Coste: ${cost}` : 'Elite'}</div>
                                )}
                              </div>
                            );
                          }
                          const shopItem = game.shopItems[i];
                          if (!shopItem) return <div key={i} className="shop-slot" style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }} />;
                          const { itemData, cost, purchased } = shopItem;
                          return (
                            <div key={i} className="shop-slot" style={{ background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: `1px solid ${RARITY_COLORS[itemData.stars - 1]}`, opacity: purchased ? 0.3 : 1 }}>
                              <div style={{ fontSize: '1.5rem', width: '40px', height: '40px', margin: '0 auto 0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {itemData.img ? <img src={itemData.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : itemData.emoji}
                              </div>
                              <div style={{ fontSize: '0.6rem', color: RARITY_COLORS[itemData.stars - 1] }}>{'★'.repeat(itemData.stars)}</div>
                              <button className="upgrade-btn" style={{ marginTop: '0.5rem', width: '100%', padding: '0.4rem', fontSize: '0.75rem' }} disabled={purchased || game.darkMatter < cost} onClick={() => game.buyShopItem(shopItem.id)}>
                                {purchased ? 'Vendido' : `🌌 ${cost}`}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            )}

            {/* ═══ INVENTARIO ═══ */}
            {activeTab === 'inventory' && (
              <div className="inventory-view">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0 0.5rem' }}>
                  <button className={`filter-chip ${inventoryTab === 'list' ? 'active' : ''}`} style={{ flex: 1, padding: '0.5rem' }} onClick={() => setInventoryTab('list')}>Inventario</button>
                  <button className={`filter-chip ${inventoryTab === 'scrap' ? 'active' : ''}`} style={{ flex: 1, padding: '0.5rem' }} onClick={() => setInventoryTab('scrap')}>Desguace</button>
                  <button className={`filter-chip ${inventoryTab === 'lab' ? 'active' : ''}`} style={{ flex: 1, padding: '0.5rem' }} onClick={() => setInventoryTab('lab')}>Laboratorio</button>
                </div>

                {inventoryTab === 'lab' && (
                  <div className="lab-view" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>Fusión Genética</h3>
                      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.8rem', borderRadius: '8px', color: '#c084fc', fontWeight: 'bold' }}>
                        🌌 {game.darkMatter}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Haz clic en un espacio para seleccionar implantes del inventario.</p>

                    <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', minHeight: '56px' }}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const item = fusionItems[i];
                        return (
                          <div key={i} onClick={() => {
                            if (item) setFusionItems(prev => prev.filter(f => f.uid !== item.uid));
                            else setFusionModalOpen(true);
                          }} style={{ flex: 1, background: item ? `rgba(${item.stars === 1 ? '100,100,255' : item.stars === 2 ? '34,197,94' : item.stars === 3 ? '59,130,246' : item.stars === 4 ? '168,85,247' : item.stars === 5 ? '234,179,8' : '192,132,252'},0.15)` : 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', minHeight: '56px', border: item ? `1px solid ${RARITY_COLORS[item.stars - 1]}` : '1px dashed rgba(255,255,255,0.15)', transition: 'all 0.2s' }}>
                            {item ? (
                              <>
                                <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {item.img ? <img src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>}
                                </div>
                                <span style={{ fontSize: '0.5rem', color: RARITY_COLORS[item.stars - 1] }}>{'★'.repeat(item.stars)}</span>
                              </>
                            ) : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '1.2rem' }}>+</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {fusionItems.length > 0 && (
                        <button className="sheet-close-btn" style={{ flex: 1 }} onClick={() => setFusionItems([])}>
                          Quitar objetos
                        </button>
                      )}
                      <button
                        disabled={fusionItems.length !== 5}
                        style={{ flex: fusionItems.length > 0 ? 1 : undefined, width: fusionItems.length > 0 ? undefined : '100%', padding: '0.8rem 1.2rem', border: 'none', borderRadius: '10px', cursor: fusionItems.length === 5 ? 'pointer' : 'not-allowed', background: fusionItems.length === 5 ? 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)' : 'rgba(255,255,255,0.1)', color: fusionItems.length === 5 ? 'white' : 'rgba(255,255,255,0.3)', fontWeight: 'bold', fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', boxShadow: fusionItems.length === 5 ? '0 0 20px rgba(6,182,212,0.4)' : 'none', transition: 'all 0.3s' }}
                        onClick={() => {
                          const uids = fusionItems.map(i => i.uid);
                          const result = game.computeFusion(uids);
                          if (result) setFusionConfirmData({ ...result, uids });
                        }}>
                        ⚡ FUSIONAR
                      </button>
                    </div>
                  </div>
                )}

                {inventoryTab === 'scrap' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 0.5rem', marginBottom: '0.5rem' }}>Selecciona rareza para desguace masivo:</p>
                    <div className="scrap-bulk-actions" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0 0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(s => {
                        const items = game.inventory.filter(i => !i.equippedTo && i.stars === s);
                        const dmValues = { 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 };
                        const totalDm = items.reduce((acc, i) => acc + dmValues[i.stars], 0);
                        return (
                          <button key={s} className="small-btn" style={{ borderColor: RARITY_COLORS[s - 1], color: RARITY_COLORS[s - 1], opacity: items.length === 0 ? 0.3 : 1, minWidth: '60px' }}
                            disabled={items.length === 0}
                            onClick={() => setScrapConfirmData({ stars: s, items, totalDm })}>
                            {s} ★<br /><span style={{ fontSize: '0.6rem' }}>{items.length} ({totalDm}🌌)</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(inventoryTab === 'list' || inventoryTab === 'scrap') && (
                  <div className="inventory-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <h4 style={{ color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        🗃️ Inventario ({game.inventory.length})
                      </h4>
                    </div>

                    <div className="filter-bar">
                      <div className="filter-group">
                        {(inventoryTab === 'scrap' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]).map(s => (
                          <button key={s}
                            className={`filter-chip star-chip ${filterStar === s ? 'active' : ''}`}
                            style={filterStar === s ? { borderColor: RARITY_COLORS[s - 1], color: RARITY_COLORS[s - 1] } : {}}
                            onClick={() => setFilterStar(prev => prev === s ? null : s)}>
                            {s} <span style={{ fontSize: '0.7rem' }}>★</span>
                          </button>
                        ))}
                      </div>
                      <div className="filter-group">
                        {[['dps', '🦠 Inercia'], ['attackSpeed', '⚡ Vel.'], ['gold', <span key="gold-lbl"><img src="/icons/biomasa.png" alt="" style={{ width: '14px', verticalAlign: 'middle' }} /> Biomasa</span>], ['crit', '🎯 Crítico']].map(([stat, label]) => (
                          <button key={stat}
                            className={`filter-chip ${filterStat === stat ? 'active' : ''}`}
                            onClick={() => setFilterStat(prev => prev === stat ? null : stat)}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="filter-group">
                        {[['head', '🧠 Cab.'], ['chest', '🛡️ Pec.'], ['weapon', '🗡️ Arm.']].map(([type, label]) => (
                          <button key={type}
                            className={`filter-chip ${filterType === type ? 'active' : ''}`}
                            onClick={() => setFilterType(prev => prev === type ? null : type)}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {getAllInventoryItems().length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem', fontSize: '0.85rem' }}>
                        Sin resultados con estos filtros.
                      </p>
                    ) : getAllInventoryItems().map(item => {
                      const isEquipped = !!item.equippedTo;
                      const dmValues = { 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 };

                      return (
                        <div key={item.uid} className="inventory-item-row" style={{ cursor: 'default' }}>
                          <div className="inventory-item-icon">
                            {item.img ? (
                              <img src={item.img} alt="" />
                            ) : (
                              <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                            )}
                            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '0.6rem', background: 'rgba(0,0,0,0.8)', padding: '2px', borderRadius: '4px' }}>
                              {item.type === 'head' ? '🧠' : item.type === 'chest' ? '🛡️' : '🗡️'}
                            </span>
                          </div>
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ color: RARITY_COLORS[item.stars - 1], fontWeight: 'bold', fontSize: '0.9rem' }}>
                              {starStr(item.stars)} {item.name}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.desc}</div>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: isEquipped ? 'var(--accent-cyan)' : 'var(--text-secondary)', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                            {isEquipped ? (
                              <>Equipado<button className="small-btn" onClick={(e) => { e.stopPropagation(); game.unequipItem(item.uid); }}>Quitar</button></>
                            ) : (
                              inventoryTab === 'scrap' ? (
                                <button className="tactical-btn withdraw" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} onClick={(e) => {
                                  e.stopPropagation();
                                  game.scrapItem(item.uid);
                                }}>
                                  Desguazar (+{dmValues[item.stars]} 🌌)
                                </button>
                              ) : 'Sin equipar'
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══ CEPAS GALERÍA ═══ */}
            {activeTab === 'heroes' && !selectedCepa && (
              <div className="cepa-gallery">
                <div className="squad-status">
                  Escuadrón Activo: <span>{game.squad.length} / 4</span>
                </div>

                {/* Panel de Sinergias Activas */}
                <div className="synergy-panel" style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid var(--glass-border)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <h4 style={{ color: 'var(--accent-cyan)', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>🧬 Sinergias de Formación</h4>
                    <button className="help-icon-btn" onClick={() => setSynergyHelpOpen(true)} title="Ver todas las sinergias">?</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {game.squadSynergies.sangreYHueso && <span className="synergy-badge" title={SYNERGY_DATA.sangreYHueso.short} style={{ borderColor: '#f3f4f6', color: '#f3f4f6' }}>🪚 Sangre y Hueso</span>}
                    {game.squadSynergies.contaminacionCruzada && <span className="synergy-badge" title={SYNERGY_DATA.contaminacionCruzada.short} style={{ borderColor: '#84cc16', color: '#84cc16' }}>🧪 Contaminación</span>}
                    {game.squadSynergies.menteColmena && <span className="synergy-badge" title={SYNERGY_DATA.menteColmena.short} style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>⚡ Mente Colmena</span>}
                    {game.squadSynergies.depredadoresApex && <span className="synergy-badge" title={SYNERGY_DATA.depredadoresApex.short} style={{ borderColor: '#06b6d4', color: '#06b6d4' }}>🔪 Depredadores</span>}
                    {game.squadSynergies.mutacionPerfecta && <span className="synergy-badge" title={SYNERGY_DATA.mutacionPerfecta.short} style={{ borderColor: '#9333ea', color: '#9333ea', background: 'rgba(147,51,234,0.1)' }}>🌟 Mutación Perfecta</span>}
                    {!Object.values(game.squadSynergies).some(v => v) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Combina roles para activar bonus...</span>
                    )}
                  </div>
                </div>
                <div className="cepa-grid">
                  {game.characters.map(char => {
                    const isDeployed = game.squad.includes(char.id);
                    const isUnlocked = char.level > 0;
                    return (
                      <div key={char.id}
                        className={`cepa-card ${isUnlocked ? 'unlocked' : 'locked'} ${isDeployed ? 'deployed' : ''}`}
                        onClick={() => setSelectedCepa(char.id)}>
                        {(() => {
                          const equipped = game.inventory.filter(i => i.equippedTo === char.id && i.stars === 6);
                          const setCounts = {};
                          equipped.forEach(i => { if (i.setType) setCounts[i.setType] = (setCounts[i.setType] || 0) + 1; });
                          const hasSet = Object.values(setCounts).some(count => count >= 3);
                          return hasSet ? (
                            <>
                              <div className="set-active-glow" />
                              <div className="set-badge">SET ACTIVO</div>
                            </>
                          ) : null;
                        })()}
                        <div className="cepa-card-img-container">
                          {char.img
                            ? <img src={char.img} alt={char.name} className="cepa-card-img" />
                            : <div className="cepa-card-emoji">{char.emoji}</div>}
                          {isDeployed && <div className="deployed-badge">🟢 Activa</div>}
                          <div className="role-badge" style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                            {char.role === 'asesino' ? '🔪' : char.role === 'toxico' ? '🧪' : char.role === 'psionico' ? '⚡' : '🪚'}
                          </div>
                        </div>
                        <div className="cepa-card-info">
                          <div className="cepa-card-name">{char.name.split(': ')[1] || char.name}</div>
                          <div className="cepa-card-level">Nv. {char.level}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ FICHA CLÍNICA ═══ */}
            {activeTab === 'heroes' && selectedCepa && (() => {
              const char = game.characters.find(c => c.id === selectedCepa);
              const cost = game.calcCharCost(char.baseCost, char.costMult, char.level);
              const canAfford = game.gold >= cost;
              const isDeployed = game.squad.includes(char.id);
              const isUnlocked = char.level > 0;
              const equipped = getEquippedItems(char.id);
              const slotsTotal = 3;

              const bonuses = equipped.reduce((acc, item) => {
                const statName = item.stat === 'tap' ? 'crit' : item.stat;
                acc[statName] = (acc[statName] || 0) + item.value;
                return acc;
              }, {});

              return (
                <div className="cepa-detail-view">
                  <div className="cepa-detail-header">
                    <div className="cepa-detail-avatar" style={{ border: `2px solid ${char.color}` }}>
                      {char.img ? <img src={char.img} alt={char.name} /> : <span>{char.emoji}</span>}
                    </div>
                    <div className="cepa-detail-stats">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{char.name}</h3>
                        <span className="role-tag" style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }}>
                          {char.role === 'asesino' ? '🔪 ASESINO' : char.role === 'toxico' ? '🧪 TÓXICO' : char.role === 'psionico' ? '⚡ PSIÓNICO' : '🪚 CARNICERO'}
                        </span>
                      </div>
                      <p>Nivel: <strong key={char.level} className="level-up-flash" style={{ color: 'var(--accent-cyan)' }}>{char.level}</strong></p>
                      <p>Inercia Viral: <strong>{game.formatNumber(game.calcCharDPS(char.baseDPS, char.dpsMult, Math.max(1, char.level)) * (1 + game.getCharItemBonus(char.id, 'dps')))}</strong></p>
                      <p>Ritmo de Ataque: <strong>{char.attackSpeed}s</strong></p>
                    </div>
                  </div>

                  {/* Slots de Implante */}
                  <div className="cepa-detail-inventory">
                    <h4>Implantes Cibernéticos</h4>
                    <div className="inventory-slots">
                      {['head', 'chest', 'weapon'].map((slotType) => {
                        const item = game.inventory.find(i => i.equippedTo === char.id && i.type === slotType);
                        const slotLabel = { head: 'Cabeza', chest: 'Pecho', weapon: 'Arma' }[slotType];
                        const slotEmoji = { head: '🧠', chest: '🛡️', weapon: '🗡️' }[slotType];

                        return item ? (
                          <div key={slotType} className="inventory-slot filled-slot" title={item.desc}
                            style={{ borderColor: RARITY_COLORS[item.stars - 1], flexDirection: 'column', height: 'auto', padding: '0.5rem 0.2rem', gap: '4px' }}>
                            <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.img ? (
                                <img src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : (
                                <span style={{ fontSize: '1.4rem' }}>{item.emoji}</span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{slotLabel}</span>
                            <button className="unequip-x" style={{ top: '2px', right: '2px' }} onClick={() => game.unequipItem(item.uid)}>✕</button>
                          </div>
                        ) : (
                          <div key={slotType} className="inventory-slot empty-slot"
                            onClick={() => { setFilterType(slotType); setPickingSlot({ charId: char.id, slotType }); }}
                            style={{ flexDirection: 'column', height: 'auto', padding: '0.6rem 0.2rem', gap: '6px' }}>
                            <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.1)' }}>{slotEmoji}</span>
                            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{slotLabel}</span>
                          </div>
                        );
                      })}
                    </div>

                    {Object.keys(bonuses).length > 0 && (
                      <div style={{ marginTop: '1rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px' }}>
                        <h5 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.9rem' }}>Total Bonus Aplicados</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {bonuses.dps && <div title="Aumenta el Daño por Segundo (DPS) de esta cepa.">🦠 Inercia Viral: <strong style={{ color: '#84cc16' }}>+{Math.round(bonuses.dps * 100)}%</strong></div>}
                          {bonuses.attackSpeed && <div title="Reduce el tiempo entre cada ataque de esta cepa.">⚡ Ritmo Ataque: <strong style={{ color: '#f59e0b' }}>+{Math.round(bonuses.attackSpeed * 100)}%</strong></div>}
                          {bonuses.gold && <div title="Aumenta la ganancia global de biomasa al derrotar enemigos."><img src="/icons/biomasa.png" alt="" style={{ width: '16px', verticalAlign: 'middle' }} /> Biomasa (Global): <strong style={{ color: '#eab308' }}>+{Math.round(bonuses.gold * 100)}%</strong></div>}
                          {bonuses.crit && <div title="Probabilidad de asestar un golpe crítico (daño doble).">🎯 Crítico: <strong style={{ color: '#ef4444' }}>+{Math.round(bonuses.crit * 100)}%</strong></div>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="cepa-detail-actions">
                    <button className="upgrade-btn main-action-btn" disabled={!canAfford}
                      onClick={() => game.upgradeCharacter(char.id)}>
                      {isUnlocked ? 'SOBRECARGA' : 'INCUBAR'}<br /><img src="/icons/biomasa.png" alt="Biomasa" style={{ width: '15px', height: '15px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 5px rgba(132,204,22,0.8))' }} /> {game.formatNumber(cost)}
                    </button>
                    {isUnlocked && (
                      <button className={`tactical-btn ${isDeployed ? 'withdraw' : 'deploy'}`}
                        onClick={() => game.toggleSquadMember(char.id)}
                        disabled={!isDeployed && game.squad.length >= 4}>
                        {isDeployed ? '🔴 Retirar' : '🟢 Desplegar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ═══ SOBRECARGA ═══ */}
            {activeTab === 'upgrades' && (
              <div className="upgrades-list" style={{ padding: '0 0.5rem' }}>
                {[
                  { id: 'tap', name: 'Impacto Cinético', desc: 'Aumenta el daño base de tus clics manuales.', emoji: '🤜', base: 10, mult: 1.5, color: '#06b6d4', suffix: '', inc: 10, label: 'Base Tap' },
                  { id: 'tapCrit', name: 'Precisión Quirúrgica', desc: 'Aumenta la probabilidad de asestar un golpe crítico con tus clics (x5 daño).', emoji: '🔪', base: 250, mult: 1.8, color: '#ef4444', suffix: '%', inc: 2, label: 'Tap Crit' },
                  { id: 'gold', name: 'Protocolo de Recolección', desc: 'Optimiza la extracción de biomasa de los enemigos derrotados.', emoji: '💰', base: 500, mult: 1.6, color: '#eab308', suffix: '%', inc: 10, label: 'Bonus Oro' },
                  { id: 'speed', name: 'Acelerador Metabólico', desc: 'Estimula el sistema nervioso de todas las cepas para atacar más rápido.', emoji: '⚡', base: 2000, mult: 1.8, color: '#f59e0b', suffix: '%', inc: 5, label: 'Atq. Speed' },
                  { id: 'crit', name: 'Sobrecarga Sináptica', desc: 'Mejora la precisión de los ataques automáticos para alcanzar puntos vitales.', emoji: '🎯', base: 1000, mult: 2.0, color: '#ef4444', suffix: '%', inc: 1, label: 'Prob. Crit.' },
                  { id: 'dps', name: 'Inercia Viral', desc: 'Potencia la virulencia general de todos tus ataques biológicos.', emoji: '🦠', base: 5000, mult: 1.7, color: '#84cc16', suffix: '%', inc: 10, label: 'Global DPS' }
                ].map(upg => {
                  const level = game.upgrades[upg.id] || 0;
                  const cost = Math.ceil(upg.base * Math.pow(upg.mult, level));
                  const canAfford = game.gold >= cost;
                  const currentValue = level * upg.inc;

                  return (
                    <div key={upg.id} className="box-card" style={{ '--box-color': upg.color, '--box-glow': upg.color + '44', marginBottom: '1rem', minHeight: '120px' }}>
                      <div className="box-card-icon" style={{ width: '70px', height: '70px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', position: 'relative' }}>
                        <span style={{ fontSize: '2rem' }}>{upg.emoji}</span>
                        <div style={{ fontSize: '0.65rem', fontWeight: 'bold', marginTop: '4px', textAlign: 'center' }}>
                          {currentValue}{upg.suffix}<br />
                          <span style={{ color: '#4ade80', fontSize: '0.55rem' }}>(+{upg.inc}{upg.suffix})</span>
                        </div>
                      </div>
                      <div className="box-card-info" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="box-card-name">{upg.name}</div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            NV. {level}
                          </div>
                        </div>
                        <div className="box-card-desc" style={{ marginBottom: '0.6rem', fontSize: '0.7rem' }}>{upg.desc}</div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button className="upgrade-btn"
                            disabled={!canAfford}
                            onClick={() => game.upgradeGlobal(upg.id)}
                            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>
                            SOBRECARGAR
                          </button>
                          <div style={{ minWidth: '80px', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Coste Biomasa</div>
                            <div style={{ color: canAfford ? 'var(--accent-cyan)' : '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}><img src="/icons/biomasa.png" alt="Biomasa" style={{ width: '15px', height: '15px', verticalAlign: 'middle', filter: 'drop-shadow(0 0 5px rgba(132,204,22,0.8))' }} /> {game.formatNumber(cost)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ═══ PRESTIGIO ═══ */}
            {activeTab === 'prestige' && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Al purgar el sistema pierdes tu biomasa y cepas, pero reconstruyes el ADN base.
                  Cada Cadena Perfecta otorga un <strong>+100% de Daño de Infección</strong> permanente.
                </p>
                <div style={{ fontSize: '1.2rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
                  Cadenas ADN: <strong style={{ color: 'var(--accent-gold)' }}>{game.relics}</strong>
                </div>
                <button className="upgrade-btn prestige-btn"
                  style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
                  disabled={game.level <= 10}
                  onClick={() => { game.prestige(); setActiveTab(null); }}>
                  {game.level > 10
                    ? `Mutar y extraer +${Math.floor(game.level / 10)} ADN`
                    : `Requiere Sector 11 (Actual: ${game.level})`}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ── Bottom Nav Bar ── */}
        <div className="bottom-nav-bar glass">
          <div className={`nav-item ${activeTab === 'heroes' ? 'active' : ''}`} onClick={() => handleTabClick('heroes')}>
            <div className="nav-icon">🧬</div>
            <div className="nav-text">Laboratorio</div>
          </div>
          <div className={`nav-item ${activeTab === 'boxes' ? 'active' : ''}`} onClick={() => handleTabClick('boxes')}>
            <div className="nav-icon">📦</div>
            <div className="nav-text">Cajas</div>
          </div>
          <div className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => handleTabClick('inventory')}>
            <div className="nav-icon">🗃️</div>
            <div className="nav-text">Inventario</div>
            {game.inventory.filter(i => !i.equippedTo).length > 0 && (
              <div className="nav-badge">{game.inventory.filter(i => !i.equippedTo).length}</div>
            )}
          </div>
          <div className={`nav-item ${activeTab === 'upgrades' ? 'active' : ''}`} onClick={() => handleTabClick('upgrades')}>
            <div className="nav-icon">⚡</div>
            <div className="nav-text">Mejoras</div>
          </div>
          <div className={`nav-item ${activeTab === 'prestige' ? 'active' : ''}`} onClick={() => handleTabClick('prestige')}>
            <div className="nav-icon">☢️</div>
            <div className="nav-text">Evolución</div>
          </div>
        </div>
        {/* ── Shop Modal ── */}
        {shopOpen && (
          <div className="fullscreen-overlay" onClick={() => setShopOpen(false)}>
            <div className="stats-panel glass" onClick={e => e.stopPropagation()}>
              <div className="stats-panel-header">
                <h3 style={{ color: '#f59e0b' }}>🛒 Terminal de Suministros</h3>
                <button className="sheet-close-btn" onClick={() => setShopOpen(false)}>✖</button>
              </div>

              <div className="stats-body shop-modal">
                {/* Sección Bundles (Slider) */}
                <div className="shop-section">
                  <div className="shop-section-title">🔥 Ofertas Destacadas</div>
                  <div className="bundles-slider">
                    <div className="bundle-card hot">
                      <div style={{ fontSize: '2rem' }}>📦</div>
                      <h4 style={{ fontSize: '0.9rem', color: 'white', margin: '0.5rem 0' }}>Pack Iniciación</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>50 🌌 + 1 🧪 Alfa</p>
                      <button className="upgrade-btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => { game.addResources(0, 50); game.openBox('alpha'); }}>0.99€</button>
                    </div>
                    <div className="bundle-card">
                      <div style={{ fontSize: '2rem' }}>🚀</div>
                      <h4 style={{ fontSize: '0.9rem', color: 'white', margin: '0.5rem 0' }}>Bio-Punk Pro</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>300 🌌 + 5 🧪 Beta</p>
                      <button className="upgrade-btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => { game.addResources(0, 300); Array(5).fill().forEach(() => game.openBox('beta')); }}>4.99€</button>
                    </div>
                    <div className="bundle-card">
                      <div style={{ fontSize: '2rem' }}>☣️</div>
                      <h4 style={{ fontSize: '0.9rem', color: 'white', margin: '0.5rem 0' }}>Mega Mutación</h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>1000 🌌 + 10 🧪 Omega</p>
                      <button className="upgrade-btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => { game.addResources(0, 1000); Array(10).fill().forEach(() => game.openBox('omega')); }}>9.99€</button>
                    </div>
                  </div>
                </div>

                {/* Sección Biomasa */}
                <div className="shop-section">
                  <div className="shop-section-title"><img src="/icons/biomasacofre.png" alt="" style={{ width: '20px', verticalAlign: 'middle' }} /> Cajas de Biomasa</div>
                  <div className="biomass-grid">
                    {[
                      { val: 1000000, price: '0.99€', img: <img src="/icons/biomasacofre.png" alt="Biomasa" style={{ width: '65px' }} /> },
                      { val: 6000000, price: '4.99€', img: <img src="/icons/biomasacofre.png" alt="Biomasa" style={{ width: '65px' }} /> },
                      { val: 15000000, price: '9.99€', img: <img src="/icons/biomasacofre.png" alt="Biomasa" style={{ width: '65px' }} /> },
                      { val: 50000000, price: '24.99€', img: <img src="/icons/biomasacofre.png" alt="Biomasa" style={{ width: '65px' }} /> },
                      { val: 150000000, price: '49.99€', img: <img src="/icons/biomasacofre.png" alt="Biomasa" style={{ width: '65px' }} /> },
                      { val: 500000000, price: '99.99€', img: <img src="/icons/biomasacofre.png" alt="Biomasa" style={{ width: '65px' }} /> }
                    ].map((p, i) => (
                      <div key={i} className="biomass-card">
                        <div style={{ fontSize: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '65px' }}>{p.img}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '0.3rem 0' }}>{game.formatNumber(p.val)}</div>
                        <button className="upgrade-btn" style={{ fontSize: '0.75rem', padding: '0.3rem' }} onClick={() => game.addResources(p.val, 0)}>{p.price}</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección Potenciadores */}
                <div className="shop-section">
                  <div className="shop-section-title">⚡ Potenciadores (Boosters x2)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {/* Daño */}
                    <div className="booster-card">
                      <div className="booster-status">
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem' }}>⚔️</span>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Daño de Escuadrón x2</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multiplica el daño total por 2</div>
                          </div>
                        </div>
                        {game.boosters.damage.expires > Date.now() && (
                          <div className="booster-timer">
                            {Math.ceil((game.boosters.damage.expires - Date.now()) / 1000 / 60)}m
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {game.permanentVIP || game.boosters.damage.expires > Date.now() ? (
                          <button className="upgrade-btn" style={{ flex: 1, fontSize: '0.7rem', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }} disabled>
                            ✅ POTENCIADOR ACTIVO
                          </button>
                        ) : (
                          <button
                            className="upgrade-btn"
                            style={{ flex: 1, fontSize: '0.7rem' }}
                            disabled={game.dailyAdBoosters.damage >= 3 || adPlaying}
                            onClick={() => {
                              setAdPlaying(true);
                              setTimeout(() => {
                                const success = game.activateBooster('damage', 'ad');
                                setAdPlaying(false);
                                setAdResult({
                                  success: !!success,
                                  msg: success ? '¡Potencial de combate duplicado! Tus Cepas han recibido la carga energética.' : 'Error al procesar el suministro.'
                                });
                              }, 5000);
                            }}>
                            📺 Ad ({3 - game.dailyAdBoosters.damage}/3)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Biomasa */}
                    <div className="booster-card">
                      <div className="booster-status">
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.5rem' }}><img src="/icons/biomasapack.png" alt="Biomasa" style={{ width: '35px', verticalAlign: 'middle' }} /></span>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Biomasa Obtenida x2</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Doble oro por cada enemigo</div>
                          </div>
                        </div>
                        {game.boosters.gold.expires > Date.now() && (
                          <div className="booster-timer">
                            {Math.ceil((game.boosters.gold.expires - Date.now()) / 1000 / 60)}m
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {game.permanentVIP || game.boosters.gold.expires > Date.now() ? (
                          <button className="upgrade-btn" style={{ flex: 1, fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderColor: '#f59e0b' }} disabled>
                            ✅ POTENCIADOR ACTIVO
                          </button>
                        ) : (
                          <button
                            className="upgrade-btn"
                            style={{ flex: 1, fontSize: '0.7rem' }}
                            disabled={game.dailyAdBoosters.gold >= 3 || adPlaying}
                            onClick={() => {
                              setAdPlaying(true);
                              setTimeout(() => {
                                const success = game.activateBooster('gold', 'ad');
                                setAdPlaying(false);
                                setAdResult({
                                  success: !!success,
                                  msg: success ? '¡Producción de biomasa duplicada! Los recolectores están trabajando al 200%.' : 'Error al procesar el suministro.'
                                });
                              }, 5000);
                            }}>
                            📺 Ad ({3 - game.dailyAdBoosters.gold}/3)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* VIP Permanente */}
                    <div className="bundle-card" style={{ borderStyle: 'dashed', borderColor: 'var(--accent-purple)' }}>
                      <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.9rem' }}>👑 Pase Élite Permanente</h4>
                      <p style={{ fontSize: '0.7rem', margin: '0.3rem 0' }}>Activa ambos multiplicadores (x2 Daño y x2 Oro) para siempre.</p>
                      <button className="upgrade-btn prestige-btn" style={{ width: '100%' }} onClick={() => game.activateBooster('both', 'purchase')} disabled={game.permanentVIP}>
                        {game.permanentVIP ? 'ADQUIRIDO' : '6.99€'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Ad Result Modal ── */}
        {adResult && (
          <div className="fullscreen-overlay" onClick={() => setAdResult(null)}>
            <div className="odds-modal glass" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', border: `1px solid ${adResult.success ? 'var(--accent-cyan)' : 'var(--accent-red)'}` }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{adResult.success ? '✅' : '❌'}</div>
              <h3 style={{ color: adResult.success ? 'var(--accent-cyan)' : 'var(--accent-red)', marginBottom: '0.5rem' }}>
                {adResult.success ? '¡Suministro Completado!' : 'Error de Sincronización'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{adResult.msg}</p>
              <button className="upgrade-btn" style={{ width: '100%' }} onClick={() => setAdResult(null)}>
                Entendido
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Tutorial Overlay (fuera del game-container para no afectar el layout flex) ── */}
      {tutorialStep !== null && (
        <TutorialOverlay
          step={tutorialStep}
          gold={game.gold}
          characters={game.characters}
          squad={game.squad}
          activeTab={activeTab}
          onNext={() => setTutorialStep(s => s + 1)}
          onComplete={() => {
            game.addResources(0, 50);
            game.setTutorialCompleted(true);
            setTutorialStep(null);
          }}
        />
      )}
    </>
  );
}

export default App;
