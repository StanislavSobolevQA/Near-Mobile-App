export type Status = 'open' | 'in_progress' | 'closed'

export interface Request {
  id: string
  author_id: string
  title: string
  description: string
  category: string
  urgency: string
  reward_type: 'thanks' | 'money'
  reward_amount: number | null
  district: string
  status: Status
  contact_type: 'telegram' | 'phone'
  contact_value?: string // Опционально для безопасности (не передаем в клиентские компоненты)
  created_at: string
}

// Тип для запросов без конфиденциальных данных (для передачи в клиентские компоненты)
export type SafeRequest = Omit<Request, 'contact_value'>

export interface Offer {
  id: string
  request_id: string
  helper_id: string
  created_at: string
}



