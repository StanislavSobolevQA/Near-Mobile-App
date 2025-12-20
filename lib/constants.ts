// Централизованные константы приложения

export const DISTRICTS = ['Все районы', 'Центральный', 'Северный', 'Южный', 'Восточный', 'Западный'] as const
export type District = typeof DISTRICTS[number]

export const CATEGORIES = ['уборка', 'ремонт', 'доставка', 'выгул'] as const
export type Category = typeof CATEGORIES[number]

export const URGENCY_OPTIONS = {
  'today': 'Сегодня',
  'tomorrow': 'Завтра',
  'week': 'На неделе',
  'not-urgent': 'Не срочно'
} as const
export type Urgency = keyof typeof URGENCY_OPTIONS

export const REWARD_TYPES = {
  'thanks': 'Спасибо',
  'money': 'Денежное вознаграждение'
} as const
export type RewardType = keyof typeof REWARD_TYPES

export const CONTACT_TYPES = {
  'telegram': 'Telegram',
  'phone': 'Телефон'
} as const
export type ContactType = keyof typeof CONTACT_TYPES

export const STATUS_OPTIONS = {
  'open': 'Открыт',
  'in_progress': 'В работе',
  'closed': 'Закрыт'
} as const
export type Status = keyof typeof STATUS_OPTIONS

// Валидационные константы
export const VALIDATION_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 100,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
  REWARD_AMOUNT_MAX: 1000000,
  REWARD_AMOUNT_MIN: 1
} as const

// Пагинация
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100


