// ============================================================
// POOL DE ÍTEMS (Implantes Cibernéticos)
// stat: 'dps' | 'attackSpeed' | 'gold' | 'tap'
// value: multiplicador (0.05 = +5%)
// ============================================================
export const ITEMS = [
  // ★1 — Comunes
  { id: 'i01', name: 'Núcleo de Bilis', stars: 1, stat: 'dps',         value: 0.05, emoji: '🫀', type: 'chest', desc: '+5% Inercia Viral', img: '/items/i01.png' },
  { id: 'i02', name: 'Espina Córnea',   stars: 1, stat: 'attackSpeed', value: 0.05, emoji: '🦷', type: 'head',  desc: '+5% Vel. Ataque', img: '/items/i02.png' },
  { id: 'i03', name: 'Linfa Tóxica',    stars: 1, stat: 'gold',        value: 0.08, emoji: '💧', type: 'head',  desc: '+8% Biomasa ganada', img: '/items/i03.png' },
  { id: 'i04', name: 'Garra Endurecida',stars: 1, stat: 'crit',        value: 0.06, emoji: '🎯', type: 'weapon',desc: '+6% Prob. Crítico', img: '/items/i04.png' },

  // ★2 — Poco comunes
  { id: 'i05', name: 'Glándula de Ácido',   stars: 2, stat: 'dps',         value: 0.12, emoji: '⚗️', type: 'head',  desc: '+12% Inercia Viral', img: '/items/i05.png' },
  { id: 'i06', name: 'Membrana Reforzada',  stars: 2, stat: 'attackSpeed', value: 0.10, emoji: '🧲', type: 'chest', desc: '+10% Vel. Ataque', img: '/items/i06.png' },
  { id: 'i07', name: 'Glándula Áurica',     stars: 2, stat: 'gold',        value: 0.18, emoji: '💰', type: 'head',  desc: '+18% Biomasa ganada', img: '/items/i07.png' },
  { id: 'i08', name: 'Músculo Mutado',      stars: 2, stat: 'crit',        value: 0.15, emoji: '💪', type: 'chest', desc: '+15% Prob. Crítico', img: '/items/i08.png' },

  // ★3 — Raros
  { id: 'i09', name: 'Tendón de Titanio',   stars: 3, stat: 'dps',         value: 0.22, emoji: '⚙️', type: 'weapon',desc: '+22% Inercia Viral', img: '/items/i09.png' },
  { id: 'i10', name: 'Implante Neural',      stars: 3, stat: 'attackSpeed', value: 0.18, emoji: '🧠', type: 'head',  desc: '+18% Vel. Ataque', img: '/items/i10.png' },
  { id: 'i11', name: 'Nódulo Explotador',   stars: 3, stat: 'gold',        value: 0.30, emoji: '💎', type: 'chest', desc: '+30% Biomasa ganada', img: '/items/i11.png' },
  { id: 'i12', name: 'Tendón de Carbono',   stars: 3, stat: 'crit',        value: 0.25, emoji: '🎯', type: 'weapon',desc: '+25% Prob. Crítico', img: '/items/i12.png' },

  // ★4 — Épicos
  { id: 'i13', name: 'ADN Sintético Puro',        stars: 4, stat: 'dps',         value: 0.38, emoji: '🧬', type: 'chest', desc: '+38% Inercia Viral', img: '/items/i13.png' },
  { id: 'i14', name: 'Núcleo de Hipervelocidad',  stars: 4, stat: 'attackSpeed', value: 0.30, emoji: '⚡', type: 'head',  desc: '+30% Vel. Ataque', img: '/items/i14.png' },
  { id: 'i15', name: 'Parásito Económico',         stars: 4, stat: 'gold',        value: 0.50, emoji: '🪱', type: 'weapon',desc: '+50% Biomasa ganada', img: '/items/i15.png' },
  { id: 'i16', name: 'Exoesqueleto Táctico',      stars: 4, stat: 'crit',        value: 0.40, emoji: '🛡️', type: 'chest', desc: '+40% Prob. Crítico', img: '/items/i16.png' },

  // ★5 — Legendarios
  { id: 'i17', name: 'Cromosoma X-Virus',     stars: 5, stat: 'dps',         value: 0.65, emoji: '☣️', type: 'chest', desc: '+65% Inercia Viral', img: '/items/i17.png' },
  { id: 'i18', name: 'Protocolo Neuronal Ω',  stars: 5, stat: 'attackSpeed', value: 0.50, emoji: '🌀', type: 'head',  desc: '+50% Vel. Ataque', img: '/items/i18.png' },
  { id: 'i19', name: 'Simbionte Áureo',        stars: 5, stat: 'gold',        value: 0.90, emoji: '👑', type: 'head',  desc: '+90% Biomasa ganada', img: '/items/i19.png' },
  { id: 'i20', name: 'Mano del Exterminador',  stars: 5, stat: 'crit',        value: 0.75, emoji: '🔥', type: 'weapon',desc: '+75% Prob. Crítico', img: '/items/i20.png' },

  // ★6 — Reliquias (Mercado Negro / Sets)
  // Set DPS: Poder Absoluto
  { id: 'i21a', name: 'Corona de Singularidad', stars: 6, stat: 'dps', value: 1.20, emoji: '👑', type: 'head',   setType: 'dps', desc: '+120% Inercia [Set: Poder Absoluto]', img: '/items/i21a.png' },
  { id: 'i21b', name: 'Coraza de Singularidad', stars: 6, stat: 'dps', value: 1.20, emoji: '🛡️', type: 'chest',  setType: 'dps', desc: '+120% Inercia [Set: Poder Absoluto]', img: '/items/i21b.png' },
  { id: 'i21c', name: 'Filo de Singularidad',   stars: 6, stat: 'dps', value: 1.20, emoji: '🗡️', type: 'weapon', setType: 'dps', desc: '+120% Inercia [Set: Poder Absoluto]', img: '/items/i21c.png' },
  
  // Set Speed: Frenesí Temporal
  { id: 'i22a', name: 'Visor Cronal',           stars: 6, stat: 'attackSpeed', value: 0.80, emoji: '🥽', type: 'head',   setType: 'speed', desc: '+80% Vel. Ataque [Set: Frenesí]', img: '/items/i22a.png' },
  { id: 'i22b', name: 'Motor Taquiónico',       stars: 6, stat: 'attackSpeed', value: 0.80, emoji: '🌀', type: 'chest',  setType: 'speed', desc: '+80% Vel. Ataque [Set: Frenesí]', img: '/items/i22b.png' },
  { id: 'i22c', name: 'Acelerador de Pulsos',   stars: 6, stat: 'attackSpeed', value: 0.80, emoji: '🔫', type: 'weapon', setType: 'speed', desc: '+80% Vel. Ataque [Set: Frenesí]', img: '/items/i22c.png' },

  // Set Gold: Asimilación
  { id: 'i23a', name: 'Sensores de Riqueza',    stars: 6, stat: 'gold', value: 2.00, emoji: '👁️', type: 'head',   setType: 'gold', desc: '+200% Biomasa [Set: Asimilación]', img: '/items/i23a.png' },
  { id: 'i23b', name: 'Extractor Planetario',   stars: 6, stat: 'gold', value: 2.00, emoji: '🪐', type: 'chest',  setType: 'gold', desc: '+200% Biomasa [Set: Asimilación]', img: '/items/i23b.png' },
  { id: 'i23c', name: 'Cosechador de Almas',    stars: 6, stat: 'gold', value: 2.00, emoji: '🔱', type: 'weapon', setType: 'gold', desc: '+200% Biomasa [Set: Asimilación]', img: '/items/i23c.png' },

  // Set Crit: Aniquilación
  { id: 'i24a', name: 'Ojo del Verdugo',        stars: 6, stat: 'crit', value: 1.00, emoji: '👁️', type: 'head',   setType: 'crit', desc: '+100% Crítico [Set: Aniquilación]', img: '/items/i24a.png' },
  { id: 'i24b', name: 'Núcleo de Fisión',       stars: 6, stat: 'crit', value: 1.00, emoji: '☢️', type: 'chest',  setType: 'crit', desc: '+100% Crítico [Set: Aniquilación]', img: '/items/i24b.png' },
  { id: 'i24c', name: 'Guadaña del Vacío',      stars: 6, stat: 'crit', value: 1.00, emoji: '💀', type: 'weapon', setType: 'crit', desc: '+100% Crítico [Set: Aniquilación]', img: '/items/i24c.png' },
];

// ============================================================
// BONUS DE SET (★6)
// ============================================================
export const SET_BONUSES = {
  'dps': { name: 'Poder Absoluto', desc: '+100% Inercia Total en toda la partida.' },
  'speed': { name: 'Frenesí Temporal', desc: '+50% Vel. Ataque Global.' },
  'gold': { name: 'Asimilación', desc: '+100% Biomasa por cada golpe.' },
  'crit': { name: 'Aniquilación', desc: '+20% Prob. Crítico Global.' }
};

// ============================================================
// CAJAS (Lootboxes) — pesos por rareza de estrella
// weights: [★1, ★2, ★3, ★4, ★5]  (deben sumar 100)
// ============================================================
export const BOXES = [
  {
    id: 'box_common',
    name: 'Núcleo Orgánico',
    emoji: '🟫',
    img: '/boxes/box-common.png',
    cost: 500,
    color: '#92400e',
    glowColor: 'rgba(146, 64, 14, 0.5)',
    desc: 'Restos de organismos eliminados. Contiene implantes básicos.',
    weights: [60, 25, 12, 3, 0],
  },
  {
    id: 'box_rare',
    name: 'Recipiente Sintético',
    emoji: '🟦',
    img: '/boxes/box-rare.png',
    cost: 5000,
    color: '#1d4ed8',
    glowColor: 'rgba(29, 78, 216, 0.5)',
    desc: 'Contenedor de laboratorio con biomasa concentrada. Mayor calidad garantizada.',
    weights: [30, 35, 25, 9, 1],
  },
  {
    id: 'box_elite',
    name: 'Cápsula Élite',
    emoji: '🟨',
    img: '/boxes/box-elite.png',
    cost: 50000,
    color: '#b45309',
    glowColor: 'rgba(180, 83, 9, 0.6)',
    desc: 'Tecnología de punta. Solo contiene implantes Raros, Épicos o Legendarios.',
    weights: [0, 20, 40, 30, 10],
  },
];

// Nombres de rareza para mostrar en UI
export const RARITY_NAMES = ['Común', 'Poco Común', 'Raro', 'Épico', 'Legendario', 'Reliquia'];
export const RARITY_COLORS = ['#94a3b8', '#4ade80', '#60a5fa', '#c084fc', '#fbbf24', '#f43f5e'];

// ============================================================
// Función de apertura de caja (lógica pura, sin estado React)
// ============================================================
export function rollBox(box) {
  // 1. Determinar rareza según pesos
  const roll = Math.random() * 100;
  let cumulative = 0;
  let starLevel = 1;
  for (let i = 0; i < box.weights.length; i++) {
    cumulative += box.weights[i];
    if (roll < cumulative) {
      starLevel = i + 1;
      break;
    }
  }

  // 2. Filtrar ítems de esa rareza y elegir uno al azar
  const pool = ITEMS.filter(item => item.stars === starLevel);
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  return { ...chosen, uid: `${chosen.id}_${Date.now()}_${Math.random()}` };
}
