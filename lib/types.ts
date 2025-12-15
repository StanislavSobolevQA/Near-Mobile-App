export type Status = 'open' | 'in_progress' | 'closed'

export interface Request {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  reward_type: 'thanks' | 'money'
  reward_amount: number | null
  district: string
  status: Status
  created_at: string
}

export interface Offer {
  id: string
  request_id: string
  helper_id: string
  created_at: string
}

