import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import RoomClient from './RoomClient'

interface Props {
  params: Promise<{ code: string }>
}

export default async function RoomPage({ params }: Props) {
  const { code } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()

  if (!room) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  return (
    <RoomClient
      room={room}
      userId={user.id}
      username={profile?.username ?? 'Anonymous'}
    />
  )
}
