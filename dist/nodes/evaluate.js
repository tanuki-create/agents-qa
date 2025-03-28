"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAnswer = evaluateAnswer;
const google_genai_1 = require("@langchain/google-genai");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const output_parsers_1 = require("@langchain/core/output_parsers");
const scoringPrompt = prompts_1.PromptTemplate.fromTemplate(`
以下の質問と回答の組み合わせについて、0-100の尺度で正確性と完全性を評価してください：
質問: {question}
回答: {answer}

数値スコアのみを提供してください:
`);
/**
 * 回答の質を評価するノード関数
 * @param state 現在の状態
 * @returns 更新された状態（scoreとfinalAnswerが設定される可能性あり）
 */
async function evaluateAnswer(state) {
    try {
        console.log('🔍 Evaluating answer...');
        if (state.answers.length === 0) {
            console.warn('⚠️ No answers to evaluate');
            return state;
        }
        const model = new google_genai_1.ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY || '',
            model: "gemini-2.0-flash",
            maxOutputTokens: 2048,
            temperature: 0.3
        });
        const scoreAnswerChain = runnables_1.RunnableSequence.from([
            scoringPrompt,
            model,
            new output_parsers_1.StringOutputParser(),
            (text) => {
                try {
                    return parseInt(text.trim());
                }
                catch (e) {
                    console.error('❌ Failed to parse score:', text);
                    return 0;
                }
            }
        ]);
        const lastAnswer = state.answers[state.answers.length - 1];
        const score = await scoreAnswerChain.invoke({
            question: state.question,
            answer: lastAnswer
        });
        console.log(`✅ Evaluated answer with score: ${score}`);
        // 最終回答の設定
        let finalAnswer = null;
        if (score >= 80 || state.iterations >= 3) {
            finalAnswer = lastAnswer;
            console.log('✅ Final answer determined');
        }
        return {
            ...state,
            currentScore: score,
            finalAnswer
        };
    }
    catch (error) {
        console.error('❌ Error in evaluateAnswer node:', error);
        throw error;
    }
}
