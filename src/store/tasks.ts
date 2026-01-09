import { create } from 'zustand'
import { Task } from '../types'
import { supabase } from '../lib/supabase'

interface TasksState {
  tasks: Task[]
  selectedTask: Task | null
  loading: boolean
  fetchTasks: (bounds?: { north: number; south: number; east: number; west: number }) => Promise<void>
  fetchTask: (id: string) => Promise<void>
  fetchUserTasks: (userId: string) => Promise<Task[]>
  fetchExecutorTasks: (userId: string) => Promise<Task[]>
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'user_id'>>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  selectTask: (task: Task | null) => void
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  loading: false,

  fetchTasks: async (bounds) => {
    set({ loading: true })
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          user:users!tasks_user_id_fkey(*)
        `)
        .eq('status', 'open')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })

      if (bounds) {
        query = query
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east)
      }

      const { data, error } = await query.limit(100)
      if (error) {
        console.error('Error fetching tasks:', error)
        throw error
      }

      const tasksWithCounts = await Promise.all(
        (data || []).map(async (task) => {
          const { count } = await supabase
            .from('task_responses')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
            .eq('status', 'pending')

          let photos: string[] = []
          if (task.photos) {
            if (Array.isArray(task.photos)) {
              photos = task.photos.filter((p: any) => p && typeof p === 'string' && p.trim() !== '')
            } else if (typeof task.photos === 'string') {
              try {
                if (task.photos.startsWith('{') && task.photos.endsWith('}')) {
                  photos = task.photos.slice(1, -1).split(',').map((p: string) => p.trim().replace(/^"|"$/g, ''))
                } else if (task.photos.startsWith('[')) {
                  photos = JSON.parse(task.photos)
                } else {
                  photos = [task.photos]
                }
              } catch {
                photos = [task.photos]
              }
            }
          }

          return {
            ...task,
            photos,
            responses_count: count || 0,
          }
        })
      )

      set({ tasks: tasksWithCounts as Task[], loading: false })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      set({ loading: false })
    }
  },

  fetchTask: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          user:users!tasks_user_id_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) {
        throw new Error('Поручение не найдено')
      }

      const { count } = await supabase
        .from('task_responses')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', id)
        .eq('status', 'pending')

      set({
        selectedTask: {
          ...data,
          responses_count: count || 0,
        } as Task,
      })
    } catch (error) {
      console.error('Error fetching task:', error)
      set({ selectedTask: null })
      throw error
    }
  },

  fetchUserTasks: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          user:users!tasks_user_id_fkey(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tasksWithCounts = await Promise.all(
        (data || []).map(async (task) => {
          const { count } = await supabase
            .from('task_responses')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
            .eq('status', 'pending')

          let photos: string[] = []
          if (task.photos) {
            if (Array.isArray(task.photos)) {
              photos = task.photos.filter((p: any) => p && typeof p === 'string' && p.trim() !== '')
            } else if (typeof task.photos === 'string') {
              try {
                if (task.photos.startsWith('{') && task.photos.endsWith('}')) {
                  photos = task.photos.slice(1, -1).split(',').map((p: string) => p.trim().replace(/^"|"$/g, ''))
                } else if (task.photos.startsWith('[')) {
                  photos = JSON.parse(task.photos)
                } else {
                  photos = [task.photos]
                }
              } catch {
                photos = [task.photos]
              }
            }
          }

          return {
            ...task,
            photos,
            responses_count: count || 0,
          }
        })
      )

      return tasksWithCounts as Task[]
    } catch (error) {
      console.error('Error fetching user tasks:', error)
      throw error
    }
  },

  fetchExecutorTasks: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          user:users!tasks_user_id_fkey(*)
        `)
        .eq('executor_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tasksWithCounts = await Promise.all(
        (data || []).map(async (task) => {
          const { count } = await supabase
            .from('task_responses')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
            .eq('status', 'pending')

          let photos: string[] = []
          if (task.photos) {
            if (Array.isArray(task.photos)) {
              photos = task.photos.filter((p: any) => p && typeof p === 'string' && p.trim() !== '')
            } else if (typeof task.photos === 'string') {
              try {
                if (task.photos.startsWith('{') && task.photos.endsWith('}')) {
                  photos = task.photos.slice(1, -1).split(',').map((p: string) => p.trim().replace(/^"|"$/g, ''))
                } else if (task.photos.startsWith('[')) {
                  photos = JSON.parse(task.photos)
                } else {
                  photos = [task.photos]
                }
              } catch {
                photos = [task.photos]
              }
            }
          }

          return {
            ...task,
            photos,
            responses_count: count || 0,
          }
        })
      )

      return tasksWithCounts as Task[]
    } catch (error) {
      console.error('Error fetching executor tasks:', error)
      throw error
    }
  },

  createTask: async (task) => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      throw new Error('Not authenticated. Please log in to create a task.')
    }

    const photosArray = Array.isArray(task.photos) ? task.photos : (task.photos ? [task.photos] : [])

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...task,
        photos: photosArray,
        user_id: authUser.id,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      throw error
    }
    
    await get().fetchTasks()
  },

  updateTask: async (id: string, updates) => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      throw new Error('Not authenticated. Please log in to update a task.')
    }

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (task.user_id !== authUser.id) {
      throw new Error('You can only edit your own tasks.')
    }

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    await get().fetchTasks()
    if (get().selectedTask?.id === id) {
      await get().fetchTask(id)
    }
  },

  deleteTask: async (id: string) => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      throw new Error('Not authenticated. Please log in to delete a task.')
    }

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (task.user_id !== authUser.id) {
      throw new Error('You can only delete your own tasks.')
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error

    const currentTasks = get().tasks
    set({ 
      tasks: currentTasks.filter(t => t.id !== id),
      selectedTask: get().selectedTask?.id === id ? null : get().selectedTask
    })
    
    await get().fetchTasks()
  },

  selectTask: (task) => {
    set({ selectedTask: task })
  },
}))
