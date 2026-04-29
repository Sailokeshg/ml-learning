import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  Database,
  GitBranch,
  Map as MapIcon,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Thermometer,
} from "lucide-react";
import {
  conceptLinks,
  conceptNodes,
  glossary,
  modules,
  useCases,
} from "./lessonData.js";

const STORAGE_KEYS = {
  activeView: "ml-llm-active-view",
  activeModule: "ml-llm-active-module",
  completed: "ml-llm-completed",
  quiz: "ml-llm-quiz",
  deepMode: "ml-llm-deep-mode",
};

const navItems = [
  { id: "journey", label: "Journey", icon: Compass },
  { id: "playgrounds", label: "Playgrounds", icon: SlidersHorizontal },
  { id: "map", label: "Concept Map", icon: MapIcon },
  { id: "use-cases", label: "Use Cases", icon: Target },
  { id: "glossary", label: "Glossary", icon: BookOpen },
];

const workflowCopy = {
  prompting: {
    title: "Prompting",
    icon: Sparkles,
    line: "Best when you need behavior changes without new infrastructure.",
    steps: ["Give role", "Add task", "Set constraints", "Review answer"],
  },
  rag: {
    title: "RAG",
    icon: Search,
    line: "Best when answers need fresh, private, or long knowledge.",
    steps: ["Ask question", "Retrieve docs", "Add context", "Generate answer"],
  },
  agents: {
    title: "Agents",
    icon: GitBranch,
    line: "Best when the model must choose tools and take multiple steps.",
    steps: ["Plan", "Use tool", "Observe result", "Continue"],
  },
  finetune: {
    title: "Fine-tuning",
    icon: Brain,
    line: "Best when you need consistent style, format, or domain behavior.",
    steps: ["Collect examples", "Train adapter", "Validate", "Deploy"],
  },
  evals: {
    title: "Evals",
    icon: BadgeCheck,
    line: "Best when you need proof that changes improve quality.",
    steps: [
      "Create cases",
      "Score outputs",
      "Compare versions",
      "Track regressions",
    ],
  },
};

const visualGuides = {
  ml: {
    title: "Pattern loop",
    flow: ["Examples", "Patterns", "Prediction"],
    watch: "Noise makes the trend harder to trust.",
    try: "Move dataset noise and watch pattern clarity fall.",
    points: [
      "The line is the model's learned guess.",
      "Points far from the line are harder examples.",
      "Cleaner data usually makes the pattern easier to learn.",
    ],
  },
  training: {
    title: "Two phases",
    flow: ["Train", "Freeze", "Use"],
    watch: "Training changes the model; inference uses the trained model.",
    try: "Increase training rounds and compare model fit with response time.",
    points: [
      "Training is the expensive practice phase.",
      "Inference is the reuse phase.",
      "One trained model can answer many future requests.",
    ],
  },
  loss: {
    title: "Error feedback",
    flow: ["Predict", "Measure loss", "Update"],
    watch: "A learning rate that is too high can make progress jumpy.",
    try: "Push learning rate near the top and compare the loss curve.",
    points: [
      "Loss is the model's error signal.",
      "Optimization is a repeated adjustment loop.",
      "Stable progress matters more than one huge step.",
    ],
  },
  network: {
    title: "Layered signals",
    flow: ["Inputs", "Hidden patterns", "Outputs"],
    watch: "More hidden units give the network more pattern detectors.",
    try: "Change hidden layer width and watch the connections expand.",
    points: [
      "Each layer transforms the signal.",
      "Hidden nodes combine simpler clues.",
      "Depth and width change what a network can represent.",
    ],
  },
  llm: {
    title: "Next-token engine",
    flow: ["Text", "Context", "Next token"],
    watch: "More context clues shift the likely next token.",
    try: "Increase context clues and watch candidate probabilities change.",
    points: [
      "LLMs read text as token sequences.",
      "Context changes what continuation is likely.",
      "Helpful chat behavior is added on top of base prediction.",
    ],
  },
  tokens: {
    title: "Text chunks",
    flow: ["Raw text", "Token chunks", "Context budget"],
    watch: "Tokens are not always words; spaces and subwords can matter.",
    try: "Type long or unfamiliar words and look for subword pieces.",
    points: [
      "A token can be a word, subword, number, punctuation, or space-aware chunk.",
      "Token count affects cost and context usage.",
      "Different model families can tokenize differently.",
    ],
  },
  embedding: {
    title: "Meaning coordinates",
    flow: ["Query", "Vector", "Nearest ideas"],
    watch: "The best match can share meaning without sharing exact words.",
    try: "Click the sample queries and watch the nearest results change.",
    points: [
      "Embeddings put similar meanings closer together.",
      "Semantic search ranks by distance, not exact keyword match.",
      "RAG often uses embeddings to find context before answering.",
    ],
  },
  attention: {
    title: "Focus weights",
    flow: ["Context", "Attention", "Prediction"],
    watch: "Changing context changes which tokens matter most.",
    try: "Switch Contract, Recipe, and Travel, then move focus strength.",
    points: [
      "Attention highlights influential earlier tokens.",
      "The next token changes with the visible context.",
      "A context window limits what the model can consider.",
    ],
  },
  prompt: {
    title: "Steering controls",
    flow: ["Instruction", "Constraints", "Output style"],
    watch: "Prompt style changes direction; temperature changes variety.",
    try: "Switch simple, teacher, and technical styles.",
    points: [
      "Clear prompts reduce ambiguity.",
      "Constraints help with format and audience.",
      "Temperature controls how exploratory the response feels.",
    ],
  },
  workflow: {
    title: "Model system",
    flow: ["Model", "Tools/context", "Evals"],
    watch:
      "Real products wrap the model with retrieval, tools, and measurement.",
    try: "Compare RAG, agents, fine-tuning, and eval workflows.",
    points: [
      "Prompting is the lightest steering layer.",
      "RAG adds external knowledge at request time.",
      "Evals help you know whether changes improved quality.",
    ],
  },
};

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local storage can be unavailable in private browser modes.
    }
  }, [key, value]);

  return [value, setValue];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const subwordExamples = {
  llms: ["LL", "Ms"],
  embeddings: ["embed", "ding", "s"],
  embedding: ["embed", "ding"],
  tokenization: ["token", "ization"],
  tokenizer: ["token", "izer"],
  transformers: ["transform", "ers"],
  transformer: ["transform", "er"],
  reasoning: ["reason", "ing"],
  unfamiliarity: ["un", "familiar", "ity"],
  internationalization: ["international", "ization"],
};

const commonWholeWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "be",
  "before",
  "do",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "like",
  "not",
  "of",
  "the",
  "they",
  "this",
  "to",
  "we",
  "what",
  "why",
  "with",
]);

function approximateTokens(text) {
  const chunks = text.match(/\s+|[A-Za-z]+|[0-9]+|[^\sA-Za-z0-9]/g) || [];
  const tokens = [];
  let hasLeadingSpace = false;

  chunks.forEach((chunk) => {
    if (/^\s+$/.test(chunk)) {
      hasLeadingSpace = true;
      return;
    }

    const pieces = /^[A-Za-z]+$/.test(chunk)
      ? splitWordIntoPieces(chunk)
      : splitNonWordToken(chunk);

    pieces.forEach((piece, index) => {
      const type = /^[^\sA-Za-z0-9]$/.test(piece)
        ? "punctuation"
        : index > 0
          ? "subword"
          : hasLeadingSpace
            ? "space"
            : "word";
      const prefix =
        hasLeadingSpace && index === 0
          ? "space + "
          : index > 0
            ? "subword: "
            : "";
      tokens.push({
        value: piece,
        display: `${prefix}${piece}`,
        type,
      });
    });

    hasLeadingSpace = false;
  });

  return tokens;
}

function splitWordIntoPieces(word) {
  const lower = word.toLowerCase();
  if (subwordExamples[lower])
    return matchWordCase(word, subwordExamples[lower]);
  if (commonWholeWords.has(lower) || word.length <= 5) return [word];

  const camelPieces = word.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g);
  if (camelPieces && camelPieces.length > 1) return camelPieces;

  if (word.length > 12)
    return [word.slice(0, 6), word.slice(6, 10), word.slice(10)];
  if (word.length > 8) return [word.slice(0, 5), word.slice(5)];
  return [word];
}

function splitNonWordToken(chunk) {
  if (/^[0-9]+$/.test(chunk) && chunk.length > 4) {
    return chunk.match(/.{1,3}/g) || [chunk];
  }
  return [chunk];
}

function matchWordCase(original, pieces) {
  if (original === original.toUpperCase())
    return pieces.map((piece) => piece.toUpperCase());
  if (original[0] === original[0].toUpperCase()) {
    return pieces.map((piece, index) =>
      index === 0 ? `${piece[0].toUpperCase()}${piece.slice(1)}` : piece,
    );
  }
  return pieces;
}

function App() {
  const [storedActiveView, setActiveView] = useStoredState(
    STORAGE_KEYS.activeView,
    "journey",
  );
  const [activeModuleId, setActiveModuleId] = useStoredState(
    STORAGE_KEYS.activeModule,
    modules[0].id,
  );
  const [completed, setCompleted] = useStoredState(STORAGE_KEYS.completed, {});
  const [quizAnswers, setQuizAnswers] = useStoredState(STORAGE_KEYS.quiz, {});
  const [deepMode, setDeepMode] = useStoredState(STORAGE_KEYS.deepMode, false);

  const activeView = navItems.some((item) => item.id === storedActiveView)
    ? storedActiveView
    : "journey";
  const activeModule =
    modules.find((module) => module.id === activeModuleId) || modules[0];
  const completedCount = modules.filter(
    (module) => completed[module.id],
  ).length;
  const progress = Math.round((completedCount / modules.length) * 100);

  const setModuleCompletion = (moduleId, shouldComplete) => {
    setCompleted((current) => {
      const next = { ...current };
      if (shouldComplete) {
        next[moduleId] = true;
      } else {
        delete next[moduleId];
      }
      return next;
    });

    if (!shouldComplete) {
      setQuizAnswers((current) => {
        const next = { ...current };
        delete next[moduleId];
        return next;
      });
    }
  };

  const answerQuiz = (moduleId, optionIndex) => {
    const module = modules.find((item) => item.id === moduleId);
    const isCorrect = module?.quiz.answer === optionIndex;
    setQuizAnswers((current) => ({
      ...current,
      [moduleId]: { optionIndex, isCorrect },
    }));
    if (isCorrect) {
      setModuleCompletion(moduleId, true);
    }
  };

  return (
    <div className="app-shell">
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        completedCount={completedCount}
        progress={progress}
      />
      <main>
        {activeView === "journey" && (
          <JourneyView
            activeModule={activeModule}
            activeModuleId={activeModuleId}
            completed={completed}
            deepMode={deepMode}
            progress={progress}
            quizAnswers={quizAnswers}
            setModuleCompletion={setModuleCompletion}
            setActiveModuleId={setActiveModuleId}
            setActiveView={setActiveView}
            setDeepMode={setDeepMode}
            answerQuiz={answerQuiz}
          />
        )}
        {activeView === "playgrounds" && (
          <PlaygroundsView
            setActiveModuleId={setActiveModuleId}
            setActiveView={setActiveView}
          />
        )}
        {activeView === "map" && (
          <ConceptMapView
            setActiveModuleId={setActiveModuleId}
            setActiveView={setActiveView}
          />
        )}
        {activeView === "use-cases" && <UseCasesView />}
        {activeView === "glossary" && <GlossaryView />}
      </main>
      <Footer />
    </div>
  );
}

function Header({ activeView, setActiveView, completedCount, progress }) {
  return (
    <header className="topbar">
      <button
        className="brand"
        type="button"
        onClick={() => setActiveView("journey")}
      >
        <span className="brand-mark">
          <Brain size={22} aria-hidden="true" />
        </span>
        <span>
          <strong>ML + LLM Journey</strong>
          <small>{completedCount}/10 modules complete</small>
        </span>
      </button>
      <nav className="nav-tabs" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeView === item.id ? "nav-tab active" : "nav-tab"}
              type="button"
              onClick={() => setActiveView(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mini-progress" aria-label={`${progress}% complete`}>
        <span>{progress}%</span>
        <div className="mini-progress-track">
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>
    </header>
  );
}

function JourneyView({
  activeModule,
  activeModuleId,
  completed,
  deepMode,
  progress,
  quizAnswers,
  setModuleCompletion,
  setActiveModuleId,
  setActiveView,
  setDeepMode,
  answerQuiz,
}) {
  return (
    <section className="page-view journey-view">
      <HeroLab progress={progress} setActiveView={setActiveView} />
      <div className="content-grid">
        <aside className="module-rail" aria-label="Learning modules">
          <div className="rail-heading">
            <span>Journey path</span>
            <strong>{progress}%</strong>
          </div>
          <div className="module-list">
            {modules.map((module) => (
              <button
                key={module.id}
                className={
                  activeModuleId === module.id
                    ? "module-link active"
                    : "module-link"
                }
                type="button"
                onClick={() => setActiveModuleId(module.id)}
              >
                <span className={`module-number ${module.theme}`}>
                  {module.number}
                </span>
                <span>
                  <strong>{module.shortTitle}</strong>
                  <small>{completed[module.id] ? "Complete" : "Ready"}</small>
                </span>
                {completed[module.id] && (
                  <CheckCircle2 size={18} aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </aside>
        <LessonModule
          module={activeModule}
          deepMode={deepMode}
          setDeepMode={setDeepMode}
          quizAnswer={quizAnswers[activeModule.id]}
          answerQuiz={answerQuiz}
          isComplete={Boolean(completed[activeModule.id])}
          setModuleCompletion={setModuleCompletion}
          setActiveModuleId={setActiveModuleId}
        />
      </div>
    </section>
  );
}

function HeroLab({ progress, setActiveView }) {
  const [prompt, setPrompt] = useState(
    "Explain embeddings like I am new to AI.",
  );
  const [temperature, setTemperature] = useState(35);
  const tokens = approximateTokens(prompt);
  const tone =
    temperature < 35 ? "focused" : temperature < 70 ? "balanced" : "creative";
  const answer =
    tone === "focused"
      ? "Embeddings are number maps for meaning. Similar ideas get nearby positions."
      : tone === "balanced"
        ? "Embeddings turn words and ideas into coordinates, so a search system can find related meaning even when the wording changes."
        : "Think of embeddings as a meaning map: recipes, robots, rain clouds, and resumes each drift into their own neighborhoods.";

  return (
    <div className="hero-lab">
      <div className="hero-copy">
        <span className="eyebrow">
          <Sparkles size={16} aria-hidden="true" />
          Beginner-first interactive ML guide
        </span>
        <h1>
          Learn how machines learn, how LLMs think, and why prompts, tokens,
          embeddings, and RAG matter.
        </h1>
        <p>
          Move through ten short modules with visual demos, quick checks, and
          playgrounds built to make AI concepts easier to explain.
        </p>
        <div className="hero-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => setActiveView("playgrounds")}
          >
            <Play size={18} aria-hidden="true" />
            Open Playgrounds
          </button>
        </div>
      </div>
      <div
        className="live-card interactive-card"
        aria-label="Interactive prompt preview"
      >
        <div className="card-topline">
          <span>Live prompt lab</span>
          <strong>{progress}% complete</strong>
        </div>
        <label className="text-control">
          <span>Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
          />
        </label>
        <div className="token-row" aria-label="Prompt tokens">
          {tokens.slice(0, 12).map((token, index) => (
            <span
              key={`${token.display}-${index}`}
              className={`token-chip ${token.type}`}
            >
              {token.display}
            </span>
          ))}
        </div>
        <label className="range-control">
          <span>Temperature: {Math.round(temperature / 10) / 10}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />
        </label>
        <div className="model-reply">
          <Brain size={18} aria-hidden="true" />
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

function LessonModule({
  module,
  deepMode,
  setDeepMode,
  quizAnswer,
  answerQuiz,
  isComplete,
  setModuleCompletion,
  setActiveModuleId,
}) {
  const currentIndex = modules.findIndex((item) => item.id === module.id);
  const nextModule = modules[currentIndex + 1];

  return (
    <article className={`lesson-module theme-${module.theme}`}>
      <div className="lesson-heading">
        <span className="module-kicker">Module {module.number}</span>
        <div>
          <h2>{module.title}</h2>
          <p>{module.summary}</p>
        </div>
      </div>
      <div className="lesson-layout">
        <VisualStory module={module} />
        <DemoPanel module={module} />
      </div>
      <QuizCard
        module={module}
        quizAnswer={quizAnswer}
        answerQuiz={answerQuiz}
      />
      <div className="takeaway-band">
        <div>
          <span>Takeaway</span>
          <strong>{module.takeaway}</strong>
        </div>
        <button
          className={isComplete ? "complete-button done" : "complete-button"}
          type="button"
          onClick={() => setModuleCompletion(module.id, !isComplete)}
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {isComplete ? "Remove completion" : "Mark complete"}
        </button>
      </div>
      <div className="deep-mode">
        <button
          className="text-button"
          type="button"
          onClick={() => setDeepMode(!deepMode)}
        >
          {deepMode ? "Hide deeper note" : "Go deeper"}
        </button>
        {deepMode && <p>{module.deeper}</p>}
      </div>
      {nextModule && (
        <button
          className="next-module"
          type="button"
          onClick={() => setActiveModuleId(nextModule.id)}
        >
          Continue to module {nextModule.number}: {nextModule.shortTitle}
        </button>
      )}
    </article>
  );
}

function VisualStory({ module }) {
  const guide = visualGuides[module.demo] || visualGuides.ml;

  return (
    <section
      className={`visual-story snapshot-${module.theme}`}
      aria-label={`${module.title} concept snapshot`}
    >
      <div className="snapshot-header">
        <span className={`module-number ${module.theme}`}>{module.number}</span>
        <div>
          <span>Concept snapshot</span>
          <h3>{guide.title}</h3>
        </div>
      </div>
      <p className="snapshot-summary">{module.visual}</p>
      <div className="snapshot-flow" aria-label={`${guide.title} flow`}>
        {guide.flow.map((step, index) => (
          <div className="snapshot-step" key={step}>
            <small>{index + 1}</small>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      <div className="snapshot-grid">
        <div className="snapshot-card">
          <span>Watch for</span>
          <strong>{guide.watch}</strong>
        </div>
        <div className="snapshot-card">
          <span>Try this</span>
          <strong>{guide.try}</strong>
        </div>
      </div>
      <ul className="snapshot-points">
        {guide.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}

function DemoPanel({ module }) {
  const initialValue = module.controlDefault ?? module.controlMin ?? 0;
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, module.id]);

  const renderDemo = () => {
    switch (module.demo) {
      case "ml":
        return <MLPlayground noise={Number(value)} />;
      case "training":
        return <TrainingDemo rounds={Number(value)} />;
      case "loss":
        return <LossDemo learningRate={Number(value)} />;
      case "network":
        return <NetworkDemo width={Number(value)} />;
      case "llm":
        return <LLMDemo clues={Number(value)} />;
      case "tokens":
        return <TokenizerDemo text={String(value)} setText={setValue} />;
      case "embedding":
        return <EmbeddingDemo query={String(value)} setQuery={setValue} />;
      case "attention":
        return <AttentionDemo focus={Number(value)} />;
      case "prompt":
        return (
          <PromptDemo temperature={Number(value)} setTemperature={setValue} />
        );
      case "workflow":
        return <WorkflowDemo selected={String(value)} setSelected={setValue} />;
      default:
        return null;
    }
  };

  const hasCustomControls = [
    "tokens",
    "embedding",
    "prompt",
    "workflow",
  ].includes(module.demo);

  return (
    <section className="demo-panel interactive-card">
      <div className="demo-heading">
        <span>Try it yourself</span>
        <strong>{module.controlLabel}</strong>
      </div>
      {!hasCustomControls && (
        <label className="range-control">
          <span>
            {module.controlLabel}: {formatControlValue(module, value)}
          </span>
          <input
            type="range"
            min={module.controlMin}
            max={module.controlMax}
            step={module.controlStep}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
          />
        </label>
      )}
      {renderDemo()}
    </section>
  );
}

function formatControlValue(module, value) {
  if (module.demo === "prompt") return Math.round(Number(value) / 10) / 10;
  if (module.demo === "loss") return `${Number(value)}%`;
  if (module.demo === "ml") return `${Number(value)}%`;
  return value;
}

function MLPlayground({ noise }) {
  const points = useMemo(() => {
    return Array.from({ length: 28 }, (_, index) => {
      const x = 18 + ((index * 29) % 250);
      const base = 118 - x * 0.32;
      const wobble =
        Math.sin(index * 1.9) * noise * 0.34 +
        Math.cos(index * 0.8) * noise * 0.15;
      const y = clamp(base + wobble + 16, 20, 132);
      return { x, y, label: y < base + 22 ? "good" : "high" };
    });
  }, [noise]);
  const accuracy = clamp(Math.round(96 - noise * 0.42), 52, 96);

  return (
    <div className="demo-stack">
      <svg
        className="chart"
        viewBox="0 0 300 160"
        role="img"
        aria-label="Simple learning playground"
      >
        <rect x="12" y="12" width="276" height="132" rx="8" />
        <path className="trend-line" d="M26 126 L276 42" />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="5.5"
            className={point.label}
          />
        ))}
      </svg>
      <div className="metric-row">
        <Metric label="Pattern clarity" value={`${accuracy}%`} />
        <Metric label="Noise" value={`${noise}%`} />
      </div>
    </div>
  );
}

function TrainingDemo({ rounds }) {
  const trainQuality = clamp(35 + rounds * 6, 0, 96);
  const inferenceSpeed = clamp(92 - rounds * 2, 62, 92);

  return (
    <div className="pipeline-demo">
      <PipelineStep
        icon={Database}
        title="Examples"
        text={`${rounds * 120} labeled rows`}
      />
      <PipelineStep
        icon={RefreshCw}
        title="Training"
        text={`${rounds} update rounds`}
        active
      />
      <PipelineStep
        icon={Brain}
        title="Model"
        text={`${trainQuality}% pattern fit`}
      />
      <PipelineStep
        icon={Activity}
        title="Inference"
        text={`${inferenceSpeed}ms response`}
      />
    </div>
  );
}

function LossDemo({ learningRate }) {
  const normalizedRate = learningRate / 100;
  const points = Array.from({ length: 10 }, (_, index) => {
    const step = index + 1;
    const decay = Math.exp(-step * normalizedRate * 0.65);
    const instability = normalizedRate > 0.78 ? Math.sin(step * 1.7) * 0.18 : 0;
    return clamp(106 * decay + 18 + instability * 70, 18, 132);
  });
  const path = points
    .map((y, index) => `${index === 0 ? "M" : "L"} ${26 + index * 28} ${y}`)
    .join(" ");
  const finalLoss = Math.round(points[points.length - 1]);

  return (
    <div className="demo-stack">
      <svg
        className="chart"
        viewBox="0 0 300 160"
        role="img"
        aria-label="Loss curve"
      >
        <rect x="12" y="12" width="276" height="132" rx="8" />
        <path className="grid-line" d="M26 116 H274 M26 78 H274 M26 40 H274" />
        <path className="loss-line" d={path} />
        {points.map((point, index) => (
          <circle key={index} cx={26 + index * 28} cy={point} r="4.5" />
        ))}
      </svg>
      <div className="metric-row">
        <Metric label="Final loss" value={finalLoss} />
        <Metric
          label="Update style"
          value={learningRate > 78 ? "jumpy" : "steady"}
        />
      </div>
    </div>
  );
}

function NetworkDemo({ width }) {
  const inputNodes = [36, 80, 124];
  const hiddenNodes = Array.from(
    { length: width },
    (_, index) => 22 + index * (116 / Math.max(width - 1, 1)),
  );
  const outputNodes = [54, 104];

  return (
    <div className="demo-stack">
      <svg
        className="network-svg"
        viewBox="0 0 300 160"
        role="img"
        aria-label="Neural network layers"
      >
        {inputNodes.flatMap((y1, inputIndex) =>
          hiddenNodes.map((y2, hiddenIndex) => (
            <line
              key={`i-${inputIndex}-${hiddenIndex}`}
              x1="52"
              y1={y1}
              x2="150"
              y2={y2}
            />
          )),
        )}
        {hiddenNodes.flatMap((y1, hiddenIndex) =>
          outputNodes.map((y2, outputIndex) => (
            <line
              key={`o-${hiddenIndex}-${outputIndex}`}
              x1="150"
              y1={y1}
              x2="248"
              y2={y2}
            />
          )),
        )}
        {inputNodes.map((y, index) => (
          <circle key={`input-${index}`} cx="52" cy={y} r="12" />
        ))}
        {hiddenNodes.map((y, index) => (
          <circle
            key={`hidden-${index}`}
            className="hidden-node"
            cx="150"
            cy={y}
            r="10"
          />
        ))}
        {outputNodes.map((y, index) => (
          <circle key={`output-${index}`} cx="248" cy={y} r="12" />
        ))}
      </svg>
      <div className="metric-row">
        <Metric label="Input signals" value="3" />
        <Metric label="Hidden detectors" value={width} />
      </div>
    </div>
  );
}

function LLMDemo({ clues }) {
  const context = [
    "The",
    "student",
    "opened",
    "the",
    "notebook",
    "to",
    "learn",
  ];
  const visible = context.slice(0, 2 + clues);
  const candidates = [
    { word: "AI", score: 30 + clues * 10 },
    { word: "music", score: 34 - clues * 3 },
    { word: "weather", score: 28 - clues * 4 },
  ];

  return (
    <div className="llm-demo">
      <div className="token-row">
        {visible.map((token, index) => (
          <span className="token-chip active" key={`${token}-${index}`}>
            {token}
          </span>
        ))}
      </div>
      <div className="candidate-list">
        {candidates.map((candidate) => (
          <div className="candidate" key={candidate.word}>
            <span>{candidate.word}</span>
            <div>
              <i style={{ width: `${clamp(candidate.score, 8, 88)}%` }} />
            </div>
            <strong>{clamp(candidate.score, 8, 88)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenizerDemo({ text, setText }) {
  const tokens = approximateTokens(text);
  const subwordCount = tokens.filter(
    (token) => token.type === "subword",
  ).length;
  const estimatedCost = Math.max(1, Math.ceil(tokens.length / 4));

  return (
    <div className="demo-stack">
      <label className="text-control">
        <span>Type text</span>
        <textarea
          value={text}
          rows={3}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      <div className="token-row large">
        {tokens.map((token, index) => (
          <span
            className={`token-chip ${token.type}`}
            key={`${token.display}-${index}`}
          >
            {token.display}
          </span>
        ))}
      </div>
      <p className="demo-note">
        Approximation: real LLM tokenizers use learned vocabularies, so tokens
        can be full words, subwords, punctuation, numbers, or chunks that
        include spaces.
      </p>
      <div className="metric-row">
        <Metric label="Approx tokens" value={tokens.length} />
        <Metric label="Subword pieces" value={subwordCount} />
        <Metric label="Cost units" value={estimatedCost} />
      </div>
    </div>
  );
}

const embeddingDocuments = [
  {
    label: "learn neural networks",
    text: "beginner guide to layers, training, and neural network intuition",
    x: 60,
    y: 48,
    type: "ml",
  },
  {
    label: "debug model training",
    text: "loss curves, learning rate, overfitting, epochs, and optimization",
    x: 50,
    y: 66,
    type: "ml",
  },
  {
    label: "search private documents",
    text: "RAG retrieval semantic search private documents and grounded answers",
    x: 80,
    y: 38,
    type: "rag",
  },
  {
    label: "retrieve useful context",
    text: "find relevant chunks add context then answer user questions",
    x: 86,
    y: 58,
    type: "rag",
  },
  {
    label: "cook pasta tonight",
    text: "recipe dinner ingredients pasta sauce cooking food",
    x: 20,
    y: 30,
    type: "food",
  },
  {
    label: "plan a mountain trip",
    text: "travel hiking itinerary packing route mountains weekend",
    x: 24,
    y: 76,
    type: "travel",
  },
  {
    label: "write support replies",
    text: "customer support tone policy helpful response evaluation",
    x: 69,
    y: 79,
    type: "support",
  },
  {
    label: "explain code errors",
    text: "developer coding assistant stack trace bug fix tool context",
    x: 38,
    y: 40,
    type: "code",
  },
];

const semanticWeights = {
  ai: { ml: 0.7, llm: 0.8 },
  answer: { rag: 0.4, support: 0.3 },
  assistant: { llm: 0.7, code: 0.5 },
  bug: { code: 1 },
  chunks: { rag: 0.8 },
  code: { code: 1 },
  context: { rag: 0.9, llm: 0.4 },
  cooking: { food: 1 },
  customer: { support: 1 },
  data: { ml: 0.6 },
  debug: { code: 0.7, ml: 0.4 },
  dinner: { food: 1 },
  docs: { rag: 1 },
  document: { rag: 1 },
  documents: { rag: 1 },
  embedding: { search: 0.7, rag: 0.6, llm: 0.4 },
  embeddings: { search: 0.7, rag: 0.6, llm: 0.4 },
  error: { code: 1 },
  eval: { support: 0.5, ml: 0.4 },
  examples: { ml: 0.5 },
  explain: { learn: 0.5, code: 0.3 },
  fine: { llm: 0.4 },
  food: { food: 1 },
  guide: { learn: 0.7 },
  hiking: { travel: 1 },
  learn: { learn: 1, ml: 0.5 },
  learning: { learn: 1, ml: 0.6 },
  llm: { llm: 1 },
  llms: { llm: 1 },
  loss: { ml: 1 },
  model: { ml: 0.8, llm: 0.5 },
  mountain: { travel: 1 },
  neural: { ml: 1, learn: 0.3 },
  network: { ml: 1 },
  networks: { ml: 1 },
  optimization: { ml: 0.9 },
  pasta: { food: 1 },
  private: { rag: 0.9 },
  prompt: { llm: 0.8, support: 0.2 },
  rag: { rag: 1 },
  recipe: { food: 1 },
  retrieve: { rag: 1, search: 0.7 },
  retrieval: { rag: 1, search: 0.7 },
  search: { search: 1, rag: 0.5 },
  semantic: { search: 1, rag: 0.4 },
  support: { support: 1 },
  token: { llm: 0.6 },
  tokens: { llm: 0.6 },
  train: { ml: 1 },
  training: { ml: 1 },
  travel: { travel: 1 },
  trip: { travel: 1 },
};

const sampleQueries = [
  "How do I learn neural networks?",
  "Find answers in private docs",
  "Help me debug a code error",
  "Give me a pasta recipe",
];

function EmbeddingDemo({ query, setQuery }) {
  const queryVector = vectorizeText(query);
  const ranked = embeddingDocuments
    .map((document) => {
      const vector = vectorizeText(`${document.label} ${document.text}`);
      return {
        ...document,
        similarity: cosineSimilarity(queryVector, vector),
      };
    })
    .sort((a, b) => b.similarity - a.similarity);
  const queryPoint = getQueryPointFromMatches(ranked);
  const topMatches = ranked.slice(0, 3);

  return (
    <div className="embedding-demo">
      <label className="text-control">
        <span>Search by meaning</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div
        className="sample-query-row"
        aria-label="Example semantic search queries"
      >
        {sampleQueries.map((sample) => (
          <button key={sample} type="button" onClick={() => setQuery(sample)}>
            {sample}
          </button>
        ))}
      </div>
      <svg
        className="embedding-map"
        viewBox="0 0 300 180"
        role="img"
        aria-label="Embedding map"
      >
        <rect x="12" y="12" width="276" height="156" rx="8" />
        {topMatches.slice(0, 2).map((point) => (
          <line
            key={`line-${point.label}`}
            className="match-line"
            x1={queryPoint.x * 2.65 + 10}
            y1={queryPoint.y * 1.45 + 6}
            x2={point.x * 2.65 + 10}
            y2={point.y * 1.45 + 6}
          />
        ))}
        {embeddingDocuments.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x * 2.65 + 10}
              cy={point.y * 1.45 + 6}
              r="7"
              className={point.type}
            />
            <text x={point.x * 2.65 + 18} y={point.y * 1.45 + 10}>
              {point.label.split(" ").slice(0, 2).join(" ")}
            </text>
          </g>
        ))}
        <circle
          className="query-point"
          cx={queryPoint.x * 2.65 + 10}
          cy={queryPoint.y * 1.45 + 6}
          r="10"
        />
      </svg>
      <div className="similarity-list">
        {topMatches.map((item) => (
          <div className="similarity-item" key={item.label}>
            <span>{item.label}</span>
            <div>
              <i style={{ width: `${Math.round(item.similarity * 100)}%` }} />
            </div>
            <strong>{Math.round(item.similarity * 100)}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function vectorizeText(text) {
  const vector = {};
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  words.forEach((word) => {
    const weights =
      semanticWeights[word] || semanticWeights[word.replace(/s$/, "")];
    if (!weights) return;
    Object.entries(weights).forEach(([dimension, amount]) => {
      vector[dimension] = (vector[dimension] || 0) + amount;
    });
  });
  return vector;
}

function cosineSimilarity(a, b) {
  const dimensions = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  dimensions.forEach((dimension) => {
    const av = a[dimension] || 0;
    const bv = b[dimension] || 0;
    dot += av * bv;
    aMagnitude += av * av;
    bMagnitude += bv * bv;
  });

  if (!aMagnitude || !bMagnitude) return 0.05;
  return clamp(
    dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude)),
    0.05,
    0.99,
  );
}

function getQueryPointFromMatches(matches) {
  const weightedMatches = matches.slice(0, 3);
  const total = weightedMatches.reduce((sum, item) => sum + item.similarity, 0);
  if (!total) {
    return { x: 52, y: 54 };
  }
  return {
    x:
      weightedMatches.reduce((sum, item) => sum + item.x * item.similarity, 0) /
      total,
    y:
      weightedMatches.reduce((sum, item) => sum + item.y * item.similarity, 0) /
      total,
  };
}

const attentionScenes = {
  contract: {
    label: "Contract",
    words: [
      { text: "The", weight: 12 },
      { text: "contract", weight: 78 },
      { text: "says", weight: 22 },
      { text: "renewal", weight: 83 },
      { text: "requires", weight: 48 },
      { text: "notice", weight: 96 },
    ],
    predictions: [
      { token: "details", evidence: ["contract"], base: 16 },
      { token: "period", evidence: ["notice"], base: 10 },
      { token: "terms", evidence: ["contract", "renewal"], base: 16 },
    ],
  },
  recipe: {
    label: "Recipe",
    words: [
      { text: "Add", weight: 48 },
      { text: "tomatoes", weight: 82 },
      { text: "garlic", weight: 76 },
      { text: "and", weight: 10 },
      { text: "olive", weight: 66 },
      { text: "oil", weight: 70 },
    ],
    predictions: [
      { token: "ingredients", evidence: ["Add"], base: 16 },
      { token: "sauce", evidence: ["tomatoes", "garlic"], base: 13 },
      { token: "pan", evidence: ["oil"], base: 15 },
    ],
  },
  travel: {
    label: "Travel",
    words: [
      { text: "Pack", weight: 52 },
      { text: "layers", weight: 74 },
      { text: "because", weight: 22 },
      { text: "mountain", weight: 88 },
      { text: "weather", weight: 94 },
      { text: "changes", weight: 68 },
    ],
    predictions: [
      { token: "items", evidence: ["Pack"], base: 16 },
      { token: "quickly", evidence: ["weather", "changes"], base: 12 },
      { token: "jacket", evidence: ["Pack", "layers"], base: 16 },
    ],
  },
};

function AttentionDemo({ focus }) {
  const [sceneId, setSceneId] = useState("contract");
  const scene = attentionScenes[sceneId];
  const scoredPredictions = scene.predictions
    .map((prediction) => {
      const evidenceScore = prediction.evidence.reduce((sum, evidenceWord) => {
        const word = scene.words.find((item) => item.text === evidenceWord);
        return sum + (word?.weight || 0);
      }, 0);
      return {
        ...prediction,
        score: clamp(
          Math.round(
            prediction.base +
              (evidenceScore / prediction.evidence.length) * (focus / 100),
          ),
          6,
          98,
        ),
      };
    })
    .sort((a, b) => b.score - a.score);
  const topPrediction = scoredPredictions[0];

  return (
    <div className="attention-demo">
      <div
        className="segmented-control"
        aria-label="Attention context examples"
      >
        {Object.entries(attentionScenes).map(([id, item]) => (
          <button
            key={id}
            type="button"
            className={sceneId === id ? "active" : ""}
            onClick={() => setSceneId(id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="context-sentence">
        Predict the next useful word after reading the context:
      </p>
      <div className="attention-words">
        {scene.words.map((word) => {
          const intensity = clamp((word.weight * focus) / 100, 12, 100);
          return (
            <span
              key={word.text}
              style={{
                "--attention": intensity / 100,
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
      <div className="model-reply compact">
        <Brain size={18} aria-hidden="true" />
        <p>
          Next token leans toward: "{topPrediction.token}" because attention is
          strongest around {topPrediction.evidence.join(" + ")}.
        </p>
      </div>
      <div className="candidate-list">
        {scoredPredictions.map((candidate) => (
          <div className="candidate" key={candidate.token}>
            <span>{candidate.token}</span>
            <div>
              <i style={{ width: `${candidate.score}%` }} />
            </div>
            <strong>{candidate.score}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptDemo({ temperature, setTemperature }) {
  const [style, setStyle] = useState("simple");
  const [constraints, setConstraints] = useState(true);
  const temp = Math.round(temperature / 10) / 10;
  const base =
    style === "simple"
      ? "Embeddings are meaning coordinates."
      : style === "teacher"
        ? "Imagine placing similar ideas on the same table. Embeddings are the coordinates for that table."
        : "Use embeddings to turn content into vectors, compare similarity, and retrieve nearby meaning.";
  const flourish =
    temperature > 68
      ? " A higher temperature adds more colorful phrasing and examples."
      : temperature < 25
        ? " The answer stays short and predictable."
        : " The answer balances clarity with a little variety.";

  return (
    <div className="prompt-demo">
      <div className="segmented-control" aria-label="Prompt style">
        {["simple", "teacher", "technical"].map((option) => (
          <button
            type="button"
            key={option}
            className={style === option ? "active" : ""}
            onClick={() => setStyle(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <label className="toggle-control">
        <input
          type="checkbox"
          checked={constraints}
          onChange={(event) => setConstraints(event.target.checked)}
        />
        <span>Require two-sentence answer</span>
      </label>
      <label className="range-control">
        <span>Temperature: {temp}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={temperature}
          onChange={(event) => setTemperature(Number(event.target.value))}
        />
      </label>
      <div className="model-reply">
        <Thermometer size={18} aria-hidden="true" />
        <p>
          {base}
          {constraints
            ? flourish
            : " Try adding format and audience constraints when quality matters."}
        </p>
      </div>
    </div>
  );
}

function WorkflowDemo({ selected, setSelected }) {
  const copy = workflowCopy[selected] || workflowCopy.rag;
  const Icon = copy.icon;

  return (
    <div className="workflow-demo">
      <div className="workflow-options">
        {Object.entries(workflowCopy).map(([key, item]) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={key}
              className={selected === key ? "active" : ""}
              type="button"
              onClick={() => setSelected(key)}
            >
              <ItemIcon size={16} aria-hidden="true" />
              {item.title}
            </button>
          );
        })}
      </div>
      <div className="workflow-card">
        <Icon size={26} aria-hidden="true" />
        <div>
          <h3>{copy.title}</h3>
          <p>{copy.line}</p>
        </div>
      </div>
      <div className="workflow-steps">
        {copy.steps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
    </div>
  );
}

function QuizCard({ module, quizAnswer, answerQuiz }) {
  return (
    <section className="quiz-card">
      <div className="quiz-heading">
        <BadgeCheck size={20} aria-hidden="true" />
        <h3>Quick check</h3>
      </div>
      <p>{module.quiz.question}</p>
      <div className="quiz-options">
        {module.quiz.options.map((option, index) => {
          const selected = quizAnswer?.optionIndex === index;
          const correct = module.quiz.answer === index;
          const className = selected
            ? correct
              ? "correct selected"
              : "incorrect selected"
            : "";
          return (
            <button
              key={option}
              className={className}
              type="button"
              onClick={() => answerQuiz(module.id, index)}
            >
              {option}
            </button>
          );
        })}
      </div>
      {quizAnswer && (
        <strong
          className={
            quizAnswer.isCorrect
              ? "quiz-result correct"
              : "quiz-result incorrect"
          }
        >
          {quizAnswer.isCorrect
            ? "Nice. That module is now complete."
            : "Almost. Try another answer."}
        </strong>
      )}
    </section>
  );
}

function PlaygroundsView({ setActiveModuleId, setActiveView }) {
  return (
    <section className="page-view">
      <SectionIntro
        icon={SlidersHorizontal}
        label="Hands-on tools"
        title="Playgrounds"
        text="All ten journey modules are available as standalone interactive labs for quick exploration."
      />
      <div className="playground-grid">
        {modules.map((module) => (
          <article
            className={`playground-card theme-${module.theme}`}
            key={module.id}
          >
            <div className="playground-card-head">
              <span className={`module-number ${module.theme}`}>
                {module.number}
              </span>
              <div>
                <h2>{module.shortTitle}</h2>
                <p>{module.summary}</p>
              </div>
            </div>
            <DemoPanel module={module} />
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setActiveModuleId(module.id);
                setActiveView("journey");
              }}
            >
              Open full lesson
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConceptMapView({ setActiveModuleId, setActiveView }) {
  const [activeNodeId, setActiveNodeId] = useState("llm");
  const nodeById = useMemo(
    () => new Map(conceptNodes.map((node) => [node.id, node])),
    [],
  );
  const activeNode = nodeById.get(activeNodeId) || conceptNodes[0];
  const layerNames = [...new Set(conceptNodes.map((node) => node.layer))];

  const openModule = (moduleId) => {
    setActiveModuleId(moduleId);
    setActiveView("journey");
  };

  const activateNode = (node) => {
    setActiveNodeId(node.id);
  };

  return (
    <section className="page-view">
      <SectionIntro
        icon={MapIcon}
        label="Mental model"
        title="LLM Concepts Map"
        text="A corrected flow from ML foundations to LLM internals and product workflows. Select any node to jump into the related lesson."
      />
      <div className="concept-map-shell">
        <svg
          className="concept-map"
          viewBox="0 0 100 100"
          role="img"
          aria-label="LLM concept map"
        >
          <rect
            className="map-layer foundation"
            x="2"
            y="6"
            width="96"
            height="38"
            rx="3"
          />
          <rect
            className="map-layer internals"
            x="2"
            y="49"
            width="66"
            height="46"
            rx="3"
          />
          <rect
            className="map-layer workflow"
            x="70"
            y="45"
            width="28"
            height="51"
            rx="3"
          />
          <text className="map-layer-label" x="5" y="12">
            ML foundation
          </text>
          <text className="map-layer-label" x="5" y="55">
            LLM internals
          </text>
          <text className="map-layer-label" x="72" y="48.2">
            App workflow
          </text>
          {conceptLinks.map(([from, to, label], index) => {
            const a = nodeById.get(from);
            const b = nodeById.get(to);
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;

            // Calculate perpendicular offset for label positioning
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const perpX = -dy / len;
            const perpY = dx / len;

            // Define custom offsets for specific crowded links
            let offsetDistance = index % 2 === 0 ? -3 : 3;
            const linkId = `${from}-${to}`;
            if (linkId === "tokens-attention") offsetDistance = -4;
            if (linkId === "tokens-embeddings") offsetDistance = 4;
            if (linkId === "prompt-llm") offsetDistance = -2.5;
            if (linkId === "attention-llm") offsetDistance = -4;
            if (linkId === "llm-rag") offsetDistance = -3.5;
            if (linkId === "llm-agents") offsetDistance = -4.5;
            if (linkId === "llm-fine-tuning") offsetDistance = 4.5;
            if (linkId === "rag-evals") offsetDistance = -5;
            if (linkId === "agents-evals") offsetDistance = -4.5;
            if (linkId === "fine-tuning-evals") offsetDistance = 4;

            const labelX = midX + perpX * offsetDistance;
            const labelY = midY + perpY * offsetDistance;

            const isActive = activeNodeId === from || activeNodeId === to;
            return (
              <g
                key={`${from}-${to}`}
                className={isActive ? "map-link active" : "map-link"}
              >
                <line
                  className={isActive ? "active" : ""}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
                <text className="map-link-label" x={labelX} y={labelY}>
                  {label}
                </text>
              </g>
            );
          })}
          {conceptNodes.map((node) => (
            <g
              key={node.id}
              className={
                activeNodeId === node.id ? "map-node active" : "map-node"
              }
              role="button"
              tabIndex="0"
              onClick={() => activateNode(node)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  activateNode(node);
                }
              }}
            >
              <circle cx={node.x} cy={node.y} r="3.2" />
              <text x={node.x} y={node.y - 5.5}>
                {node.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="map-notes" aria-label="Selected concept details">
          <article className="map-detail">
            <span>{activeNode.layer}</span>
            <h2>{activeNode.label}</h2>
            <p>{activeNode.description}</p>
            <button
              type="button"
              onClick={() => openModule(activeNode.moduleId)}
            >
              Open related lesson
            </button>
          </article>
          <div className="map-layer-list">
            {layerNames.map((layer) => (
              <section key={layer}>
                <h3>{layer}</h3>
                <div>
                  {conceptNodes
                    .filter((node) => node.layer === layer)
                    .map((node) => (
                      <button
                        key={node.id}
                        className={activeNodeId === node.id ? "active" : ""}
                        type="button"
                        onClick={() => activateNode(node)}
                      >
                        {node.label}
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCasesView() {
  return (
    <section className="page-view">
      <SectionIntro
        icon={Target}
        label="Applied intuition"
        title="Use Cases"
        text="Simple examples that connect each concept to things people already see in real products."
      />
      <div className="use-case-grid">
        {useCases.map((item) => (
          <article className="use-case-card" key={item.title}>
            <span>{item.concept}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function GlossaryView() {
  const [filter, setFilter] = useState("");
  const filtered = glossary.filter(([term, definition]) =>
    `${term} ${definition}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <section className="page-view">
      <SectionIntro
        icon={BookOpen}
        label="Plain English"
        title="Glossary"
        text="A fast reference for ML and LLM vocabulary without assuming a math background."
      />
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          placeholder="Search a term"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </label>
      <div className="glossary-grid">
        {filtered.map(([term, definition]) => (
          <article className="glossary-card" key={term}>
            <h2>{term}</h2>
            <p>{definition}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionIntro({ icon: Icon, label, title, text }) {
  return (
    <div className="section-intro">
      <span className="eyebrow">
        <Icon size={16} aria-hidden="true" />
        {label}
      </span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function PipelineStep({ icon: Icon, title, text, active = false }) {
  return (
    <div className={active ? "pipeline-step active" : "pipeline-step"}>
      <Icon size={21} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <span>Built by Sai Lokesh with Codex</span>
      <span>Static React app ready for GitHub Pages and Netlify.</span>
    </footer>
  );
}

export default App;
