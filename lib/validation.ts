import { z } from 'zod'
import { CATEGORIES, URGENCY_OPTIONS, REWARD_TYPES, CONTACT_TYPES, VALIDATION_LIMITS } from './constants'

// Схема валидации для создания запроса
export const createRequestSchema = z.object({
  title: z.string()
    .min(VALIDATION_LIMITS.TITLE_MIN, `Заголовок должен быть не менее ${VALIDATION_LIMITS.TITLE_MIN} символов`)
    .max(VALIDATION_LIMITS.TITLE_MAX, `Заголовок должен быть не более ${VALIDATION_LIMITS.TITLE_MAX} символов`)
    .trim(),
  description: z.string()
    .min(VALIDATION_LIMITS.DESCRIPTION_MIN, `Описание должно быть не менее ${VALIDATION_LIMITS.DESCRIPTION_MIN} символов`)
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, `Описание должно быть не более ${VALIDATION_LIMITS.DESCRIPTION_MAX} символов`)
    .trim(),
  category: z.enum(CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите категорию' })
  }),
  urgency: z.enum(Object.keys(URGENCY_OPTIONS) as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите срочность' })
  }),
  reward_type: z.enum(Object.keys(REWARD_TYPES) as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите тип вознаграждения' })
  }),
  reward_amount: z.number()
    .positive('Сумма должна быть положительной')
    .max(VALIDATION_LIMITS.REWARD_AMOUNT_MAX, `Сумма не может превышать ${VALIDATION_LIMITS.REWARD_AMOUNT_MAX.toLocaleString('ru-RU')} ₽`)
    .nullable()
    .optional(),
  district: z.string().min(1, 'Выберите район'),
  contact_type: z.enum(Object.keys(CONTACT_TYPES) as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите тип контакта' })
  }),
  contact_value: z.string()
    .min(1, 'Укажите контактные данные')
    .trim()
    .refine((val) => {
      // Базовая валидация формата
      if (val.startsWith('@')) {
        return val.length >= 2 // Минимум @username
      }
      if (val.startsWith('+')) {
        return /^\+7\d{10}$/.test(val.replace(/\s|-|\(|\)/g, '')) // Российский номер
      }
      return true
    }, {
      message: 'Некорректный формат контакта'
    })
}).refine((data) => {
  // Если выбран денежный тип вознаграждения, сумма обязательна
  if (data.reward_type === 'money') {
    return data.reward_amount !== null && data.reward_amount !== undefined && data.reward_amount > 0
  }
  return true
}, {
  message: 'Укажите сумму вознаграждения',
  path: ['reward_amount']
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>

// Схема для обновления профиля
export const updateProfileSchema = z.object({
  display_name: z.string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(50, 'Имя должно быть не более 50 символов')
    .trim()
    .nullable()
    .optional(),
  district: z.string().nullable().optional(),
  telegram: z.string()
    .regex(/^@?[a-zA-Z0-9_]{5,32}$/, 'Некорректный формат Telegram username')
    .nullable()
    .optional()
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Схема для обновления запроса (все поля опциональны)
export const updateRequestSchema = z.object({
  title: z.string()
    .min(VALIDATION_LIMITS.TITLE_MIN, `Заголовок должен быть не менее ${VALIDATION_LIMITS.TITLE_MIN} символов`)
    .max(VALIDATION_LIMITS.TITLE_MAX, `Заголовок должен быть не более ${VALIDATION_LIMITS.TITLE_MAX} символов`)
    .trim()
    .optional(),
  description: z.string()
    .min(VALIDATION_LIMITS.DESCRIPTION_MIN, `Описание должно быть не менее ${VALIDATION_LIMITS.DESCRIPTION_MIN} символов`)
    .max(VALIDATION_LIMITS.DESCRIPTION_MAX, `Описание должно быть не более ${VALIDATION_LIMITS.DESCRIPTION_MAX} символов`)
    .trim()
    .optional(),
  category: z.enum(CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите категорию' })
  }).optional(),
  urgency: z.enum(Object.keys(URGENCY_OPTIONS) as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите срочность' })
  }).optional(),
  reward_type: z.enum(Object.keys(REWARD_TYPES) as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите тип вознаграждения' })
  }).optional(),
  reward_amount: z.number()
    .positive('Сумма должна быть положительной')
    .max(VALIDATION_LIMITS.REWARD_AMOUNT_MAX, `Сумма не может превышать ${VALIDATION_LIMITS.REWARD_AMOUNT_MAX.toLocaleString('ru-RU')} ₽`)
    .nullable()
    .optional(),
  district: z.string().min(1, 'Выберите район').optional(),
  contact_type: z.enum(Object.keys(CONTACT_TYPES) as [string, ...string[]], {
    errorMap: () => ({ message: 'Выберите тип контакта' })
  }).optional(),
  contact_value: z.string()
    .min(1, 'Укажите контактные данные')
    .trim()
    .refine((val) => {
      // Базовая валидация формата
      if (val.startsWith('@')) {
        return val.length >= 2
      }
      if (val.startsWith('+')) {
        return /^\+7\d{10}$/.test(val.replace(/\s|-|\(|\)/g, ''))
      }
      return true
    }, {
      message: 'Некорректный формат контакта'
    })
    .optional()
}).refine((data) => {
  // Если выбран денежный тип вознаграждения, сумма обязательна
  if (data.reward_type === 'money' && data.reward_type !== undefined) {
    return data.reward_amount !== null && data.reward_amount !== undefined && data.reward_amount > 0
  }
  return true
}, {
  message: 'Укажите сумму вознаграждения',
  path: ['reward_amount']
})

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>


