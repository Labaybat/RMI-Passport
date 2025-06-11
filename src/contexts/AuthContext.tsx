import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import supabase from '../lib/supabase/client';

interface AuthContextType {
  user: { id: string; email: string } | null
  profile: { first_name?: string; last_name?: string; full_name?: string; email?: string; role?: string; status?: string } | null
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
        
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, role, status")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError.message)
        }

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
    );

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, []);
  useEffect(() => {
    // Check if environment variables are configured
    console.log("[AuthContext] Environment variables check:");
    console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL ? "SET" : "NOT SET");
    console.log("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "NOT SET");
    
    const isSupabaseConfigured = Boolean(
      import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_SUPABASE_URL.trim() !== '' &&
      import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== ''
    );
    console.log("[AuthContext] isSupabaseConfigured:", isSupabaseConfigured);
    
    // Force to true if we have valid-looking URLs
    const hasValidUrl = import.meta.env.VITE_SUPABASE_URL && 
                       import.meta.env.VITE_SUPABASE_URL.includes('supabase.co');
    const hasValidKey = import.meta.env.VITE_SUPABASE_ANON_KEY && 
                       import.meta.env.VITE_SUPABASE_ANON_KEY.length > 50;
    
    const finalConfigured = hasValidUrl && hasValidKey;
    console.log("[AuthContext] Final isConfigured decision:", finalConfigured);
    setIsConfigured(finalConfigured);
  }, []);

  useEffect(() => {
    // Fetch profile whenever user changes and is not null
    if (user) {
      (async () => {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, role, status")
          .eq("id", user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile (on user change):", profileError.message);
        }
        
        setProfile(profileData || null);
      })();
    }
  }, [user]);

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
