import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Target, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrepAI — AI Interview Preparation" },
      {
        name: "description",
        content:
          "Land your dream job with AI-tailored mock interviews. Role, company & topic specific MCQ, technical, coding and HR practice.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    if (getSession()) navigate({ to: "/dashboard" });
  }, [navigate]);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Brain className="size-6 text-primary" />
          <span className="font-semibold">PrepAI</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" size="sm">Sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3 text-primary" />
          Powered by Lovable AI
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
          Ace your next interview with <span className="gradient-text">AI-tailored</span> practice
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Generate role, company and topic specific interview questions. MCQ, technical, coding and HR — all in one place.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="btn-gradient">Get started free</Button>
          </Link>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Target, title: "Targeted", desc: "Pick role, company, topic & difficulty." },
            { icon: Brain, title: "AI generated", desc: "Fresh questions every session." },
            { icon: Trophy, title: "Track progress", desc: "Review past scores & explanations." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 text-left">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
