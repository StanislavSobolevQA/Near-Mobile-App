import { create } from 'zustand'
import { Chat, Message } from '../types'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface ChatState {
  chats: Chat[]
  currentChat: Chat | null
  messages: Message[]
  loading: boolean
  channel: RealtimeChannel | null
  fetchChats: () => Promise<void>
  fetchChat: (chatId: string) => Promise<void>
  createChat: (taskId: string, executorId: string) => Promise<string>
  sendMessage: (chatId: string, content: string) => Promise<void>
  acceptResponse: (taskId: string, executorId: string) => Promise<void>
  rejectExecutor: (taskId: string, executorId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<void>
  submitReview: (taskId: string, toUserId: string, rating: number, comment?: string) => Promise<void>
  checkExistingReview: (taskId: string, toUserId?: string) => Promise<boolean>
  deleteChat: (chatId: string) => Promise<void>
  subscribeToChat: (chatId: string) => void
  unsubscribeFromChat: () => void
  getUnreadCount: () => number
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  loading: false,
  channel: null,

  fetchChats: async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          task:tasks(*),
          customer:users!chats_customer_id_fkey(*),
          executor:users!chats_executor_id_fkey(*)
        `)
        .or(`customer_id.eq.${authUser.id},executor_id.eq.${authUser.id}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const chatsWithMessages = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('read', false)
            .neq('user_id', authUser.id)

          return {
            ...chat,
            last_message: lastMessage || null,
            unread_count: count || 0,
          }
        })
      )

      set({ chats: chatsWithMessages as Chat[], loading: false })
    } catch (error) {
      console.error('Error fetching chats:', error)
      set({ loading: false })
    }
  },

  fetchChat: async (chatId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          task:tasks(*),
          customer:users!chats_customer_id_fkey(*),
          executor:users!chats_executor_id_fkey(*)
        `)
        .eq('id', chatId)
        .single()

      if (error) throw error

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      set({
        currentChat: data as Chat,
        messages: (messages || []) as Message[],
      })

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .eq('read', false)
        .neq('user_id', authUser.id)

      const { chats } = get()
      const chatInList = chats.some(chat => chat.id === chatId)

      if (!chatInList) {
        const newChat: Chat = {
          ...data,
          unread_count: 0,
        }
        set((state) => ({
          chats: [newChat, ...state.chats],
        }))
      } else {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, unread_count: 0 }
              : chat
          ),
        }))
      }

      get().subscribeToChat(chatId)
    } catch (error) {
      console.error('Error fetching chat:', error)
    }
  },

  createChat: async (taskId: string, executorId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data: existing } = await supabase
      .from('chats')
      .select('id')
      .eq('task_id', taskId)
      .eq('executor_id', executorId)
      .single()

    if (existing) {
      const { chats } = get()
      const chatExists = chats.some(chat => chat.id === existing.id)
      if (!chatExists) {
        await get().fetchChats()
      }
      return existing.id
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', taskId)
      .single()

    const { data, error } = await supabase
      .from('chats')
      .insert({
        task_id: taskId,
        customer_id: task?.user_id,
        executor_id: executorId,
      })
      .select()
      .single()

    if (error) throw error

    const templateMessage = "Здравствуйте! Готов выполнить Ваше поручение."
    await supabase
      .from('messages')
      .insert({
        chat_id: data.id,
        user_id: executorId,
        content: templateMessage,
        read: false,
      })

    const unreadCount = authUser.id === executorId ? 0 : 1
    
    const newChat: Chat = {
      ...data,
      task: task ? { ...task } : undefined,
      unread_count: unreadCount,
    }

    set((state) => ({
      chats: [newChat, ...state.chats],
    }))

    return data.id
  },

  sendMessage: async (chatId: string, content: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: authUser.id,
        content,
        read: false,
      })

    if (error) throw error
  },

  acceptResponse: async (taskId: string, executorId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    await supabase
      .from('task_responses')
      .update({ status: 'accepted' })
      .eq('task_id', taskId)
      .eq('user_id', executorId)

    await supabase
      .from('tasks')
      .update({ 
        executor_id: executorId,
        status: 'in_progress' 
      })
      .eq('id', taskId)

    const { data: chats } = await supabase
      .from('chats')
      .select('id')
      .eq('task_id', taskId)
      .eq('executor_id', executorId)
      .single()

    if (chats) {
      await supabase
        .from('messages')
        .insert({
          chat_id: chats.id,
          user_id: authUser.id,
          content: 'Заказчик выбрал вас исполнителем.',
          read: false,
        })
    }

    const { data: otherChats } = await supabase
      .from('chats')
      .select('id')
      .eq('task_id', taskId)
      .neq('executor_id', executorId)

    if (otherChats && otherChats.length > 0) {
      const messages = otherChats.map(chat => ({
        chat_id: chat.id,
        user_id: authUser.id,
        content: 'Заказчик выбрал другого исполнителя.',
        read: false,
      }))

      await supabase
        .from('messages')
        .insert(messages)
    }

    const { currentChat } = get()
    if (currentChat && currentChat.task_id === taskId) {
      await get().fetchChat(currentChat.id)
    }
  },

  rejectExecutor: async (taskId: string, executorId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data: chat } = await supabase
      .from('chats')
      .select('id')
      .eq('task_id', taskId)
      .eq('executor_id', executorId)
      .single()

    if (chat) {
      await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          user_id: authUser.id,
          content: 'Заказчик выбрал другого исполнителя.',
          read: false,
        })
    }

    const { currentChat } = get()
    if (currentChat && currentChat.task_id === taskId) {
      await get().fetchChat(currentChat.id)
    }
  },

  completeTask: async (taskId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)

    const { data: chat } = await supabase
      .from('chats')
      .select('id')
      .eq('task_id', taskId)
      .single()

    if (chat) {
      await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          user_id: authUser.id,
          content: 'Задача завершена.',
          read: false,
        })
    }

    const { currentChat } = get()
    if (currentChat && currentChat.task_id === taskId) {
      await get().fetchChat(currentChat.id)
    }
  },

  checkExistingReview: async (taskId: string, toUserId?: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    let actualToUserId = toUserId
    if (!actualToUserId) {
      const { data: task } = await supabase
        .from('tasks')
        .select('user_id, executor_id')
        .eq('id', taskId)
        .single()

      if (task) {
        actualToUserId = authUser.id === task.user_id ? task.executor_id : task.user_id
      }
    }

    if (!actualToUserId) return false

    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('task_id', taskId)
      .eq('from_user_id', authUser.id)
      .eq('to_user_id', actualToUserId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  submitReview: async (taskId: string, toUserId: string, rating: number, comment?: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('user_id, executor_id')
      .eq('id', taskId)
      .single()

    if (taskError) throw taskError
    if (!task) throw new Error('Задача не найдена')

    const actualToUserId = authUser.id === task.user_id ? task.executor_id : task.user_id
    
    if (!actualToUserId) {
      throw new Error('Не удалось определить получателя отзыва')
    }

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('task_id', taskId)
      .eq('from_user_id', authUser.id)
      .eq('to_user_id', actualToUserId)
      .maybeSingle()

    if (existingReview) {
      throw new Error('Отзыв уже оставлен')
    }

    const { error: reviewError } = await supabase
      .from('reviews')
      .insert({
        task_id: taskId,
        from_user_id: authUser.id,
        to_user_id: actualToUserId,
        rating,
        comment: comment || null,
      })

    if (reviewError) {
      if (reviewError.code === '23505') {
        throw new Error('Отзыв уже оставлен')
      }
      throw reviewError
    }

    const { data: chat } = await supabase
      .from('chats')
      .select('id')
      .eq('task_id', taskId)
      .single()

    if (chat) {
      const roleText = authUser.id === task.user_id ? 'Заказчик' : 'Исполнитель'
      await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          user_id: authUser.id,
          content: `${roleText} оставил отзыв.`,
          read: false,
        })
    }

    const { currentChat } = get()
    if (currentChat && currentChat.task_id === taskId) {
      await get().fetchChat(currentChat.id)
    }

    await get().fetchChats()
  },

  deleteChat: async (chatId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select('customer_id, executor_id')
      .eq('id', chatId)
      .single()

    if (fetchError) throw fetchError

    if (chat.customer_id !== authUser.id && chat.executor_id !== authUser.id) {
      throw new Error('У вас нет прав на удаление этого чата')
    }

    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
    }))

    const { currentChat } = get()
    if (currentChat && currentChat.id === chatId) {
      get().unsubscribeFromChat()
      set({ currentChat: null, messages: [] })
    }

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (error) {
      await get().fetchChats()
      throw error
    }

    await get().fetchChats()
  },

  subscribeToChat: (chatId: string) => {
    get().unsubscribeFromChat()

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              user:users(*)
            `)
            .eq('id', payload.new.id)
            .single()

          set((state) => ({
            messages: [...state.messages, message as Message],
          }))

          const { data: { user: authUser } } = await supabase.auth.getUser()
          const { currentChat } = get()
          
          if (authUser && message?.user_id !== authUser.id) {
            if (currentChat?.id === chatId) {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', message.id)
            } else {
              set((state) => ({
                chats: state.chats.map((chat) =>
                  chat.id === chatId
                    ? { ...chat, unread_count: (chat.unread_count || 0) + 1 }
                    : chat
                ),
              }))
            }
          }
        }
      )
      .subscribe()

    set({ channel })
  },

  unsubscribeFromChat: () => {
    const { channel } = get()
    if (channel) {
      supabase.removeChannel(channel)
      set({ channel: null })
    }
  },

  getUnreadCount: () => {
    const { chats } = get()
    return chats.reduce((total, chat) => total + (chat.unread_count || 0), 0)
  },
}))
