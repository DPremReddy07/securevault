'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useRole() {
  const [role, setRole] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role || 'viewer')
      setLoading(false)
    }
    getUser()
  }, [])

  return { user, role, loading }
}
