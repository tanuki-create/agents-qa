import { Router } from 'express';
import { supabase, TABLES } from '../config/supabase';
import { createQAAgent } from '../agents/qaAgent';

const router = Router();

// Initialize QA Agent
let qaAgentPromise: Promise<any>;
try {
  console.log('🤖 Initializing QA Agent...');
  qaAgentPromise = createQAAgent(process.env.GOOGLE_API_KEY || '');
  console.log('✅ QA Agent initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize QA Agent:', error);
  throw error;
}

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

    // Run QA Agent
    console.log('🤖 Running QA Agent...');
    const qaAgent = await qaAgentPromise;
    const result = await qaAgent.invoke({
      question: question.content,
      context: ''
    });

    console.log('✅ QA Agent result:', result);

    // Get the best answer
    const bestAnswer = result.answers[result.answers.length - 1];
    const score = result.currentScore;

    // Save answer to database
    console.log('💾 Saving answer to database...');
    const { data: answer, error: answerError } = await supabase
      .from(TABLES.ANSWERS)
      .insert({
        question_id: questionId,
        content: bestAnswer,
        score,
        agent_id: agentId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (answerError) {
      console.error('❌ Error saving answer:', {
        error: answerError,
        details: answerError.details,
        message: answerError.message
      });
      throw answerError;
    }

    console.log('✅ Answer saved:', answer);

    // Update question status
    console.log('📝 Updating question status...');
    const { error: updateError } = await supabase
      .from(TABLES.QUESTIONS)
      .update({ status: 'answered' })
      .eq('id', questionId);

    if (updateError) {
      console.error('❌ Error updating question status:', updateError);
      throw updateError;
    }

    console.log('✅ Question status updated');
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