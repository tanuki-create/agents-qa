import { supabase, TABLES } from "../config/supabase";

/**
 * 最終回答をデータベースに保存するノード関数
 * @param state 現在の状態
 * @returns 更新された状態（変更なし）
 */
export async function storeResult(state: any) {
  try {
    console.log('💾 Storing final answer...');
    
    if (!state.finalAnswer) {
      console.warn('⚠️ No final answer to store');
      return state;
    }

    // 回答をデータベースに保存
    const { data: answer, error: answerError } = await supabase
      .from(TABLES.ANSWERS)
      .insert({
        question_id: state.questionId,
        content: state.finalAnswer,
        score: state.currentScore,
        agent_id: state.agentId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (answerError) {
      console.error('❌ Error saving answer:', answerError);
      throw answerError;
    }

    console.log('✅ Answer saved:', answer);

    // 質問ステータスを更新
    const { error: updateError } = await supabase
      .from(TABLES.QUESTIONS)
      .update({ status: 'answered' })
      .eq('id', state.questionId);

    if (updateError) {
      console.error('❌ Error updating question status:', updateError);
      throw updateError;
    }
    
    console.log('✅ Question status updated');
    
    // 状態変更なし
    return state;
  } catch (error) {
    console.error('❌ Error in storeResult node:', error);
    throw error;
  }
} 