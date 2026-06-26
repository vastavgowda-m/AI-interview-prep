import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createGroqProvider } from "./ai-gateway.server";
import type { InterviewQuestion, QuestionType } from "./interview-types";

const InputSchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  topic: z.string().min(1),
  numQuestions: z.number().int().min(1).max(25),
  difficulty: z.enum(["Easy","Medium","Hard"]),
  questionType: z.enum(["mcq","technical","coding","hr"]),
});

function extractJson(text: string) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (match ? match[1] : text).trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error("AI did not return a JSON array.\n" + text);
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function buildPrompt(input: z.infer<typeof InputSchema>) {
  return `
Generate ${input.numQuestions} unique ${input.difficulty} ${input.questionType} interview questions.

Role: ${input.role}
Company: ${input.company}
Topic: ${input.topic}

Rules:
- Every question must be unique.
- Never repeat or rephrase a question.
- Explanation must be one sentence.
- MCQ: exactly 4 options.
- Technical/Coding/HR: no options.
- Return ONLY a JSON array.

Example:
[
 {
   "question":"",
   "options":["","","",""],
   "correctAnswer":"",
   "explanation":""
 }
]
`;
}

export const generateQuestions = createServerFn({
  method: "POST",
})
.inputValidator((input)=>InputSchema.parse(input))
.handler(async ({data}): Promise<InterviewQuestion[]> => {

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  const gateway = createGroqProvider(apiKey);
  const model = gateway("llama-3.3-70b-versatile");

  console.time("AI");

  const { text } = await generateText({
    model,
    prompt: buildPrompt(data),
    maxOutputTokens: 800,
  });

  console.timeEnd("AI");

  const parsed = extractJson(text) as Array<{
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;

  const seen = new Set<string>();

  return parsed
    .filter(q=>{
      const key=q.question.trim().toLowerCase();
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0,data.numQuestions)
    .map((q,index)=>({
      id:index,
      type:data.questionType,
      question:q.question,
      options:data.questionType==="mcq"?q.options:undefined,
      correctAnswer:q.correctAnswer,
      explanation:q.explanation,
    }));
});
