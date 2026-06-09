import { create } from "zustand";
import { SleepRecord, DreamRecord, UserSettings, DEFAULT_USER_SETTINGS } from "@/types";
import * as db from "@/utils/db";

interface SleepStore {
  records: SleepRecord[];
  loading: boolean;
  fetchRecords: () => Promise<void>;
  addRecord: (record: SleepRecord) => Promise<void>;
  updateRecord: (record: SleepRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

export const useSleepStore = create<SleepStore>((set) => ({
  records: [],
  loading: false,
  fetchRecords: async () => {
    set({ loading: true });
    const records = await db.getAllSleepRecords();
    set({ records, loading: false });
  },
  addRecord: async (record) => {
    await db.saveSleepRecord(record);
    set((state) => ({ records: [record, ...state.records] }));
  },
  updateRecord: async (record) => {
    await db.saveSleepRecord(record);
    set((state) => ({
      records: state.records.map((r) => (r.id === record.id ? record : r)),
    }));
  },
  deleteRecord: async (id) => {
    await db.deleteSleepRecord(id);
    set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
  },
}));

interface DreamStore {
  records: DreamRecord[];
  loading: boolean;
  fetchRecords: () => Promise<void>;
  addRecord: (record: DreamRecord) => Promise<void>;
  updateRecord: (record: DreamRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

export const useDreamStore = create<DreamStore>((set) => ({
  records: [],
  loading: false,
  fetchRecords: async () => {
    set({ loading: true });
    const records = await db.getAllDreamRecords();
    set({ records, loading: false });
  },
  addRecord: async (record) => {
    await db.saveDreamRecord(record);
    set((state) => ({ records: [record, ...state.records] }));
  },
  updateRecord: async (record) => {
    await db.saveDreamRecord(record);
    set((state) => ({
      records: state.records.map((r) => (r.id === record.id ? record : r)),
    }));
  },
  deleteRecord: async (id) => {
    await db.deleteDreamRecord(id);
    set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
  },
}));

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem("dreamlog-settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_USER_SETTINGS, ...parsed };
    }
  } catch {
  }
  return { ...DEFAULT_USER_SETTINGS };
}

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: loadSettings(),
  updateSettings: (s) =>
    set((state) => {
      const next = { ...state.settings, ...s };
      localStorage.setItem("dreamlog-settings", JSON.stringify(next));
      return { settings: next };
    }),
  resetSettings: () =>
    set(() => {
      localStorage.setItem(
        "dreamlog-settings",
        JSON.stringify(DEFAULT_USER_SETTINGS)
      );
      return { settings: { ...DEFAULT_USER_SETTINGS } };
    }),
}));
