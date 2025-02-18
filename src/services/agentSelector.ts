import { supabase, TABLES } from '../config/supabase';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

interface AgentScore {
  agentId: string;
  score: number;
}

const agentSelectionPrompt = PromptTemplate.fromTemplate(`
Analyze the following question and determine how well it matches each agent's specialization.
Rate each agent's suitability on a scale of 0-100.

Question: {question}

Agents and their specializations:
{agents}

For each agent, provide only a numerical score (0-100) indicating their suitability for this question.
Format: agentId:score
`);

export async function selectBestAgent(question: string): Promise<string> {
  // Get all agents
  const { data: agents } = await supabase
    .from(TABLES.AGENTS)
    .select('*');

  if (!agents || agents.length === 0) {
    throw new Error('No agents available');
  }

  const model = new ChatGoogleGenerativeAI({ 
    apiKey: process.env.GOOGLE_API_KEY || '',
    modelName: "gemini-pro",
    maxOutputTokens: 2048,
    temperature: 0.3
  });

  const agentDescriptions = agents
    .map(agent => `${agent.id}: ${agent.description}\nSpecializations: ${agent.specialization.join(', ')}`)
    .join('\n\n');

  const generateScores = RunnableSequence.from([
    agentSelectionPrompt,
    model,
    new StringOutputParser()
  ]);

  const scoresText = await generateScores.invoke({
    question,
    agents: agentDescriptions
  });

  // Parse scores
  const scores: AgentScore[] = scoresText
    .split('\n')
    .map(line => {
      const [agentId, score] = line.split(':');
      return {
        agentId: agentId.trim(),
        score: parseInt(score.trim())
      };
    })
    .filter(score => !isNaN(score.score));

  // Find agent with highest score
  const bestAgent = scores.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  );

  return bestAgent.agentId;
} 