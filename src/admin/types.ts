export interface Analytics { id: number; session_id: string; event_type: string; path: string | null; created_at: string }
export interface QRow { id: string; session_id: string; question_number: number; answer_text: string | null; answer_choice: 'yes' | 'no' | null; created_at: string; updated_at: string }
export interface PRow { id: string; session_id: string; no_attempts: number; no_attempt_times: string[]; final_choice: 'yes' | null; first_seen_at: string; final_at: string | null; updated_at: string }
export interface RRow { id: string; session_id: string; reply_text: string | null; status: 'submitted' | 'skipped'; created_at: string }
export interface MusicRow { enabled: boolean; file_path: string | null; file_name: string | null; fade_out_seconds: number; updated_at: string }

export const fmt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' }) : '—'
export const shortId = (s: string) => s.slice(0, 8)
