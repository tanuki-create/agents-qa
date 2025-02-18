import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { QAAgent, QAResult } from '../types';

const qaPrompt = PromptTemplate.fromTemplate(`
You are an expert AI assistant. Answer the following question based on the context provided.
Question: {question}
Context: {context}
Previous answers: {answers}

Provide a comprehensive and accurate answer. If the previous answers are good, you can build upon them.
Answer:`);

const scoringPrompt = PromptTemplate.fromTemplate(`
Rate the following answer for accuracy and completeness on a scale of 0-100:
Question: {question}
Answer: {answer}

Provide only the numerical score:
`);

export async function createQAAgent(apiKey: string): Promise<QAAgent> {
  const model = new ChatGoogleGenerativeAI({ 
    apiKey: apiKey,
    modelName: "gemini-pro",
    maxOutputTokens: 2048,
    temperature: 0.7
  });

  const generateAnswer = RunnableSequence.from([
    qaPrompt,
    model,
    new StringOutputParser()
  ]);

  const scoreAnswer = RunnableSequence.from([
    scoringPrompt,
    model,
    new StringOutputParser(),
    (text) => parseInt(text.trim())
  ]);

  return {
    async invoke(params: { question: string; context: string }): Promise<QAResult> {
      const state = {
        answers: [] as string[],
        currentScore: 0,
        iterations: 0
      };

      while (state.iterations < 3) {
        // Generate answer
        const answer = await generateAnswer.invoke({
          question: params.question,
          context: params.context,
          answers: state.answers.join("\n")
        });
        
        state.answers.push(answer);

        // Score answer
        const score = await scoreAnswer.invoke({
          question: params.question,
          answer: answer
        });

        state.currentScore = score;
        state.iterations += 1;

        // Check if score is good enough
        if (score >= 80) {
          break;
        }
      }

      return state;
    }
  };
} 