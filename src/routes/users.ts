import { Router } from 'express';
import { supabase, TABLES } from '../config/supabase';

const router = Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { name, role } = req.body;
    console.log('📝 Creating user:', { name, role }); // Debug log

    // Validate role
    if (!['questioner', 'answerer', 'admin'].includes(role)) {
      console.error('❌ Invalid role:', role);
      return res.status(400).json({ error: 'Invalid role. Must be one of: questioner, answerer, admin' });
    }
    
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert({
        name,
        role,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ User created:', data);
    res.json(data);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting user:', id);
    
    // First, get all questions for this user
    const { data: questions } = await supabase
      .from(TABLES.QUESTIONS)
      .select('id')
      .eq('user_id', id); // Changed from userId to user_id

    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      
      // Delete all answers for these questions
      await supabase
        .from(TABLES.ANSWERS)
        .delete()
        .in('question_id', questionIds); // Changed from questionId to question_id

      // Delete all questions
      await supabase
        .from(TABLES.QUESTIONS)
        .delete()
        .in('id', questionIds);
    }

    // Finally delete the user
    const { error } = await supabase
      .from(TABLES.USERS)
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log('✅ User deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router; 