import { useState, useMemo, useEffect } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Scatter } from "react-chartjs-2";
import { BarChart3, Calendar } from "lucide-react";
import {
  DREAM_TYPES,
  DREAM_TYPE_COLORS,
  DreamType,
  SleepRecord,
  DreamRecord,
} from "@/types";
import { useSleepStore, useDreamStore } from "@/stores";
import { isLateBedtime } from "@/utils/calc";
import EmptyState from "@/components/EmptyState";

ChartJS.register(...registerables);

const DREAM_TYPE_INDEX: Record<DreamType, number> = {
  清晰梦: 1,
  噩梦: 2,
  反复梦: 3,
  预知梦: 4,
  普通梦: 5,
};

type TimeRange = 7 | 30;

interface MetricCardProps {
  title: string;
  icon: string;
  mainRate: number;
  mainN: number;
  compareRate: number;
  compareN: number;
  compareLabel: string;
  isNegative?: boolean;
}

function MetricCard({
  title,
  icon,
  mainRate,
  mainN,
  compareRate,
  compareN,
  compareLabel,
  isNegative = false,
}: MetricCardProps) {
  const diff = mainRate - compareRate;
  const showDiff = Math.abs(diff) >= 10;
  const insufficientSample = mainN < 2 || compareN < 2;

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <h4 className="text-white/90 font-medium text-sm flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h4>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent">
          {mainRate.toFixed(0)}%
        </span>
        <span className="text-xs text-white/40">样本 N = {mainN}</span>
      </div>
      <div className="text-xs text-white/50">
        {compareLabel}: {compareRate.toFixed(0)}% (N = {compareN})
      </div>
      {showDiff && (
        <div
          className={`text-xs font-medium ${
            isNegative
              ? diff > 0
                ? "text-red-400"
                : "text-emerald-400"
              : diff > 0
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {diff > 0 ? "↑" : "↓"}{" "}
          {diff > 0
            ? isNegative
              ? `增加 ${Math.abs(diff).toFixed(0)}pp`
              : `提升 ${Math.abs(diff).toFixed(0)}pp`
            : isNegative
            ? `减少 ${Math.abs(diff).toFixed(0)}pp`
            : `降低 ${Math.abs(diff).toFixed(0)}pp`}
        </div>
      )}
      {insufficientSample && (
        <div className="text-xs text-amber-400/80 mt-auto">
          ⚠️ 样本量不足，结论仅供参考
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  const [range, setRange] = useState<TimeRange>(7);
  const sleepRecords = useSleepStore((s) => s.records);
  const dreamRecords = useDreamStore((s) => s.records);
  const fetchSleep = useSleepStore((s) => s.fetchRecords);
  const fetchDream = useDreamStore((s) => s.fetchRecords);

  useEffect(() => {
    fetchSleep();
    fetchDream();
  }, []);

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - range);
    return d.toISOString().split("T")[0];
  }, [range]);

  const joinedData = useMemo(() => {
    const sleepMap = new Map<string, SleepRecord>();
    for (const r of sleepRecords) {
      if (r.date >= cutoffDate) sleepMap.set(r.date, r);
    }
    const result: { sleep: SleepRecord; dream: DreamRecord }[] = [];
    for (const d of dreamRecords) {
      if (d.date >= cutoffDate) {
        const sleep = sleepMap.get(d.date);
        if (sleep) result.push({ sleep, dream: d });
      }
    }
    return result;
  }, [sleepRecords, dreamRecords, cutoffDate]);

  const scatterData = useMemo(() => {
    const datasets = DREAM_TYPES.map((type) => ({
      label: type,
      data: joinedData
        .filter((j) => j.dream.dreamType === type)
        .map((j) => ({
          x: j.sleep.sleepDuration / 60,
          y: DREAM_TYPE_INDEX[type],
        })),
      backgroundColor: DREAM_TYPE_COLORS[type],
      borderColor: DREAM_TYPE_COLORS[type],
      pointRadius: 6,
      pointHoverRadius: 8,
    }));
    return { datasets };
  }, [joinedData]);

  const metrics = useMemo(() => {
    const caffeineDays = joinedData.filter((j) =>
      j.sleep.factors.some((f) => f === "咖啡" || f === "茶")
    );
    const nonCaffeineDays = joinedData.filter(
      (j) => !j.sleep.factors.some((f) => f === "咖啡" || f === "茶")
    );
    const caffeineNightmareRate =
      caffeineDays.length > 0
        ? (caffeineDays.filter((j) => j.dream.dreamType === "噩梦").length /
            caffeineDays.length) *
          100
        : 0;
    const nonCaffeineNightmareRate =
      nonCaffeineDays.length > 0
        ? (nonCaffeineDays.filter((j) => j.dream.dreamType === "噩梦").length /
            nonCaffeineDays.length) *
          100
        : 0;

    const lateDays = joinedData.filter((j) => isLateBedtime(j.sleep.bedTime));
    const earlyDays = joinedData.filter(
      (j) => !isLateBedtime(j.sleep.bedTime)
    );
    const lateLucidRate =
      lateDays.length > 0
        ? (lateDays.filter((j) => j.dream.dreamType === "清晰梦").length /
            lateDays.length) *
          100
        : 0;
    const earlyLucidRate =
      earlyDays.length > 0
        ? (earlyDays.filter((j) => j.dream.dreamType === "清晰梦").length /
            earlyDays.length) *
          100
        : 0;

    const stressDays = joinedData.filter((j) =>
      j.sleep.factors.includes("压力")
    );
    const nonStressDays = joinedData.filter(
      (j) => !j.sleep.factors.includes("压力")
    );
    const stressAnxietyRate =
      stressDays.length > 0
        ? (stressDays.filter((j) => j.dream.emotions.includes("焦虑")).length /
            stressDays.length) *
          100
        : 0;
    const nonStressAnxietyRate =
      nonStressDays.length > 0
        ? (nonStressDays.filter((j) => j.dream.emotions.includes("焦虑"))
            .length /
            nonStressDays.length) *
          100
        : 0;

    const exerciseDays = joinedData.filter((j) =>
      j.sleep.factors.includes("运动")
    );
    const nonExerciseDays = joinedData.filter(
      (j) => !j.sleep.factors.includes("运动")
    );
    const exerciseJoyRate =
      exerciseDays.length > 0
        ? (exerciseDays.filter((j) => j.dream.emotions.includes("愉悦")).length /
            exerciseDays.length) *
          100
        : 0;
    const nonExerciseJoyRate =
      nonExerciseDays.length > 0
        ? (nonExerciseDays.filter((j) => j.dream.emotions.includes("愉悦"))
            .length /
            nonExerciseDays.length) *
          100
        : 0;

    return {
      caffeine: {
        mainRate: caffeineNightmareRate,
        mainN: caffeineDays.length,
        compareRate: nonCaffeineNightmareRate,
        compareN: nonCaffeineDays.length,
      },
      late: {
        mainRate: lateLucidRate,
        mainN: lateDays.length,
        compareRate: earlyLucidRate,
        compareN: earlyDays.length,
      },
      stress: {
        mainRate: stressAnxietyRate,
        mainN: stressDays.length,
        compareRate: nonStressAnxietyRate,
        compareN: nonStressDays.length,
      },
      exercise: {
        mainRate: exerciseJoyRate,
        mainN: exerciseDays.length,
        compareRate: nonExerciseJoyRate,
        compareN: nonExerciseDays.length,
      },
    };
  }, [joinedData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className="section-title flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          关联分析
        </h2>
        <div className="flex gap-2">
          {([7, 30] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                range === r
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-400/40"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              最近{r}天
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 w-full overflow-x-auto">
        <h3 className="text-white/90 font-medium mb-4">
          睡眠时长 vs 梦境类型
        </h3>
        {joinedData.length >= 3 ? (
          <div className="min-w-[480px]">
            <Scatter
              data={scatterData}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#94a3b8" } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                        const type = DREAM_TYPES[ctx.datasetIndex];
                        return `${type}: ${ctx.parsed.x.toFixed(1)}h`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "睡眠时长（小时）",
                      color: "#94a3b8",
                    },
                    ticks: { color: "#94a3b8" },
                    grid: { color: "rgba(148,163,184,0.1)" },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "梦境类型",
                      color: "#94a3b8",
                    },
                    ticks: {
                      color: "#94a3b8",
                      stepSize: 1,
                      callback: (v: string | number) => {
                        const numV = Number(v);
                        const match = DREAM_TYPES.find(
                          (t) => DREAM_TYPE_INDEX[t] === numV
                        );
                        return match ?? "";
                      },
                    },
                    min: 0.5,
                    max: 5.5,
                    grid: { color: "rgba(148,163,184,0.1)" },
                  },
                },
              }}
            />
          </div>
        ) : (
          <EmptyState
            title="睡眠与梦境关联数据不足"
            description="至少需要 3 天同时记录了睡眠和梦境的数据，才能生成关联分析"
          />
        )}
      </div>

      <div className="glass-card p-6 w-full">
        <h3 className="text-white/90 font-medium mb-1">
          📊 关键因素占比分析（基于样本数据，仅供参考）
        </h3>
        <p className="text-xs text-white/40 mb-5">
          *所有百分比基于对应分组内的样本统计，样本量不足（N&lt;5）时请谨慎解读
        </p>
        {joinedData.length >= 3 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              icon="☕"
              title="咖啡因日噩梦占比"
              mainRate={metrics.caffeine.mainRate}
              mainN={metrics.caffeine.mainN}
              compareRate={metrics.caffeine.compareRate}
              compareN={metrics.caffeine.compareN}
              compareLabel="无咖啡因日噩梦"
              isNegative={true}
            />
            <MetricCard
              icon="🌙"
              title="晚睡日清晰梦占比"
              mainRate={metrics.late.mainRate}
              mainN={metrics.late.mainN}
              compareRate={metrics.late.compareRate}
              compareN={metrics.late.compareN}
              compareLabel="正常入睡日清晰梦"
              isNegative={false}
            />
            <MetricCard
              icon="🧠"
              title="压力日焦虑梦境占比"
              mainRate={metrics.stress.mainRate}
              mainN={metrics.stress.mainN}
              compareRate={metrics.stress.compareRate}
              compareN={metrics.stress.compareN}
              compareLabel="非压力日焦虑梦境"
              isNegative={true}
            />
            <MetricCard
              icon="🏃"
              title="运动日愉悦梦境占比"
              mainRate={metrics.exercise.mainRate}
              mainN={metrics.exercise.mainN}
              compareRate={metrics.exercise.compareRate}
              compareN={metrics.exercise.compareN}
              compareLabel="非运动日愉悦梦境"
              isNegative={false}
            />
          </div>
        ) : (
          <EmptyState
            title="影响因素关联分析数据不足"
            description="需要积累更多同时包含睡眠和梦境的完整记录日，建议至少 3 个数据点"
          />
        )}
      </div>
    </div>
  );
}
