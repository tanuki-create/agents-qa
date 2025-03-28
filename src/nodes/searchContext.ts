import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

/**
 * コンテキスト検索ノード関数
 * @param state 現在の状態
 * @returns 更新された状態（contextが追加される）
 */
export async function searchContext(state: any) {
  try {
    if (!state.question) {
      console.warn('⚠️ Question not found for search');
      return state;
    }
    
    console.log('🔍 Searching context for question:', state.question);

    // APIキーの確認
    if (!process.env.TAVILY_API_KEY) {
      console.error('❌ TAVILY_API_KEY not found in environment');
      throw new Error('TAVILY_API_KEY not found');
    }

    // Tavily検索ツールの初期化 - クエリパラメータは下部のinvokeで設定
    const search = new TavilySearchResults({
      apiKey: process.env.TAVILY_API_KEY,
      maxResults: 3
    });
    
    // 検索実行 - バージョン0.1.17では入力はオブジェクトでなく直接文字列で渡す
    const searchResults = await search.invoke(state.question);
    
    // 結果をコンテキストに変換
    const context = Array.isArray(searchResults) 
      ? searchResults
          .map((result: any, index: number) => (
            `[${index + 1}] ${result.title || 'No Title'}\n${result.content}\nSource: ${result.url}`
          ))
          .join('\n\n')
      : '';
    
    console.log('✅ Found context');
    
    return {
      ...state,
      context
    };
  } catch (error) {
    console.error('❌ Error in searchContext node:', error);
    // エラーが発生しても処理を続行
    return {
      ...state,
      context: "情報検索中にエラーが発生しました。既存の情報に基づいて回答を生成します。"
    };
  }
} 