import { create } from "zustand";
import { SleepRecord, DreamRecord } from "@/types";
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
