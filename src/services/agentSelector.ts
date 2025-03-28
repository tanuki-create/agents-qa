import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { supabase, TABLES } from '../config/supabase';

// 質問を分析して最適なエージェント専門分野を特定するためのプロンプト
const analyzeQuestionPrompt = PromptTemplate.fromTemplate(`
あなたは質問を分析し、最適な専門家を選択するシステムです。
以下の質問を分析し、最も適切な専門分野を1つ選んでください。また、この選択の信頼度（0-100の整数）も返してください。

質問: {question}

以下の専門分野の中から、1つだけ選んでください：
{specializations}

以下の形式で返してください：
専門分野: [専門分野]
信頼度: [0-100の整数]
`);

interface AnalysisResult {
  specialization: string;
  confidence: number;
}

/**
 * AIの出力をパースして専門分野と信頼度を抽出
 */
function parseAnalysisOutput(output: string): AnalysisResult {
  const specializationMatch = output.match(/専門分野:\s*(.+)/i);
  const confidenceMatch = output.match(/信頼度:\s*(\d+)/i);
  
  return {
    specialization: specializationMatch ? specializationMatch[1].trim() : "",
    confidence: confidenceMatch ? parseInt(confidenceMatch[1], 10) : 70 // デフォルト値として70を設定
  };
}

/**
 * 質問を分析して最適なエージェントを選択するサービス
 * @returns エージェントと信頼度のオブジェクト
 */
export async function selectBestAgent(question: string): Promise<{ selectedAgent: any, confidence: number }> {
  try {
    console.log('🧠 Analyzing question to select best agent...');
    
    // 登録済みのエージェント一覧を取得
    const { data: agents, error } = await supabase
      .from(TABLES.AGENTS)
      .select('*')
      .order('performance_score', { ascending: false });
    
    if (error || !agents || agents.length === 0) {
      console.error('❌ No agents found in the database or error:', error);
      return { selectedAgent: null, confidence: 0 };
    }
    
    // エージェントをPrismaライクのモデルに変換
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      specialization: agent.specialization || [],
      performanceScore: agent.performance_score,
      createdAt: agent.created_at
    }));
    
    // 専門分野を抽出
    const allSpecializations = new Set<string>();
    formattedAgents.forEach(agent => {
      if (Array.isArray(agent.specialization)) {
        agent.specialization.forEach(spec => allSpecializations.add(spec));
      }
    });
    
    const specializationList = Array.from(allSpecializations).join('、');
    
    // Google AIモデルの初期化
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY || '',
      model: "gemini-2.0-flash",
      maxOutputTokens: 256,
      temperature: 0.1 // 低い温度で決定的な回答を得る
    });
    
    // 質問分析チェーンの作成
    const analyzeChain = RunnableSequence.from([
      analyzeQuestionPrompt,
      model,
      new StringOutputParser()
    ]);
    
    // 質問を分析して専門分野を取得
    const analysisOutput = await analyzeChain.invoke({
      question,
      specializations: specializationList
    });
    
    // 分析結果をパース
    const { specialization, confidence } = parseAnalysisOutput(analysisOutput);
    console.log(`✅ Analyzed question. Recommended specialization: ${specialization} (confidence: ${confidence}%)`);
    
    // 専門分野に基づいてエージェントを選択
    // 同じ専門分野を持つエージェントがいる場合はパフォーマンススコアが高いものを優先
    const matchingAgents = formattedAgents.filter(agent => 
      Array.isArray(agent.specialization) && 
      agent.specialization.some(spec => 
        spec.toLowerCase() === specialization.trim().toLowerCase()
      )
    );
    
    if (matchingAgents.length > 0) {
      // パフォーマンススコアで並べ替え済みなので先頭のエージェントを選択
      return { selectedAgent: matchingAgents[0], confidence };
    }
    
    // 一致するエージェントがない場合は最もスコアの高い一般エージェントを選択
    const generalAgents = formattedAgents.filter(agent => 
      Array.isArray(agent.specialization) && 
      agent.specialization.some(spec => 
        spec.toLowerCase().includes('general') || 
        spec.toLowerCase().includes('一般')
      )
    );
    
    if (generalAgents.length > 0) {
      // 一般エージェントを選択する場合は信頼度を下げる
      return { selectedAgent: generalAgents[0], confidence: Math.min(confidence, 60) };
    }
    
    // それでも見つからなければ最初のエージェントを返す
    console.log('⚠️ No matching agent found, using default agent');
    return { selectedAgent: formattedAgents[0], confidence: Math.min(confidence, 50) };
    
  } catch (error) {
    console.error('❌ Error in agent selection:', error);
    return { selectedAgent: null, confidence: 0 };
  }
} 