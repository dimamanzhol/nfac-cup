'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import Lobby from '@/components/Lobby'
import GameScreen from '@/components/GameScreen'
import WinnerScreen from '@/components/WinnerScreen'

interface Room {
  id: string
  code: string
  status: string
  host_id: string
  text: string | null
}

interface Player {
  id: string
  user_id: string
  name: string
  progress: number
  wpm: number
  eliminated: boolean
  is_host: boolean
  character_id: string | null
}

interface Props {
  room: Room
  userId: string
  username: string
}

export default function RoomClient({ room: initialRoom, userId, username }: Props) {
  const [room, setRoom] = useState<Room>(initialRoom)
  const [players, setPlayers] = useState<Player[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [winner, setWinner] = useState<Player | null>(null)
  const supabase = createClient()

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
    if (data) setPlayers(data)
  }, [supabase, room.id])

  // Auto-join room on mount
  useEffect(() => {
    async function autoJoin() {
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        await supabase.from('players').insert({
          room_id: room.id,
          user_id: userId,
          name: username,
          is_host: room.host_id === userId,
        })
      }
      fetchPlayers()
    }
    autoJoin()
  }, [room.id, room.host_id, userId, username, supabase, fetchPlayers])

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase.channel(`room:${room.id}`)

    ch
      .on('broadcast', { event: 'game_started' }, ({ payload }) => {
        setRoom((r) => ({ ...r, status: 'playing', text: payload.text }))
        fetchPlayers()
      })
      .on('broadcast', { event: 'progress_update' }, ({ payload }) => {
        setPlayers((prev) =>
          prev.map((p) =>
            p.user_id === payload.user_id
              ? { ...p, progress: payload.progress, wpm: payload.wpm, character_id: payload.character_id ?? p.character_id }
              : p
          )
        )
      })
      .on('broadcast', { event: 'player_eliminated' }, ({ payload }) => {
        setPlayers((prev) =>
          prev.map((p) => (p.user_id === payload.user_id ? { ...p, eliminated: true } : p))
        )
      })
      .on('broadcast', { event: 'game_over' }, ({ payload }) => {
        setRoom((r) => ({ ...r, status: 'finished' }))
        setWinner(payload.winner)
      })
      .on('broadcast', { event: 'character_selected' }, ({ payload }) => {
        setPlayers((prev) =>
          prev.map((p) =>
            p.user_id === payload.user_id ? { ...p, character_id: payload.character_id } : p
          )
        )
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, () => {
        fetchPlayers()
      })
      .subscribe()

    setChannel(ch)
    return () => { supabase.removeChannel(ch) }
  }, [room.id, supabase, fetchPlayers])

  if (room.status === 'finished' && winner) {
    return <WinnerScreen winner={winner} players={players} roomId={room.id} userId={userId} />
  }

  if (room.status === 'playing' && room.text) {
    return (
      <GameScreen
        room={room}
        players={players}
        userId={userId}
        channel={channel}
        onGameOver={(w) => {
          setRoom((r) => ({ ...r, status: 'finished' }))
          setWinner(w)
        }}
        setPlayers={setPlayers}
      />
    )
  }

  return (
    <Lobby
      room={room}
      players={players}
      userId={userId}
      channel={channel}
      onGameStart={(text) => setRoom((r) => ({ ...r, status: 'playing', text }))}
      setPlayers={setPlayers}
    />
  )
}
