import { supabase } from './client';

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  language: string;
  level: string;
  topic: string | null;
  status: 'active' | 'completed' | 'archived';
  duration_seconds: number;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface TranscriptEntry {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ConversationWithTranscripts extends Conversation {
  transcript_entries: TranscriptEntry[];
}

// Use untyped supabase client for these operations since the generated types may be incomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  language: string,
  level: string
): Promise<Conversation | null> {
  const { data, error } = await db
    .from('conversations')
    .insert({
      user_id: userId,
      language,
      level,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data as Conversation;
}

/**
 * Get a conversation by ID with its transcripts
 */
export async function getConversationWithTranscripts(
  conversationId: string
): Promise<ConversationWithTranscripts | null> {
  const { data, error } = await db
    .from('conversations')
    .select(`
      *,
      transcript_entries (*)
    `)
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  if (!data) return null;

  // Sort transcripts by created_at
  const conversation = data as ConversationWithTranscripts;
  if (conversation.transcript_entries) {
    conversation.transcript_entries.sort(
      (a: TranscriptEntry, b: TranscriptEntry) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  return conversation;
}

/**
 * Add a transcript entry to a conversation
 */
export async function addTranscriptEntry(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<TranscriptEntry | null> {
  const { data, error } = await db
    .from('transcript_entries')
    .insert({
      conversation_id: conversationId,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding transcript entry:', error);
    return null;
  }

  return data as TranscriptEntry;
}

/**
 * Update conversation status and end time
 */
export async function endConversation(
  conversationId: string,
  durationSeconds?: number
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    status: 'completed',
    ended_at: new Date().toISOString(),
  };

  if (durationSeconds !== undefined) {
    updateData.duration_seconds = durationSeconds;
  }

  const { error } = await db
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId);

  if (error) {
    console.error('Error ending conversation:', error);
    return false;
  }

  return true;
}

/**
 * Update conversation title (usually auto-generated from first exchange)
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  const { error } = await db
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    return false;
  }

  return true;
}

/**
 * Get user's conversations list
 */
export async function getUserConversations(
  userId: string,
  limit = 20
): Promise<Conversation[]> {
  const { data, error } = await db
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return (data as Conversation[]) || [];
}

/**
 * Format transcript entries for context injection into agent
 */
export function formatTranscriptsForContext(transcripts: TranscriptEntry[]): string {
  if (transcripts.length === 0) return '';

  const formatted = transcripts
    .map((t) => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
    .join('\n');

  return formatted;
}
