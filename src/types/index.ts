export interface Question {
  id: string;
  content: string;
  userId: string;
  createdAt: Date;
  status: 'pending' | 'answered';
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  score: number;
  agentId: string;
  createdAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  specialization: string[];
  prompt_template: string;
  performance_score: number;
}

export interface User {
  id: string;
  name: string;
  role: 'questioner' | 'answerer';
}

export interface QAResult {
  answers: string[];
  currentScore: number;
  iterations: number;
}

export interface QAAgent {
  invoke(params: { question: string; context: string }): Promise<QAResult>;
} 