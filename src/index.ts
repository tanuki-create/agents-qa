import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createQAAgent } from './agents/qaAgent';
import { supabase, TABLES } from './config/supabase';
import agentRoutes from './routes/agents';
import questionRoutes from './routes/questions';
import answerRoutes from './routes/answers';
import userRoutes from './routes/users';
import { QAAgent } from './types';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize QA Agent
let qaAgent: QAAgent;

async function initializeApp() {
  qaAgent = await createQAAgent(process.env.GOOGLE_API_KEY || '');

  // Register routes - order matters!
  app.use('/api/users', userRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/answers', answerRoutes);
  app.use('/api/agents', agentRoutes);

  // API Endpoints
  app.get('/api/questions/pending', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUESTIONS)
        .select(`
          *,
          answers (*)
        `)
        .eq('status', 'pending')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending questions' });
    }
  });

  app.post('/api/questions', async (req, res) => {
    try {
      const { content, userId } = req.body;
      
      const { data, error } = await supabase
        .from(TABLES.QUESTIONS)
        .insert({
          content,
          userId,
          status: 'pending',
          createdAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create question' });
    }
  });

  app.post('/api/answers', async (req, res) => {
    try {
      const { questionId, agentId } = req.body;
      
      // Get question details
      const { data: question } = await supabase
        .from(TABLES.QUESTIONS)
        .select('*')
        .eq('id', questionId)
        .single();

      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Run QA Agent
      const result = await qaAgent.invoke({
        question: question.content,
        context: ''
      });

      // Get the best answer (last one with score >= 80)
      const bestAnswer = result.answers[result.answers.length - 1];
      const score = result.currentScore;

      // Save answer to database
      const { data: answer, error } = await supabase
        .from(TABLES.ANSWERS)
        .insert({
          questionId,
          content: bestAnswer,
          score,
          agentId,
          createdAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update question status
      await supabase
        .from(TABLES.QUESTIONS)
        .update({ status: 'answered' })
        .eq('id', questionId);

      res.json(answer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate answer' });
    }
  });

  app.get('/api/questions/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { data, error } = await supabase
        .from(TABLES.QUESTIONS)
        .select(`
          *,
          answers (*)
        `)
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Start the application
initializeApp().catch(console.error); 