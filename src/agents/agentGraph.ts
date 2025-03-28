import { StateGraph } from "@langchain/langgraph";
import { retrieveQuestion } from "../nodes/retrieve";
import { generateAnswer } from "../nodes/generate";
import { evaluateAnswer } from "../nodes/evaluate";
import { storeResult } from "../nodes/store";
import { searchContext } from "../nodes/searchContext";

// StateGraphの初期化（型キャストでエラーを回避）
const builder = new StateGraph({
  channels: {
    question: { value: (left: string, right: string) => right, default: () => "" },
    questionId: { value: (left: string, right: string) => right, default: () => "" },
    agentId: { value: (left: string, right: string) => right, default: () => "" },
    context: { value: (left: string, right: string) => right, default: () => "" },
    answers: { 
      value: (left: string[], right: string[]) => left.concat(right), 
      default: () => [] 
    },
    currentScore: { value: (left: number, right: number) => right, default: () => 0 },
    iterations: { value: (left: number, right: number) => right, default: () => 0 },
    finalAnswer: { value: (left: any, right: any) => right, default: () => null }
  }
} as any);

// ノードの追加（型キャストで型エラーを回避）
builder.addNode("retrieve" as any, retrieveQuestion);
builder.addNode("search" as any, searchContext);
builder.addNode("generate" as any, generateAnswer);
builder.addNode("evaluate" as any, evaluateAnswer);
builder.addNode("store" as any, storeResult);

// エッジの追加（型キャストで型エラーを回避）
builder.addEdge("__start__" as any, "retrieve" as any);
builder.addEdge("retrieve" as any, "search" as any);
builder.addEdge("search" as any, "generate" as any);
builder.addEdge("generate" as any, "evaluate" as any);

// 条件付きエッジの関数
function routeAfterEvaluation(state: any) {
  // スコアが80以上または3回以上の反復で終了して保存する
  if (state.currentScore >= 80 || state.iterations >= 3) {
    return "store";
  }
  // それ以外は再度生成
  return "generate";
}

// 条件付きエッジの追加（型キャストで型エラーを回避）
builder.addConditionalEdges(
  "evaluate" as any,
  routeAfterEvaluation as any,
  ["generate", "store"] as any
);

builder.addEdge("store" as any, "__end__" as any);

// グラフをコンパイル
export const qaGraph = builder.compile();

/**
 * 質問応答処理を実行する関数
 * @param questionId 質問ID
 * @param agentId エージェントID
 * @returns 処理結果
 */
export async function runQAWorkflow(questionId: string, agentId: string) {
  console.log('🚀 Running QA workflow...');
  
  // 初期状態を設定
  const input = {
    question: "",
    questionId,
    agentId,
    context: "",
    answers: [],
    currentScore: 0,
    iterations: 0,
    finalAnswer: null
  };
  
  try {
    // グラフを実行
    return await qaGraph.invoke(input as any);
  } catch (error) {
    console.error('❌ Error running QA workflow:', error);
    throw error;
  }
} 