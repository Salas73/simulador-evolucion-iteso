/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Dna, Skull, Trophy, Activity, Shield, Feather, Wind, Eye, HeartPulse, RefreshCw, Sparkles, GitBranch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- TS Interfaces & Types ---
type GameState = 'intro' | 'difficulty' | 'build' | 'mutation' | 'event' | 'resolution' | 'speciation' | 'gameover' | 'victory';

interface Stats {
  size: number;
  thermal: number;
  camo: number;
  defense: number;
  metabolism: number;
  reproduction: number;
  immunity: number;
  speed: number;
  senses: number;
}

interface StatDef {
  key: keyof Stats;
  label: string;
  category: 'Físicas (Morfológicas)' | 'Metabólicas (Fisiológicas)' | 'Locomotoras';
  icon: React.ReactNode;
  desc: string;
  cost: number;
}

interface GameEvent {
  id: string;
  name: string;
  description: string;
  calculateSurvival: (stats: Stats) => number;
  successStory: (stats: Stats) => string;
  failureStory: (stats: Stats) => string;
}

// --- Data Definitions ---
// Costos asimétricos: size y defense exigen más inversión (trade-off real).
const STAT_DEFS: StatDef[] = [
  { key: 'size', label: 'Tamaño', category: 'Físicas (Morfológicas)', icon: <Activity className="w-4 h-4" />, desc: 'Termorregulación e intimidación, pero exige más alimento.', cost: 2 },
  { key: 'thermal', label: 'Aislamiento Térmico', category: 'Físicas (Morfológicas)', icon: <Feather className="w-4 h-4" />, desc: 'Grasa, pelaje o plumas. Vital para climas fríos.', cost: 1 },
  { key: 'camo', label: 'Camuflaje', category: 'Físicas (Morfológicas)', icon: <Eye className="w-4 h-4" />, desc: 'Coloración críptica para evitar detección.', cost: 1 },
  { key: 'defense', label: 'Defensa Física', category: 'Físicas (Morfológicas)', icon: <Shield className="w-4 h-4" />, desc: 'Corazas, espinas o toxinas.', cost: 2 },
  { key: 'metabolism', label: 'Ef. Metabólica', category: 'Metabólicas (Fisiológicas)', icon: <HeartPulse className="w-4 h-4" />, desc: 'Aprovechamiento de nutrientes con poca comida.', cost: 1 },
  { key: 'reproduction', label: 'Tasa de Reprod.', category: 'Metabólicas (Fisiológicas)', icon: <RefreshCw className="w-4 h-4" />, desc: 'Cantidad de crías. Compensa altas tasas de mortalidad.', cost: 1 },
  { key: 'immunity', label: 'Inmunidad', category: 'Metabólicas (Fisiológicas)', icon: <Shield className="w-4 h-4" />, desc: 'Resistencia fisiológica a patógenos.', cost: 1 },
  { key: 'speed', label: 'Velocidad', category: 'Locomotoras', icon: <Wind className="w-4 h-4" />, desc: 'Para huir o cazar. Requiere energía.', cost: 1 },
  { key: 'senses', label: 'Agudeza Sensorial', category: 'Locomotoras', icon: <Eye className="w-4 h-4" />, desc: 'Detección temprana de amenazas o alimento.', cost: 1 },
];

const STAT_COST: Record<keyof Stats, number> = STAT_DEFS.reduce((acc, s) => {
  acc[s.key] = s.cost;
  return acc;
}, {} as Record<keyof Stats, number>);

const MUTATION_IMPACTS: Record<keyof Stats, { positive: string, negative: string }> = {
  size: {
    positive: "A mayor tamaño, mejor termorregulación y menor depredación, pero exige un alto costo calórico.",
    negative: "Un menor tamaño reduce las necesidades alimenticias, aunque incrementa la vulnerabilidad."
  },
  thermal: {
    positive: "El desarrollo de un mayor aislamiento protege los tejidos del daño por congelamiento.",
    negative: "La reducción de cobertura corporal facilita la disipación de calor pero compromete la viabilidad en frío."
  },
  camo: {
    positive: "Los nuevos patrones crípticos dificultan la detección visual por parte de otras especies.",
    negative: "La pérdida de mimetismo hace a la especie más vistosa y llamativa."
  },
  defense: {
    positive: "El engrosamiento de la piel o un exoesqueleto endurecido previene el daño físico directo.",
    negative: "La inhibición de la síntesis de defensas aligera el organismo a costa de mayor fragilidad."
  },
  metabolism: {
    positive: "Enzimas digestivas más potentes asimilan nutrientes de fuentes antes descartadas.",
    negative: "Un metabolismo ineficiente consume las reservas rápidamente y requiere alimentación constante."
  },
  reproduction: {
    positive: "Mutaciones que acortan la gestación permiten repoblar el nicho tras catástrofes.",
    negative: "Un ciclo reproductivo más lento limita la variabilidad, aunque puede dar crías más desarrolladas."
  },
  immunity: {
    positive: "Alteraciones en los glóbulos blancos ofrecen resistencia fortuita a patógenos emergentes.",
    negative: "Un fallo en el código genético merma la respuesta innata de protección microbiológica."
  },
  speed: {
    positive: "Cambios en las fibras musculares facilitan la evasión acelerada.",
    negative: "Las restricciones motoras priorizan la cautela sobre la velocidad."
  },
  senses: {
    positive: "Los abombamientos nerviosos amplían el rango de detección preventiva.",
    negative: "El deterioro de los nervios sensoriales reduce el tiempo de reacción general."
  }
};

const INITIAL_STATS: Stats = {
  size: 0, thermal: 0, camo: 0, defense: 0,
  metabolism: 0, reproduction: 0, immunity: 0,
  speed: 0, senses: 0,
};

const MAX_STAT_LEVEL = 5;
const SPECIATION_AFTER_TURN = 3;

const DIFFICULTY: Record<string, { points: number, label: string, desc: string }> = {
  easy:   { points: 20, label: 'Linaje Adaptado',    desc: '20 puntos. Margen amplio para experimentar.' },
  medium: { points: 15, label: 'Equilibrio Natural', desc: '15 puntos. Dificultad estándar.' },
  hard:   { points: 10, label: 'Presión Extrema',    desc: '10 puntos. Cada decisión es crítica.' },
};

// --- Eventos darwinianos ampliados ---
// Todos pueden penalizar stats (trade-off cruzado), no solo recompensar.
const EVENTS: GameEvent[] = [
  {
    id: 'glaciacion',
    name: 'Glaciación Repentina',
    description: 'La temperatura global ha descendido drásticamente. Los lagos se congelan y los vientos helados barren las llanuras.',
    calculateSurvival: (stats) => {
      let prob = 10 + (stats.thermal * 18) + (stats.size * 8) + (stats.metabolism * 6);
      return Math.min(Math.max(prob, 5), 95);
    },
    successStory: (stats) => {
      const drivers: string[] = [];
      if (stats.thermal >= 3) drivers.push('su espeso aislamiento térmico retuvo el calor corporal');
      if (stats.size >= 3) drivers.push('su masa robusta redujo la pérdida calórica relativa');
      if (stats.metabolism >= 3) drivers.push('su eficiencia metabólica aprovechó el escaso forraje invernal');
      const reason = drivers.length > 0 ? drivers.join(' y ') : 'una combinación marginal de rasgos';
      return `¡Han sobrevivido! Los individuos menos adaptados perecieron porque ${reason}. La selección natural filtró el linaje sin propósito alguno.`;
    },
    failureStory: () => `La especie no soportó el frío extremo. La falta de aislamiento térmico condujo a una falla metabólica por hipotermia. La selección natural ha sido implacable.`,
  },
  {
    id: 'sequia',
    name: 'Sequía Prolongada',
    description: 'Hace meses que no llueve. El agua escasea, la vegetación se seca y los recursos son mínimos.',
    calculateSurvival: (stats) => {
      let prob = 30 + (stats.metabolism * 20) - (stats.size * 8) - (stats.reproduction * 8);
      return Math.max(Math.min(prob, 95), 5);
    },
    successStory: (stats) => `¡Prosperan en la adversidad! ${stats.metabolism > 2 ? 'Su altísima eficiencia metabólica les permitió extraer hasta la última gota de nutrientes.' : 'Su metabolismo basal logró sostenerlos.'} La escasez filtró a quienes demandaban demasiados recursos.`,
    failureStory: (stats) => `La hambruna y la sed los han diezmado. ${stats.size > 2 ? 'Sus grandes cuerpos requerían una ingesta insostenible.' : 'Su rápido ciclo reproductivo no pudo mantenerse.'} Un fracaso fisiológico ante el medio carente de recursos.`,
  },
  {
    id: 'depredador',
    name: 'Aparición de un Súper-Depredador',
    description: 'Una nueva especie depredadora altamente agresiva ha migrado a su hábitat, alterando la cadena trófica.',
    calculateSurvival: (stats) => {
      // Tamaño grande hace al organismo más visible (penaliza camuflaje efectivo).
      let prob = 10 + (stats.speed * 14) + (stats.camo * 14) + (stats.defense * 14) + (stats.senses * 8) - (stats.size * 4);
      return Math.min(Math.max(prob, 5), 95);
    },
    successStory: (stats) => {
      const best = Math.max(stats.speed, stats.camo, stats.defense);
      if (best === stats.camo && stats.camo > 0) return `Su coloración críptica les hizo invisibles al depredador. Los individuos más vistosos fueron devorados rápida e inexorablemente.`;
      if (best === stats.speed && stats.speed > 0) return `Sus ágiles extremidades y sistema cardiorrespiratorio les permitieron superar en carrera al cazador.`;
      if (best === stats.defense && stats.defense > 0) return `Sus defensas físicas (corazas, espinas o exoesqueleto) disuadieron al depredador de atacarlos.`;
      return `Por azar, los pocos sobrevivientes lograron escapar a refugios marginales. La presión selectiva fue brutal.`;
    },
    failureStory: () => `El depredador aniquiló a su población. La especie carecía de la velocidad, las defensas o el camuflaje necesarios. Un clásico ejemplo de cómo la presión selectiva erradica a los no aptos.`,
  },
  {
    id: 'virus',
    name: 'Brote Viral Letal',
    description: 'Un patógeno altamente contagioso se propaga por el ecosistema, infectando rápidamente a casi toda la población.',
    calculateSurvival: (stats) => {
      // Alta densidad por reproducción acelera contagio si la inmunidad es baja.
      let prob = 10 + (stats.immunity * 22) + (stats.reproduction * 10);
      if (stats.immunity < 2) prob -= stats.reproduction * 6;
      return Math.min(Math.max(prob, 5), 95);
    },
    successStory: (stats) => `La especie se ha sobrepuesto. ${stats.immunity >= stats.reproduction ? 'Variaciones previas en su sistema inmunológico produjeron anticuerpos eficaces.' : 'Su altísima tasa reproductiva mantuvo viable la población mientras nacían individuos resistentes.'}`,
    failureStory: () => `El colapso fue casi absoluto. Sus defensas inmunológicas sucumbieron ante la replicación viral. El acervo genético no contenía la llave para combatir este patógeno.`,
  },
  {
    id: 'meteorito',
    name: 'Caída de Meteorito (Deriva Génica)',
    description: 'Un cataclismo impredecible. Un gigantesco impacto meteorítico asola el continente, provocando incendios y tsunamis.',
    calculateSurvival: () => 50,
    successStory: () => `¡Por azares del destino, han sobrevivido! Ni morfología ni fisiología jugaron el papel principal: pura "Deriva Génica". Estaban en el lado correcto del continente durante el impacto.`,
    failureStory: () => `Trágicamente, la especie fue borrada. Este evento no discriminó al "más apto". Fue puro azar geográfico — un cataclismo ciego que demuestra que a veces la supervivencia requiere simple suerte.`,
  },
  {
    id: 'cuelloBotella',
    name: 'Cuello de Botella Poblacional',
    description: 'Una catástrofe local ha reducido la población a unos pocos individuos. Quienes sobrevivan determinarán todo el acervo genético futuro.',
    calculateSurvival: () => 60,
    successStory: () => `La población se recupera, pero el acervo genético se ha empobrecido drásticamente. Los rasgos de los pocos supervivientes — fueran adaptativos o no — dominarán al linaje. Es deriva génica en acción: el azar, no la aptitud, ha esculpido el futuro.`,
    failureStory: () => `El cuello de botella fue demasiado estrecho. La consanguinidad y la pérdida de variabilidad condenaron al linaje. Sin variación, la selección natural no tiene material sobre el cual actuar.`,
  },
  {
    id: 'competencia',
    name: 'Competencia Interespecífica',
    description: 'Una especie rival con un nicho similar ha invadido el territorio. La competencia por alimento y refugio se intensifica.',
    calculateSurvival: (stats) => {
      let prob = 15 + (stats.metabolism * 14) + (stats.senses * 12) + (stats.speed * 8) - (stats.size * 5);
      return Math.min(Math.max(prob, 5), 95);
    },
    successStory: (stats) => `Han desplazado al competidor. ${stats.metabolism >= stats.senses ? 'Su eficiencia metabólica les permitió subsistir con menos recursos.' : 'Su agudeza sensorial localizó el alimento primero.'} El principio de exclusión competitiva favoreció su nicho.`,
    failureStory: () => `El rival ha demostrado ser más eficiente explotando los recursos compartidos. Por exclusión competitiva, su nicho ha sido absorbido y la población colapsa.`,
  },
  {
    id: 'deforestacion',
    name: 'Cambio Abrupto de Hábitat',
    description: 'El bosque que les dio cobijo ha sido reemplazado por pradera abierta. Los patrones de coloración antes crípticos ahora destacan sobre el nuevo fondo.',
    calculateSurvival: (stats) => {
      // El camuflaje específico al bosque ya no sirve (incluso penaliza si era alto).
      let prob = 25 + (stats.speed * 12) + (stats.senses * 10) + (stats.metabolism * 6) - (stats.camo * 5);
      return Math.min(Math.max(prob, 5), 95);
    },
    successStory: () => `La transición fue brutal pero superable. Quienes no estaban sobreespecializados al bosque y tenían movilidad para recorrer distancias prosperaron. Un rasgo "ventajoso" lo es solo en su contexto.`,
    failureStory: (stats) => `El nuevo entorno los expuso. ${stats.camo >= 3 ? 'Irónicamente, su camuflaje altamente especializado al bosque los volvió blancos visibles en la pradera.' : 'No tuvieron la movilidad para encontrar refugios alternos.'} La adaptación pasada se convirtió en su condena.`,
  },
  {
    id: 'eutrofizacion',
    name: 'Eutrofización del Ecosistema',
    description: 'Un exceso de nutrientes (algas, bacterias) ha alterado el agua y la cadena alimenticia. Toxinas y patógenos oportunistas proliferan.',
    calculateSurvival: (stats) => {
      let prob = 15 + (stats.immunity * 16) + (stats.metabolism * 12) - (stats.size * 4);
      return Math.min(Math.max(prob, 5), 95);
    },
    successStory: () => `Su fisiología logró tolerar las nuevas toxinas. Los individuos con defensas inmunológicas y metabólicas robustas filtraron y procesaron lo que para otros era veneno.`,
    failureStory: () => `Las toxinas y patógenos oportunistas devastaron al linaje. Sin tolerancia inmunológica ni metabólica, el ecosistema alterado se volvió letal.`,
  },
];

// --- Main Application ---
export default function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [pointsSpent, setPointsSpent] = useState(0);
  const [maxPoints, setMaxPoints] = useState(15);

  const [eventQueue, setEventQueue] = useState<GameEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [eventResult, setEventResult] = useState<{survived: boolean, prob: number, message: string, rolled: number} | null>(null);
  const [pendingMutation, setPendingMutation] = useState<{key: keyof Stats, oldVal: number, newVal: number, isPositive: boolean, desc: string} | null>(null);
  const [highlightedStat, setHighlightedStat] = useState<keyof Stats | null>(null);
  const [speciationOptions, setSpeciationOptions] = useState<{label: string, desc: string, stats: Stats}[] | null>(null);
  const [hasSpeciated, setHasSpeciated] = useState(false);

  const [historyLog, setHistoryLog] = useState<{turn: number, title: string, desc: string, type: 'info' | 'success' | 'danger'}[]>([]);
  const [turnCounter, setTurnCounter] = useState(0);
  const [survivedCount, setSurvivedCount] = useState(0);

  const restartGame = () => {
    setStats(INITIAL_STATS);
    setPointsSpent(0);
    setHistoryLog([]);
    setTurnCounter(0);
    setSurvivedCount(0);
    setHasSpeciated(false);
    setPendingMutation(null);
    setSpeciationOptions(null);
    setGameState('intro');
    setHighlightedStat(null);
  };

  const handleStatChange = (key: keyof Stats, delta: number) => {
    const cost = STAT_COST[key];
    const currentVal = stats[key];
    const pointDelta = delta * cost;
    const newPointsSpent = pointsSpent + pointDelta;

    if (newPointsSpent > maxPoints || newPointsSpent < 0) return;
    if (currentVal + delta < 0 || currentVal + delta > MAX_STAT_LEVEL) return;

    setStats(prev => ({ ...prev, [key]: prev[key] + delta }));
    setPointsSpent(newPointsSpent);
  };

  const startGame = () => {
    const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
    setEventQueue(shuffled);
    setTurnCounter(1);
    setHistoryLog([{
      turn: 1,
      title: 'Génesis',
      desc: 'Población inicial establecida en bioma base.',
      type: 'info'
    }]);
    advanceToNextEvent(shuffled, stats, false);
  };

  // Mutación PRE-evento: las variaciones existen ANTES de la presión selectiva.
  const advanceToNextEvent = (queue: GameEvent[], currentStats: Stats, applyMutation: boolean) => {
    if (queue.length === 0) {
      setGameState('victory');
      return;
    }

    let nextStats = currentStats;
    let mutated = false;

    if (applyMutation && Math.random() <= 0.35) {
      const statKeys = Object.keys(currentStats) as (keyof Stats)[];
      const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
      const isPositive = Math.random() > 0.5;
      const oldVal = currentStats[randomStat];
      const newVal = isPositive ? Math.min(MAX_STAT_LEVEL, oldVal + 1) : Math.max(0, oldVal - 1);

      if (oldVal !== newVal) {
        mutated = true;
        const statLabel = STAT_DEFS.find(s => s.key === randomStat)?.label;
        const impactDesc = isPositive ? MUTATION_IMPACTS[randomStat].positive : MUTATION_IMPACTS[randomStat].negative;
        const mutDesc = `Mutación en ${statLabel}: ${oldVal} → ${newVal}. ${impactDesc} Como toda mutación, este error de copiado genético ocurrió ANTES de saber qué presión vendría.`;

        nextStats = { ...currentStats, [randomStat]: newVal };
        setStats(nextStats);
        setPendingMutation({ key: randomStat, oldVal, newVal, isPositive, desc: mutDesc });
        setHighlightedStat(randomStat);
        setHistoryLog(prev => [{
          turn: turnCounter,
          title: 'Mutación pre-selectiva',
          desc: mutDesc,
          type: 'info'
        }, ...prev]);
      }
    }

    const [nextEvent, ...rest] = queue;
    setCurrentEvent(nextEvent);
    setEventQueue(rest);
    setEventResult(null);

    if (mutated) {
      setGameState('mutation');
    } else {
      setPendingMutation(null);
      setGameState('event');
    }
  };

  const acknowledgeMutation = () => {
    setPendingMutation(null);
    setHighlightedStat(null);
    setGameState('event');
  };

  const resolveEvent = () => {
    if (!currentEvent) return;
    const probOfSurvival = currentEvent.calculateSurvival(stats);
    const roll = Math.floor(Math.random() * 100) + 1;
    const survived = roll <= probOfSurvival;
    const message = survived ? currentEvent.successStory(stats) : currentEvent.failureStory(stats);

    setEventResult({ survived, prob: probOfSurvival, message, rolled: roll });
    setHistoryLog(prev => [{
      turn: turnCounter,
      title: currentEvent.name,
      desc: survived ? `superado (${probOfSurvival}% req., tirada ${roll}).` : `extinción (${probOfSurvival}% req., tirada ${roll}).`,
      type: survived ? 'success' : 'danger'
    }, ...prev]);

    setGameState('resolution');
  };

  const generateSpeciationOptions = (): {label: string, desc: string, stats: Stats}[] => {
    const morphHeavy: Stats = { ...stats };
    const physioHeavy: Stats = { ...stats };
    (['size', 'defense', 'camo'] as (keyof Stats)[]).forEach(k => { morphHeavy[k] = Math.min(MAX_STAT_LEVEL, morphHeavy[k] + 1); });
    (['speed', 'metabolism'] as (keyof Stats)[]).forEach(k => { morphHeavy[k] = Math.max(0, morphHeavy[k] - 1); });
    (['speed', 'metabolism', 'senses'] as (keyof Stats)[]).forEach(k => { physioHeavy[k] = Math.min(MAX_STAT_LEVEL, physioHeavy[k] + 1); });
    (['size', 'defense'] as (keyof Stats)[]).forEach(k => { physioHeavy[k] = Math.max(0, physioHeavy[k] - 1); });
    return [
      { label: 'Linaje Robusto', desc: 'Subpoblación aislada en zonas frías y rocosas. Mayor tamaño, defensa y camuflaje, a costa de velocidad y metabolismo.', stats: morphHeavy },
      { label: 'Linaje Ágil', desc: 'Subpoblación que migró a praderas abiertas. Mayor velocidad, metabolismo y sentidos, a costa de tamaño y defensa.', stats: physioHeavy },
    ];
  };

  const handleNextTurn = () => {
    if (!eventResult?.survived) {
      setGameState('gameover');
      return;
    }
    const newSurvived = survivedCount + 1;
    setSurvivedCount(newSurvived);
    setTurnCounter(t => t + 1);

    if (newSurvived === SPECIATION_AFTER_TURN && !hasSpeciated && eventQueue.length > 0) {
      setSpeciationOptions(generateSpeciationOptions());
      setGameState('speciation');
      return;
    }

    advanceToNextEvent(eventQueue, stats, true);
  };

  const chooseSpeciation = (option: {label: string, desc: string, stats: Stats}) => {
    setStats(option.stats);
    setHasSpeciated(true);
    setHistoryLog(prev => [{
      turn: turnCounter,
      title: 'Especiación alopátrica',
      desc: `El linaje se bifurcó. Continuamos siguiendo a "${option.label}" — la otra subpoblación sigue su propio rumbo evolutivo.`,
      type: 'info'
    }, ...prev]);
    setSpeciationOptions(null);
    advanceToNextEvent(eventQueue, option.stats, true);
  };

  const remainingPoints = maxPoints - pointsSpent;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* HEADER */}
      <div className="h-[60px] bg-slate-900 text-white flex items-center px-6 border-b-4 border-emerald-600 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl font-extrabold tracking-tight">
            DarwinSim <span className="text-emerald-500">v2.0</span>
          </span>
          <span className="ml-2 md:ml-4 text-slate-400 text-xs md:text-sm border-l border-slate-700 pl-2 md:pl-4 uppercase tracking-widest hidden sm:inline-block">
            Simulador de Selección Natural
          </span>
        </div>
        {gameState !== 'intro' && (
          <button onClick={restartGame} className="ml-auto text-sm px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-2 font-medium">
            <RefreshCw className="w-4 h-4" />
            Reiniciar
          </button>
        )}
      </div>

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-4 max-w-[1400px] w-full mx-auto lg:h-[calc(100vh-60px)]">

        {/* LEFT COLUMN: STATS */}
        <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200 flex flex-col h-auto lg:h-full lg:overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-sm flex justify-between items-center shrink-0">
            <span>ATRIBUTOS</span>
            <span className="text-emerald-600">{remainingPoints} / {maxPoints} Pts</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
            {['Físicas (Morfológicas)', 'Metabólicas (Fisiológicas)', 'Locomotoras'].map((cat) => (
              <section key={cat}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{cat}</label>
                <div className="mt-2 space-y-3">
                  {STAT_DEFS.filter(s => s.category === cat).map(stat => {
                    const isHighlighted = highlightedStat === stat.key;
                    const cost = STAT_COST[stat.key];
                    return (
                    <div key={stat.key} className={`p-1.5 -mx-1.5 rounded-lg transition-colors duration-500 ${isHighlighted ? 'bg-amber-100 ring-1 ring-amber-400/50' : ''}`}>
                      <div className="flex justify-between text-[11px] md:text-xs mb-1.5 font-medium text-slate-700">
                        <span title={stat.desc}>
                          {stat.label}
                          {cost > 1 && <span className="ml-1 text-[9px] text-amber-700 font-bold" title={`Cuesta ${cost} puntos por nivel`}>×{cost}</span>}
                        </span>
                        <span>{stats[stat.key]}/5</span>
                      </div>
                      {gameState === 'build' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatChange(stat.key, -1)}
                            disabled={stats[stat.key] === 0}
                            className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 flex items-center justify-center font-bold text-slate-600 text-xs transition-colors cursor-pointer"
                          >-</button>
                          <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${(stats[stat.key] / 5) * 100}%` }}></div>
                          </div>
                          <button
                            onClick={() => handleStatChange(stat.key, 1)}
                            disabled={stats[stat.key] === MAX_STAT_LEVEL || pointsSpent + cost > maxPoints}
                            className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50 flex items-center justify-center font-bold text-slate-600 text-xs transition-colors cursor-pointer"
                          >+</button>
                        </div>
                      ) : (
                        <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${(stats[stat.key] / 5) * 100}%` }}></div>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </section>
            ))}
          </div>
          {pendingMutation && gameState === 'mutation' && (
            <div className="p-4 bg-amber-50 border-t border-amber-200 shrink-0">
              <div className="text-[10px] text-amber-800 font-bold mb-1 uppercase">Mutación previa al evento:</div>
              <p className="text-xs text-amber-900">{pendingMutation.desc}</p>
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN */}
        <div className="flex flex-col gap-4 lg:h-full lg:overflow-hidden">

          <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200 flex-1 relative flex flex-col p-6 lg:overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">

              {gameState === 'intro' && (
                <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center max-w-xl mx-auto items-center text-center py-8">
                  <BookOpen className="w-16 h-16 text-emerald-600 mb-6" />
                  <h2 className="font-serif text-4xl mb-4 text-slate-800 italic">Bienvenido al Simulador</h2>
                  <p className="text-slate-600 mb-8 max-w-sm text-sm md:text-base leading-relaxed">
                    Configura los atributos genéticos de tu especie y sométela a las presiones del medio ambiente. Consulta el <strong>Cuaderno de Darwin</strong> para asegurar tus decisiones teóricas.
                  </p>
                  <button onClick={() => setGameState('difficulty')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md">
                    COMENZAR
                  </button>
                </motion.div>
              )}

              {gameState === 'difficulty' && (
                <motion.div key="difficulty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center items-center text-center py-8">
                  <h2 className="font-serif text-3xl mb-2 text-slate-800 italic">Selecciona la presión inicial</h2>
                  <p className="text-slate-500 mb-8 text-sm">Cuántos puntos tendrás para esculpir el linaje.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
                    {Object.entries(DIFFICULTY).map(([key, d]) => (
                      <button
                        key={key}
                        onClick={() => { setMaxPoints(d.points); setStats(INITIAL_STATS); setPointsSpent(0); setGameState('build'); }}
                        className="bg-white border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-lg p-5 text-left transition-all"
                      >
                        <div className="text-2xl font-black text-emerald-600">{d.points}</div>
                        <div className="font-bold text-slate-800 mt-1">{d.label}</div>
                        <div className="text-xs text-slate-500 mt-2">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {gameState === 'build' && (
                <motion.div key="build" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center items-center text-center py-8">
                  <div className="bg-slate-100 p-4 rounded-full mb-6 text-slate-500">
                    <Dna className="w-12 h-12" />
                  </div>
                  <h2 className="font-serif text-3xl mb-4 text-slate-800 italic">Diseño Fenotípico</h2>
                  <p className="text-slate-500 mb-4 max-w-md text-sm md:text-base leading-relaxed">
                    Usa el panel lateral para asignar <strong>{maxPoints} puntos</strong>. Estas decisiones conformarán el linaje inicial de la población.
                  </p>
                  <p className="text-amber-700 mb-8 max-w-md text-xs leading-relaxed bg-amber-50 px-4 py-2 rounded border border-amber-200">
                    <strong>Trade-off:</strong> Tamaño y Defensa cuestan <strong>2 puntos</strong> por nivel — desarrollar masa o blindaje sale caro, biológicamente y aquí.
                  </p>
                  <button
                    onClick={startGame}
                    disabled={pointsSpent === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md disabled:opacity-50 disabled:bg-slate-400 flex items-center justify-center gap-2"
                  >
                    INICIAR SIMULACIÓN
                    {remainingPoints > 0 && <span className="text-xs font-normal opacity-80 ml-2">({remainingPoints} sin asignar)</span>}
                  </button>
                </motion.div>
              )}

              {gameState === 'mutation' && pendingMutation && (
                <motion.div key="mutation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-xl shadow-sm border ${pendingMutation.isPositive ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-orange-50 border-orange-200 text-orange-600'}`}>
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-slate-800">Mutación Pre-Selectiva</h2>
                      <p className="text-xs mt-1 font-medium text-slate-500">Una variación apareció ANTES de que se conociera la siguiente presión.</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 md:p-6 rounded-lg border border-slate-200 flex-1 mb-8 text-sm md:text-base text-slate-700 leading-relaxed italic border-l-4 border-l-amber-400">
                    "{pendingMutation.desc}"
                  </div>
                  <button onClick={acknowledgeMutation} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-8 rounded-full font-bold transition-all w-full sm:w-auto self-center shadow-md">
                    Ver siguiente presión ambiental
                  </button>
                </motion.div>
              )}

              {gameState === 'event' && currentEvent && (
                <motion.div key={`event-${currentEvent.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-100 text-red-700 tracking-wider">
                      Turno {turnCounter}
                    </span>
                  </div>
                  <h2 className="text-3xl font-serif italic mb-3 text-slate-800 pr-24 leading-tight">{currentEvent.name}</h2>
                  <p className="text-slate-600 text-sm mb-6 leading-relaxed max-w-lg">{currentEvent.description}</p>

                  <div className="bg-slate-900 text-white rounded-xl p-8 text-center flex-1 flex flex-col justify-center items-center shadow-inner">
                    <div className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-semibold">Probabilidad de Supervivencia</div>
                    <div className="text-6xl md:text-7xl font-black text-emerald-400 mb-2">{currentEvent.calculateSurvival(stats)}%</div>
                    <div className="text-[10px] text-slate-500 mb-8">Basado en sus atributos actuales</div>
                    <button onClick={resolveEvent} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-10 rounded-full transition-colors w-full sm:w-auto shadow-lg shadow-emerald-900/50">
                      ENFRENTAR EVENTO
                    </button>
                  </div>
                </motion.div>
              )}

              {gameState === 'resolution' && eventResult && (
                <motion.div key="resolution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 rounded-xl shadow-sm border ${eventResult.survived ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                      {eventResult.survived ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-slate-800">
                        {eventResult.survived ? 'Población Sobrevive' : 'Linaje Extinto'}
                      </h2>
                      <p className={`text-xs mt-1 font-medium ${eventResult.survived ? 'text-emerald-600' : 'text-red-500'}`}>
                        Requería {eventResult.prob}% — El azar dictó {eventResult.rolled}.
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-5 md:p-6 rounded-lg border border-slate-200 flex-1 mb-8 text-sm md:text-base text-slate-700 leading-relaxed italic border-l-4 border-l-slate-400">
                    "{eventResult.message}"
                  </div>
                  <button
                    onClick={handleNextTurn}
                    className={`py-3.5 px-8 rounded-full font-bold transition-all w-full sm:w-auto self-center shadow-md ${
                      eventResult.survived ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {eventResult.survived ? 'Avanzar Era Continua' : 'Concluir Simulación'}
                  </button>
                </motion.div>
              )}

              {gameState === 'speciation' && speciationOptions && (
                <motion.div key="speciation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-xl shadow-sm border bg-indigo-50 border-indigo-200 text-indigo-600">
                      <GitBranch className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-slate-800">Especiación Alopátrica</h2>
                      <p className="text-xs mt-1 font-medium text-slate-500">Una barrera geográfica ha aislado dos subpoblaciones. Cada una sigue su propia trayectoria evolutiva.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-6">
                    {speciationOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => chooseSpeciation(opt)}
                        className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-lg p-5 text-left transition-all"
                      >
                        <div className="font-bold text-slate-800 text-lg">{opt.label}</div>
                        <div className="text-xs text-slate-500 mt-2 leading-relaxed">{opt.desc}</div>
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px]">
                          {STAT_DEFS.map(s => (
                            <div key={s.key} className="flex justify-between">
                              <span className="text-slate-500">{s.label.slice(0, 6)}.</span>
                              <span className={opt.stats[s.key] > stats[s.key] ? 'text-emerald-600 font-bold' : opt.stats[s.key] < stats[s.key] ? 'text-red-500' : 'text-slate-700'}>
                                {opt.stats[s.key]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 italic text-center">Solo seguirás a uno de los linajes. El otro continuará evolucionando fuera de cuadro.</p>
                </motion.div>
              )}

              {gameState === 'gameover' && (
                <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center items-center text-center p-6">
                  <Skull className="w-20 h-20 text-slate-300 mb-6 drop-shadow-sm" />
                  <h2 className="font-serif text-3xl font-bold text-slate-800 mb-2">Registro Fósil</h2>
                  <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed">
                    La especie sobrevivió <strong>{survivedCount}</strong> presiones antes de extinguirse. La selección natural es un mecanismo ciego de criba, sin propósitos.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8 max-w-md w-full">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Fenotipo final</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {STAT_DEFS.map(s => (
                        <div key={s.key} className="flex justify-between">
                          <span className="text-slate-600">{s.label.slice(0, 8)}.</span>
                          <span className="font-bold text-slate-800">{stats[s.key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={restartGame} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md">
                    INTENTAR NUEVO LINAJE
                  </button>
                </motion.div>
              )}

              {gameState === 'victory' && (
                <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center items-center text-center p-6">
                  <div className="bg-emerald-50 p-6 rounded-full mb-6 border border-emerald-100">
                    <Trophy className="w-16 h-16 text-emerald-600" />
                  </div>
                  <h2 className="font-serif text-3xl font-bold text-slate-800 mb-2 italic">Supervivencia Asegurada</h2>
                  <p className="text-slate-500 mb-6 max-w-md text-sm leading-relaxed">
                    Tu linaje superó <strong>{survivedCount}</strong> presiones ambientales. La especie prosperará — al menos hasta el siguiente cambio del medio.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8 max-w-md w-full">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Fenotipo final</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {STAT_DEFS.map(s => (
                        <div key={s.key} className="flex justify-between">
                          <span className="text-slate-600">{s.label.slice(0, 8)}.</span>
                          <span className="font-bold text-slate-800">{stats[s.key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={restartGame} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md shadow-emerald-600/30">
                    REALIZAR NUEVA MEZCLA
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {gameState !== 'intro' && gameState !== 'difficulty' && (
            <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200 h-48 lg:h-[180px] shrink-0 flex flex-col p-4 overflow-hidden">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Registro de Eventos</div>
              <div className="overflow-y-auto space-y-0 custom-scrollbar pr-2 flex-1">
                {historyLog.length === 0 ? (
                  <div className="text-xs text-slate-400 italic mt-2">Esperando datos fisiológicos...</div>
                ) : historyLog.map((log, i) => (
                  <div key={i} className={`text-[0.75rem] py-2 border-b border-slate-50/80 ${log.type === 'danger' ? 'text-red-600' : log.type === 'success' ? 'text-emerald-700' : 'text-slate-700'}`}>
                    <strong className="font-semibold">Gen {log.turn} — {log.title}:</strong> <span className="text-slate-600">{log.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DARWIN'S NOTEBOOK */}
        <div className="bg-[#fefce8] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-slate-200 border-l-[8px] border-l-[#ca8a04] p-5 md:p-6 flex flex-col h-auto lg:h-full lg:overflow-y-auto custom-scrollbar">
          <h3 className="font-serif text-xl border-b border-yellow-200/80 pb-3 mb-5 text-slate-800 italic">Cuaderno de Darwin</h3>
          <div className="space-y-5 text-sm leading-relaxed text-slate-700">
            <section>
              <h4 className="font-bold text-slate-800 underline decoration-yellow-400 decoration-2 mb-2">1. Variación</h4>
              <p className="text-[13px]">Los individuos no son idénticos: presentan diferencias por mutaciones aleatorias del ADN. Estas surgen <strong>antes</strong> de que la presión actúe — no como respuesta a ella.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 underline decoration-yellow-400 decoration-2 mb-2">2. Herencia</h4>
              <p className="text-[13px]">Los rasgos adaptativos deben tener componente genético para transmitirse a la siguiente generación.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 underline decoration-yellow-400 decoration-2 mb-2">3. Selección Natural</h4>
              <p className="text-[13px]">El ambiente filtra ciegamente: los rasgos ventajosos <em>en ese contexto</em> se reproducen más. Lo "ventajoso" cambia con el ambiente.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 underline decoration-yellow-400 decoration-2 mb-2">4. Deriva Génica</h4>
              <p className="text-[13px]">Eventos aleatorios (cataclismos, cuellos de botella) alteran frecuencias génicas independientemente de la aptitud. La suerte también esculpe.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 underline decoration-yellow-400 decoration-2 mb-2">5. Especiación</h4>
              <p className="text-[13px]">Cuando subpoblaciones se aíslan, acumulan diferencias hasta dejar de ser intercambiables: nace una nueva especie.</p>
            </section>
            <div className="pt-4 mt-4 border-t border-yellow-200/80 italic text-slate-500 font-serif text-[13px] leading-relaxed">
              "No es la más fuerte de las especies la que sobrevive, ni la más inteligente, sino la que mejor se adapta al cambio."<br/><span className="text-[11px] not-italic block mt-1">— C. Darwin (Apócrifo)</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
