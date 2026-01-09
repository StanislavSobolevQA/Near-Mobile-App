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
      
      // Ждем, чтобы сессия полностью сохранилась в AsyncStorage
      // Это необходимо для RLS политик, которые проверяют auth.uid()
      console.log('Waiting for session to persist...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Используем вспомогательную функцию с таймаутом
      const user = await loadUserFromDatabase(data.user.id)
      
      if (user) {
        // Пользователь найден в БД
        set({ user: user as User, loading: false, isAuthenticating: false })
        console.log('Sign in complete, user loaded:', user.email)
        return
      }
      
      // Пользователя нет в БД - создаем нового
      console.log('User not found in database, creating new user...')
      
      try {
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
        
        const createTimeout = new Promise<any>((_, reject) => {
          setTimeout(() => reject(new Error('Create user timeout (5s)')), 5000)
        })
        
        const createResult = await Promise.race([createPromise, createTimeout])
        const { data: newUser, error: createError } = createResult

        if (!createError && newUser) {
          set({ user: newUser as User, loading: false, isAuthenticating: false })
          console.log('Sign in complete, user created:', newUser.email)
          return
        }
        
        if (createError && createError.code === '23505') {
          // Пользователь уже существует (race condition) - загружаем его
          console.log('User already exists (race condition), loading from database...')
          const existingUser = await loadUserFromDatabase(data.user.id)
          
          if (existingUser) {
            set({ user: existingUser as User, loading: false, isAuthenticating: false })
            console.log('Sign in complete, user loaded after race condition:', existingUser.email)
            return
          }
          
          console.error('Failed to load user after race condition')
          throw new Error('Не удалось загрузить профиль пользователя')
        }
        
        console.error('Failed to create user:', createError)
        throw createError || new Error('Не удалось создать профиль пользователя')
      } catch (err: any) {
        console.error('Error creating user:', err.message)
        throw new Error('Не удалось создать профиль пользователя')
      }
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
      console.log('loadUser: User already loaded, skipping')
      return
    }
    
    if (currentState.loading && !currentState.isAuthenticating) {
      console.log('loadUser: Already loading, skipping')
      return
    }
    
    console.log('loadUser: Starting...')
    set({ loading: true })
    
    try {
      console.log('loadUser: Getting session...')
      
      // Добавляем таймаут для getSession(), так как он тоже может зависнуть
      const getSessionPromise = supabase.auth.getSession()
      const sessionTimeout = new Promise<any>((_, reject) => {
        setTimeout(() => reject(new Error('getSession timeout (3s)')), 3000)
      })
      
      let session: any = null
      let sessionError: any = null
      
      try {
        const result = await Promise.race([getSessionPromise, sessionTimeout]) as any
        session = result.data?.session
        sessionError = result.error
        console.log('loadUser: getSession() completed. Error:', sessionError?.code, 'Session:', session ? 'Yes' : 'No')
      } catch (timeoutErr: any) {
        console.error('loadUser: getSession() timeout:', timeoutErr.message)
        set({ user: null, loading: false, isAuthenticating: false })
        return
      }
      
      if (sessionError) {
        console.error('loadUser: Session error:', sessionError)
        set({ user: null, loading: false, isAuthenticating: false })
        return
      }
      
      if (!session?.user) {
        console.log('loadUser: No session or user')
        set({ user: null, loading: false, isAuthenticating: false })
        return
      }
      
      const authUser = session.user
      console.log('loadUser: Got user from session:', authUser.id)
      let user = null
      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries && !user) {
        console.log(`loadUser: Attempting to load from DB (retry ${retries + 1}/${maxRetries})...`)
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        console.log('loadUser: DB query completed. Error:', error?.code, error?.message, 'Data:', data ? 'Yes' : 'No')

        if (!error && data) {
          user = data
          console.log('loadUser: User loaded from DB:', user.email)
          break
        }

        if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
          console.log('loadUser: User not found, creating...')
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

          console.log('loadUser: Create completed. Error:', createError?.code, 'User:', newUser ? 'Yes' : 'No')

          if (!createError && newUser) {
            user = newUser
            console.log('loadUser: User created:', user.email)
            break
          } else {
            console.error('loadUser: Failed to create user:', createError)
          }
        }

        retries++
        if (retries < maxRetries) {
          console.log(`loadUser: Waiting before retry ${retries + 1}...`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (user) {
        console.log('loadUser: Setting user in store:', user.email)
        set({ user: user as User, loading: false, isAuthenticating: false })
      } else {
        console.log('loadUser: No user loaded after all retries')
        set({ user: null, loading: false, isAuthenticating: false })
      }
    } catch (error: any) {
      console.error('loadUser: Unexpected error:', error)
      set({ user: null, loading: false, isAuthenticating: false })
    }
  },
}))

// Вспомогательная функция для загрузки пользователя из БД с таймаутом
async function loadUserFromDatabase(userId: string): Promise<User | null> {
  try {
    console.log('Loading user from database:', userId)
    
    // Добавляем таймаут 5 секунд для запроса к БД
    const dbQueryPromise = supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout (5s)')), 5000)
    })
    
    const result = await Promise.race([dbQueryPromise, timeoutPromise])
    const { data, error } = result
    
    console.log('Database query result:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
    })
    
    if (error) {
      console.error('Error loading user from database:', error.code, error.message)
      if (error.details) console.error('Error details:', error.details)
      if (error.hint) console.error('Error hint:', error.hint)
      return null
    }
    
    if (data) {
      console.log('User loaded from database:', data.email)
      return data as User
    }
    
    console.log('No data returned from database')
    return null
  } catch (err: any) {
    console.error('Unexpected error loading user from database:', err.message)
    return null
  }
}

// Обработчик изменения состояния аутентификации
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, 'Session:', session ? 'Yes' : 'No')
  
  if (event === 'INITIAL_SESSION') {
    // При инициализации проверяем, есть ли активная сессия
    if (session?.user) {
      console.log('Initial session found, loading user...')
      const user = await loadUserFromDatabase(session.user.id)
      if (user) {
        useAuthStore.setState({ user, loading: false, isAuthenticating: false })
      } else {
        useAuthStore.setState({ user: null, loading: false, isAuthenticating: false })
      }
    } else {
      console.log('No initial session')
      useAuthStore.setState({ user: null, loading: false, isAuthenticating: false })
    }
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
    globalInitialized = false
    useAuthStore.setState({ user: null, loading: false, isAuthenticating: false, initialized: false })
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // При входе или обновлении токена загружаем пользователя, если его еще нет в store
    const currentState = useAuthStore.getState()
    if (!currentState.user && session?.user) {
      console.log('Loading user after sign in or token refresh...')
      const user = await loadUserFromDatabase(session.user.id)
      if (user) {
        useAuthStore.setState({ user, loading: false, isAuthenticating: false })
      }
    }
  }
})
