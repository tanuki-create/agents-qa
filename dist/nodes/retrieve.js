"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveQuestion = retrieveQuestion;
const supabase_1 = require("../config/supabase");
/**
 * 質問情報を取得するノード関数
 * @param state 現在の状態
 * @returns 更新された状態
 */
async function retrieveQuestion(state) {
    try {
        console.log('🔍 Retrieving question details...');
        // 質問IDがあればその情報を取得
        if (state.questionId) {
            const { data: question, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.QUESTIONS)
                .select('*')
                .eq('id', state.questionId)
                .single();
            if (error) {
                console.error('❌ Error retrieving question:', error);
                throw error;
            }
            if (question) {
                console.log('✅ Retrieved question:', question.content);
                // 質問内容がまだ設定されていない場合のみ設定
                if (!state.question) {
                    return {
                        ...state,
                        question: question.content
                    };
                }
            }
        }
        // state.questionが既に設定されている場合はそのまま返す
        return state;
    }
    catch (error) {
        console.error('❌ Error in retrieveQuestion node:', error);
        throw error;
    }
}
