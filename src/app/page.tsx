import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { DailyData } from "@/lib/types";
import Dashboard from "./dashboard";

function getAvailableDates(): string[] {
  const dataDir = join(process.cwd(), "data");
  try {
    return readdirSync(dataDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function loadData(date: string): DailyData | null {
  const filePath = join(process.cwd(), "data", `${date}.json`);
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const dates = getAvailableDates();
  const currentDate = params.date || dates[0] || new Date().toISOString().split("T")[0];
  const data = loadData(currentDate);

  return <Dashboard data={data} dates={dates} currentDate={currentDate} />;
}
