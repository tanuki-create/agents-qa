import { supabase, TABLES } from './supabase';

// Prisma-like client adapter for Supabase
const prisma = {
  // User operations
  user: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', where.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  },
  
  // Question operations
  question: {
    findMany: async ({ 
      where, 
      orderBy, 
      include 
    }: { 
      where: any, 
      orderBy: any, 
      include?: any 
    }) => {
      let query = supabase.from(TABLES.QUESTIONS).select(`
        *,
        ${include?.answers ? `answers:${TABLES.ANSWERS} (
          id, 
          content, 
          score, 
          created_at, 
          agent_id, 
          ${include.answers.include?.agent ? `agent:${TABLES.AGENTS} (
            name, 
            performance_score
          )` : ''}
        )` : ''}
      `);
      
      // Apply filters
      if (where?.userId) {
        query = query.eq('user_id', where.userId);
      }
      
      // Apply ordering
      if (orderBy?.createdAt) {
        const direction = orderBy.createdAt === 'desc' ? { ascending: false } : { ascending: true };
        query = query.order('created_at', direction);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    
    create: async ({ data }: { data: any }) => {
      const { data: result, error } = await supabase
        .from(TABLES.QUESTIONS)
        .insert({
          content: data.content,
          user_id: data.userId,
          status: data.status || 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Format to match Prisma response format
      return {
        id: result.id,
        content: result.content,
        userId: result.user_id,
        status: result.status,
        createdAt: result.created_at
      };
    }
  },
  
  // Agent operations
  agent: {
    findMany: async ({ orderBy }: { orderBy?: any } = {}) => {
      let query = supabase.from(TABLES.AGENTS).select('*');
      
      // Apply ordering
      if (orderBy?.performanceScore) {
        const direction = orderBy.performanceScore === 'desc' ? { ascending: false } : { ascending: true };
        query = query.order('performance_score', direction);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format data to match Prisma model fields
      return (data || []).map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        specialization: agent.specialization || [],
        performanceScore: agent.performance_score,
        createdAt: agent.created_at
      }));
    },
    
    findUnique: async ({ where }: { where: { id: string } }) => {
      const { data, error } = await supabase
        .from(TABLES.AGENTS)
        .select('*')
        .eq('id', where.id)
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      // Format to match Prisma model fields
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        specialization: data.specialization || [],
        performanceScore: data.performance_score,
        createdAt: data.created_at
      };
    }
  }
};

export default prisma; 