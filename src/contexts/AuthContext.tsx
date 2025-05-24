import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import supabase from '../lib/supabase/client';

interface AuthContextType {
  user: { id: string; email: string } | null
  profile: { first_name?: string; last_name?: string; full_name?: string; email?: string } | null
  signOut: () => Promise<{ error: Error | null }>
  isConfigured: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null)
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email || "" })

        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", data.user.id)
          .single()

        setProfile(profileData || null)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: string, session: import('@supabase/supabase-js').Session | null) => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || "" })
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, signOut, isConfigured, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
