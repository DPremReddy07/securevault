'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useRole() {
  const [role, setRole] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isTerminated, setIsTerminated] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_terminated')
        .eq('id', user.id)
        .single()

      setRole(profile?.role || 'viewer')
      setIsTerminated(profile?.is_terminated || false)
      setLoading(false)
    }
    getUser()
  }, [])

  return { user, role, loading, isTerminated }
}
