'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Agent {
  id: string;
  name: string;
  description: string;
  specialization: string[];
  prompt_template: string;
  performance_score: number;
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
  agent: {
    name: string;
    performance_score: number;
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'questions'>('questions');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchQuestions();
  }, []);

  const fetchAgents = async () => {
    try {
      console.log('🔍 Fetching agents...');
      const response = await fetch('http://localhost:3001/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      console.log('✅ Agents fetched:', data);
      setAgents(data);
    } catch (error) {
      console.error('❌ Failed to fetch agents:', error);
      setError('Failed to fetch agents. Please try again.');
    }
  };

  const fetchQuestions = async () => {
    try {
      console.log('🔍 Fetching all questions...');
      const response = await fetch('http://localhost:3001/api/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      console.log('✅ Questions fetched:', data);
      setQuestions(data);
    } catch (error) {
      console.error('❌ Failed to fetch questions:', error);
      setError('Failed to fetch questions. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/agents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }
      fetchAgents();
    } catch (error) {
      console.error('❌ Failed to delete agent:', error);
      setError('Failed to delete agent. Please try again.');
    }
  };

  const handleAnswer = async (questionId: string, agentId: string) => {
    try {
      console.log('🤖 Generating answer...', { questionId, agentId });
      const response = await fetch('http://localhost:3001/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, agentId }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate answer');
      }
      console.log('✅ Answer generated');
      fetchQuestions();
    } catch (error) {
      console.error('❌ Failed to generate answer:', error);
      setError('Failed to generate answer. Please try again.');
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

        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'questions'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Questions
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'agents'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Manage Agents
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {activeTab === 'questions' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Questions & Answers</h2>
              {questions.map((question) => (
                <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="mb-4">
                    <p className="text-lg text-gray-900">{question.content}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {new Date(question.created_at).toLocaleString()}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        question.status === 'answered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {question.status}
                      </span>
                    </div>
                  </div>

                  {question.answers && question.answers.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      <h3 className="text-md font-semibold text-gray-700">Answers:</h3>
                      {question.answers.map((answer) => (
                        <div key={answer.id} className="pl-4 border-l-4 border-blue-200 bg-blue-50 p-4 rounded-r-lg">
                          <p className="text-gray-700">{answer.content}</p>
                          <div className="mt-2 flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                              Score: {answer.score}
                            </span>
                            <span className="text-sm text-gray-500">
                              Agent: {answer.agent?.name || 'Unknown'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(answer.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : question.status === 'pending' ? (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Agent to Answer:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {agents.map((agent) => (
                          <button
                            key={agent.id}
                            onClick={() => handleAnswer(question.id, agent.id)}
                            className="bg-white border border-gray-300 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all text-left"
                          >
                            <div className="font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500">Score: {agent.performance_score.toFixed(1)}%</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    setEditingAgent(null);
                    setIsModalOpen(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
                >
                  <PlusIcon className="w-5 h-5" />
                  New Agent
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">{agent.name}</h2>
                        <p className="text-gray-600 text-sm mt-1">
                          Performance: {agent.performance_score.toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAgent(agent);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{agent.description}</p>

                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.specialization.map((spec, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Prompt Template
                      </h3>
                      <pre className="bg-gray-50 p-3 rounded text-sm text-gray-700 overflow-x-auto">
                        {agent.prompt_template}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {isModalOpen && (
          <AgentModal
            agent={editingAgent}
            onClose={() => setIsModalOpen(false)}
            onSave={async (data) => {
              try {
                const method = editingAgent ? 'PUT' : 'POST';
                const url = editingAgent
                  ? `http://localhost:3001/api/agents/${editingAgent.id}`
                  : 'http://localhost:3001/api/agents';

                const response = await fetch(url, {
                  method,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(data),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to save agent');
                }

                setIsModalOpen(false);
                fetchAgents();
              } catch (error) {
                console.error('❌ Failed to save agent:', error);
                setError('Failed to save agent. Please try again.');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function AgentModal({
  agent,
  onClose,
  onSave,
}: {
  agent: Agent | null;
  onClose: () => void;
  onSave: (data: Omit<Agent, 'id' | 'performance_score'>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    description: agent?.description || '',
    specialization: agent?.specialization.join(', ') || '',
    prompt_template: agent?.prompt_template || '',
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-6">
          {agent ? 'Edit Agent' : 'New Agent'}
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSave({
              name: formData.name,
              description: formData.description,
              specialization: formData.specialization
                .split(',')
                .map((s) => s.trim()),
              prompt_template: formData.prompt_template,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specializations (comma-separated)
            </label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Template
            </label>
            <textarea
              value={formData.prompt_template}
              onChange={(e) =>
                setFormData({ ...formData, prompt_template: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono"
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 