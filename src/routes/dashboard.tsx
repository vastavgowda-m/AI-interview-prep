import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, LogOut, Play, Trash2, Trophy } from "lucide-react";
import { getSession, logout, type User } from "@/lib/auth";
import { deleteResult, getResults } from "@/lib/results-store";
import type { TestResult } from "@/lib/interview-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PrepAI" },
      { name: "description", content: "Your interview practice dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/auth" });
      return;
    }
    setUser(s);
    setResults(getResults(s.username));
  }, [navigate]);

  if (!user) return null;

  const onLogout = () => {
    logout();
    navigate({ to: "/auth" });
  };

  const onDelete = (id: string) => {
    deleteResult(id);
    setResults(getResults(user.username));
  };

  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Brain className="size-6 text-primary" />
            <span className="font-semibold">PrepAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Hi, <span className="text-foreground font-medium">{user.username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="glass-card flex flex-col items-start justify-between gap-6 rounded-2xl p-8 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="mt-1 text-3xl font-bold">
              <span className="gradient-text">{user.username}</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Ready for another mock interview?</p>
          </div>
          <Link to="/test/setup">
            <Button size="lg" className="btn-gradient">
              <Play className="mr-2 size-4" />
              Start new test
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Tests taken" value={results.length} />
          <Stat label="Average score" value={`${avg}%`} />
          <Stat
            label="Best score"
            value={`${results.length ? Math.max(...results.map((r) => r.percentage)) : 0}%`}
          />
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">Previous Test Results</h2>
          </div>

          {results.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
              No tests yet — start your first one!
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="glass-card flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {r.config.role} @ {r.config.company}
                      </h3>
                      <Badge variant="secondary">{r.config.topic}</Badge>
                      <Badge variant="outline">{r.config.difficulty}</Badge>
                      <Badge variant="outline" className="uppercase">{r.config.questionType}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(r.takenAt).toLocaleString()} · {r.correctCount}/{r.total} correct
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text">{r.percentage}%</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(r.id)}
                      aria-label="Delete result"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
