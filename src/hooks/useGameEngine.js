import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BOXES, rollBox, ITEMS } from '../data/lootboxes';

// Fórmulas matemáticas basadas en el GDD
const calcEnemyMaxHp = (level) => 10 * Math.pow(1.15, level);
const calcEnemyGold = (level) => 5 * Math.pow(1.1, level);
const calcCharCost = (baseCost, costMult, level) => baseCost * Math.pow(costMult, level);
const calcCharDPS = (baseDPS, dpsMult, level) => baseDPS * Math.pow(dpsMult, level);

// Datos iniciales de los personajes (Cepas Mutantes y Velocidades)
export const INITIAL_CHARACTERS = [
  { id: 'c1', name: 'Cepa-01: Cruel Talon', role: 'asesino', baseCost: 10, costMult: 1.15, baseDPS: 1, dpsMult: 1.1, level: 0, attackSpeed: 0.5, emoji: '🪚', img: '/champions/cruel-talon.png', color: '#06b6d4' },
  { id: 'c2', name: 'Cepa-02: Vomit-Acid', role: 'toxico', baseCost: 100, costMult: 1.2, baseDPS: 5, dpsMult: 1.15, level: 0, attackSpeed: 1.0, emoji: '🧪', img: '/champions/vomit-acid.png', color: '#84cc16' },
  { id: 'c3', name: 'Cepa-03: Neural-Shock', role: 'psionico', baseCost: 1000, costMult: 1.25, baseDPS: 30, dpsMult: 1.2, level: 0, attackSpeed: 2.0, emoji: '⚡', img: '/champions/neural-shock.png', color: '#3b82f6' },
  { id: 'c4', name: 'Cepa-04: Bone-Crusher', role: 'carnicero', baseCost: 5000, costMult: 1.3, baseDPS: 100, dpsMult: 1.25, level: 0, attackSpeed: 3.0, emoji: '🦴', img: '/champions/bone-crusher.png', color: '#f3f4f6' },
  { id: 'c5', name: 'Cepa-05: Spore-Cloud', role: 'toxico', baseCost: 25000, costMult: 1.35, baseDPS: 400, dpsMult: 1.3, level: 0, attackSpeed: 5.0, emoji: '🍄', img: '/champions/spore-cloud.png', color: '#9333ea' }
];

const NORMAL_ENEMIES = [
  { name: 'Sentinel-Drone',   emoji: '👁️', img: '/enemies/sentinel-drone.png' },
  { name: 'Purge-Trooper',    emoji: '🧑‍🚀', img: '/enemies/purge-trooper.png' },
  { name: 'Shock-Reaper',     emoji: '🕷️', img: '/enemies/shock-reaper.png' },
  { name: 'Chem-Tech Warden', emoji: '🛡️', img: '/enemies/chem-tech-warden.png' },
];

const BOSSES = [
  { name: 'El Carnicero de Circuitos', emoji: '⚙️', img: '/enemies/boss-carnicero.png' },
  { name: 'Unidad de Contención C-04', emoji: '🧊', img: '/enemies/boss-unidad-c04.png' },
  { name: 'La Matriarca Sintética',    emoji: '🧠', img: '/enemies/boss-matriarca.png' },
  { name: 'Heredero de Tungsteno',     emoji: '🦾', img: '/enemies/boss-heredero.png' },
  { name: 'Director Valerius',         emoji: '🕴️', img: '/enemies/boss-valerius.png' },
];

const BATTLE_BGS = ['/bg-battle.jpg', '/bg-battle2.jpg', '/bg-battle3.jpg', '/bg-battle4.jpg'];

const SAVE_KEY = 'idle_clicker_save';

export function useGameEngine(onHeroAttackCallback) {
  const [level, setLevel] = useState(1);
  const [gold, setGold] = useState(0);
  const [relics, setRelics] = useState(0);
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS);
  const [squad, setSquad] = useState([]);
  const [inventory, setInventory] = useState([]); // [{ id, uid, name, stars, stat, value, emoji, desc, equippedTo, setType }]
  const [darkMatter, setDarkMatter] = useState(0); // Nueva Moneda

  // Tienda / Mercado Negro
  const [shopItems, setShopItems] = useState([]);
  const [shopNextRefresh, setShopNextRefresh] = useState(0);
  const [shopManualRefreshes, setShopManualRefreshes] = useState(0);
  const [shopAdRefreshes, setShopAdRefreshes] = useState(0);
  const [shopLastReset, setShopLastReset] = useState(0);
  const [shopSlotsUnlocked, setShopSlotsUnlocked] = useState(3);
  
  // Upgrades Globales
  const [upgrades, setUpgrades] = useState({
    tap: 1,      // Nivel de daño base de clic
    tapCrit: 0,  // Nivel de probabilidad de crítico en clics
    gold: 0,
    speed: 0,
    crit: 0,
    dps: 0
  });

  // Monetización y Boosters
  const [boosters, setBoosters] = useState({
    damage: { expires: 0 },
    gold: { expires: 0 }
  });
  const [permanentVIP, setPermanentVIP] = useState(false);
  const [dailyAdBoosters, setDailyAdBoosters] = useState({
    damage: 0,
    gold: 0,
    lastReset: 0
  });

  // Estado del Enemigo
  const [enemy, setEnemy] = useState({
    name: 'Sentinel-Drone',
    emoji: '👁️',
    img: '/enemies/sentinel-drone.png',
    maxHp: calcEnemyMaxHp(1),
    hp: calcEnemyMaxHp(1),
    isBoss: false,
    timeLimit: 0,
    timeRemaining: 0,
    reward: calcEnemyGold(1)
  });

  const [offlineGoldEarned, setOfflineGoldEarned] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [attackPercentages, setAttackPercentages] = useState({});
  const [bgImage, setBgImage] = useState(BATTLE_BGS[0]);

  // Overdrive System
  const [overdriveProgress, setOverdriveProgress] = useState(0);
  const [overdriveActive, setOverdriveActive] = useState(false);
  const [overdriveCooldown, setOverdriveCooldown] = useState(0); // Tiempo restante en segundos

  // Valores Computados
  const prestigeMultiplier = 1 + (relics * 1.0);

  // Helper: calcula el bonus de ítems equipados en una cepa para un stat dado
  const getCharItemBonus = useCallback((charId, stat) => {
    return inventory
      .filter(item => item.equippedTo === charId && item.stat === stat)
      .reduce((acc, item) => acc + item.value, 0);
  }, [inventory]);

  // Helper: Detectar Sets ★6 Activos y su Progreso
  const activeSets = useMemo(() => {
    const sets = { 
      dps: { completed: 0, maxProgress: 0 }, 
      speed: { completed: 0, maxProgress: 0 }, 
      gold: { completed: 0, maxProgress: 0 }, 
      crit: { completed: 0, maxProgress: 0 } 
    };

    characters.forEach(char => {
      const equipped = inventory.filter(i => i.equippedTo === char.id && i.stars === 6);
      const setCounts = {};
      equipped.forEach(i => {
        if (i.setType) setCounts[i.setType] = (setCounts[i.setType] || 0) + 1;
      });

      Object.keys(setCounts).forEach(type => {
        if (sets[type]) {
          sets[type].maxProgress = Math.max(sets[type].maxProgress, setCounts[type]);
          if (setCounts[type] >= 3) {
            sets[type].completed++;
          }
        }
      });
    });
    return sets;
  }, [inventory, characters]);

  // Detectar Sinergias de Escuadrón Activas
  const squadSynergies = useMemo(() => {
    const counts = { carnicero: 0, toxico: 0, psionico: 0, asesino: 0 };
    squad.forEach(charId => {
      const char = characters.find(c => c.id === charId);
      if (char && char.role) {
        counts[char.role] = (counts[char.role] || 0) + 1;
      }
    });

    return {
      sangreYHueso: counts.carnicero >= 2,
      contaminacionCruzada: counts.toxico >= 2,
      menteColmena: counts.psionico >= 2,
      depredadoresApex: counts.asesino >= 2,
      mutacionPerfecta: counts.carnicero >= 1 && counts.toxico >= 1 && counts.psionico >= 1 && counts.asesino >= 1
    };
  }, [squad, characters]);

  // Bonus global de oro (Set Bonus: +100% per set)
  const globalGoldBonus = inventory.filter(i => i.stat === 'gold').reduce((acc, i) => acc + i.value, 0);
  const setGoldMult = 1 + (activeSets.gold.completed * 1.0);

  const totalDps = characters.reduce((acc, char) => {
    if (char.level === 0 || !squad.includes(char.id)) return acc;
    const dpsItemMult = 1 + getCharItemBonus(char.id, 'dps');
    const setMult = 1 + (activeSets.dps.completed * 1.0);
    const upgradeMult = 1 + (upgrades.dps * 0.1);
    const synDpsMult = 1 + (squadSynergies.sangreYHueso ? 0.10 : 0) + (squadSynergies.mutacionPerfecta ? 0.30 : 0);
    return acc + calcCharDPS(char.baseDPS, char.dpsMult, char.level) * dpsItemMult * setMult * upgradeMult * synDpsMult;
  }, 0) * prestigeMultiplier;

  // Daño por Click: 5% del DPS total como base, escalado por el nivel de 'tap'
  const synTapBonus = squadSynergies.sangreYHueso ? 1.15 : 1.0;
  const overdriveTapMult = overdriveActive ? 3 : 1;
  const tapDamage = ((totalDps * 0.05) + (upgrades.tap * prestigeMultiplier * 10)) * synTapBonus * overdriveTapMult;
  const tapCritProb = upgrades.tapCrit * 0.02; // +2% por nivel
  const tapCritMult = 5; // Los críticos de click pegan x5

  // Referencias para el Game Loop
  // heroTimers guardará el progreso de ataque de cada héroe individual
  const stateRef = useRef({ enemy, gold, totalDps, level, characters, relics, upgrades, squad, inventory, heroTimers: {}, activeSets, squadSynergies, darkMatter, shopItems, shopNextRefresh, shopManualRefreshes, shopAdRefreshes, shopLastReset, shopSlotsUnlocked, bgImage, tutorialCompleted, permanentVIP, dailyAdBoosters, overdriveProgress, overdriveActive, overdriveCooldown });
  stateRef.current = { enemy, gold, totalDps, level, characters, relics, upgrades, squad, inventory, heroTimers: stateRef.current.heroTimers, activeSets, squadSynergies, darkMatter, shopItems, shopNextRefresh, shopManualRefreshes, shopAdRefreshes, shopLastReset, shopSlotsUnlocked, bgImage, tutorialCompleted, permanentVIP, dailyAdBoosters, overdriveProgress, overdriveActive, overdriveCooldown };

  // Referencia al callback para usarlo dentro de useEffect sin dependencias
  const onAttackRef = useRef(onHeroAttackCallback);
  onAttackRef.current = onHeroAttackCallback;

  // --- SISTEMA DE GUARDADO ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLevel(parsed.level || 1);
        setGold(parsed.gold || 0);
        setRelics(parsed.relics || 0);
        setSquad(parsed.squad || []);
        const loadedInventory = (parsed.inventory || []).map(item => {
          // 1. Migración de IDs de Reliquias ★6 viejas
          let currentId = item.id;
          const relicMap = { 'i21': 'i21b', 'i22': 'i22a', 'i23': 'i23b', 'i24': 'i24a' };
          if (relicMap[currentId]) currentId = relicMap[currentId];
          
          const baseItem = ITEMS.find(it => it.id === currentId);
          if (!baseItem) return item;

          // Sincronizamos con los datos maestros (img, emoji, name, etc.)
          return { ...item, ...baseItem, uid: item.uid, equippedTo: item.equippedTo };
        });
        setInventory(loadedInventory);

        const loadedShop = (parsed.shopItems || []).map(si => {
          const base = ITEMS.find(it => it.id === si.itemData.id);
          if (!base) return si;
          return { ...si, itemData: { ...si.itemData, ...base } };
        });
        setShopItems(loadedShop);

        setDarkMatter(parsed.darkMatter || 0);
        setShopNextRefresh(parsed.shopNextRefresh || 0);
        setShopManualRefreshes(parsed.shopManualRefreshes || 0);
        setShopAdRefreshes(parsed.shopAdRefreshes || 0);
        setShopLastReset(parsed.shopLastReset || 0);
        setShopSlotsUnlocked(parsed.shopSlotsUnlocked || 3);
        setPermanentVIP(!!parsed.permanentVIP);
        setTutorialCompleted(!!parsed.tutorialCompleted);
        if (parsed.bgImage) setBgImage(parsed.bgImage);
        if (parsed.dailyAdBoosters) {
          setDailyAdBoosters(parsed.dailyAdBoosters);
        }
        
        if (parsed.upgrades) {
          setUpgrades(parsed.upgrades);
        } else if (parsed.tapDamageLevel) {
          setUpgrades(prev => ({ ...prev, tap: parsed.tapDamageLevel }));
        }
        if (parsed.characters) {
          const mergedChars = INITIAL_CHARACTERS.map(baseChar => {
            const savedChar = parsed.characters.find(c => c.id === baseChar.id);
            return savedChar ? { ...baseChar, level: savedChar.level } : baseChar;
          });
          setCharacters(mergedChars);
        } else {
          setCharacters(INITIAL_CHARACTERS);
        }

        
        if (parsed.enemy) {
          if (parsed.enemy.hp === null || isNaN(parsed.enemy.hp) || parsed.enemy.hp <= 0) {
            // Si el enemigo guardado está corrupto (ej: NaN por un bug anterior), forzar regeneración
            setTimeout(() => spawnEnemy(parsed.level || 1), 0);
          } else {
            setEnemy(parsed.enemy);
          }
        }

        // Progreso Offline
        if (parsed.lastSaveTime) {
          const now = Date.now();
          const offlineSeconds = Math.floor((now - parsed.lastSaveTime) / 1000);
          
          const savedPrestigeMultiplier = 1 + ((parsed.relics || 0) * 1.0);
          const savedTotalDps = (parsed.characters || INITIAL_CHARACTERS).reduce((acc, char) => {
            if (char.level === 0 || !(parsed.squad || []).includes(char.id)) return acc;
            return acc + calcCharDPS(char.baseDPS, char.dpsMult, char.level);
          }, 0) * savedPrestigeMultiplier;

          // Si estuvo fuera más de 5 segundos y tiene DPS
          if (offlineSeconds >= 5 && savedTotalDps > 0) {
            const hp = parsed.enemy?.maxHp || calcEnemyMaxHp(parsed.level || 1);
            const reward = parsed.enemy?.reward || calcEnemyGold(parsed.level || 1);
            
            // Fórmula: (DPS / Vida) * Recompensa por segundo
            const goldPerSecond = (savedTotalDps / hp) * reward;
            
            // Limitamos a un máximo de 24 horas (86400s)
            const maxSeconds = Math.min(offlineSeconds, 86400);
            const earnedGold = maxSeconds * goldPerSecond;
            
            if (earnedGold > 0) {
              setGold(parsed.gold + earnedGold); // Sumamos directamente sobre el oro cargado
              setOfflineGoldEarned(earnedGold);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error loading save", e);
    }
    setIsLoaded(true);
  }, []);

  // Autoguardado cada 5 segundos y al cerrar pestaña
  useEffect(() => {
    if (!isLoaded) return;
    
    const performSave = () => {
      const st = stateRef.current;
      const saveData = {
        level: st.level,
        gold: st.gold,
        relics: st.relics,
        characters: st.characters,
        squad: st.squad,
        inventory: st.inventory,
        upgrades: st.upgrades,
        enemy: st.enemy,
        darkMatter: st.darkMatter,
        shopItems: st.shopItems,
        shopNextRefresh: st.shopNextRefresh,
        shopManualRefreshes: st.shopManualRefreshes,
        shopAdRefreshes: st.shopAdRefreshes,
        shopLastReset: st.shopLastReset,
        shopSlotsUnlocked: st.shopSlotsUnlocked,
        permanentVIP: st.permanentVIP,
        tutorialCompleted: st.tutorialCompleted,
        dailyAdBoosters: st.dailyAdBoosters,
        lastSaveTime: Date.now()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    };

    const interval = setInterval(performSave, 5000);
    window.addEventListener('beforeunload', performSave);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', performSave);
    };
  }, [isLoaded]);

  const spawnEnemy = useCallback((newLevel) => {
    const isBoss = newLevel % 5 === 0;
    let maxHp = calcEnemyMaxHp(newLevel);
    let reward = calcEnemyGold(newLevel);

    let name = '';
    let emoji = '';
    let img = '';

    if (isBoss) {
      maxHp *= 5;
      reward *= 10;
      const bossIndex = (newLevel / 5 - 1) % BOSSES.length;
      name = BOSSES[bossIndex].name;
      emoji = BOSSES[bossIndex].emoji;
      img = BOSSES[bossIndex].img;
    } else {
      const enemyIndex = (newLevel - 1) % NORMAL_ENEMIES.length;
      name = NORMAL_ENEMIES[enemyIndex].name;
      emoji = NORMAL_ENEMIES[enemyIndex].emoji;
      img = NORMAL_ENEMIES[enemyIndex].img;
    }

    setEnemy({
      name,
      emoji,
      img,
      maxHp,
      hp: maxHp,
      isBoss,
      timeLimit: isBoss ? 30 : 0,
      timeRemaining: isBoss ? 30 : 0,
      reward
    });
  }, []);



  const onEnemyDefeated = useCallback(() => {
    const { reward, isBoss } = stateRef.current.enemy;
    // Bonus global de oro (Set Bonus: +100% per set)
    const goldBonus = inventory.filter(i => i.stat === 'gold').reduce((acc, i) => acc + i.value, 0);
    const setGoldMult = 1 + (activeSets.gold * 1.0);
    const upgradeGoldMult = 1 + (upgrades.gold * 0.1);
    
    const synGoldMult = 1 + (stateRef.current.squadSynergies.contaminacionCruzada ? 0.25 : 0) + (stateRef.current.squadSynergies.mutacionPerfecta ? 0.30 : 0);

    // Aplicar Booster x2
    const now = Date.now();
    const hasGoldBooster = permanentVIP || (boosters.gold.expires > now);
    const boosterMult = hasGoldBooster ? 2 : 1;
    
    setGold(g => g + (reward * (1 + goldBonus) * setGoldMult * upgradeGoldMult * synGoldMult * boosterMult));
    
    if (isBoss) {
      // Change background randomly when a boss is defeated
      const currentBg = stateRef.current.bgImage;
      const otherBgs = BATTLE_BGS.filter(bg => bg !== currentBg);
      const nextBg = otherBgs[Math.floor(Math.random() * otherBgs.length)];
      setBgImage(nextBg);
    }
    
    const nextLevel = level + 1;
    setLevel(nextLevel);
    spawnEnemy(nextLevel);
  }, [level, spawnEnemy, inventory, activeSets, permanentVIP, boosters.gold.expires]);

  const onBossFailed = useCallback(() => {
    const prevLevel = level - 1 > 0 ? level - 1 : 1;
    setLevel(prevLevel);
    spawnEnemy(prevLevel);
  }, [level, spawnEnemy]);

  // Manejador de eventos de estado (Muertes y Fallos) de forma segura en React
  useEffect(() => {
    if (!isLoaded) return;
    
    if (enemy.hp === 0) {
      const t = setTimeout(() => onEnemyDefeated(), 400);
      return () => clearTimeout(t);
    }
  }, [enemy.hp, enemy.isBoss, isLoaded, onEnemyDefeated]);

  const doDamage = useCallback((amount) => {
    setEnemy(e => {
      if (e.hp <= 0) return e; 
      if (e.hp - amount <= 0) {
        return { ...e, hp: 0 }; 
      }
      return { ...e, hp: e.hp - amount };
    });
  }, []);

  const handleTap = useCallback(() => {
    // Cargar barra de Overdrive
    if (!stateRef.current.overdriveActive && stateRef.current.overdriveCooldown <= 0) {
      setOverdriveProgress(p => {
        const next = Math.min(100, p + 4);
        if (next >= 100) {
          setOverdriveActive(true);
          // La duración se maneja en el loop
          return 100;
        }
        return next;
      });
    }

    let finalDmg = tapDamage;
    let isCrit = false;
    if (Math.random() < tapCritProb) {
      finalDmg *= tapCritMult;
      isCrit = true;
    }
    doDamage(finalDmg);
    return { damage: finalDmg, isCrit };
  }, [doDamage, tapDamage, tapCritProb, tapCritMult]);

  // Game Loop (DPS y Boss Timer) a 60 FPS
  useEffect(() => {
    if (!isLoaded) return;

    let lastTime = performance.now();
    let frameId;

    const loop = (time) => {
      const delta = (time - lastTime) / 1000; // Delta en segundos
      lastTime = time;
      
      const st = stateRef.current;

      // Aplicar Daño Automático (Rol RPG individual por héroe)
      const newPercentages = {};
      st.characters.forEach(char => {
        if (char.level > 0 && st.squad.includes(char.id) && st.enemy.hp > 0) {
          if (st.heroTimers[char.id] === undefined) st.heroTimers[char.id] = 0;
          st.heroTimers[char.id] += delta;

          const itemSpeedBonus = st.inventory
            .filter(i => i.equippedTo === char.id && i.stat === 'attackSpeed')
            .reduce((acc, i) => acc + i.value, 0);
          
          const globalSpeedBonus = st.activeSets.speed.completed * 0.5;
          const upgradeSpeedBonus = st.upgrades.speed * 0.05;
          const synSpeedBonus = st.squadSynergies.menteColmena ? 0.15 : 0;
          const overdriveSpeedBonus = st.overdriveActive ? 0.20 : 0;
          const effectiveSpeed = char.attackSpeed / (1 + itemSpeedBonus + globalSpeedBonus + upgradeSpeedBonus + synSpeedBonus + overdriveSpeedBonus);
          
          newPercentages[char.id] = Math.min(100, (st.heroTimers[char.id] / effectiveSpeed) * 100);

          if (st.heroTimers[char.id] >= effectiveSpeed) {
            const itemDpsBonus = st.inventory
              .filter(i => i.equippedTo === char.id && i.stat === 'dps')
              .reduce((acc, i) => acc + i.value, 0);

            const setDpsMult = 1 + (st.activeSets.dps.completed * 1.0);
            const upgradeDpsMult = 1 + (st.upgrades.dps * 0.1);
            const synDpsMult = 1 + (st.squadSynergies.sangreYHueso ? 0.10 : 0) + (st.squadSynergies.mutacionPerfecta ? 0.30 : 0);
            const charDps = calcCharDPS(char.baseDPS, char.dpsMult, char.level) * (1 + st.relics) * (1 + itemDpsBonus) * setDpsMult * upgradeDpsMult * synDpsMult;
            
            const critBonus = st.inventory
              .filter(i => i.equippedTo === char.id && (i.stat === 'crit' || i.stat === 'tap'))
              .reduce((acc, i) => acc + i.value, 0);
            
            const globalCritBonus = st.activeSets.crit.completed * 0.2;
            const upgradeCritBonus = st.upgrades.crit * 0.01;
            const synCritBonus = st.squadSynergies.depredadoresApex ? 0.15 : 0;
            const totalCritProb = critBonus + globalCritBonus + upgradeCritBonus + synCritBonus;

            let isCrit = false;
            const now = Date.now();
            const hasDamageBooster = permanentVIP || (boosters.damage.expires > now);
            const damageBoosterMult = hasDamageBooster ? 2 : 1;
            
            let damageHit = charDps * char.attackSpeed * damageBoosterMult;
            if (Math.random() < totalCritProb) {
              isCrit = true;
              damageHit *= 2; 
            }
            
            doDamage(damageHit);
            st.heroTimers[char.id] = 0; 
            newPercentages[char.id] = 0;
            
            if (onAttackRef.current) {
              onAttackRef.current(char, damageHit, isCrit);
            }
          }
        }
      });
      setAttackPercentages(newPercentages);

      // Lógica de Temporizador para Jefes
      if (st.enemy.isBoss && st.enemy.hp > 0) {
        if (st.enemy.timeRemaining <= 0) {
          // El tiempo se agotó: El jefe gana
          onBossFailed();
        } else {
          setEnemy(e => {
            if (e.timeRemaining <= 0) return e; 
            const newTime = e.timeRemaining - delta;
            return { ...e, timeRemaining: newTime <= 0 ? 0 : newTime };
          });
        }
      }

      // Lógica de Overdrive (Decaimiento, Duración y Cooldown)
      if (st.overdriveActive) {
        // El Overdrive dura 8 segundos (usamos el progress como timer de 100 a 0)
        setOverdriveProgress(p => {
          const next = p - (100 / 8) * delta;
          if (next <= 0) {
            setOverdriveActive(false);
            setOverdriveCooldown(20); // 20s de cooldown
            return 0;
          }
          return next;
        });
      } else if (st.overdriveCooldown > 0) {
        setOverdriveCooldown(c => Math.max(0, c - delta));
      } else {
        // Decaimiento natural si no está activo ni en cooldown
        setOverdriveProgress(p => Math.max(0, p - 5 * delta));
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [doDamage, onBossFailed, isLoaded]);

  // Funciones de Compra (Upgrades)
  const upgradeCharacter = (id) => {
    const char = stateRef.current.characters.find(c => c.id === id);
    if (!char) return;
    
    const cost = calcCharCost(char.baseCost, char.costMult, char.level);
    
    // Verificamos contra la ref (que es síncrona) para evitar que clics rápidos superen el oro
    if (stateRef.current.gold >= cost) {
      stateRef.current.gold -= cost; // Descontamos inmediatamente de la ref
      
      const updatedChars = stateRef.current.characters.map(c => 
        c.id === id ? { ...c, level: c.level + 1 } : c
      );
      stateRef.current.characters = updatedChars;

      setGold(g => g - cost);
      setCharacters(updatedChars);

      if (char.level === 0) {
        setSquad(prev => {
          if (prev.length < 4 && !prev.includes(id)) {
            const newSquad = [...prev, id];
            stateRef.current.squad = newSquad;
            return newSquad;
          }
          return prev;
        });
      }
    }
  };

  const toggleSquadMember = useCallback((id) => {
    setSquad(prev => {
      let newSquad = prev;
      if (prev.includes(id)) {
        newSquad = prev.filter(sId => sId !== id);
      } else if (prev.length < 4) {
        newSquad = [...prev, id];
      }
      stateRef.current.squad = newSquad;
      return newSquad;
    });
  }, []);

  const upgradeGlobal = useCallback((id) => {
    const configs = {
      tap: { base: 10, mult: 1.5 },
      tapCrit: { base: 250, mult: 1.8 }, // Nueva mejora
      gold: { base: 500, mult: 1.6 },
      speed: { base: 2000, mult: 1.8 },
      crit: { base: 1000, mult: 2.0 },
      dps: { base: 5000, mult: 1.7 }
    };
    const conf = configs[id];
    if (!conf) return;

    const currentLevel = upgrades[id] || 0;
    const cost = Math.ceil(conf.base * Math.pow(conf.mult, currentLevel));
    
    if (stateRef.current.gold >= cost) {
      stateRef.current.gold -= cost;
      setGold(g => g - cost);
      setUpgrades(prev => {
        const next = { ...prev, [id]: (prev[id] || 0) + 1 };
        stateRef.current.upgrades = next;
        return next;
      });
    }
  }, [upgrades]);

  const prestige = () => {
    if (level <= 10) return;
    const newRelics = Math.floor(level / 10);
    setRelics(r => r + newRelics);
    setLevel(1);
    setGold(0);
    setCharacters(INITIAL_CHARACTERS);
    setSquad([]);
    setInventory([]);
    setUpgrades({ tap: 1, tapCrit: 0, gold: 0, speed: 0, crit: 0, dps: 0 });
    spawnEnemy(1);
    // Ya no hacemos localStorage.removeItem, el auto-save se encargará de guardar el nuevo estado limpio en el siguiente tick.
  };

  const clearOfflineGold = () => setOfflineGoldEarned(0);

  const formatNumber = (num) => {
    if (num < 1000) return Math.floor(num).toString();
    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi"];
    const suffixNum = Math.floor((Math.floor(num).toString().length - 1) / 3);
    const safeSuffixNum = Math.min(suffixNum, suffixes.length - 1);
    
    let shortValue = num / Math.pow(1000, safeSuffixNum);
    let formatted = shortValue.toFixed(1);
    if (formatted.endsWith('.0')) {
      formatted = formatted.slice(0, -2);
    }
    return formatted + suffixes[safeSuffixNum];
  };

  // --- FUNCIONES DE INVENTARIO Y CAJAS ---
  const openBox = useCallback((boxId) => {
    const box = BOXES.find(b => b.id === boxId);
    if (!box) return null;
    if (stateRef.current.gold < box.cost) return null;

    stateRef.current.gold -= box.cost;
    setGold(g => g - box.cost);

    const item = rollBox(box);
    setInventory(prev => {
      const updated = [...prev, item];
      stateRef.current.inventory = updated;
      return updated;
    });
    return item;
  }, []);

  const openBoxMulti = useCallback((boxId, qty) => {
    const box = BOXES.find(b => b.id === boxId);
    if (!box) return null;
    const totalCost = box.cost * qty;
    if (stateRef.current.gold < totalCost) return null;

    stateRef.current.gold -= totalCost;
    setGold(g => g - totalCost);

    const items = Array.from({ length: qty }, () => rollBox(box));
    setInventory(prev => {
      const updated = [...prev, ...items];
      stateRef.current.inventory = updated;
      return updated;
    });
    return items;
  }, []);

  const equipItem = useCallback((uid, charId) => {
    setInventory(prev => {
      const itemToEquip = prev.find(i => i.uid === uid);
      if (!itemToEquip) return prev;

      const updated = prev.map(item => {
        // Desequipar el objeto que ya estaba en ese slot (cabeza/pecho/arma) del personaje
        if (item.equippedTo === charId && item.type === itemToEquip.type) {
          return { ...item, equippedTo: null };
        }
        // Equipar el nuevo objeto
        if (item.uid === uid) {
          return { ...item, equippedTo: charId };
        }
        return item;
      });
      stateRef.current.inventory = updated;
      return updated;
    });
  }, []);

  const unequipItem = useCallback((uid) => {
    setInventory(prev => {
      const updated = prev.map(item => {
        if (item.uid === uid) return { ...item, equippedTo: null };
        return item;
      });
      stateRef.current.inventory = updated;
      return updated;
    });
  }, []);
  // --- MECÁNICAS DE MERCADO NEGRO Y RECICLAJE ---
  const scrapItem = useCallback((itemUid) => {
    setInventory(prev => {
      const item = prev.find(i => i.uid === itemUid);
      if (!item || item.equippedTo) return prev;
      const dmValues = { 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 };
      setDarkMatter(d => d + (dmValues[item.stars] || 1));
      return prev.filter(i => i.uid !== itemUid);
    });
  }, []);

  const bulkScrapItems = useCallback((stars) => {
    setInventory(prev => {
      const dmValues = { 1: 1, 2: 3, 3: 10, 4: 30, 5: 100, 6: 500 };
      let dmGained = 0;
      const newInv = prev.filter(item => {
        if (!item.equippedTo && item.stars === stars) {
          dmGained += (dmValues[stars] || 1);
          return false; // remove
        }
        return true; // keep
      });
      if (dmGained > 0) setDarkMatter(d => d + dmGained);
      return newInv;
    });
  }, []);

  // Pure function: compute which item results from fusing these 5 UIDs (no side effects)
  const computeFusion = useCallback((itemUids) => {
    const itemsToFuse = stateRef.current.inventory.filter(i => itemUids.includes(i.uid));
    if (itemsToFuse.length !== 5) return null;
    const baseStars = itemsToFuse[0].stars;
    if (baseStars >= 5) return null;
    if (!itemsToFuse.every(i => i.stars === baseStars)) return null;

    // Stat weights for display
    const statCounts = {};
    itemsToFuse.forEach(i => { statCounts[i.stat] = (statCounts[i.stat] || 0) + 1; });
    const statWeights = Object.entries(statCounts).map(([stat, count]) => ({
      stat, count, pct: Math.round((count / 5) * 100)
    }));

    // Roll the result
    const statsWeighted = itemsToFuse.map(i => i.stat);
    const chosenStat = statsWeighted[Math.floor(Math.random() * statsWeighted.length)];
    const possibleItems = ITEMS.filter(i => i.stars === baseStars + 1 && i.stat === chosenStat);
    if (possibleItems.length === 0) return null;
    const newItem = { ...possibleItems[Math.floor(Math.random() * possibleItems.length)], uid: `fused_${Date.now()}` };
    return { newItem, statWeights, baseStars };
  }, []);

  // Commit: remove the 5 items and add the precomputed result to inventory
  const commitFusion = useCallback((itemUids, newItem) => {
    setInventory(prev => [
      ...prev.filter(i => !itemUids.includes(i.uid)),
      newItem
    ]);
  }, []);

  // Legacy wrapper kept for compatibility (returns boolean)
  const fuseItems = useCallback((itemUids) => {
    const result = computeFusion(itemUids);
    if (!result) return false;
    commitFusion(itemUids, result.newItem);
    return true;
  }, [computeFusion, commitFusion]);

  const generateShopItems = useCallback(() => {
    const newShop = [];
    const timestamp = Date.now();
    for (let i=0; i<9; i++) {
      const rnd = Math.random() * 100;
      let stars = 1;
      if (rnd < 0.5) stars = 6;
      else if (rnd < 5) stars = 5;
      else if (rnd < 15) stars = 4;
      else if (rnd < 30) stars = 3;
      else if (rnd < 60) stars = 2;
      
      const pool = ITEMS.filter(item => item.stars === stars);
      const chosen = pool[Math.floor(Math.random() * pool.length)] || pool[0];
      const baseCosts = { 1: 5, 2: 15, 3: 50, 4: 150, 5: 500, 6: 2000 };
      
      newShop.push({ 
        id: `shop_${timestamp}_${i}_${Math.random().toString(36).substr(2, 4)}`, 
        itemData: chosen, 
        cost: baseCosts[stars], 
        purchased: false 
      });
    }
    setShopItems(newShop);
  }, []);

  const refreshShop = useCallback((type) => {
    const now = Date.now();
    if (type === 'auto') {
      if (now < shopNextRefresh) return false;
    } else if (type === 'manual') {
      if (shopManualRefreshes >= 3 || darkMatter < 10) return false;
      setDarkMatter(prev => prev - 10);
      setShopManualRefreshes(prev => prev + 1);
    } else if (type === 'ad') {
      if (shopAdRefreshes >= 5) return false;
      setShopAdRefreshes(prev => prev + 1);
    }
    generateShopItems();
    setShopNextRefresh(now + 3600000);
    return true;
  }, [shopNextRefresh, shopManualRefreshes, shopAdRefreshes, darkMatter, generateShopItems]);

  const buyShopItem = useCallback((shopId) => {
    const shopItem = shopItems.find(si => si.id === shopId);
    if (!shopItem || shopItem.purchased || darkMatter < shopItem.cost) return false;
    setDarkMatter(prev => prev - shopItem.cost);
    setShopItems(prev => prev.map(si => si.id === shopId ? { ...si, purchased: true } : si));
    setInventory(prev => [...prev, { ...shopItem.itemData, uid: Date.now() + Math.random().toString(36).substr(2, 9) }]);
    return true;
  }, [shopItems, darkMatter]);

  const unlockShopSlot = useCallback(() => {
    const st = stateRef.current;
    if (st.shopSlotsUnlocked >= 9) return false;
    
    // Slots 4, 5, 6 se compran con DM
    if (st.shopSlotsUnlocked < 6) {
      const costs = { 3: 50, 4: 150, 5: 500 };
      const cost = costs[st.shopSlotsUnlocked];
      if (st.darkMatter >= cost) {
        setDarkMatter(prev => prev - cost);
        setShopSlotsUnlocked(prev => prev + 1);
        return true;
      }
    } 
    // Los slots 7, 8, 9 requieren VIP Permanente
    else if (st.permanentVIP) {
      setShopSlotsUnlocked(prev => Math.min(9, prev + 1));
      return true;
    }
    return false;
  }, []);

  // Inicialización de la tienda si está vacía
  useEffect(() => {
    if (isLoaded && shopItems.length === 0) {
      generateShopItems();
    }
  }, [isLoaded, shopItems.length, generateShopItems]);

  // Reset diario de refrescos manuales y de anuncios (incluyendo boosters)
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (isLoaded && shopLastReset < today) {
      setShopManualRefreshes(0);
      setShopAdRefreshes(0);
      setDailyAdBoosters({ damage: 0, gold: 0, lastReset: today });
      setShopLastReset(today);
    }
  }, [isLoaded, shopLastReset]);

  return {
    level, gold, relics, characters, squad, inventory, tapDamage, totalDps, enemy, upgrades,
    upgradeCharacter, toggleSquadMember, handleTap, openBox, openBoxMulti, equipItem, unequipItem, scrapItem, formatNumber, prestige,
    calcCharCost, calcCharDPS, getCharItemBonus, activeSets, squadSynergies, darkMatter, computeFusion, commitFusion, bulkScrapItems,
    shopItems, shopNextRefresh, shopManualRefreshes, shopAdRefreshes, shopSlotsUnlocked, refreshShop, buyShopItem, unlockShopSlot,
    offlineGoldEarned, clearOfflineGold, upgradeGlobal, isLoaded, attackPercentages, tutorialCompleted, setTutorialCompleted,
    boosters, permanentVIP, dailyAdBoosters, bgImage,
    overdriveProgress, overdriveActive, overdriveCooldown,
    activateBooster: (type, method) => {
      const now = Date.now();
      if (method === 'ad') {
        if (dailyAdBoosters[type] >= 3) return false;
        setDailyAdBoosters(prev => ({ ...prev, [type]: prev[type] + 1 }));
        setBoosters(prev => ({
          ...prev,
          [type]: { expires: Math.max(prev[type].expires, now) + (5 * 60 * 1000) }
        }));
      } else if (method === 'purchase') {
        setPermanentVIP(true);
      }
      return true;
    },
    addResources: (goldVal, dmVal) => {
      if (goldVal) setGold(g => g + goldVal);
      if (dmVal) setDarkMatter(d => d + dmVal);
    }
  };
}
