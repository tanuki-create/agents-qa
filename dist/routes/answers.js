"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const agentGraph_1 = require("../agents/agentGraph");
const router = (0, express_1.Router)();
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
        const { data: agent, error: agentError } = await supabase_1.supabase
            .from(supabase_1.TABLES.AGENTS)
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
        const { data: question, error: questionError } = await supabase_1.supabase
            .from(supabase_1.TABLES.QUESTIONS)
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
        const result = await (0, agentGraph_1.runQAWorkflow)(questionId, agentId);
        console.log('✅ QA workflow result:', result);
        // Get the final answer from result
        const { data: answer } = await supabase_1.supabase
            .from(supabase_1.TABLES.ANSWERS)
            .select('*')
            .eq('question_id', questionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        console.log('✅ Answer retrieved:', answer);
        res.json(answer);
    }
    catch (error) {
        console.error('❌ Error in answer generation:', error);
        res.status(500).json({
            error: 'Failed to generate answer',
            details: error instanceof Error ? error.message : 'Unknown error',
            ...error?.details && { additionalDetails: error.details }
        });
    }
});
exports.default = router;
