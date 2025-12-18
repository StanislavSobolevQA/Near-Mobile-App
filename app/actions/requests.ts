'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getRequests(district?: string) {
  const supabase = createClient()

  let query = supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })

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

  // TODO: Add proper permission check (only offerer or author can see contact)

  const { data, error } = await supabase
    .from('requests')
    .select('contact_type, contact_value')
    .eq('id', requestId)
    .single()

  if (error || !data) {
    return null
  }

  return data
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

  // Fetch profiles for all offers
  const offersWithProfiles = await Promise.all(offers.map(async (offer) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', offer.helper_id)
      .single()

    return {
      ...offer,
      profiles: profile
    }
  }))

  return offersWithProfiles
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
