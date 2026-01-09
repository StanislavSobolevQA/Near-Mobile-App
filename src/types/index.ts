export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  rating: number
  reviews_count: number
  about_me?: string | null
  show_phone?: boolean
  show_email?: boolean
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  executor_id?: string | null
  title: string
  description: string
  budget: number
  address: string
  latitude: number
  longitude: number
  category: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  photos: string[]
  phone?: string | null
  created_at: string
  updated_at: string
  user?: User
  responses_count?: number
}

export interface TaskResponse {
  id: string
  task_id: string
  user_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  user?: User
}

export interface Message {
  id: string
  chat_id: string
  user_id: string
  content: string
  created_at: string
  user?: User
}

export interface Chat {
  id: string
  task_id: string
  customer_id: string
  executor_id: string
  created_at: string
  task?: Task
  customer?: User
  executor?: User
  last_message?: Message
  unread_count?: number
}

export interface Review {
  id: string
  task_id: string
  from_user_id: string
  to_user_id: string
  rating: number
  comment: string | null
  created_at: string
  from_user?: User
  to_user?: User
}

export type TaskCategory = 
  | 'courier' 
  | 'animals' 
  | 'loader' 
  | 'store' 
  | 'other'

export const TASK_CATEGORIES: Record<TaskCategory, { label: string; icon: string }> = {
  courier: { label: 'Курьер', icon: '🚚' },
  animals: { label: 'Животные', icon: '🐕' },
  loader: { label: 'Грузчик', icon: '📦' },
  store: { label: 'Магазин', icon: '🛒' },
  other: { label: 'Другое', icon: '📋' },
}
