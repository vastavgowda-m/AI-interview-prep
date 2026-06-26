import type { TestResult } from "./interview-types";

const KEY = "ai_interview_results";

export function getResults(username: string): TestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const all: TestResult[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return all
      .filter((r) => r.username === username)
      .sort((a, b) => b.takenAt - a.takenAt);
  } catch {
    return [];
  }
}

export function saveResult(result: TestResult) {
  const all: TestResult[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  all.push(result);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteResult(id: string) {
  const all: TestResult[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  localStorage.setItem(KEY, JSON.stringify(all.filter((r) => r.id !== id)));
}
