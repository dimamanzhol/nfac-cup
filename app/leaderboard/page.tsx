export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: players } = await supabase
    .from('users')
    .select('username, total_wins, best_wpm, total_games')
    .order('best_wpm', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">LEADERBOARD</h1>
            <p className="text-[#555] text-sm mt-1">Top founders by WPM</p>
          </div>
          <Link href="/" className="text-[#555] text-sm hover:text-white transition-colors">← Back</Link>
        </div>

        <div className="space-y-2">
          {players?.map((p, i) => (
            <div
              key={p.username}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                i === 0 ? 'border-[#ffaa00] bg-[#ffaa0010]' :
                i === 1 ? 'border-[#aaaaaa] bg-[#aaaaaa08]' :
                i === 2 ? 'border-[#cd7f32] bg-[#cd7f3208]' :
                'border-[#222] bg-[#111]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[#555] text-sm w-5 text-right">{i + 1}</span>
                <span className="font-semibold text-white">@{p.username}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#666]">{p.total_wins} 🦄</span>
                <span className="text-white font-mono font-bold">{p.best_wpm} WPM</span>
              </div>
            </div>
          ))}
          {(!players || players.length === 0) && (
            <p className="text-center text-[#555] py-12">No founders yet. Be the first unicorn.</p>
          )}
        </div>
      </div>
    </div>
  )
}
