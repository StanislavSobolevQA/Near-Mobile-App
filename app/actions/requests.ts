'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getRequests(district?: string, status: 'open' | 'all' = 'open') {
  const supabase = createClient()

  let query = supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })

  // Фильтрация по статусу (по умолчанию только открытые)
  if (status === 'open') {
    query = query.eq('status', 'open')
  }

  if (district && district !== 'Все районы') {
    query = query.eq('district', district)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching requests:', error)
    return []
  }

  return data
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
    throw new Error('Unauthorized')
  }

  const {
    title,
    description,
    category,
    urgency,
    reward_type,
    reward_amount,
    district,
    contact_type,
    contact_value
  } = params

  console.log('[createRequest] Received:', { title, description, category, district, contact_value })

  if (!title || !description || !category || !district || !contact_value) {
    throw new Error(`Missing required fields: ${JSON.stringify({ title: !!title, description: !!description, category: !!category, district: !!district, contact_value: !!contact_value })}`)
  }

  const { data, error } = await supabase
    .from('requests')
    .insert({
      author_id: user.id,
      title,
      description,
      category,
      urgency,
      reward_type,
      reward_amount,
      district,
      status: 'open',
      contact_type: contact_type || 'telegram',
      contact_value: contact_value,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating request:', error)
    throw new Error('Failed to create request')
  }

  revalidatePath('/')
  revalidatePath('/dashboard')

  return data
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
    console.error('Error creating offer:', error)
    // Проверяем, если это ошибка дубликата (UNIQUE constraint)
    if (error.code === '23505') {
      return { success: false, error: 'ALREADY_OFFERED', message: 'Вы уже откликнулись на этот запрос' }
    }
    return { success: false, error: error.message }
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
    console.error('Error fetching request:', error)
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
    console.error('Error fetching offers:', error)
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
    console.error('Error fetching user profile:', error)
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
    console.error('Error fetching requests:', requestsError)
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
