import { createGroq } from "@ai-sdk/groq";

export function createGroqProvider(apiKey: string) {
  return createGroq({
    apiKey,
  });
}
