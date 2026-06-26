import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Difficulty, InterviewConfig, QuestionType } from "@/lib/interview-types";

export const Route = createFileRoute("/test/setup")({
  head: () => ({
    meta: [
      { title: "New test — PrepAI" },
      { name: "description", content: "Configure your mock interview." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getSession()) navigate({ to: "/auth" });
  }, [navigate]);

  const [role, setRole] = useState("Software Engineer");
  const [company, setCompany] = useState("Google");
  const [topic, setTopic] = useState("Data Structures & Algorithms");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [timed, setTimed] = useState(true);
  const [minutes, setMinutes] = useState(10);

  const onStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !company.trim() || !topic.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    const config: InterviewConfig = {
      role: role.trim(),
      company: company.trim(),
      topic: topic.trim(),
      numQuestions,
      difficulty,
      questionType,
      timed,
      minutes,
    };
    sessionStorage.setItem("ai_interview_config", JSON.stringify(config));
    sessionStorage.removeItem("ai_interview_questions");
    navigate({ to: "/test/run" });
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 size-4" /> Back to dashboard
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold">Configure your <span className="gradient-text">mock interview</span></h1>
          <p className="mt-2 text-muted-foreground">Tell us what you're preparing for.</p>
        </div>

        <form onSubmit={onStart} className="glass-card mt-8 space-y-6 rounded-2xl p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target job role">
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend Engineer" required />
            </Field>
            <Field label="Target company">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Amazon" required />
            </Field>
          </div>

          <Field label="Interview topic">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. System Design, React, SQL" required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of questions">
              <Input
                type="number"
                min={1}
                max={25}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(25, Number(e.target.value) || 1)))}
              />
            </Field>
            <Field label="Difficulty">
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Question type">
            <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">MCQ (auto-graded)</SelectItem>
                <SelectItem value="technical">Technical (short answer)</SelectItem>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="hr">HR / Behavioral</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Timed mode</p>
                <p className="text-xs text-muted-foreground">Auto-submit when the timer ends.</p>
              </div>
              <Switch checked={timed} onCheckedChange={setTimed} />
            </div>
            {timed && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">Time limit (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full btn-gradient">
            <Sparkles className="mr-2 size-4" />
            Generate questions
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
