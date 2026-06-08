import { useState, useEffect, useRef, useCallback } from "react";
import { Wind, CloudRain, Waves, Flame, Play, Pause, RotateCcw, Timer } from "lucide-react";

type BreathPhase = "inhale" | "hold" | "exhale";

const PHASE_CONFIG: { phase: BreathPhase; label: string; duration: number; anim: string }[] = [
  { phase: "inhale", label: "吸气...", duration: 4000, anim: "animate-breathe-in" },
  { phase: "hold", label: "屏息...", duration: 7000, anim: "animate-breathe-hold" },
  { phase: "exhale", label: "呼气...", duration: 8000, anim: "animate-breathe-out" },
];

function BreathingGuide() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [phaseKey, setPhaseKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = PHASE_CONFIG[phaseIndex];

  const advance = useCallback(() => {
    setPhaseIndex((prev) => {
      const next = (prev + 1) % 3;
      if (next === 0) setCycles((c) => c + 1);
      setPhaseKey((k) => k + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (running) {
      timerRef.current = setTimeout(advance, current.duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, phaseIndex, advance, current.duration]);

  const toggle = () => {
    if (!running) setPhaseKey((k) => k + 1);
    setRunning((r) => !r);
  };

  const reset = () => {
    setRunning(false);
    setPhaseIndex(0);
    setCycles(0);
    setPhaseKey((k) => k + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <h3 className="section-title text-lg">4-7-8 呼吸引导</h3>
      <div className="flex justify-center py-4">
        <div className="relative w-48 h-48">
          <div
            key={phaseKey}
            className={`w-full h-full rounded-full border-[3px] border-gradient flex items-center justify-center ${running ? current.anim : "scale-40 opacity-50"}`}
            style={{
              borderImage: "linear-gradient(135deg, #8B5CF6, #00CED1) 1",
              boxShadow: "0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(0,206,209,0.15)",
            }}
          >
            <span className="text-white/90 text-lg font-medium select-none">
              {running ? current.label : "准备"}
            </span>
          </div>
        </div>
      </div>
      <p className="text-center text-white/50 text-sm">
        已完成 <span className="text-stargold font-semibold">{cycles}</span> 个循环
      </p>
      <div className="flex justify-center gap-3">
        <button onClick={toggle} className="btn-primary flex items-center gap-2">
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? "暂停" : "开始"}
        </button>
        <button onClick={reset} className="btn-ghost flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> 重置
        </button>
      </div>
    </div>
  );
}

interface NoiseSource {
  name: string;
  icon: React.ReactNode;
  type: "brown" | "pink" | "crackle" | "highpass";
}

const NOISE_SOURCES: NoiseSource[] = [
  { name: "雨声", icon: <CloudRain className="w-5 h-5" />, type: "brown" },
  { name: "溪流", icon: <Waves className="w-5 h-5" />, type: "pink" },
  { name: "篝火", icon: <Flame className="w-5 h-5" />, type: "crackle" },
  { name: "风铃", icon: <Wind className="w-5 h-5" />, type: "highpass" },
];

function createNoiseBuffer(ctx: AudioContext, seconds: number, type: NoiseSource["type"]): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = rate * seconds;
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);

  if (type === "brown") {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * white) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else if (type === "crackle") {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() < 0.002 ? (Math.random() * 2 - 1) * 0.8 : data[i - 1] || 0;
      if (i > 0 && data[i] === 0) data[i] = data[i - 1] * 0.98;
    }
  } else {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

function WhiteNoiseMixer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Map<string, { source: AudioBufferSourceNode; gain: GainNode }>>(new Map());
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [master, setMaster] = useState(70);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const toggleSource = (src: NoiseSource) => {
    const isOn = active[src.name];
    if (isOn) {
      const nodes = nodesRef.current.get(src.name);
      if (nodes) {
        nodes.source.stop();
        nodes.gain.disconnect();
        nodesRef.current.delete(src.name);
      }
      setActive((a) => ({ ...a, [src.name]: false }));
    } else {
      const ctx = getCtx();
      const buffer = createNoiseBuffer(ctx, 4, src.type);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      const vol = volumes[src.name] ?? 50;
      gain.gain.value = (vol / 100) * (master / 100);

      let lastNode: AudioNode = source;
      if (src.type === "highpass") {
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 4000;
        lastNode.connect(hp);
        lastNode = hp;
      }
      if (src.type === "brown") {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 800;
        lastNode.connect(lp);
        lastNode = lp;
      }

      lastNode.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      nodesRef.current.set(src.name, { source, gain });
      setActive((a) => ({ ...a, [src.name]: true }));
    }
  };

  const changeVolume = (name: string, vol: number) => {
    setVolumes((v) => ({ ...v, [name]: vol }));
    const nodes = nodesRef.current.get(name);
    if (nodes) {
      nodes.gain.gain.value = (vol / 100) * (master / 100);
    }
  };

  const changeMaster = (val: number) => {
    setMaster(val);
    nodesRef.current.forEach((nodes) => {
      const name = [...nodesRef.current.entries()].find(([, n]) => n === nodes)?.[0];
      if (name) {
        const vol = volumes[name] ?? 50;
        nodes.gain.gain.value = (vol / 100) * (val / 100);
      }
    });
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="section-title text-lg">白噪音混音器</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {NOISE_SOURCES.map((src) => (
          <div key={src.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <button
              onClick={() => toggleSource(src)}
              className={`p-2 rounded-lg transition-colors ${active[src.name] ? "bg-aurora/20 text-aurora" : "bg-white/5 text-white/40"}`}
            >
              {src.icon}
            </button>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-white/70">{src.name}</p>
              <input
                type="range"
                min={0}
                max={100}
                value={volumes[src.name] ?? 50}
                onChange={(e) => changeVolume(src.name, Number(e.target.value))}
                className="w-full h-1 accent-aurora cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
        <span className="text-sm text-white/50 shrink-0">主音量</span>
        <input
          type="range"
          min={0}
          max={100}
          value={master}
          onChange={(e) => changeMaster(Number(e.target.value))}
          className="flex-1 h-1 accent-stargold cursor-pointer"
        />
        <span className="text-sm text-white/50 w-8 text-right">{master}</span>
      </div>
    </div>
  );
}

interface Stretch {
  name: string;
  emoji: string;
  desc: string;
  defaultSec: number;
}

const STRETCHES: Stretch[] = [
  { name: "颈部侧弯", emoji: "🧘‍♀️", desc: "缓慢将头倾向一侧，保持15秒", defaultSec: 15 },
  { name: "肩部环绕", emoji: "💆‍♀️", desc: "前后各转动肩膀10圈", defaultSec: 30 },
  { name: "猫牛式", emoji: "🐱", desc: "交替弓背与塌腰，重复8次", defaultSec: 30 },
  { name: "婴儿式", emoji: "🧒", desc: "跪坐前倾，双臂伸展，保持30秒", defaultSec: 30 },
  { name: "仰卧扭转", emoji: "🔄", desc: "仰卧屈膝倒向一侧，每侧15秒", defaultSec: 30 },
  { name: "腿部靠墙", emoji: "🦵", desc: "仰卧将双腿靠墙，保持2分钟", defaultSec: 120 },
];

function StretchCards() {
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const hasActive = Object.values(running).some(Boolean);
    if (hasActive) {
      intervalRef.current = setInterval(() => {
        setTimers((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(running)) {
            if (running[key] && next[key] > 0) next[key]--;
            if (next[key] === 0) setRunning((r) => ({ ...r, [key]: false }));
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const startTimer = (s: Stretch) => {
    if (running[s.name]) {
      setRunning((r) => ({ ...r, [s.name]: false }));
    } else {
      setTimers((t) => ({ ...t, [s.name]: t[s.name] ?? s.defaultSec }));
      setRunning((r) => ({ ...r, [s.name]: true }));
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="section-title text-lg flex items-center gap-2">
        <Timer className="w-5 h-5" /> 睡前拉伸
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {STRETCHES.map((s) => {
          const isActive = running[s.name];
          const timeLeft = timers[s.name] ?? s.defaultSec;
          return (
            <div
              key={s.name}
              className={`glass-card shrink-0 w-44 p-4 flex flex-col items-center gap-2 transition-all ${isActive ? "border-aurora/50 shadow-lg shadow-aurora/10" : ""}`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <p className="text-sm font-medium text-white/80 text-center">{s.name}</p>
              <p className="text-xs text-white/40 text-center leading-relaxed">{s.desc}</p>
              {isActive && (
                <p className="text-stargold font-semibold tabular-nums">{timeLeft}s</p>
              )}
              <button
                onClick={() => startTimer(s)}
                className={`mt-auto text-xs px-3 py-1.5 rounded-full transition-all ${isActive ? "bg-aurora/20 text-aurora border border-aurora/30" : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"}`}
              >
                {isActive ? <Pause className="w-3 h-3 inline" /> : <Play className="w-3 h-3 inline" />}
                {" "}{isActive ? "暂停" : "开始"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">助眠工具</h2>
      <BreathingGuide />
      <WhiteNoiseMixer />
      <StretchCards />
    </div>
  );
}
