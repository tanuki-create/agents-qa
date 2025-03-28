# LangGraphを使用したQAシステムの実装

## 概要

既存のQAシステムをLangGraphを使用してより高度なAIエージェントワークフローに再構築します。LangGraphは複雑なAIワークフローの設計と実装に優れており、現在のシステムをより柔軟で拡張性の高いものに変換できます。

## LangGraphとは

LangGraphはLangChainのグラフベースの拡張機能で、複雑なAIワークフローを設計・実装するためのフレームワークです。以下の特徴があります：

- グラフベースのワークフロー定義
- 条件付きルーティング
- ツール統合
- ステート管理
- デプロイオプション（LangGraph Cloud）

## 実装計画

### 1. プロジェクト構造

```
src/
├── agents/
│   ├── qaAgent.ts        # LangGraph QAエージェント実装
│   └── agentGraph.ts     # メインのエージェントグラフ定義
├── config/
│   ├── supabase.ts       # 既存のSupabase設定
│   └── langGraph.ts      # LangGraph設定
├── routes/               # 既存のルート（一部修正）
├── services/             # 既存のサービス
├── types/                # 拡張された型定義
├── nodes/                # LangGraphノード関数
│   ├── retrieve.ts       # 情報検索ノード
│   ├── generate.ts       # 回答生成ノード
│   ├── evaluate.ts       # 回答評価ノード
│   └── store.ts          # データ保存ノード
├── index.ts              # メインアプリケーション
└── langgraph.json        # LangGraph設定ファイル
```

### 2. 主要コンポーネント

#### エージェントグラフ定義 (src/agents/agentGraph.ts)

```typescript
import { StateGraph } from "@langchain/langgraph";
import { MessagesAnnotation } from "@langchain/langgraph";
import { retrieveQuestion } from "../nodes/retrieve";
import { generateAnswer } from "../nodes/generate";
import { evaluateAnswer } from "../nodes/evaluate";
import { storeResult } from "../nodes/store";

// 状態定義
interface AgentState {
  question: string;
  questionId: string;
  agentId: string;
  context: string;
  answers: string[];
  currentScore: number;
  iterations: number;
  finalAnswer: string | null;
}

// グラフ定義
const workflow = new StateGraph<AgentState>({
  channels: {
    question: { value: "" },
    questionId: { value: "" },
    agentId: { value: "" },
    context: { value: "" },
    answers: { value: [] },
    currentScore: { value: 0 },
    iterations: { value: 0 },
    finalAnswer: { value: null }
  }
})
  // ノードの定義
  .addNode("retrieve", retrieveQuestion)
  .addNode("generate", generateAnswer)
  .addNode("evaluate", evaluateAnswer)
  .addNode("store", storeResult)
  
  // エッジの定義（フロー）
  .addEdge("__start__", "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", "evaluate")
  
  // 条件付きエッジ
  .addConditionalEdges(
    "evaluate",
    (state) => {
      // スコアが80以上または3回以上の反復で終了
      if (state.currentScore >= 80 || state.iterations >= 3) {
        return "store";
      }
      // それ以外は再度生成
      return "generate";
    },
    ["generate", "store"]
  )
  .addEdge("store", "__end__");

// グラフをコンパイル
export const qaGraph = workflow.compile();
```

#### 回答生成ノード (src/nodes/generate.ts)

```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const qaPrompt = PromptTemplate.fromTemplate(`
あなたは専門的なAIアシスタントです。以下の質問に対して、コンテキストに基づいて回答してください。
質問: {question}
コンテキスト: {context}
前回の回答: {previousAnswers}

包括的で正確な回答を提供してください。前回の回答が良ければ、それを基に改善してください。
回答:`);

export async function generateAnswer(state) {
  const model = new ChatGoogleGenerativeAI({ 
    apiKey: process.env.GOOGLE_API_KEY || '',
    modelName: "gemini-2.0-flash",
    maxOutputTokens: 2048,
    temperature: 0.7
  });

  const generateAnswerChain = RunnableSequence.from([
    qaPrompt,
    model,
    new StringOutputParser()
  ]);

  const answer = await generateAnswerChain.invoke({
    question: state.question,
    context: state.context,
    previousAnswers: state.answers.join("\n")
  });
  
  // 状態を更新
  state.answers.push(answer);
  state.iterations += 1;
  
  return state;
}
```

#### 回答評価ノード (src/nodes/evaluate.ts)

```typescript
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const scoringPrompt = PromptTemplate.fromTemplate(`
以下の質問と回答の組み合わせについて、0-100の尺度で正確性と完全性を評価してください：
質問: {question}
回答: {answer}

数値スコアのみを提供してください:
`);

export async function evaluateAnswer(state) {
  const model = new ChatGoogleGenerativeAI({ 
    apiKey: process.env.GOOGLE_API_KEY || '',
    modelName: "gemini-2.0-flash",
    maxOutputTokens: 2048,
    temperature: 0.3
  });

  const scoreAnswerChain = RunnableSequence.from([
    scoringPrompt,
    model,
    new StringOutputParser(),
    (text) => parseInt(text.trim())
  ]);

  const lastAnswer = state.answers[state.answers.length - 1];
  
  const score = await scoreAnswerChain.invoke({
    question: state.question,
    answer: lastAnswer
  });
  
  // 状態を更新
  state.currentScore = score;
  
  // スコアが十分高ければ最終回答として設定
  if (score >= 80 || state.iterations >= 3) {
    state.finalAnswer = lastAnswer;
  }
  
  return state;
}
```

#### データ保存ノード (src/nodes/store.ts)

```typescript
import { supabase, TABLES } from "../config/supabase";

export async function storeResult(state) {
  try {
    // 回答をデータベースに保存
    const { data: answer, error: answerError } = await supabase
      .from(TABLES.ANSWERS)
      .insert({
        question_id: state.questionId,
        content: state.finalAnswer,
        score: state.currentScore,
        agent_id: state.agentId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (answerError) {
      console.error('❌ Error saving answer:', answerError);
      throw answerError;
    }

    // 質問ステータスを更新
    const { error: updateError } = await supabase
      .from(TABLES.QUESTIONS)
      .update({ status: 'answered' })
      .eq('id', state.questionId);

    if (updateError) {
      console.error('❌ Error updating question status:', updateError);
      throw updateError;
    }
    
    console.log('✅ Answer saved and question status updated');
    
    // 状態変更なし
    return state;
  } catch (error) {
    console.error('❌ Error in store node:', error);
    throw error;
  }
}
```

### 3. APIエンドポイント修正 (src/routes/answers.ts)

```typescript
import { Router } from 'express';
import { supabase, TABLES } from '../config/supabase';
import { qaGraph } from '../agents/agentGraph';

const router = Router();

// Generate answer for a question
router.post('/', async (req, res) => {
  try {
    console.log('📝 Received answer request:', req.body);
    const { questionId, agentId } = req.body;

    if (!questionId || !agentId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Both questionId and agentId are required'
      });
    }

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from(TABLES.AGENTS)
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return res.status(404).json({
        error: 'Agent not found',
        details: 'The specified agent does not exist'
      });
    }

    // Get question details
    const { data: question, error: questionError } = await supabase
      .from(TABLES.QUESTIONS)
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return res.status(404).json({
        error: 'Question not found',
        details: 'The specified question does not exist'
      });
    }

    // Run LangGraph QA workflow
    const result = await qaGraph.invoke({
      question: question.content,
      questionId: questionId,
      agentId: agentId,
      context: '',
      answers: [],
      currentScore: 0,
      iterations: 0,
      finalAnswer: null
    });

    res.json({
      id: result.questionId,
      question_id: result.questionId,
      content: result.finalAnswer,
      score: result.currentScore,
      agent_id: result.agentId,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in answer generation:', error);
    res.status(500).json({ 
      error: 'Failed to generate answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

### 4. LangGraph設定ファイル (langgraph.json)

```json
{
  "node_version": "20",
  "dockerfile_lines": [],
  "dependencies": ["."],
  "graphs": {
    "qaAgent": "./src/agents/agentGraph.ts:qaGraph"
  },
  "env": ".env"
}
```

## 拡張機能

### 1. 検索ツールの統合

情報検索機能を強化するために、Webサーチツールを統合します：

```typescript
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

// ツール定義
const tools = [
  new TavilySearchResults({ maxResults: 3 }),
];

// ToolNodeの設定
import { ToolNode } from "@langchain/langgraph/prebuilt";
const searchNode = new ToolNode(tools);

// グラフに追加
workflow
  .addNode("search", searchNode)
  .addEdge("retrieve", "search")
  .addEdge("search", "generate");
```

### 2. エージェント選択の改善

質問に最適なエージェントを選択するプロセスも改善できます：

```typescript
// エージェント選択ノード
const selectAgentNode = async (state) => {
  const { question } = state;
  const agentId = await selectBestAgent(question); // 既存のservice関数
  return { ...state, agentId };
};

// グラフに追加
workflow
  .addNode("selectAgent", selectAgentNode)
  .addEdge("__start__", "selectAgent")
  .addEdge("selectAgent", "retrieve");
```

## メリット

1. **モジュール性**: 各処理ステップが独立したノードとして定義され、拡張・修正が容易
2. **フロー制御**: 条件付きエッジによる柔軟なワークフロー設計
3. **可視化**: LangGraph Studioを使用したワークフローの可視化
4. **スケーラビリティ**: 新しいノードやツールの追加が容易
5. **デプロイオプション**: LangGraph Cloudを使用した簡単なデプロイ

## 実装ステップ

1. 必要なパッケージのインストール:
   ```bash
   npm install @langchain/langgraph @langchain/core @langchain/google-genai
   ```

2. 新しいディレクトリ構造の作成
3. エージェントグラフとノードの実装
4. APIエンドポイントの更新
5. LangGraph設定ファイルの作成
6. テストとデバッグ
7. デプロイ（必要に応じてLangGraph Cloudを使用）

## まとめ

LangGraphを使用することで、現在のQAシステムをより柔軟で拡張性の高いものに変換できます。グラフベースのアプローチにより、複雑なAIワークフローを明示的に定義し、エージェントの挙動をより細かく制御できるようになります。また、将来的な機能追加も容易になり、システムの進化に合わせて拡張していくことができます。 