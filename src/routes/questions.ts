import { Router } from 'express';
import { supabase, TABLES } from '../config/supabase';
import { selectBestAgent } from '../services/agentSelector';
import express from 'express';
import prisma from '../config/db';
import { runQAWorkflow } from '../agents/agentGraph';

const router = Router();

// Get pending questions - specific route first
router.get('/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.QUESTIONS)
      .select(`
        *,
        answers (*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching pending questions:', error);
    res.status(500).json({ error: 'Failed to fetch pending questions' });
  }
});

// Create new question
router.post('/', async (req, res) => {
  try {
    const { content, user_id } = req.body;
    console.log('📝 Creating question:', { content, user_id });

    if (!content || !user_id) {
      return res.status(400).json({ error: 'Content and user_id are required' });
    }
    
    const { data, error } = await supabase
      .from(TABLES.QUESTIONS)
      .insert({
        content,
        user_id,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Question created:', data);
    res.json(data);
  } catch (error) {
    console.error('❌ Error creating question:', error);
    res.status(500).json({ 
      error: 'Failed to create question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all questions - add this before the /:userId route
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching all questions...');
    console.log('📊 Database connection status:', !!supabase);
    
    // First, test the database connection
    const { data: testData, error: testError } = await supabase
      .from(TABLES.QUESTIONS)
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test error:', testError);
      throw testError;
    }
    
    console.log('✅ Database connection successful');
    
    // Now try the full query
    const { data, error } = await supabase
      .from(TABLES.QUESTIONS)
      .select(`
        *,
        answers (
          id,
          content,
          score,
          created_at,
          agent_id,
          agent:agents (
            name,
            performance_score
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} questions with agent details`);
    console.log('📝 First question sample:', data?.[0]);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Error fetching all questions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown error',
      ...(error as any)?.details && { additionalDetails: (error as any).details }
    });
  }
});

// Get questions for a user - generic route last
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Fetching questions for user:', userId);
    
    // まずユーザーの存在確認
    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('❌ User not found or error:', userError);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // ユーザーの質問と回答を取得
    const { data: questions, error: questionsError } = await supabase
      .from(TABLES.QUESTIONS)
      .select(`
        *,
        answers (
          id,
          content,
          score,
          created_at,
          agent_id,
          agent:agents (
            name,
            performance_score
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (questionsError) {
      console.error('❌ Error fetching user questions:', questionsError);
      throw questionsError;
    }
    
    // TypeScriptの型に合わせてデータを変換
    const formattedQuestions = (questions || []).map(question => ({
      id: question.id,
      content: question.content,
      status: question.status,
      created_at: question.created_at,
      userId: question.user_id,
      answers: (question.answers || []).map(answer => ({
        id: answer.id,
        content: answer.content,
        score: answer.score,
        created_at: answer.created_at,
        agent: answer.agent ? {
          name: answer.agent.name,
          performance_score: answer.agent.performance_score
        } : undefined
      }))
    }));
    
    console.log(`✅ Successfully fetched ${formattedQuestions.length} questions for user ${userId}`);
    res.json(formattedQuestions);
  } catch (error) {
    console.error('❌ Error fetching questions for user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 質問を作成し、自動的に最適なエージェントを選択して回答を生成するエンドポイント
router.post('/auto-answer', async (req, res) => {
  try {
    const { content, userId } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Question content is required' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // ユーザーの存在確認
    const { data: userData, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('❌ User not found or error:', userError);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 質問の登録
    const { data: questionData, error: questionError } = await supabase
      .from(TABLES.QUESTIONS)
      .insert({
        content,
        user_id: userId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (questionError || !questionData) {
      console.error('❌ Error creating question:', questionError);
      throw questionError;
    }
    
    // 最適なエージェントを選択
    const { selectedAgent, confidence } = await selectBestAgent(content);
    
    if (!selectedAgent) {
      return res.status(500).json({ error: 'No suitable agent found for this question' });
    }
    
    console.log(`Selected agent ${selectedAgent.name} with confidence ${confidence}`);
    
    // 非同期で回答生成プロセスを開始
    // ※実際のレスポンスを待たずに処理を続行します
    runQAWorkflow(questionData.id, selectedAgent.id)
      .then((result) => {
        console.log(`Answer workflow completed for question ${questionData.id}`);
        console.log('Result:', result);
      })
      .catch((error) => {
        console.error(`Error running answer workflow for question ${questionData.id}:`, error);
      });
    
    // 即時レスポンスを返す
    res.status(202).json({
      message: 'Answer generation started',
      questionId: questionData.id,
      selectedAgent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        description: selectedAgent.description,
        specialization: selectedAgent.specialization,
        performance_score: selectedAgent.performanceScore
      }
    });
  } catch (error) {
    console.error('Error in auto-answer process:', error);
    res.status(500).json({ error: 'Failed to process auto-answer request' });
  }
});

export default router; 