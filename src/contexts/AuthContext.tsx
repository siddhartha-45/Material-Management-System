import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  currentSessionId: string | null
  signUp: (employeeId: string, email: string, password: string, role: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('AuthContext: Error getting session:', error)
        }
        
        if (mounted) {
          console.log('AuthContext: Initial session user:', session?.user?.email)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('AuthContext: Error in getInitialSession:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, session?.user?.email)
      
      if (mounted) {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
          
          // Log login if this is a sign in event
          if (event === 'SIGNED_IN') {
            await logUserLogin(session.user.id)
          }
        } else {
          setUserProfile(null)
          // Log logout if we have a current session
          if (currentSessionId && event === 'SIGNED_OUT') {
            await logUserLogout(currentSessionId)
            setCurrentSessionId(null)
          }
        }
        
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [currentSessionId])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching user profile for:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('AuthContext: Error fetching user profile:', error)
        // Don't throw error, just log it
        return
      }
      
      console.log('AuthContext: User profile fetched:', data)
      setUserProfile(data)
    } catch (error) {
      console.error('AuthContext: Error fetching user profile:', error)
    }
  }

  const logUserLogin = async (userId: string) => {
    try {
      if (!userProfile) return
      
      console.log('AuthContext: Logging user login for:', userId)
      
      const { data, error } = await supabase.rpc('log_user_login', {
        p_user_id: userId,
        p_role: userProfile.role,
        p_ip_address: null, // Could be enhanced to get real IP
        p_user_agent: navigator.userAgent
      })

      if (error) {
        console.error('AuthContext: Error logging login:', error)
      } else {
        console.log('AuthContext: Login logged with session ID:', data)
        setCurrentSessionId(data)
      }
    } catch (error) {
      console.error('AuthContext: Error logging login:', error)
    }
  }

  const logUserLogout = async (sessionId: string) => {
    try {
      console.log('AuthContext: Logging user logout for session:', sessionId)
      
      const { error } = await supabase.rpc('log_user_logout', {
        p_session_id: sessionId
      })

      if (error) {
        console.error('AuthContext: Error logging logout:', error)
      } else {
        console.log('AuthContext: Logout logged successfully')
      }
    } catch (error) {
      console.error('AuthContext: Error logging logout:', error)
    }
  }

  const signUp = async (employeeId: string, email: string, password: string, role: string) => {
    try {
      console.log('AuthContext: Starting signup for:', email, 'with role:', role)
      
      // First, check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email, employee_id')
        .or(`email.eq.${email},employee_id.eq.${employeeId}`)
        .single()

      if (existingUser) {
        const error = existingUser.email === email 
          ? new Error('An account with this email already exists')
          : new Error('An account with this employee ID already exists')
        console.error('AuthContext: User already exists:', error.message)
        return { error }
      }

      // Create auth user with email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            employee_id: employeeId,
            role: role
          }
        }
      })

      if (authError) {
        console.error('AuthContext: Auth signup error:', authError)
        return { error: authError }
      }

      console.log('AuthContext: Auth user created:', authData.user?.email)

      // Create user profile in custom users table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              employee_id: employeeId,
              role: role,
              email: email,
              password: password, 
              created_at: new Date().toISOString()
            }
          ])

        if (profileError) {
          console.error('AuthContext: Profile creation error:', profileError)
          
          // If profile creation fails, try to clean up the auth user
          try {
            await supabase.auth.admin.deleteUser(authData.user.id)
          } catch (cleanupError) {
            console.error('AuthContext: Failed to cleanup auth user:', cleanupError)
          }
          
          return { error: new Error(`Failed to create user profile: ${profileError.message}`) }
        } else {
          console.log('AuthContext: User profile created successfully')
        }
      }

      return { error: null }
    } catch (error) {
      console.error('AuthContext: SignUp error:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting signin for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        console.error('AuthContext: SignIn error:', error)
        return { error }
      }

      console.log('AuthContext: SignIn successful for:', data.user?.email)
      return { error: null }
    } catch (error) {
      console.error('AuthContext: SignIn error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting logout process...')
      
      // Log logout if we have a current session
      if (currentSessionId) {
        await logUserLogout(currentSessionId)
      }
      
      // Clear local state first
      setUser(null)
      setUserProfile(null)
      setCurrentSessionId(null)
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('AuthContext: Error signing out:', error)
        // Don't throw error, we've already cleared local state
      }
      
      console.log('AuthContext: Logout completed successfully')
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error)
      // Even if there's an error, ensure local state is cleared
      setUser(null)
      setUserProfile(null)
      setCurrentSessionId(null)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    currentSessionId,
    signUp,
    signIn,
    signOut,
  }

  console.log('AuthContext: Current state - user:', user?.email, 'loading:', loading, 'profile:', userProfile?.role)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}