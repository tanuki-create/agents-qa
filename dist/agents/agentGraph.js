"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qaGraph = void 0;
exports.runQAWorkflow = runQAWorkflow;
const langgraph_1 = require("@langchain/langgraph");
const retrieve_1 = require("../nodes/retrieve");
const generate_1 = require("../nodes/generate");
const evaluate_1 = require("../nodes/evaluate");
const store_1 = require("../nodes/store");
const searchContext_1 = require("../nodes/searchContext");
// StateGraphの初期化（型キャストでエラーを回避）
const builder = new langgraph_1.StateGraph({
    channels: {
        question: { value: (left, right) => right, default: () => "" },
        questionId: { value: (left, right) => right, default: () => "" },
        agentId: { value: (left, right) => right, default: () => "" },
        context: { value: (left, right) => right, default: () => "" },
        answers: {
            value: (left, right) => left.concat(right),
            default: () => []
        },
        currentScore: { value: (left, right) => right, default: () => 0 },
        iterations: { value: (left, right) => right, default: () => 0 },
        finalAnswer: { value: (left, right) => right, default: () => null }
    }
});
// ノードの追加（型キャストで型エラーを回避）
builder.addNode("retrieve", retrieve_1.retrieveQuestion);
builder.addNode("search", searchContext_1.searchContext);
builder.addNode("generate", generate_1.generateAnswer);
builder.addNode("evaluate", evaluate_1.evaluateAnswer);
builder.addNode("store", store_1.storeResult);
// エッジの追加（型キャストで型エラーを回避）
builder.addEdge("__start__", "retrieve");
builder.addEdge("retrieve", "search");
builder.addEdge("search", "generate");
builder.addEdge("generate", "evaluate");
// 条件付きエッジの関数
function routeAfterEvaluation(state) {
    // スコアが80以上または3回以上の反復で終了して保存する
    if (state.currentScore >= 80 || state.iterations >= 3) {
        return "store";
    }
    // それ以外は再度生成
    return "generate";
}
// 条件付きエッジの追加（型キャストで型エラーを回避）
builder.addConditionalEdges("evaluate", routeAfterEvaluation, ["generate", "store"]);
builder.addEdge("store", "__end__");
// グラフをコンパイル
exports.qaGraph = builder.compile();
/**
 * 質問応答処理を実行する関数
 * @param questionId 質問ID
 * @param agentId エージェントID
 * @returns 処理結果
 */
async function runQAWorkflow(questionId, agentId) {
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
        return await exports.qaGraph.invoke(input);
    }
    catch (error) {
        console.error('❌ Error running QA workflow:', error);
        throw error;
    }
}
