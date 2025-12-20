'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { createRequestSchema, updateRequestSchema } from '@/lib/validation'
import type { PaginatedResponse, Status, District } from '@/lib/types'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, DISTRICTS } from '@/lib/constants'

export async function getRequests(
  district?: string, 
  status: 'open' | 'all' = 'open',
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<any> | any[]> {
  const supabase = createClient()

  // Если пагинация явно запрошена (переданы page и pageSize), используем её
  // Иначе возвращаем все данные как массив (старый API для обратной совместимости)
  const usePagination = page !== undefined && pageSize !== undefined

  let query = supabase
    .from('requests')
    .select(usePagination ? '*, count' : '*', { count: usePagination ? 'exact' : undefined })
    .order('created_at', { ascending: false })

  // Фильтрация по статусу (по умолчанию только открытые)
  if (status === 'open') {
    query = query.eq('status', 'open')
  }

  if (district && district !== DISTRICTS[0]) {
    query = query.eq('district', district)
  }

  if (usePagination && page !== undefined && pageSize !== undefined) {
    const validPage = Math.max(1, Math.floor(page))
    const validPageSize = Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE)
    const from = (validPage - 1) * validPageSize
    const to = from + validPageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  // Всегда логируем ошибки (даже в продакшене), так как это критично
  if (error) {
    logger.error('Error fetching requests', error, { 
      district, 
      status, 
      page, 
      pageSize, 
      errorMessage: error.message, 
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint
    })
    return usePagination 
      ? { data: [], pagination: { page: page || 1, pageSize: pageSize || DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 } }
      : []
  }

  // Логируем результат для отладки
  const requestCount = data?.length || 0
  logger.info('Fetched requests', { 
    count: requestCount, 
    district: district || 'all', 
    status,
    hasData: !!data,
    dataLength: data?.length || 0,
    usePagination
  })
  
  // Если данных нет, но ошибки тоже нет - логируем это как предупреждение
  if (requestCount === 0) {
    logger.warn('No requests found', { district: district || 'all', status, usePagination })
  }

  if (usePagination && page !== undefined && pageSize !== undefined) {
    const validPage = Math.max(1, Math.floor(page))
    const validPageSize = Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE)
    const total = count || 0
    return {
      data: data || [],
      pagination: {
        page: validPage,
        pageSize: validPageSize,
        total,
        totalPages: Math.ceil(total / validPageSize)
      }
    }
  }

  return data || []
}

export type CreateRequestParams = {
  title: string
  description: string
  category: string
  urgency: string
  reward_type: 'thanks' | 'money'
  reward_amount?: number | null
  district: string
  contact_type: string
  contact_value: string
}

export async function createRequest(params: CreateRequestParams) {
  const supabase = createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    logger.warn('Unauthorized attempt to create request', { userId: null })
    throw new Error('Unauthorized')
  }

  try {
    // Валидация с Zod
    const validated = createRequestSchema.parse({
      ...params,
      reward_amount: params.reward_type === 'money' ? params.reward_amount : null
    })

    logger.info('Creating request', { 
      userId: user.id, 
      category: validated.category,
      district: validated.district 
    })

    const { data, error } = await supabase
      .from('requests')
      .insert({
        author_id: user.id,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        urgency: validated.urgency,
        reward_type: validated.reward_type,
        reward_amount: validated.reward_amount,
        district: validated.district,
        status: 'open',
        contact_type: validated.contact_type,
        contact_value: validated.contact_value,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating request', error, { userId: user.id, params: validated })
      throw new Error(`Не удалось создать запрос: ${error.message}`)
    }

    revalidatePath('/')
    revalidatePath('/dashboard')

    logger.info('Request created successfully', { requestId: data?.id, userId: user.id })
    return data
  } catch (error) {
    // Обработка ошибок валидации Zod
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any
      const firstError = zodError.errors?.[0]
      const message = firstError?.message || 'Ошибка валидации данных'
      logger.warn('Validation error in createRequest', { userId: user.id, errors: zodError.errors })
      throw new Error(message)
    }
    throw error
  }
}

export async function createOffer(requestId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Проверяем, не является ли пользователь автором запроса
  const { data: request } = await supabase
    .from('requests')
    .select('author_id, status')
    .eq('id', requestId)
    .single()

  if (!request) {
    return { success: false, error: 'REQUEST_NOT_FOUND', message: 'Запрос не найден' }
  }

  if (request.author_id === user.id) {
    return { success: false, error: 'CANNOT_OFFER_OWN_REQUEST', message: 'Вы не можете откликнуться на свой запрос' }
  }

  if (request.status !== 'open') {
    return { success: false, error: 'REQUEST_CLOSED', message: 'Этот запрос уже закрыт' }
  }

  // Проверяем, не создал ли пользователь уже отклик на этот запрос
  const { data: existingOffer } = await supabase
    .from('offers')
    .select('id')
    .eq('request_id', requestId)
    .eq('helper_id', user.id)
    .single()

  if (existingOffer) {
    return { success: false, error: 'ALREADY_OFFERED', message: 'Вы уже откликнулись на этот запрос' }
  }

  const { error } = await supabase
    .from('offers')
    .insert({
      request_id: requestId,
      helper_id: user.id
    })

  if (error) {
    logger.error('Error creating offer', error, { requestId, userId: user.id })
    // Проверяем, если это ошибка дубликата (UNIQUE constraint)
    if (error.code === '23505') {
      return { success: false, error: 'ALREADY_OFFERED', message: 'Вы уже откликнулись на этот запрос' }
    }
    return { success: false, error: error.message || 'Не удалось создать отклик' }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath(`/requests/${requestId}`)
  return { success: true }
}

export async function closeRequest(requestId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const { data: request } = await supabase
    .from('requests')
    .select('author_id')
    .eq('id', requestId)
    .single()

  if (!request || request.author_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('requests')
    .update({ status: 'closed' })
    .eq('id', requestId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getRequestContact(requestId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Получаем информацию о запросе
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('author_id, contact_type, contact_value')
    .eq('id', requestId)
    .single()

  if (requestError || !request) {
    return null
  }

  // Проверяем, является ли пользователь автором
  const isAuthor = request.author_id === user.id

  // Если не автор, проверяем, есть ли отклик от этого пользователя
  if (!isAuthor) {
    const { data: offer } = await supabase
      .from('offers')
      .select('id')
      .eq('request_id', requestId)
      .eq('helper_id', user.id)
      .single()

    if (!offer) {
      // Пользователь не имеет права видеть контакты
      return null
    }
  }

  // Возвращаем контакты только если пользователь имеет право их видеть
  return {
    contact_type: request.contact_type,
    contact_value: request.contact_value
  }
}

export async function getRequestById(id: string) {
  const supabase = createClient()

  const { data: request, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !request) {
    logger.error('Error fetching request by ID', error, { requestId: id })
    return null
  }

  // Fetch author profile manually to avoid join issues
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', request.author_id)
    .single()

  return {
    ...request,
    profiles: profile
  }
}

export async function getOffers(requestId: string) {
  const supabase = createClient()

  const { data: offers, error } = await supabase
    .from('offers')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching offers', error, { requestId })
    return []
  }

  if (!offers || offers.length === 0) {
    return []
  }

  // Загружаем все профили одним запросом (исправление N+1)
  const helperIds = offers.map(o => o.helper_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', helperIds)

  // Создаем Map для быстрого поиска профилей
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // Сопоставляем профили с откликами
  return offers.map(offer => ({
    ...offer,
    profiles: profileMap.get(offer.helper_id) || null
  }))
}

export async function getUserProfile(userId: string) {
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    logger.error('Error fetching user profile', error, { userId })
    return null
  }

  return profile
}

// Получить запросы, на которые пользователь откликнулся
export async function getMyOffers() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Получаем все отклики пользователя
  const { data: offers, error: offersError } = await supabase
    .from('offers')
    .select('request_id')
    .eq('helper_id', user.id)
    .order('created_at', { ascending: false })

  if (offersError || !offers || offers.length === 0) {
    return []
  }

  // Получаем все запросы одним запросом
  const requestIds = offers.map(o => o.request_id)
  const { data: requests, error: requestsError } = await supabase
    .from('requests')
    .select('*')
    .in('id', requestIds)
    .order('created_at', { ascending: false })

  if (requestsError) {
    logger.error('Error fetching requests for my offers', requestsError, { userId: user.id })
    return []
  }

  return requests || []
}

// Получить ID запросов, на которые пользователь откликнулся (для проверки)
export async function getUserOfferIds() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data: offers, error } = await supabase
    .from('offers')
    .select('request_id')
    .eq('helper_id', user.id)

  if (error || !offers) {
    return []
  }

  return offers.map(o => o.request_id)
}

// Обновление запроса
export async function updateRequest(
  requestId: string,
  params: Partial<CreateRequestParams>
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Проверяем владельца
  const { data: request } = await supabase
    .from('requests')
    .select('author_id, status')
    .eq('id', requestId)
    .single()

  if (!request || request.author_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Подготавливаем данные для обновления
  const updateData: any = {}
  
  if (params.title !== undefined) updateData.title = params.title.trim()
  if (params.description !== undefined) updateData.description = params.description.trim()
  if (params.category !== undefined) updateData.category = params.category
  if (params.urgency !== undefined) updateData.urgency = params.urgency
  if (params.reward_type !== undefined) updateData.reward_type = params.reward_type
  if (params.reward_amount !== undefined) updateData.reward_amount = params.reward_amount
  if (params.district !== undefined) updateData.district = params.district
  if (params.contact_type !== undefined) updateData.contact_type = params.contact_type
  if (params.contact_value !== undefined) updateData.contact_value = params.contact_value.trim()

  // Валидация через Zod (если переданы поля для обновления)
  if (Object.keys(updateData).length > 0) {
    try {
      updateRequestSchema.parse(updateData)
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        const zodError = error as any
        const firstError = zodError.errors?.[0]
        throw new Error(firstError?.message || 'Ошибка валидации данных')
      }
      throw error
    }
  }

  const { data, error } = await supabase
    .from('requests')
    .update(updateData)
    .eq('id', requestId)
    .select()
    .single()

  if (error) {
    logger.error('Error updating request', error, { requestId, userId: user.id })
    throw new Error(`Не удалось обновить запрос: ${error.message}`)
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath(`/requests/${requestId}`)

  logger.info('Request updated successfully', { requestId, userId: user.id })
  return data
}

// Удаление запроса
export async function deleteRequest(requestId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Проверяем владельца
  const { data: request } = await supabase
    .from('requests')
    .select('author_id')
    .eq('id', requestId)
    .single()

  if (!request || request.author_id !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', requestId)

  if (error) {
    logger.error('Error deleting request', error, { requestId, userId: user.id })
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/requests')

  logger.info('Request deleted successfully', { requestId, userId: user.id })
  return { success: true }
}
