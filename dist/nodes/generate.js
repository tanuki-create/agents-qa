"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnswer = generateAnswer;
const google_genai_1 = require("@langchain/google-genai");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const output_parsers_1 = require("@langchain/core/output_parsers");
const qaPrompt = prompts_1.PromptTemplate.fromTemplate(`
あなたは専門的なAIアシスタントです。以下の質問に対して、コンテキストに基づいて回答してください。
質問: {question}
コンテキスト: {context}
前回の回答: {previousAnswers}

包括的で正確な回答を提供してください。前回の回答が良ければ、それを基に改善してください。
回答:`);
/**
 * 回答を生成するノード関数
 * @param state 現在の状態
 * @returns 更新された状態（回答が追加される）
 */
async function generateAnswer(state) {
    try {
        console.log('🤖 Generating answer...');
        const model = new google_genai_1.ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY || '',
            model: "gemini-2.0-flash",
            maxOutputTokens: 2048,
            temperature: 0.7
        });
        const generateAnswerChain = runnables_1.RunnableSequence.from([
            qaPrompt,
            model,
            new output_parsers_1.StringOutputParser()
        ]);
        const answer = await generateAnswerChain.invoke({
            question: state.question,
            context: state.context || '',
            previousAnswers: state.answers.join("\n")
        });
        console.log('✅ Generated answer');
        // 状態を更新
        const answers = [...state.answers, answer];
        const iterations = state.iterations + 1;
        return {
            ...state,
            answers,
            iterations
        };
    }
    catch (error) {
        console.error('❌ Error in generateAnswer node:', error);
        throw error;
    }
}
