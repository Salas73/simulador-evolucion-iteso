/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Darwin Evolution — Simulador de Selección Natural
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon, EnergyBar, ProbabilityRing } from './HudComponents';
import { Cinematic } from './Cinematics';

type GameState = 'intro' | 'difficulty' | 'build' | 'mutation' | 'event' | 'resolution' | 'speciation' | 'gameover' | 'victory';

interface Stats {
  size: number; thermal: number; camo: number; defense: number;
  metabolism: number; reproduction: number; immunity: number;
  speed: number; senses: number;
}

interface StatDef {
  key: keyof Stats;
  label: string;
  cat: 'fis' | 'met' | 'loc';
  icon: string;
  desc: string;
  cost: number;
}

interface GameEvent {
  id: string;
  name: string;
  description: string;
  cinematic: string;
  calculateSurvival: (stats: Stats) => number;
  successStory: (stats: Stats) => string;
  failureStory: (stats: Stats) => string;
}

const STAT_DEFS: StatDef[] = [
  { key: 'size', label: 'Tamaño', cat: 'fis', icon: 'activity', cost: 2, desc: 'Termorregulación e intimidación, exige más alimento.' },
  { key: 'thermal', label: 'Aislamiento Térmico', cat: 'fis', icon: 'feather', cost: 1, desc: 'Grasa, pelaje o plumas. Vital para climas fríos.' },
  { key: 'camo', label: 'Camuflaje', cat: 'fis', icon: 'eye', cost: 1, desc: 'Coloración críptica para evitar detección.' },
  { key: 'defense', label: 'Defensa Física', cat: 'fis', icon: 'shield', cost: 2, desc: 'Corazas, espinas o toxinas.' },
  { key: 'metabolism', label: 'Ef. Metabólica', cat: 'met', icon: 'heart', cost: 1, desc: 'Aprovechamiento de nutrientes con poca comida.' },
  { key: 'reproduction', label: 'Tasa de Reprod.', cat: 'met', icon: 'refresh', cost: 1, desc: 'Cantidad de crías. Compensa altas tasas de mortalidad.' },
  { key: 'immunity', label: 'Inmunidad', cat: 'met', icon: 'shield', cost: 1, desc: 'Resistencia fisiológica a patógenos.' },
  { key: 'speed', label: 'Velocidad', cat: 'loc', icon: 'wind', cost: 1, desc: 'Para huir o cazar. Requiere energía.' },
  { key: 'senses', label: 'Agudeza Sensorial', cat: 'loc', icon: 'eye', cost: 1, desc: 'Detección temprana de amenazas o alimento.' }
];

const STAT_COST: Record<keyof Stats, number> = STAT_DEFS.reduce((a, s) => { a[s.key] = s.cost; return a; }, {} as Record<keyof Stats, number>);
const INITIAL_STATS: Stats = { size: 0, thermal: 0, camo: 0, defense: 0, metabolism: 0, reproduction: 0, immunity: 0, speed: 0, senses: 0 };
const MAX_STAT_LEVEL = 5;
const SPECIATION_AFTER_TURN = 3;

const CAT_LABEL: Record<'fis'|'met'|'loc', string> = {
  fis: 'FÍSICAS · MORFOLÓGICAS',
  met: 'METABÓLICAS · FISIOLÓGICAS',
  loc: 'LOCOMOTORAS'
};
const CAT_COLOR: Record<'fis'|'met'|'loc', 'em'|'am'|'cy'> = { fis: 'em', met: 'am', loc: 'cy' };
const CAT_HEX = { em: '#34f0a0', am: '#f6c453', cy: '#38e1ff' };

const DIFFICULTY = {
  easy:   { points: 20, label: 'Linaje Adaptado',    desc: '20 puntos · Margen amplio.' },
  medium: { points: 15, label: 'Equilibrio Natural', desc: '15 puntos · Estándar.' },
  hard:   { points: 10, label: 'Presión Extrema',    desc: '10 puntos · Crítico.' }
};

const MUTATION_IMPACTS: Record<keyof Stats, { positive: string; negative: string }> = {
  size: { positive: "A mayor tamaño, mejor termorregulación y menor depredación, pero exige un alto costo calórico.", negative: "Un menor tamaño reduce las necesidades alimenticias, aunque incrementa la vulnerabilidad." },
  thermal: { positive: "El desarrollo de un mayor aislamiento protege los tejidos del daño por congelamiento.", negative: "La reducción de cobertura corporal facilita la disipación de calor pero compromete la viabilidad en frío." },
  camo: { positive: "Los nuevos patrones crípticos dificultan la detección visual por parte de otras especies.", negative: "La pérdida de mimetismo hace a la especie más vistosa y llamativa." },
  defense: { positive: "El engrosamiento de la piel o un exoesqueleto endurecido previene el daño físico directo.", negative: "La inhibición de la síntesis de defensas aligera el organismo a costa de mayor fragilidad." },
  metabolism: { positive: "Enzimas digestivas más potentes asimilan nutrientes de fuentes antes descartadas.", negative: "Un metabolismo ineficiente consume las reservas rápidamente y requiere alimentación constante." },
  reproduction: { positive: "Mutaciones que acortan la gestación permiten repoblar el nicho tras catástrofes.", negative: "Un ciclo reproductivo más lento limita la variabilidad, aunque puede dar crías más desarrolladas." },
  immunity: { positive: "Alteraciones en los glóbulos blancos ofrecen resistencia fortuita a patógenos emergentes.", negative: "Un fallo en el código genético merma la respuesta innata de protección microbiológica." },
  speed: { positive: "Cambios en las fibras musculares facilitan la evasión acelerada.", negative: "Las restricciones motoras priorizan la cautela sobre la velocidad." },
  senses: { positive: "Los abombamientos nerviosos amplían el rango de detección preventiva.", negative: "El deterioro de los nervios sensoriales reduce el tiempo de reacción general." }
};

const EVENTS: GameEvent[] = [
  { id: 'glaciacion', name: 'Glaciación Repentina', cinematic: 'ice',
    description: 'La temperatura global ha descendido drásticamente. Los lagos se congelan y los vientos helados barren las llanuras.',
    calculateSurvival: (s) => Math.min(Math.max(10 + s.thermal*18 + s.size*8 + s.metabolism*6, 5), 95),
    successStory: (s) => { const d: string[] = []; if(s.thermal>=3) d.push('su espeso aislamiento térmico retuvo el calor corporal'); if(s.size>=3) d.push('su masa robusta redujo la pérdida calórica relativa'); if(s.metabolism>=3) d.push('su eficiencia metabólica aprovechó el escaso forraje invernal'); return `¡Han sobrevivido! Los individuos menos adaptados perecieron porque ${d.length?d.join(' y '):'una combinación marginal de rasgos'}. La selección natural filtró el linaje sin propósito alguno.`; },
    failureStory: () => `La especie no soportó el frío extremo. La falta de aislamiento térmico condujo a una falla metabólica por hipotermia. La selección natural ha sido implacable.` },
  { id: 'sequia', name: 'Sequía Prolongada', cinematic: 'drought',
    description: 'Hace meses que no llueve. El agua escasea, la vegetación se seca y los recursos son mínimos.',
    calculateSurvival: (s) => Math.max(Math.min(30 + s.metabolism*20 - s.size*8 - s.reproduction*8, 95), 5),
    successStory: (s) => `¡Prosperan en la adversidad! ${s.metabolism > 2 ? 'Su altísima eficiencia metabólica les permitió extraer hasta la última gota de nutrientes.' : 'Su metabolismo basal logró sostenerlos.'} La escasez filtró a quienes demandaban demasiados recursos.`,
    failureStory: (s) => `La hambruna y la sed los han diezmado. ${s.size > 2 ? 'Sus grandes cuerpos requerían una ingesta insostenible.' : 'Su rápido ciclo reproductivo no pudo mantenerse.'} Un fracaso fisiológico ante el medio carente de recursos.` },
  { id: 'depredador', name: 'Aparición de un Súper-Depredador', cinematic: 'predator',
    description: 'Una nueva especie depredadora altamente agresiva ha migrado a su hábitat, alterando la cadena trófica.',
    calculateSurvival: (s) => Math.min(Math.max(10 + s.speed*14 + s.camo*14 + s.defense*14 + s.senses*8 - s.size*4, 5), 95),
    successStory: (s) => { const best = Math.max(s.speed, s.camo, s.defense); if(best === s.camo && s.camo>0) return `Su coloración críptica les hizo invisibles al depredador. Los individuos más vistosos fueron devorados rápida e inexorablemente.`; if(best === s.speed && s.speed>0) return `Sus ágiles extremidades y sistema cardiorrespiratorio les permitieron superar en carrera al cazador.`; if(best === s.defense && s.defense>0) return `Sus defensas físicas (corazas, espinas o exoesqueleto) disuadieron al depredador de atacarlos.`; return `Por azar, los pocos sobrevivientes lograron escapar a refugios marginales. La presión selectiva fue brutal.`; },
    failureStory: () => `El depredador aniquiló a su población. La especie carecía de la velocidad, las defensas o el camuflaje necesarios. Un clásico ejemplo de cómo la presión selectiva erradica a los no aptos.` },
  { id: 'virus', name: 'Brote Viral Letal', cinematic: 'virus',
    description: 'Un patógeno altamente contagioso se propaga por el ecosistema, infectando rápidamente a casi toda la población.',
    calculateSurvival: (s) => { let p = 10 + s.immunity*22 + s.reproduction*10; if(s.immunity < 2) p -= s.reproduction*6; return Math.min(Math.max(p, 5), 95); },
    successStory: (s) => `La especie se ha sobrepuesto. ${s.immunity >= s.reproduction ? 'Variaciones previas en su sistema inmunológico produjeron anticuerpos eficaces.' : 'Su altísima tasa reproductiva mantuvo viable la población mientras nacían individuos resistentes.'}`,
    failureStory: () => `El colapso fue casi absoluto. Sus defensas inmunológicas sucumbieron ante la replicación viral. El acervo genético no contenía la llave para combatir este patógeno.` },
  { id: 'meteorito', name: 'Caída de Meteorito · Deriva Génica', cinematic: 'meteor',
    description: 'Un cataclismo impredecible. Un gigantesco impacto meteorítico asola el continente, provocando incendios y tsunamis.',
    calculateSurvival: () => 50,
    successStory: () => `¡Por azares del destino, han sobrevivido! Ni morfología ni fisiología jugaron el papel principal: pura "Deriva Génica". Estaban en el lado correcto del continente durante el impacto.`,
    failureStory: () => `Trágicamente, la especie fue borrada. Este evento no discriminó al "más apto". Fue puro azar geográfico — un cataclismo ciego que demuestra que a veces la supervivencia requiere simple suerte.` },
  { id: 'cuelloBotella', name: 'Cuello de Botella Poblacional', cinematic: 'bottleneck',
    description: 'Una catástrofe local ha reducido la población a unos pocos individuos. Quienes sobrevivan determinarán todo el acervo genético futuro.',
    calculateSurvival: () => 60,
    successStory: () => `La población se recupera, pero el acervo genético se ha empobrecido drásticamente. Los rasgos de los pocos supervivientes — fueran adaptativos o no — dominarán al linaje. Es deriva génica en acción: el azar, no la aptitud, ha esculpido el futuro.`,
    failureStory: () => `El cuello de botella fue demasiado estrecho. La consanguinidad y la pérdida de variabilidad condenaron al linaje. Sin variación, la selección natural no tiene material sobre el cual actuar.` },
  { id: 'competencia', name: 'Competencia Interespecífica', cinematic: 'competition',
    description: 'Una especie rival con un nicho similar ha invadido el territorio. La competencia por alimento y refugio se intensifica.',
    calculateSurvival: (s) => Math.min(Math.max(15 + s.metabolism*14 + s.senses*12 + s.speed*8 - s.size*5, 5), 95),
    successStory: (s) => `Han desplazado al competidor. ${s.metabolism >= s.senses ? 'Su eficiencia metabólica les permitió subsistir con menos recursos.' : 'Su agudeza sensorial localizó el alimento primero.'} El principio de exclusión competitiva favoreció su nicho.`,
    failureStory: () => `El rival ha demostrado ser más eficiente explotando los recursos compartidos. Por exclusión competitiva, su nicho ha sido absorbido y la población colapsa.` },
  { id: 'deforestacion', name: 'Cambio Abrupto de Hábitat', cinematic: 'habitat',
    description: 'El bosque que les dio cobijo ha sido reemplazado por pradera abierta. Los patrones de coloración antes crípticos ahora destacan sobre el nuevo fondo.',
    calculateSurvival: (s) => Math.min(Math.max(25 + s.speed*12 + s.senses*10 + s.metabolism*6 - s.camo*5, 5), 95),
    successStory: () => `La transición fue brutal pero superable. Quienes no estaban sobreespecializados al bosque y tenían movilidad para recorrer distancias prosperaron. Un rasgo "ventajoso" lo es solo en su contexto.`,
    failureStory: (s) => `El nuevo entorno los expuso. ${s.camo >= 3 ? 'Irónicamente, su camuflaje altamente especializado al bosque los volvió blancos visibles en la pradera.' : 'No tuvieron la movilidad para encontrar refugios alternos.'} La adaptación pasada se convirtió en su condena.` },
  { id: 'eutrofizacion', name: 'Eutrofización del Ecosistema', cinematic: 'toxin',
    description: 'Un exceso de nutrientes (algas, bacterias) ha alterado el agua y la cadena alimenticia. Toxinas y patógenos oportunistas proliferan.',
    calculateSurvival: (s) => Math.min(Math.max(15 + s.immunity*16 + s.metabolism*12 - s.size*4, 5), 95),
    successStory: () => `Su fisiología logró tolerar las nuevas toxinas. Los individuos con defensas inmunológicas y metabólicas robustas filtraron y procesaron lo que para otros era veneno.`,
    failureStory: () => `Las toxinas y patógenos oportunistas devastaron al linaje. Sin tolerancia inmunológica ni metabólica, el ecosistema alterado se volvió letal.` }
];

function StatRow({ stat, value, onChange, mode, points, max, highlighted }: { stat: StatDef; value: number; onChange: (d: number) => void; mode: 'build' | 'view'; points: number; max: number; highlighted: boolean }) {
  const cost = stat.cost;
  const color = CAT_COLOR[stat.cat];
  return (
    <div className={`px-3 py-2.5 rounded-lg transition-all duration-500 ${highlighted ? 'row-mutate' : 'border border-transparent hover:border-cyan-400/15 hover:bg-cyan-400/[0.03]'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="opacity-70" style={{ color: CAT_HEX[color] }}><Icon name={stat.icon} className="w-3.5 h-3.5" /></span>
          <span className="text-[11.5px] font-medium tracking-wide text-slate-200">{stat.label}</span>
          {cost > 1 && <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300">×{cost}</span>}
        </div>
        <span className="font-mono text-[11px] tracking-wider digital" style={{ color: CAT_HEX[color] }}>
          {String(value).padStart(2,'0')}<span className="opacity-40">/05</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        {mode === 'build' && (
          <button onClick={() => onChange(-1)} disabled={value === 0}
            className="w-5 h-5 rounded-md border border-slate-600/50 bg-slate-800/60 text-slate-300 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs leading-none flex items-center justify-center">−</button>
        )}
        <div className="flex-1"><EnergyBar value={value} color={color} highlighted={highlighted} /></div>
        {mode === 'build' && (
          <button onClick={() => onChange(1)} disabled={value === max || points + cost > 999}
            className="w-5 h-5 rounded-md border border-slate-600/50 bg-slate-800/60 text-slate-300 hover:border-emerald-400/60 hover:bg-emerald-400/10 hover:text-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs leading-none flex items-center justify-center">+</button>
        )}
      </div>
    </div>
  );
}

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
    setStats(INITIAL_STATS); setPointsSpent(0); setHistoryLog([]);
    setTurnCounter(0); setSurvivedCount(0); setHasSpeciated(false);
    setPendingMutation(null); setSpeciationOptions(null);
    setGameState('intro'); setHighlightedStat(null);
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
    setHistoryLog([{ turn: 1, title: 'Génesis', desc: 'Población inicial establecida en bioma base.', type: 'info' }]);
    advanceToNextEvent(shuffled, stats, false);
  };

  const advanceToNextEvent = (queue: GameEvent[], currentStats: Stats, applyMutation: boolean) => {
    if (queue.length === 0) { setGameState('victory'); return; }
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
        setHistoryLog(prev => [{ turn: turnCounter, title: 'Mutación pre-selectiva', desc: mutDesc, type: 'info' }, ...prev]);
      }
    }
    const [nextEvent, ...rest] = queue;
    setCurrentEvent(nextEvent); setEventQueue(rest); setEventResult(null);
    if (mutated) setGameState('mutation');
    else { setPendingMutation(null); setGameState('event'); }
  };

  const acknowledgeMutation = () => { setPendingMutation(null); setHighlightedStat(null); setGameState('event'); };

  const resolveEvent = () => {
    if (!currentEvent) return;
    const probOfSurvival = currentEvent.calculateSurvival(stats);
    const roll = Math.floor(Math.random() * 100) + 1;
    const survived = roll <= probOfSurvival;
    const message = survived ? currentEvent.successStory(stats) : currentEvent.failureStory(stats);
    setEventResult({ survived, prob: probOfSurvival, message, rolled: roll });
    setHistoryLog(prev => [{
      turn: turnCounter, title: currentEvent.name,
      desc: survived ? `superado (${probOfSurvival}% req., tirada ${roll}).` : `extinción (${probOfSurvival}% req., tirada ${roll}).`,
      type: survived ? 'success' : 'danger'
    }, ...prev]);
    setGameState('resolution');
  };

  const generateSpeciationOptions = () => {
    const morphHeavy: Stats = { ...stats };
    const physioHeavy: Stats = { ...stats };
    (['size', 'defense', 'camo'] as (keyof Stats)[]).forEach(k => { morphHeavy[k] = Math.min(MAX_STAT_LEVEL, morphHeavy[k] + 1); });
    (['speed', 'metabolism'] as (keyof Stats)[]).forEach(k => { morphHeavy[k] = Math.max(0, morphHeavy[k] - 1); });
    (['speed', 'metabolism', 'senses'] as (keyof Stats)[]).forEach(k => { physioHeavy[k] = Math.min(MAX_STAT_LEVEL, physioHeavy[k] + 1); });
    (['size', 'defense'] as (keyof Stats)[]).forEach(k => { physioHeavy[k] = Math.max(0, physioHeavy[k] - 1); });
    return [
      { label: 'Linaje Robusto', desc: 'Subpoblación aislada en zonas frías y rocosas. Mayor tamaño, defensa y camuflaje, a costa de velocidad y metabolismo.', stats: morphHeavy },
      { label: 'Linaje Ágil', desc: 'Subpoblación que migró a praderas abiertas. Mayor velocidad, metabolismo y sentidos, a costa de tamaño y defensa.', stats: physioHeavy }
    ];
  };

  const handleNextTurn = () => {
    if (!eventResult?.survived) { setGameState('gameover'); return; }
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
    setStats(option.stats); setHasSpeciated(true);
    setHistoryLog(prev => [{ turn: turnCounter, title: 'Especiación alopátrica', desc: `El linaje se bifurcó. Continuamos siguiendo a "${option.label}".`, type: 'info' }, ...prev]);
    setSpeciationOptions(null);
    advanceToNextEvent(eventQueue, option.stats, true);
  };

  const remainingPoints = maxPoints - pointsSpent;
  const grouped = useMemo(() => {
    const g: Record<'fis'|'met'|'loc', StatDef[]> = { fis: [], met: [], loc: [] };
    STAT_DEFS.forEach(s => g[s.cat].push(s));
    return g;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-[62px] border-b border-cyan-400/15 bg-slate-950/80 backdrop-blur flex items-center px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md border border-cyan-400/40 bg-cyan-400/5 flex items-center justify-center text-cyan-300 glow-cyan">
            <Icon name="dna" className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-bold text-base tracking-tight text-slate-100">
              Darwin Evolution <span className="text-cyan-400 text-glow-cyan">●</span>
            </div>
            <div className="font-mono text-[9px] tracking-[0.32em] text-slate-500 uppercase">
              CONSOLA · SELECCIÓN NATURAL
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-500 mr-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 blink"></span>
            UPLINK · NOMINAL
          </div>
          {gameState !== 'intro' && (
            <>
              <div className="hidden md:block text-[10px] font-mono text-slate-400 px-3 py-1.5 rounded border border-slate-700/50 bg-slate-900/40">
                GEN <span className="text-cyan-300 digital">{String(turnCounter).padStart(3,'0')}</span> · SURV <span className="text-emerald-300 digital">{String(survivedCount).padStart(2,'0')}</span>
              </div>
              <button onClick={restartGame} className="btn-ghost text-[10px] px-3 py-1.5 rounded flex items-center gap-2">
                <Icon name="restart" className="w-3 h-3" /> Reiniciar
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] gap-4 max-w-[1480px] w-full mx-auto lg:h-[calc(100vh-62px-44px)]">
        <aside className="hud-panel relative flex flex-col h-auto lg:h-full lg:overflow-hidden">
          <span className="hud-corner tl"></span><span className="hud-corner tr"></span>
          <span className="hud-corner bl"></span><span className="hud-corner br"></span>
          <div className="px-4 py-3 border-b border-cyan-400/10 flex justify-between items-center shrink-0">
            <div>
              <div className="font-mono text-[10px] tracking-[0.28em] text-cyan-300/80 uppercase">Atributos</div>
              <div className="text-[9px] font-mono text-slate-500 mt-0.5">PHENOTYPE.SCHEMA</div>
            </div>
            <div className="text-right">
              <div className="font-mono digital text-emerald-300 text-glow-emerald text-lg leading-none">
                {String(remainingPoints).padStart(2,'0')}
                <span className="text-slate-500 text-xs"> / {String(maxPoints).padStart(2,'0')}</span>
              </div>
              <div className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mt-0.5">Pts disp.</div>
            </div>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-4 nice-scroll">
            {(['fis','met','loc'] as const).map((cat) => (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{background: CAT_HEX[CAT_COLOR[cat]], boxShadow: `0 0 8px ${CAT_HEX[CAT_COLOR[cat]]}`}}></div>
                  <span className="text-[9px] font-mono tracking-[0.22em] uppercase" style={{color: CAT_HEX[CAT_COLOR[cat]]}}>{CAT_LABEL[cat]}</span>
                  <div className="flex-1 h-px" style={{background: `linear-gradient(90deg, ${CAT_HEX[CAT_COLOR[cat]]}40, transparent)`}}></div>
                </div>
                <div className="space-y-1">
                  {grouped[cat].map(s => (
                    <StatRow key={s.key} stat={s} value={stats[s.key]}
                      onChange={(d) => handleStatChange(s.key, d)}
                      mode={gameState === 'build' ? 'build' : 'view'}
                      points={pointsSpent} max={MAX_STAT_LEVEL}
                      highlighted={highlightedStat === s.key} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          {pendingMutation && gameState === 'mutation' && (
            <div className="p-3 border-t border-amber-400/30 bg-gradient-to-b from-amber-400/10 to-amber-400/5 shrink-0 anim-in">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="sparkles" className="w-3 h-3 text-amber-300" />
                <div className="text-[9px] font-mono tracking-[0.22em] text-amber-300 uppercase">Mutación detectada</div>
              </div>
              <p className="text-[11px] text-amber-100/85 leading-relaxed">{pendingMutation.desc}</p>
            </div>
          )}
        </aside>

        <section className="flex flex-col gap-4 lg:h-full lg:overflow-hidden min-h-0">
          <div className="hud-panel relative flex-1 flex flex-col min-h-0 overflow-hidden">
            <span className="hud-corner tl"></span><span className="hud-corner tr"></span>
            <span className="hud-corner bl"></span><span className="hud-corner br"></span>
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-cyan-400/10 bg-gradient-to-r from-cyan-400/[0.02] to-transparent shrink-0">
              <div className="flex items-center gap-3 font-mono text-[9px] tracking-[0.22em] uppercase text-slate-500">
                <span className="text-cyan-300/80">CTRL_DECK</span>
                <span className="divider-mono">···</span>
                <span>{gameState.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
                {Array.from({length: 3}).map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-cyan-300/60 blink" style={{animationDelay: `${i*0.3}s`}}></span>
                ))}
              </div>
            </div>

            <div className="flex-1 relative overflow-y-auto nice-scroll">
              <AnimatePresence mode="wait">
                {gameState === 'intro' && (
                  <motion.div key="intro" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col justify-center items-center text-center px-6 py-12 max-w-2xl mx-auto h-full">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-3xl"></div>
                      <div className="relative w-24 h-24 rounded-full border border-emerald-400/40 bg-slate-900/60 flex items-center justify-center text-emerald-300 glow-emerald">
                        <Icon name="dna" className="w-10 h-10" strokeWidth={1.4} />
                      </div>
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-300/70 uppercase mb-3">// SIMULACIÓN INICIADA</div>
                    <h1 className="font-display text-5xl font-bold mb-4 text-slate-100 tracking-tight">
                      Tablero de <span className="text-emerald-300 text-glow-emerald">Bioingeniería</span>
                    </h1>
                    <p className="text-slate-400 mb-10 max-w-md text-sm leading-relaxed">
                      Configura los atributos genéticos de tu especie y sométela a las presiones del medio ambiente.
                      Consulta el <span className="text-amber-200">Cuaderno de Darwin</span> para anclar tus decisiones teóricas.
                    </p>
                    <button onClick={() => setGameState('difficulty')} className="btn-primary px-10 py-3.5 rounded-md text-sm flex items-center gap-3">
                      <Icon name="play" className="w-3.5 h-3.5" /> Comenzar
                    </button>
                  </motion.div>
                )}

                {gameState === 'difficulty' && (
                  <motion.div key="difficulty" initial={{opacity:0}} animate={{opacity:1}} className="flex-1 flex flex-col justify-center items-center text-center px-6 py-12 h-full">
                    <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-300/70 uppercase mb-3">// CALIBRAR PRESIÓN INICIAL</div>
                    <h2 className="font-display text-3xl font-bold mb-3 text-slate-100">Selecciona el régimen evolutivo</h2>
                    <p className="text-slate-400 mb-10 text-sm">Cuántos puntos tendrás para esculpir el linaje.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
                      {Object.entries(DIFFICULTY).map(([key, d]) => (
                        <button key={key} onClick={() => { setMaxPoints(d.points); setStats(INITIAL_STATS); setPointsSpent(0); setGameState('build'); }}
                          className="hud-panel p-5 text-left transition-all hover:border-emerald-400/60 hover:-translate-y-0.5 group relative overflow-hidden">
                          <div className="absolute top-0 right-0 font-mono text-[8px] tracking-[0.3em] text-slate-600 uppercase p-2">{key}</div>
                          <div className="font-display text-5xl font-bold digital text-emerald-300 text-glow-emerald mb-2">{d.points}</div>
                          <div className="text-slate-100 font-medium mb-1.5 group-hover:text-emerald-200 transition-colors">{d.label}</div>
                          <div className="text-[11px] text-slate-500 leading-relaxed">{d.desc}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {gameState === 'build' && (
                  <motion.div key="build" initial={{opacity:0}} animate={{opacity:1}} className="flex-1 flex flex-col justify-center items-center text-center px-6 py-12 h-full">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full bg-cyan-400/15 blur-2xl"></div>
                      <div className="relative w-20 h-20 rounded-full border border-cyan-400/40 bg-slate-900/60 flex items-center justify-center text-cyan-300">
                        <Icon name="dna" className="w-9 h-9" strokeWidth={1.4} />
                      </div>
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-300/70 uppercase mb-3">// FENOTIPO INICIAL</div>
                    <h2 className="font-display text-3xl font-bold mb-3 text-slate-100">Diseño Fenotípico</h2>
                    <p className="text-slate-400 mb-3 max-w-md text-sm leading-relaxed">
                      Asigna <span className="text-emerald-300 font-mono digital">{maxPoints}</span> puntos en el panel lateral. Estas decisiones conformarán al linaje inicial.
                    </p>
                    <div className="font-mono text-[10px] text-amber-200/90 max-w-md leading-relaxed bg-amber-400/[0.08] px-4 py-2.5 rounded border border-amber-400/30 mb-8">
                      <span className="text-amber-300">! TRADE-OFF</span> &nbsp; Tamaño y Defensa cuestan <span className="text-amber-100">×2 puntos</span> por nivel.
                    </div>
                    <button onClick={startGame} disabled={pointsSpent === 0} className="btn-primary px-10 py-3.5 rounded-md text-sm flex items-center gap-3">
                      Iniciar Simulación
                      {remainingPoints > 0 && <span className="text-[10px] opacity-70 font-mono">[{remainingPoints} sin asignar]</span>}
                    </button>
                  </motion.div>
                )}

                {gameState === 'mutation' && pendingMutation && (
                  <motion.div key="mutation" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col h-full p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-3.5 rounded-xl border ${pendingMutation.isPositive ? 'border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-300 glow-emerald' : 'border-amber-400/40 bg-amber-400/[0.08] text-amber-300 glow-amber'}`}>
                        <Icon name="sparkles" className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.3em] text-cyan-300/70 uppercase mb-1">// MUTATION.PRE_SELECT</div>
                        <h2 className="font-display text-3xl font-bold text-slate-100">Variación Pre-Selectiva</h2>
                        <p className="text-[11px] mt-1 text-slate-500 max-w-lg">Una variación apareció <strong className="text-amber-200">antes</strong> de que se conociera la siguiente presión.</p>
                      </div>
                    </div>
                    <div className="hud-panel relative flex-1 p-6 mb-6 border-l-4" style={{borderLeftColor: pendingMutation.isPositive ? '#34f0a0' : '#f6c453'}}>
                      <div className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.2em] text-slate-500 uppercase">{pendingMutation.oldVal} → {pendingMutation.newVal}</div>
                      <div className="text-sm md:text-base text-slate-300 leading-relaxed font-serif-darwin italic">"{pendingMutation.desc}"</div>
                    </div>
                    <button onClick={acknowledgeMutation} className="btn-primary px-8 py-3 rounded-md text-sm self-center">Ver siguiente presión ambiental</button>
                  </motion.div>
                )}

                {gameState === 'event' && currentEvent && (
                  <motion.div key={`event-${currentEvent.id}`} initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col h-full">
                    <div className="relative h-[260px] md:h-[300px] border-b border-cyan-400/15 overflow-hidden scan">
                      <Cinematic id={currentEvent.cinematic} />
                      <div className="absolute inset-0 hud-grid opacity-30 pointer-events-none"></div>
                      <div className="sweep-line" style={{top: 0}}></div>
                      <div className="absolute top-3 left-4 right-4 flex items-start justify-between pointer-events-none">
                        <div className="font-mono text-[9px] tracking-[0.3em] text-cyan-200 uppercase">EVT_{currentEvent.id.toUpperCase()} · GEN {String(turnCounter).padStart(3,'0')}</div>
                        <div className="flex items-center gap-2 font-mono text-[9px] text-red-300 uppercase tracking-[0.25em]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 blink"></span> REC
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pointer-events-none">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-50 mb-1 tracking-tight">{currentEvent.name}</h2>
                        <p className="text-slate-300/85 text-xs md:text-sm leading-relaxed max-w-2xl">{currentEvent.description}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-6 md:p-10">
                      <ProbabilityRing value={currentEvent.calculateSurvival(stats)} />
                      <div className="flex flex-col gap-4 max-w-xs">
                        <div className="hud-panel p-4 relative">
                          <div className="font-mono text-[9px] tracking-[0.25em] text-cyan-300/70 uppercase mb-1">// ANÁLISIS</div>
                          <div className="text-[12px] text-slate-300 leading-relaxed">
                            La probabilidad se calcula a partir del fenotipo actual. Una <span className="text-emerald-300">tirada</span> aleatoria 1–100 decidirá el resultado.
                          </div>
                        </div>
                        <button onClick={resolveEvent} className="btn-danger px-8 py-4 rounded-md text-sm flex items-center justify-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-red-300 blink"></span> Enfrentar Evento
                        </button>
                        <div className="text-[10px] font-mono text-slate-500 text-center tracking-widest uppercase">↑ Compromete al linaje</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {gameState === 'resolution' && eventResult && (
                  <motion.div key="resolution" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col h-full p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-3.5 rounded-xl border ${eventResult.survived ? 'border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-300 glow-emerald' : 'border-red-400/40 bg-red-400/[0.08] text-red-300 glow-red'}`}>
                        <Icon name={eventResult.survived ? 'trophy' : 'skull'} className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <div className="font-mono text-[10px] tracking-[0.3em] uppercase mb-1" style={{color: eventResult.survived ? '#34f0a0' : '#ff5d6c'}}>// {eventResult.survived ? 'OUTCOME.SURVIVED' : 'OUTCOME.EXTINCT'}</div>
                        <h2 className="font-display text-3xl font-bold text-slate-100">{eventResult.survived ? 'Población Sobrevive' : 'Linaje Extinto'}</h2>
                        <div className="flex items-center gap-4 mt-2 font-mono text-[11px] text-slate-400">
                          <div>REQ <span className={eventResult.survived ? 'text-emerald-300 digital' : 'text-red-300 digital'}>{eventResult.prob}%</span></div>
                          <div className="text-slate-600">·</div>
                          <div>ROLL <span className={eventResult.survived ? 'text-emerald-300 digital' : 'text-red-300 digital'}>{eventResult.rolled}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="hud-panel relative flex-1 p-6 mb-6 border-l-4" style={{borderLeftColor: eventResult.survived ? '#34f0a0' : '#ff5d6c'}}>
                      <div className="text-sm md:text-base text-slate-300 leading-relaxed font-serif-darwin italic">"{eventResult.message}"</div>
                    </div>
                    <button onClick={handleNextTurn} className={`px-8 py-3.5 rounded-md text-sm self-center ${eventResult.survived ? 'btn-primary' : 'btn-danger'}`}>
                      {eventResult.survived ? 'Avanzar Era Continua →' : 'Concluir Simulación'}
                    </button>
                  </motion.div>
                )}

                {gameState === 'speciation' && speciationOptions && (
                  <motion.div key="speciation" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col h-full p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3.5 rounded-xl border border-violet-400/40 bg-violet-400/[0.08] text-violet-300" style={{boxShadow: '0 0 24px rgba(167,139,250,0.25), 0 0 0 1px rgba(167,139,250,0.4)'}}>
                        <Icon name="branch" className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.3em] text-violet-300/80 uppercase mb-1">// SPECIATION.ALOPATRIC</div>
                        <h2 className="font-display text-3xl font-bold text-slate-100">Especiación Alopátrica</h2>
                        <p className="text-[12px] mt-1 text-slate-400 max-w-xl leading-relaxed">Una barrera geográfica ha aislado dos subpoblaciones. Cada una sigue su propia trayectoria evolutiva.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mb-4">
                      {speciationOptions.map(opt => (
                        <button key={opt.label} onClick={() => chooseSpeciation(opt)}
                          className="hud-panel p-5 text-left transition-all hover:border-violet-400/60 hover:-translate-y-0.5 group">
                          <div className="font-display font-bold text-xl text-slate-100 group-hover:text-violet-200 transition-colors mb-2">{opt.label}</div>
                          <div className="text-[12px] text-slate-400 leading-relaxed mb-4">{opt.desc}</div>
                          <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-cyan-400/10 font-mono text-[10px]">
                            {STAT_DEFS.map(s => (
                              <div key={s.key} className="flex justify-between">
                                <span className="text-slate-500">{s.label.slice(0,5).toLowerCase()}</span>
                                <span className={opt.stats[s.key] > stats[s.key] ? 'text-emerald-300 digital' : opt.stats[s.key] < stats[s.key] ? 'text-red-300 digital' : 'text-slate-300 digital'}>{opt.stats[s.key]}</span>
                              </div>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 italic text-center tracking-wider">// Solo seguirás a uno de los linajes. El otro continuará evolucionando fuera de cuadro.</p>
                  </motion.div>
                )}

                {gameState === 'gameover' && (
                  <motion.div key="gameover" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col justify-center items-center text-center p-8 h-full">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full bg-red-400/20 blur-3xl"></div>
                      <Icon name="skull" className="relative w-24 h-24 text-red-300/80" strokeWidth={1.2} />
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-red-300/80 uppercase mb-3">// REGISTRO.FÓSIL</div>
                    <h2 className="font-display text-3xl font-bold text-slate-100 mb-3">Linaje Extinto</h2>
                    <p className="text-slate-400 mb-6 max-w-md text-sm leading-relaxed">
                      La especie sobrevivió <span className="text-emerald-300 font-mono digital">{survivedCount}</span> presiones antes de extinguirse. La selección natural es un mecanismo ciego de criba, sin propósitos.
                    </p>
                    <div className="hud-panel p-4 mb-8 max-w-md w-full text-left">
                      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500 mb-3">Fenotipo final</div>
                      <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                        {STAT_DEFS.map(s => (
                          <div key={s.key} className="flex justify-between">
                            <span className="text-slate-500">{s.label.slice(0,7).toLowerCase()}</span>
                            <span className="text-slate-200 digital">{stats[s.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={restartGame} className="btn-ghost px-8 py-3 rounded-md text-sm">Intentar nuevo linaje</button>
                  </motion.div>
                )}

                {gameState === 'victory' && (
                  <motion.div key="victory" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col justify-center items-center text-center p-8 h-full">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-3xl"></div>
                      <Icon name="trophy" className="relative w-24 h-24 text-emerald-300" strokeWidth={1.2} style={{filter: 'drop-shadow(0 0 18px #34f0a0)'}} />
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-emerald-300 uppercase mb-3">// SUPERVIVENCIA.ASEGURADA</div>
                    <h2 className="font-display text-3xl font-bold text-slate-100 mb-3">Especie Establecida</h2>
                    <p className="text-slate-400 mb-6 max-w-md text-sm leading-relaxed">
                      Tu linaje superó <span className="text-emerald-300 font-mono digital">{survivedCount}</span> presiones ambientales. La especie prosperará — al menos hasta el siguiente cambio del medio.
                    </p>
                    <div className="hud-panel p-4 mb-8 max-w-md w-full text-left">
                      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500 mb-3">Fenotipo final</div>
                      <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                        {STAT_DEFS.map(s => (
                          <div key={s.key} className="flex justify-between">
                            <span className="text-slate-500">{s.label.slice(0,7).toLowerCase()}</span>
                            <span className="text-emerald-300 digital">{stats[s.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={restartGame} className="btn-primary px-8 py-3 rounded-md text-sm">Realizar nueva mezcla</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {gameState !== 'intro' && gameState !== 'difficulty' && (
            <div className="hud-panel relative h-44 shrink-0 flex flex-col p-3 overflow-hidden">
              <span className="hud-corner tl"></span><span className="hud-corner tr"></span>
              <span className="hud-corner bl"></span><span className="hud-corner br"></span>
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="font-mono text-[9px] tracking-[0.28em] text-cyan-300/70 uppercase">// REGISTRO_EVENTOS</div>
                <div className="font-mono text-[9px] text-slate-500 tracking-wider">{historyLog.length} ENTRY</div>
              </div>
              <div className="flex-1 overflow-y-auto nice-scroll px-2 space-y-1">
                {historyLog.length === 0 ? (
                  <div className="text-[11px] font-mono text-slate-500 italic">Esperando datos fisiológicos<span className="term-cursor"></span></div>
                ) : historyLog.map((log, i) => {
                  const tone = log.type === 'danger' ? '#ff5d6c' : log.type === 'success' ? '#34f0a0' : '#7dd3fc';
                  return (
                    <div key={i} className="font-mono text-[11px] py-1 border-b border-cyan-400/5 leading-relaxed">
                      <span style={{color: tone}}>▸</span>
                      <span className="text-slate-500"> GEN_{String(log.turn).padStart(3,'0')}</span>
                      <span className="text-slate-300"> · {log.title}: </span>
                      <span className="text-slate-400/85">{log.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <aside className="paper rounded-lg shadow-2xl flex flex-col h-auto lg:h-full lg:overflow-y-auto nice-scroll relative">
          <div className="paper-edge absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"></div>
          <div className="px-5 py-4 pl-7">
            <div className="text-[9px] font-mono tracking-[0.3em] uppercase text-amber-900/60 mb-1">Notebook · 1859</div>
            <h3 className="font-serif-darwin text-2xl italic text-amber-950 border-b-2 border-amber-700/30 pb-2">Cuaderno de Darwin</h3>
          </div>
          <div className="px-5 pb-5 pl-7 space-y-4 text-[13px] leading-relaxed text-amber-950/85">
            {[
              {n: '1.', t: 'Variación', b: <>Los individuos no son idénticos: presentan diferencias por mutaciones aleatorias del ADN. Estas surgen <strong>antes</strong> de que la presión actúe — no como respuesta a ella.</>},
              {n: '2.', t: 'Herencia', b: <>Los rasgos adaptativos deben tener componente genético para transmitirse a la siguiente generación.</>},
              {n: '3.', t: 'Selección Natural', b: <>El ambiente filtra ciegamente: los rasgos ventajosos <em>en ese contexto</em> se reproducen más. Lo "ventajoso" cambia con el ambiente.</>},
              {n: '4.', t: 'Deriva Génica', b: <>Eventos aleatorios (cataclismos, cuellos de botella) alteran frecuencias génicas independientemente de la aptitud. La suerte también esculpe.</>},
              {n: '5.', t: 'Especiación', b: <>Cuando subpoblaciones se aíslan, acumulan diferencias hasta dejar de ser intercambiables: nace una nueva especie.</>}
            ].map(s => (
              <section key={s.n}>
                <h4 className="font-bold text-amber-950 mb-1">
                  <span className="text-amber-700/80 mr-1.5 font-serif-darwin italic">{s.n}</span>
                  <span className="border-b-2 border-amber-600/50">{s.t}</span>
                </h4>
                <p className="text-[12.5px]">{s.b}</p>
              </section>
            ))}
            <div className="pt-4 mt-4 border-t border-amber-700/30 italic text-amber-900/75 font-serif-darwin text-[13px] leading-relaxed">
              "No es la más fuerte de las especies la que sobrevive, ni la más inteligente, sino la que mejor se adapta al cambio."
              <span className="text-[10px] not-italic block mt-1.5 font-sans tracking-wider text-amber-800/60">— C. Darwin (apócrifo)</span>
            </div>
          </div>
        </aside>
      </main>

      <footer className="border-t border-cyan-400/10 bg-slate-950/70 px-6 py-2.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-mono text-[9px] tracking-[0.22em] uppercase text-slate-500">
        <span className="text-cyan-300/60">// EQUIPO</span>
        <span className="text-slate-400">Angel Salas</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">Cesar Aguila</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">Christian Morales</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">Elian Morales</span>
      </footer>
    </div>
  );
}
