import { openDB, DBSchema, IDBPDatabase } from "idb";
import { SleepRecord, DreamRecord } from "@/types";

interface DreamLogDB extends DBSchema {
  sleepRecords: {
    key: string;
    value: SleepRecord;
    indexes: {
      "by-date": string;
      "by-createdAt": number;
    };
  };
  dreamRecords: {
    key: string;
    value: DreamRecord;
    indexes: {
      "by-date": string;
      "by-dreamType": string;
      "by-createdAt": number;
    };
  };
}

let dbInstance: IDBPDatabase<DreamLogDB> | null = null;

async function getDB(): Promise<IDBPDatabase<DreamLogDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<DreamLogDB>("dreamlog-db", 1, {
    upgrade(db) {
      const sleepStore = db.createObjectStore("sleepRecords", { keyPath: "id" });
      sleepStore.createIndex("by-date", "date", { unique: true });
      sleepStore.createIndex("by-createdAt", "createdAt");

      const dreamStore = db.createObjectStore("dreamRecords", { keyPath: "id" });
      dreamStore.createIndex("by-date", "date", { unique: true });
      dreamStore.createIndex("by-dreamType", "dreamType");
      dreamStore.createIndex("by-createdAt", "createdAt");
    },
  });
  return dbInstance;
}

export async function getAllSleepRecords(): Promise<SleepRecord[]> {
  const db = await getDB();
  const records = await db.getAll("sleepRecords");
  return records.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSleepRecordByDate(date: string): Promise<SleepRecord | undefined> {
  const db = await getDB();
  const index = db.transaction("sleepRecords").store.index("by-date");
  return index.get(date);
}

export async function saveSleepRecord(record: SleepRecord): Promise<void> {
  const db = await getDB();
  await db.put("sleepRecords", record);
}

export async function deleteSleepRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("sleepRecords", id);
}

export async function getAllDreamRecords(): Promise<DreamRecord[]> {
  const db = await getDB();
  const records = await db.getAll("dreamRecords");
  return records.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getDreamRecordByDate(date: string): Promise<DreamRecord | undefined> {
  const db = await getDB();
  const index = db.transaction("dreamRecords").store.index("by-date");
  return index.get(date);
}

export async function getDreamRecordsByType(dreamType: string): Promise<DreamRecord[]> {
  const db = await getDB();
  const index = db.transaction("dreamRecords").store.index("by-dreamType");
  return index.getAll(dreamType);
}

export async function saveDreamRecord(record: DreamRecord): Promise<void> {
  const db = await getDB();
  await db.put("dreamRecords", record);
}

export async function deleteDreamRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("dreamRecords", id);
}

export async function getSleepRecordsInRange(
  startDate: string,
  endDate: string
): Promise<SleepRecord[]> {
  const all = await getAllSleepRecords();
  return all.filter((r) => r.date >= startDate && r.date <= endDate);
}

export async function getDreamRecordsInRange(
  startDate: string,
  endDate: string
): Promise<DreamRecord[]> {
  const all = await getAllDreamRecords();
  return all.filter((r) => r.date >= startDate && r.date <= endDate);
}
