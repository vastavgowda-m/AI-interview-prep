import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";
import { generateQuestions } from "@/lib/interview.functions";
import { saveResult } from "@/lib/results-store";
import type { InterviewConfig, InterviewQuestion, TestResult } from "@/lib/interview-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/test/run")({
  head: () => ({ meta: [{ title: "Test in progress — PrepAI" }] }),
  component: RunPage,
});

function loadConfig(): InterviewConfig | null {
  try {
    const raw = sessionStorage.getItem("ai_interview_config");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function RunPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const submittedRef = useRef(false);

  // Bootstrap
  useEffect(() => {
    if (!getSession()) {
      navigate({ to: "/auth" });
      return;
    }
    const c = loadConfig();
    if (!c) {
      navigate({ to: "/test/setup" });
      return;
    }
    setConfig(c);
    setSecondsLeft(c.minutes * 60);

    const cached = sessionStorage.getItem("ai_interview_questions");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as InterviewQuestion[];
        setQuestions(parsed);
        setAnswers(new Array(parsed.length).fill(""));
        setLoading(false);
        return;
      } catch {
        /* fall through */
      }
    }

    (async () => {
      try {
        const qs = await generateQuestions({
          data: {
            role: c.role,
            company: c.company,
            topic: c.topic,
            numQuestions: c.numQuestions,
            difficulty: c.difficulty,
            questionType: c.questionType,
          },
        });
        if (!qs.length) throw new Error("No questions generated");
        sessionStorage.setItem("ai_interview_questions", JSON.stringify(qs));
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(""));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate questions");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    if (!questions || !config) return;
    submittedRef.current = true;

    const session = getSession();
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }

    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const a = (answers[i] ?? "").trim();
      if (q.type === "mcq" && a && a === q.correctAnswer) correct++;
    }
    const total = questions.length;
    const isMcq = config.questionType === "mcq";
    const wrong = isMcq ? total - correct : 0;
    const percentage = isMcq && total > 0 ? Math.round((correct / total) * 100) : 0;

    const result: TestResult = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username: session.username,
      config,
      questions,
      answers,
      correctCount: correct,
      wrongCount: wrong,
      total,
      percentage,
      takenAt: Date.now(),
    };
    saveResult(result);
    sessionStorage.setItem("ai_interview_last_result", JSON.stringify(result));
    sessionStorage.removeItem("ai_interview_questions");
    navigate({ to: "/test/results" });
  }, [answers, config, questions, navigate]);

  // Timer
  useEffect(() => {
    if (!config?.timed || !questions || loading) return;
    if (secondsLeft <= 0) {
      toast.info("Time's up — submitting…");
      submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, config, questions, loading, submit]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <h2 className="text-lg font-semibold">Generating your interview…</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Our AI is crafting questions tailored to your role, company and topic.
          </p>
        </div>
      </main>
    );
  }

  if (error || !questions || !config) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card max-w-md rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold">Couldn't generate questions</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
          <Button className="mt-6 btn-gradient" onClick={() => navigate({ to: "/test/setup" })}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  const setAnswer = (val: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = val;
      return next;
    });
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="size-5 text-primary" />
            <span className="font-semibold">PrepAI</span>
          </div>
          {config.timed && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-sm">
              <Clock className="size-4 text-primary" />
              <span className="font-mono">{fmt(secondsLeft)}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <span>Question {current + 1} of {questions.length}</span>
          <Badge variant="outline" className="uppercase">{q.type}</Badge>
          <Badge variant="secondary">{config.difficulty}</Badge>
        </div>
        <Progress value={progress} className="mt-3" />

        <div className="glass-card mt-6 rounded-2xl p-6">
          <h2 className="text-lg font-medium leading-relaxed">{q.question}</h2>

          <div className="mt-6">
            {q.type === "mcq" && q.options ? (
              <RadioGroup value={answers[current] ?? ""} onValueChange={setAnswer} className="space-y-2">
                {q.options.map((opt, i) => {
                  const id = `opt-${current}-${i}`;
                  const selected = answers[current] === opt;
                  return (
                    <Label
                      key={id}
                      htmlFor={id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        selected ? "border-primary bg-accent/40" : "border-border hover:bg-accent/20"
                      }`}
                    >
                      <RadioGroupItem value={opt} id={id} className="mt-0.5" />
                      <span className="text-sm leading-relaxed">{opt}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
            ) : (
              <Textarea
                value={answers[current] ?? ""}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={q.type === "coding" ? "Write your code or pseudocode…" : "Type your answer…"}
                rows={q.type === "coding" ? 10 : 6}
                className={q.type === "coding" ? "font-mono" : ""}
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            <ArrowLeft className="mr-2 size-4" /> Previous
          </Button>

          {current < questions.length - 1 ? (
            <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="btn-gradient">
              Next <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button onClick={submit} className="btn-gradient">
              Submit test
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`size-8 rounded-md border text-xs font-medium transition ${
                i === current
                  ? "border-primary bg-primary text-primary-foreground"
                  : answers[i]
                    ? "border-primary/40 bg-accent/50"
                    : "border-border bg-card/40 hover:bg-accent/30"
              }`}
              aria-label={`Go to question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
