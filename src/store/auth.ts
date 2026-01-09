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
      console.log('Starting sign in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      if (!data.user) {
        throw new Error('Не удалось получить данные пользователя')
      }
      
      console.log('User authenticated, loading profile...', data.user.id)
      
      // Пытаемся загрузить пользователя из базы с коротким таймаутом
      let user: User | null = null
      let userLoaded = false
      
      try {
        // Быстрая попытка загрузить пользователя (таймаут 3 секунды)
        const userPromise = supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 3000)
        })

        try {
          const result = await Promise.race([userPromise, timeoutPromise]) as any
          if (result.data && !result.error) {
            user = result.data as User
            userLoaded = true
            console.log('User loaded from database')
          } else if (result.error && result.error.code === 'PGRST116') {
            // Пользователя нет - это нормально, создадим ниже
            console.log('User not found in database, will create')
          }
        } catch (timeoutError: any) {
          console.log('Database query timeout, will try to create user')
        }
      } catch (dbError: any) {
        console.log('Database query error:', dbError.message)
      }

      // Если пользователь не загружен, пытаемся создать его с таймаутом
      if (!userLoaded) {
        console.log('Attempting to create user...')
        const createPromise = supabase
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
        
        const createTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Create timeout')), 2000) // Уменьшили до 2 секунд
        })

        try {
          const createResult = await Promise.race([createPromise, createTimeoutPromise]) as any
          
          if (createResult.data && !createResult.error) {
            user = createResult.data as User
            console.log('User created successfully')
          } else if (createResult.error && createResult.error.code === '23505') {
            // Пользователь уже существует - это нормально, используем fallback
            console.log('User already exists in database, will use fallback')
          }
        } catch (createTimeout: any) {
          console.log('Create user timeout (2s), will use fallback')
          // Не делаем ничего - просто переходим к fallback
        }
      }

      // Если все еще нет пользователя, создаем временный объект из auth данных
      // Это гарантирует, что авторизация всегда завершится успешно
      if (!user) {
        console.log('Creating fallback user from auth data')
        user = {
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || 'Пользователь',
          avatar_url: null,
          phone: null,
          rating: 5.0,
          reviews_count: 0,
          created_at: new Date().toISOString(),
        } as User
        console.log('Fallback user created:', user.id, user.email)
      }

      console.log('Setting user in store, sign in complete. User ID:', user.id)
      set({ user: user, loading: false, isAuthenticating: false })
      console.log('Store updated successfully')
    } catch (error: any) {
      console.error('Sign in failed:', error)
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
        // Ждем немного для создания профиля через trigger
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Загружаем пользователя напрямую из базы
        let userLoaded = false
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (!userError && userData) {
            set({ user: userData as User, loading: false, isAuthenticating: false })
            userLoaded = true
            break
          }
          
          // Если пользователя нет, создаем
          if (userError && userError.code === 'PGRST116') {
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email || '',
                full_name: fullName,
                rating: 5.0,
                reviews_count: 0,
              })
              .select()
              .single()
            
            if (!createError && newUser) {
              set({ user: newUser as User, loading: false, isAuthenticating: false })
              userLoaded = true
              break
            }
          }
          
          // Ждем перед следующей попыткой
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        
        if (!userLoaded) {
          throw new Error('Не удалось создать или загрузить профиль пользователя')
        }
      } else {
        set({ loading: false, isAuthenticating: false })
      }
    } catch (error: any) {
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
        set({ user: null, loading: false, isAuthenticating: false })
        return
      }

      if (!authUser) {
        set({ user: null, loading: false, isAuthenticating: false })
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
    } catch (error: any) {
      console.error('Unexpected error loading user:', error)
      // При любой ошибке устанавливаем loading в false
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
