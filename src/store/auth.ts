import { create } from 'zustand'
import { User } from '../types'
import { supabase } from '../lib/supabase'

// Глобальный флаг инициализации, который сохраняется между перемонтированиями
let globalInitialized = false

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticating: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
  setInitialized: (value: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  isAuthenticating: false,
  initialized: globalInitialized,
  
  setInitialized: (value: boolean) => {
    globalInitialized = value
    set({ initialized: value })
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, isAuthenticating: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      if (!data.user) {
        throw new Error('Не удалось получить данные пользователя')
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      let loaded = false
      for (let i = 0; i < 5; i++) {
        await useAuthStore.getState().loadUser()
        const { user } = useAuthStore.getState()
        if (user) {
          loaded = true
          break
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      if (!loaded) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (userError && userError.code === 'PGRST116') {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || 'Пользователь',
              rating: 5.0,
              reviews_count: 0,
            })
            .select()
            .single()
          
          if (createError) throw createError
          set({ user: newUser as User, loading: false, isAuthenticating: false })
        } else if (user) {
          set({ user: user as User, loading: false, isAuthenticating: false })
        } else {
          throw new Error('Не удалось загрузить профиль пользователя')
        }
      }
    } catch (error) {
      set({ loading: false, isAuthenticating: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, fullName: string) => {
    set({ loading: true, isAuthenticating: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      
      if (data.user) {
        // Профиль пользователя создается автоматически через database trigger
        // Ждем немного, чтобы trigger успел выполниться
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Пытаемся загрузить пользователя несколько раз
        let loaded = false
        for (let i = 0; i < 10; i++) {
          await useAuthStore.getState().loadUser()
          
          const currentState = useAuthStore.getState()
          if (currentState.user) {
            loaded = true
            break
          }
          
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        const finalState = useAuthStore.getState()
        if (loaded && finalState.user) {
          set({ loading: false, isAuthenticating: false })
          if (!finalState.initialized) {
            globalInitialized = true
            set({ initialized: true })
          }
        } else {
          set({ loading: false, isAuthenticating: false })
          try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()
              
              if (userData) {
                set({ user: userData as User, loading: false, isAuthenticating: false })
                if (!globalInitialized) {
                  globalInitialized = true
                  set({ initialized: true })
                }
              }
            }
          } catch (err) {
            console.error('Final user load attempt failed:', err)
          }
        }
      } else {
        set({ loading: false, isAuthenticating: false })
      }
    } catch (error) {
      set({ loading: false, isAuthenticating: false })
      throw error
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      globalInitialized = false
      set({ user: null, loading: false, initialized: false })
    } catch (error) {
      console.error('Error during sign out:', error)
      globalInitialized = false
      set({ user: null, loading: false, initialized: false })
    }
  },

  loadUser: async () => {
    const currentState = get()
    if (currentState.user && !currentState.isAuthenticating) {
      return
    }
    
    if (currentState.loading && !currentState.isAuthenticating) {
      return
    }
    
    set({ loading: true })
    
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        set({ user: null, loading: false })
        return
      }

      if (!authUser) {
        set({ user: null, loading: false })
        return
      }

      let user = null
      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries && !user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!error && data) {
          user = data
          break
        }

        if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || 'Пользователь',
              rating: 5.0,
              reviews_count: 0,
            })
            .select()
            .single()

          if (!createError && newUser) {
            user = newUser
            break
          }
        }

        retries++
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (user) {
        set({ user: user as User, loading: false, isAuthenticating: false })
      } else {
        set({ user: null, loading: false, isAuthenticating: false })
      }
    } catch (error) {
      console.error('Unexpected error loading user:', error)
      set({ user: null, loading: false, isAuthenticating: false })
    }
  },
}))

let isInitialized = false
supabase.auth.onAuthStateChange(async (event, session) => {
  if (!isInitialized && event === 'INITIAL_SESSION') {
    isInitialized = true
    return
  }
  
  if (event === 'SIGNED_OUT') {
    globalInitialized = false
    useAuthStore.setState({ user: null, loading: false, isAuthenticating: false, initialized: false })
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    const currentState = useAuthStore.getState()
    if (!currentState.loading && !currentState.isAuthenticating && !currentState.user) {
      await useAuthStore.getState().loadUser()
    }
  }
})
