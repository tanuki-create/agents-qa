import { Router } from 'express';
import { supabase, TABLES } from '../config/supabase';

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
    
    // First, check if user exists
    const { data: user, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('👤 User data:', user);
    if (userError) {
      console.error('❌ User fetch error:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user) {
      console.log('⚠️ User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const { data, error } = await supabase
      .from(TABLES.QUESTIONS)
      .select(`
        *,
        answers (
          *,
          agent:agents (
            name,
            performance_score
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('📝 Questions data:', data);
    if (error) {
      console.error('❌ Questions fetch error:', error);
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('❌ General error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

export default router; 