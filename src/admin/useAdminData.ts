import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Analytics, MusicRow, PRow, QRow, RRow } from './types'

export interface AdminData {
  analytics: Analytics[]
  questions: QRow[]
  proposals: PRow[]
  replies: RRow[]
  music: MusicRow | null
}

export function useAdminData() {
  const [data, setData] = useState<AdminData>({ analytics: [], questions: [], proposals: [], replies: [], music: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const sb = supabase
    if (!sb) return
    setLoading(true)
    setError('')
    const [a, q, p, r, m] = await Promise.all([
      sb.from('website_analytics').select('id,session_id,event_type,path,created_at').order('created_at', { ascending: false }).limit(5000),
      sb.from('question_responses').select('*').order('updated_at', { ascending: false }).limit(1500),
      sb.from('proposal_responses').select('*').order('updated_at', { ascending: false }).limit(1000),
      sb.from('personal_replies').select('*').order('created_at', { ascending: false }).limit(1000),
      sb.from('music_settings').select('enabled,file_path,file_name,fade_out_seconds,updated_at').eq('id', 1).maybeSingle(),
    ])
    const firstError = [a, q, p, r, m].find((x) => x.error)?.error
    if (firstError) setError(firstError.message)
    setData({
      analytics: (a.data ?? []) as Analytics[],
      questions: (q.data ?? []) as QRow[],
      proposals: (p.data ?? []) as PRow[],
      replies: (r.data ?? []) as RRow[],
      music: (m.data ?? null) as MusicRow | null,
    })
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])
  return { data, loading, error, reload }
}
