export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LandingScreen from '@/components/LandingScreen'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('users')
    .select('username, total_wins, best_wpm')
    .eq('id', user.id)
    .single()

  return <LandingScreen user={profile} />
}
