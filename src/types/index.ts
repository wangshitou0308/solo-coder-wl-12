export interface SleepRecord {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  fallAsleepMinutes: number;
  sleepDuration: number;
  sleepEfficiency: number;
  qualityRating: number;
  factors: SleepFactor[];
  createdAt: number;
  updatedAt: number;
}

export interface DreamRecord {
  id: string;
  date: string;
  content: string;
  dreamType: DreamType;
  emotions: DreamEmotion[];
  createdAt: number;
  updatedAt: number;
}

export type SleepFactor =
  | "咖啡"
  | "茶"
  | "运动"
  | "午睡"
  | "压力"
  | "蓝光暴露"
  | "酒精"
  | "晚餐过饱";

export type DreamType = "清晰梦" | "噩梦" | "反复梦" | "预知梦" | "普通梦";

export type DreamEmotion = "愉悦" | "焦虑" | "恐惧" | "平静" | "奇幻" | "悲伤";

export const SLEEP_FACTORS: SleepFactor[] = [
  "咖啡",
  "茶",
  "运动",
  "午睡",
  "压力",
  "蓝光暴露",
  "酒精",
  "晚餐过饱",
];

export const DREAM_TYPES: DreamType[] = [
  "清晰梦",
  "噩梦",
  "反复梦",
  "预知梦",
  "普通梦",
];

export const DREAM_EMOTIONS: DreamEmotion[] = [
  "愉悦",
  "焦虑",
  "恐惧",
  "平静",
  "奇幻",
  "悲伤",
];

export const DREAM_TYPE_COLORS: Record<DreamType, string> = {
  清晰梦: "#3B82F6",
  噩梦: "#EF4444",
  反复梦: "#F59E0B",
  预知梦: "#8B5CF6",
  普通梦: "#6B7280",
};

export const DREAM_EMOTION_COLORS: Record<DreamEmotion, string> = {
  愉悦: "#10B981",
  焦虑: "#F59E0B",
  恐惧: "#EF4444",
  平静: "#3B82F6",
  奇幻: "#8B5CF6",
  悲伤: "#6B7280",
};

export const SLEEP_FACTOR_ICONS: Record<SleepFactor, string> = {
  咖啡: "coffee",
  茶: "cup-soda",
  运动: "dumbbell",
  午睡: "sun",
  压力: "brain",
  蓝光暴露: "monitor-smartphone",
  酒精: "wine",
  晚餐过饱: "utensils",
};

export interface WordCloudItem {
  text: string;
  value: number;
}
