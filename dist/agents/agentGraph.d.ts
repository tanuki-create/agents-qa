export declare const qaGraph: import("@langchain/langgraph").CompiledStateGraph<any, import("@langchain/langgraph").UpdateType<any> | Partial<any>, "__start__", any, any, import("@langchain/langgraph").StateDefinition>;
/**
 * 質問応答処理を実行する関数
 * @param questionId 質問ID
 * @param agentId エージェントID
 * @returns 処理結果
 */
export declare function runQAWorkflow(questionId: string, agentId: string): Promise<import("@langchain/langgraph").StateType<any>>;
