export type QuestionType = "mcq" | "technical" | "coding" | "hr";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface InterviewConfig {
  role: string;
  company: string;
  topic: string;
  numQuestions: number;
  difficulty: Difficulty;
  questionType: QuestionType;
  timed: boolean;
  minutes: number;
}

export interface InterviewQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[]; // for MCQ
  correctAnswer: string; // for MCQ, the option text. For others, an ideal answer
  explanation: string;
}

export interface TestResult {
  id: string;
  username: string;
  config: InterviewConfig;
  questions: InterviewQuestion[];
  answers: string[]; // user's answers, same index
  correctCount: number;
  wrongCount: number;
  total: number;
  percentage: number;
  takenAt: number;
}
