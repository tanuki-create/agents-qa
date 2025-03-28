"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../config/supabase");
const router = (0, express_1.Router)();
// Get all agents
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from(supabase_1.TABLES.AGENTS)
            .select('*')
            .order('name');
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
});
// Create new agent
router.post('/', async (req, res) => {
    try {
        const { name, description, specialization, prompt_template } = req.body;
        const { data, error } = await supabase_1.supabase
            .from(supabase_1.TABLES.AGENTS)
            .insert({
            id: `agent-${Date.now()}`,
            name,
            description,
            specialization,
            prompt_template,
            performance_score: 0
        })
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create agent' });
    }
});
// Update agent
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, specialization, prompt_template } = req.body;
        const { data, error } = await supabase_1.supabase
            .from(supabase_1.TABLES.AGENTS)
            .update({
            name,
            description,
            specialization,
            prompt_template
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update agent' });
    }
});
// Delete agent
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase_1.supabase
            .from(supabase_1.TABLES.AGENTS)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete agent' });
    }
});
exports.default = router;
