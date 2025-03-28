import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, TABLES } from './config/supabase';
import agentRoutes from './routes/agents';
import questionRoutes from './routes/questions';
import answerRoutes from './routes/answers';
import userRoutes from './routes/users';

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの作成
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

async function initializeApp() {
  try {
    console.log('🚀 Initializing QA System with LangGraph...');
    
    // APIルートの登録
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

    // サーバーの起動
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API available at http://localhost:${PORT}/api`);
      console.log('✅ QA System with LangGraph initialized and ready');
    });
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    process.exit(1);
  }
}

// アプリケーションを初期化
initializeApp().catch(error => {
  console.error('❌ Unhandled error during initialization:', error);
  process.exit(1);
}); 