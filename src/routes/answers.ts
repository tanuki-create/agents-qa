import { Router } from 'express';
import { supabase, TABLES } from '../config/supabase';
import { runQAWorkflow } from '../agents/agentGraph';

const router = Router();

// Generate answer for a question
router.post('/', async (req, res) => {
  try {
    console.log('📝 Received answer request:', req.body);
    const { questionId, agentId } = req.body;

    if (!questionId || !agentId) {
      console.error('❌ Missing required parameters:', { questionId, agentId });
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Both questionId and agentId are required'
      });
    }

    // Verify agent exists
    console.log('🔍 Verifying agent:', agentId);
    const { data: agent, error: agentError } = await supabase
      .from(TABLES.AGENTS)
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('❌ Agent not found:', agentError || 'No agent with this ID');
      return res.status(404).json({
        error: 'Agent not found',
        details: 'The specified agent does not exist'
      });
    }

    // Get question details
    console.log('🔍 Fetching question:', questionId);
    const { data: question, error: questionError } = await supabase
      .from(TABLES.QUESTIONS)
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      console.error('❌ Question not found:', questionError || 'No question with this ID');
      return res.status(404).json({
        error: 'Question not found',
        details: 'The specified question does not exist'
      });
    }

    console.log('✅ Found question:', question);

    // Run QA workflow using LangGraph
    console.log('🤖 Running QA workflow...');
    const result = await runQAWorkflow(questionId, agentId);

    console.log('✅ QA workflow result:', result);

    // Get the final answer from result
    const { data: answer } = await supabase
      .from(TABLES.ANSWERS)
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('✅ Answer retrieved:', answer);
    res.json(answer);
  } catch (error) {
    console.error('❌ Error in answer generation:', error);
    res.status(500).json({ 
      error: 'Failed to generate answer',
      details: error instanceof Error ? error.message : 'Unknown error',
      ...(error as any)?.details && { additionalDetails: (error as any).details }
    });
  }
});

export default router; 