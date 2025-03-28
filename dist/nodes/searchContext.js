"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchContext = searchContext;
const tavily_search_1 = require("@langchain/community/tools/tavily_search");
/**
 * コンテキスト検索ノード関数
 * @param state 現在の状態
 * @returns 更新された状態（contextが追加される）
 */
async function searchContext(state) {
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
        // Tavily検索を使用
        const search = new tavily_search_1.TavilySearchResults({
            apiKey: process.env.TAVILY_API_KEY,
            maxResults: 3
        });
        const searchResults = await search.invoke({
            query: state.question
        });
        // 結果をコンテキストに変換
        const context = searchResults.map((result, index) => (`[${index + 1}] ${result.title || 'No Title'}\n${result.content}\nSource: ${result.url}`)).join('\n\n');
        console.log('✅ Found context');
        return {
            ...state,
            context
        };
    }
    catch (error) {
        console.error('❌ Error in searchContext node:', error);
        throw error;
    }
}
