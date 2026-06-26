import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, RotateCcw, Sparkles, X } from "lucide-react";
import type { TestResult } from "@/lib/interview-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/test/results")({
  head: () => ({ meta: [{ title: "Results — PrepAI" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ai_interview_last_result");
      if (!raw) {
        navigate({ to: "/dashboard" });
        return;
      }
      setResult(JSON.parse(raw));
    } catch {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  if (!result) return null;

  const isMcq = result.config.questionType === "mcq";

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 size-4" /> Back to dashboard
        </Link>

        <div className="glass-card mt-6 rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Your score</p>
          <p className="mt-2 text-6xl font-bold gradient-text">{result.percentage}%</p>
          <p className="mt-2 text-muted-foreground">
            {result.config.role} @ {result.config.company} · {result.config.topic}
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
            <Stat label="Total" value={result.total} />
            {isMcq ? (
              <>
                <Stat label="Correct" value={result.correctCount} accent="success" />
                <Stat label="Wrong" value={result.wrongCount} accent="destructive" />
              </>
            ) : (
              <>
                <Stat label="Answered" value={result.answers.filter((a) => a.trim()).length} />
                <Stat label="Skipped" value={result.answers.filter((a) => !a.trim()).length} />
              </>
            )}
          </div>

          {!isMcq && (
            <p className="mt-6 text-xs text-muted-foreground">
              Open-ended answers aren't auto-graded — compare your answer with the AI's reference below.
            </p>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate({ to: "/test/setup" })} className="btn-gradient">
              <RotateCcw className="mr-2 size-4" /> Take another test
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Back to dashboard
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Detailed review</h2>
          <div className="space-y-4">
            {result.questions.map((q, i) => {
              const userAns = (result.answers[i] ?? "").trim();
              const isCorrect = isMcq && userAns === q.correctAnswer;
              return (
                <div key={q.id} className="glass-card rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Q{i + 1}</span>
                      <Badge variant="outline" className="uppercase">{q.type}</Badge>
                    </div>
                    {isMcq && (
                      <Badge
                        className={
                          isCorrect
                            ? "bg-[color:var(--success)] text-[color:var(--success-foreground)]"
                            : "bg-[color:var(--destructive)] text-[color:var(--destructive-foreground)]"
                        }
                      >
                        {isCorrect ? (
                          <><Check className="mr-1 size-3" /> Correct</>
                        ) : (
                          <><X className="mr-1 size-3" /> Wrong</>
                        )}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-3 font-medium">{q.question}</p>

                  {isMcq && q.options && (
                    <div className="mt-4 space-y-2">
                      {q.options.map((opt) => {
                        const isUser = opt === userAns;
                        const isRight = opt === q.correctAnswer;
                        return (
                          <div
                            key={opt}
                            className={`rounded-lg border p-3 text-sm ${
                              isRight
                                ? "border-[color:var(--success)]/50 bg-[color:var(--success)]/10"
                                : isUser
                                  ? "border-[color:var(--destructive)]/50 bg-[color:var(--destructive)]/10"
                                  : "border-border bg-card/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{opt}</span>
                              <div className="flex gap-1">
                                {isUser && <Badge variant="outline" className="text-[10px]">Your answer</Badge>}
                                {isRight && <Badge className="bg-[color:var(--success)] text-[color:var(--success-foreground)] text-[10px]">Correct</Badge>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!isMcq && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Your answer</p>
                        <p className="mt-1 whitespace-pre-wrap rounded-lg border border-border bg-card/40 p-3 text-sm">
                          {userAns || <span className="text-muted-foreground italic">— skipped —</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference answer</p>
                        <p className="mt-1 whitespace-pre-wrap rounded-lg border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 p-3 text-sm">
                          {q.correctAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {isMcq && !isCorrect && (
                    <p className="mt-3 text-sm">
                      <span className="text-muted-foreground">Correct answer: </span>
                      <span className="font-medium">{q.correctAnswer}</span>
                    </p>
                  )}

                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p><span className="font-medium">AI explanation: </span>{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success" | "destructive";
}) {
  const color =
    accent === "success"
      ? "text-[color:var(--success)]"
      : accent === "destructive"
        ? "text-[color:var(--destructive)]"
        : "";
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
