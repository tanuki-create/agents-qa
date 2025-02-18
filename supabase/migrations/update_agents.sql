-- Add prompt_template column to agents table
ALTER TABLE agents
ADD COLUMN prompt_template TEXT,
ADD COLUMN chat_history JSONB[];

-- Add indexes for better performance
CREATE INDEX idx_questions_user_id ON questions(user_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_agents_specialization ON agents USING GIN(specialization);

-- Add trigger to update agent performance score
CREATE OR REPLACE FUNCTION update_agent_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agents
  SET performance_score = (
    SELECT AVG(score)
    FROM answers
    WHERE agent_id = NEW.agent_id
    AND created_at >= NOW() - INTERVAL '30 days'
  )
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_score
AFTER INSERT OR UPDATE ON answers
FOR EACH ROW
EXECUTE FUNCTION update_agent_score(); 