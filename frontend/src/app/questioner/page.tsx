'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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

export default function QuestionerPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();
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
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setError('Failed to fetch questions. Please try again.');
      setQuestions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting || !userId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('📝 Submitting question for user:', userId);
      
      // Submit question
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
        console.error('❌ Failed to submit question:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to submit question');
      }

      const question = await questionResponse.json();
      console.log('✅ Question created:', question);

      // Generate answer
      console.log('🤖 Generating answer for question:', question.id);
      const answerResponse = await fetch('http://localhost:3001/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questionId: question.id,
          agentId: 'tech-agent'  // Using tech-agent as default
        }),
      });

      if (!answerResponse.ok) {
        const errorData = await answerResponse.json();
        console.error('❌ Failed to generate answer:', errorData);
        throw new Error(
          errorData.details || 
          errorData.error || 
          errorData.additionalDetails || 
          'Failed to generate answer'
        );
      }

      const answer = await answerResponse.json();
      console.log('✅ Answer generated:', answer);

      setNewQuestion('');
      fetchQuestions(userId);
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
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Ask a Question</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Type your question here..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Question'}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Your Questions</h2>
            {questions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-gray-500 text-center">
                No questions yet. Ask your first question above!
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
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

                  {question.answers?.map((answer) => (
                    <div key={answer.id} className="mt-4 pl-4 border-l-4 border-blue-200">
                      <p className="text-gray-700">{answer.content}</p>
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
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 