'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon, BoltIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import MarkdownRenderer from '../../components/MarkdownRenderer';

interface User {
  id: string;
  name: string;
  role: 'questioner' | 'answerer' | 'admin';
  created_at: string;
}

interface Question {
  id: string;
  content: string;
  status: 'pending' | 'answered';
  created_at: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  content: string;
  score: number;
  created_at: string;
  agent?: {
    name: string;
    performance_score: number;
  };
}

interface Agent {
  id: string;
  name: string;
  description: string;
  specialization: string[];
  performance_score: number;
}

export default function QuestionerPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [useAutoMode, setUseAutoMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [waitingForAnswer, setWaitingForAnswer] = useState<string | null>(null);
  const [lastSubmittedQuestionId, setLastSubmittedQuestionId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeUser();
    return () => {
      // クリーンアップ：ポーリング停止
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const initializeUser = async () => {
    try {
      // Try to create a new user
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo User',
          role: 'questioner'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const user: User = await response.json();
      setUserId(user.id);
      console.log('✅ User created:', user);
      
      // Now fetch questions for this user
      fetchQuestions(user.id);
    } catch (error) {
      console.error('Failed to initialize user:', error);
      setError('Failed to initialize user. Please try again.');
    }
  };

  const fetchQuestions = async (id: string) => {
    try {
      console.log('🔍 Fetching questions for user:', id);
      const response = await fetch(`http://localhost:3001/api/questions/${id}`);
      const data = await response.json();
      
      // Check if the response is an error
      if (response.status === 404) {
        console.log('No questions found for user');
        setQuestions([]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      // Ensure data is an array
      const questionsArray = Array.isArray(data) ? data : [];
      setQuestions(questionsArray);
      
      // デバッグ用：現在の質問データをログ
      console.log('📊 Current questions:', questionsArray.length);
      
      // 回答待ちの質問があるかチェック
      if (lastSubmittedQuestionId) {
        console.log(`🔍 Checking if question ${lastSubmittedQuestionId} has an answer...`);
        
        const pendingQuestion = questionsArray.find(q => q.id === lastSubmittedQuestionId);
        
        if (!pendingQuestion) {
          // 質問が見つからない場合、ポーリングを停止
          console.log(`❓ Question ${lastSubmittedQuestionId} not found, stopping polling`);
          stopPolling();
          return;
        }
        
        // 回答があるかチェック（長さによる判定と空配列の場合を考慮）
        const hasAnswers = pendingQuestion.answers && 
                          Array.isArray(pendingQuestion.answers) && 
                          pendingQuestion.answers.length > 0;
                          
        console.log(`📝 Question ${lastSubmittedQuestionId} status:`, {
          status: pendingQuestion.status,
          hasAnswers,
          answerCount: hasAnswers ? pendingQuestion.answers.length : 0
        });
        
        if (hasAnswers || pendingQuestion.status === 'answered') {
          // 回答が完了した場合、ポーリングを停止
          console.log(`✅ Answer received for question ${lastSubmittedQuestionId}, stopping polling`);
          stopPolling();
        } else {
          // まだ回答がない場合、待機中の状態を維持
          console.log(`⏳ Still waiting for answer to question ${lastSubmittedQuestionId}`);
          setWaitingForAnswer(lastSubmittedQuestionId);
        }
      } else {
        // lastSubmittedQuestionIdがnullの場合は初期ロード時
        console.log('📋 Initial questions load or no pending question');
        
        // ポーリング状態をリセット（念のため）
        if (waitingForAnswer) {
          console.log('⚠️ Waiting state found without questionId, resetting');
          stopPolling();
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch questions:', error);
      setError('Failed to fetch questions. Please try again.');
      setQuestions([]);
      // エラー時もポーリングを停止
      stopPolling();
    }
  };

  // ポーリングを停止する関数
  const stopPolling = () => {
    console.log('🛑 Stopping polling');
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // 状態をリセット（setTimeout使用で非同期処理の問題を回避）
    setTimeout(() => {
      setWaitingForAnswer(null);
      setLastSubmittedQuestionId(null);
      console.log('🔄 Reset polling state complete, new question can be submitted');
    }, 0);
  };

  // 回答をポーリングする関数
  const startPollingForAnswer = (questionId: string) => {
    // 既存のポーリングがあれば停止
    stopPolling();
    
    // 新しいポーリングを開始
    console.log(`🔄 Starting polling for question ${questionId}`);
    setWaitingForAnswer(questionId);
    setLastSubmittedQuestionId(questionId);
    
    // 初回の即時チェック
    if (userId) {
      fetchQuestions(userId);
    }
    
    // 2秒ごとに回答をチェック（頻度を上げて即応性を向上）
    pollingIntervalRef.current = setInterval(() => {
      if (userId) {
        console.log(`🔄 Polling for answer to question ${questionId}...`);
        fetchQuestions(userId);
      } else {
        // userIdがない場合はポーリングを停止
        console.log('❌ No userId available, stopping polling');
        stopPolling();
      }
    }, 2000);
    
    // 念のため、30秒後にはポーリングを自動停止（安全策・短縮）
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        console.log('⏱️ Polling timeout reached (30s), stopping polling');
        stopPolling();
      }
    }, 30000);
  };

  // フォームとポーリング状態をすべてリセットする関数
  const resetAll = () => {
    stopPolling();
    setNewQuestion('');
    setSelectedAgent(null);
    setError(null);
    if (userId) {
      fetchQuestions(userId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting || !userId || waitingForAnswer) return;

    setIsSubmitting(true);
    setError(null);
    // 古い選択エージェント情報をクリア
    setSelectedAgent(null);

    try {
      console.log('📝 Submitting question for user:', userId);
      
      if (useAutoMode) {
        // 自動モードでは、エージェント選択と回答生成を自動的に行う
        const autoResponse = await fetch('http://localhost:3001/api/questions/auto-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: newQuestion, 
            userId: userId
          }),
        });

        if (!autoResponse.ok) {
          const errorData = await autoResponse.json();
          throw new Error(errorData.error || 'Failed to process auto-answer');
        }

        const result = await autoResponse.json();
        console.log('✅ Auto-answer initiated:', result);
        setSelectedAgent(result.selectedAgent || null);
        
        // フォームをリセット
        setNewQuestion('');
        
        // 回答ポーリングを開始
        startPollingForAnswer(result.questionId);
      } else {
        // 通常モードでは、質問を作成するだけ
        const questionResponse = await fetch('http://localhost:3001/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content: newQuestion, 
            user_id: userId
          }),
        });

        if (!questionResponse.ok) {
          const errorData = await questionResponse.json();
          throw new Error(errorData.error || 'Failed to submit question');
        }

        const result = await questionResponse.json();
        console.log('✅ Question created successfully:', result);
        
        // フォームをリセット
        setNewQuestion('');
        
        // 質問リストを更新（ポーリングなし）
        fetchQuestions(userId);
      }
    } catch (error) {
      console.error('❌ Error in submission:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          
          <button
            onClick={resetAll}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center"
            title="全ての状態をリセットして最初からやり直します"
          >
            <span className="mr-1">リセット</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Ask a Question</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {selectedAgent && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
              <BoltIcon className="w-5 h-5 mr-2" />
              Selected agent: <span className="font-bold ml-1">{selectedAgent.name}</span> - {selectedAgent.description}
            </div>
          )}
          
          {waitingForAnswer && (
            <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded flex items-center justify-between">
              <div className="flex items-center animate-pulse">
                <ClockIcon className="w-5 h-5 mr-2" />
                <span>回答を生成中です... 自動的に更新されます</span>
              </div>
              <button 
                onClick={() => stopPolling()} 
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                title="ポーリングを停止して新しい質問を入力できるようにします"
              >
                停止
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSubmitting || !!waitingForAnswer}
              />
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoMode"
                    checked={useAutoMode}
                    onChange={() => setUseAutoMode(!useAutoMode)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={!!waitingForAnswer}
                  />
                  <label htmlFor="autoMode" className="ml-2 block text-sm text-gray-700">
                    自動エージェント選択モード（AIが質問に最適なエージェントを選びます）
                  </label>
                </div>
                <div className="flex gap-2">
                  {waitingForAnswer && (
                    <button
                      type="button"
                      onClick={() => stopPolling()}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600"
                    >
                      キャンセル
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || !!waitingForAnswer || !newQuestion.trim()}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    {isSubmitting ? 'Submitting...' : waitingForAnswer ? '回答生成中...' : useAutoMode ? 'Submit & Auto-Answer' : 'Submit Question'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Your Questions</h2>
              <button
                onClick={() => {
                  if (userId) fetchQuestions(userId);
                }}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
              >
                <span className="mr-1">更新</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            {questions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-gray-500 text-center">
                No questions yet. Ask your first question above!
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.id} className={`bg-white rounded-lg shadow-md p-6 ${question.id === waitingForAnswer ? 'border-2 border-blue-300' : ''}`}>
                  <div className="mb-4">
                    <p className="text-lg text-gray-900">{question.content}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {new Date(question.created_at).toLocaleString()}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          question.status === 'answered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {question.status}
                      </span>
                    </div>
                  </div>

                  {question.answers?.length > 0 ? (
                    question.answers.map((answer) => (
                      <div key={answer.id} className="mt-4 pl-4 border-l-4 border-blue-200">
                        <MarkdownRenderer content={answer.content} />
                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            Score: {answer.score}
                          </span>
                          {answer.agent && (
                            <span className="text-sm text-gray-500">
                              Agent: {answer.agent.name}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(answer.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : question.id === waitingForAnswer ? (
                    <div className="mt-4 pl-4 border-l-4 border-blue-100">
                      <p className="text-gray-500 italic flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
                        回答を生成中...
                      </p>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
