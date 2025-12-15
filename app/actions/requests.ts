'use server'

import { revalidatePath } from 'next/cache'

// Моковые данные для разработки
const mockRequests: any[] = []

export async function getRequests(district?: string) {
  // Возвращаем моковые данные
  let filtered = [...mockRequests]
  
  if (district && district !== 'Все районы') {
    filtered = filtered.filter(req => req.district === district)
  }
  
  return filtered
}

export async function createRequest(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const urgency = formData.get('urgency') as string
  const reward_type = formData.get('reward_type') as 'thanks' | 'money'
  const reward_amount_str = formData.get('reward_amount') as string
  const reward_amount = reward_type === 'money' && reward_amount_str ? Number(reward_amount_str) : null
  const district = formData.get('district') as string

  if (!title || !description || !category || !district) {
    throw new Error('Missing required fields')
  }

  // Создаем моковый запрос
  const newRequest = {
    id: crypto.randomUUID(),
    title,
    description,
    category,
    urgency,
    reward_type,
    reward_amount,
    district,
    status: 'open' as const,
    created_at: new Date().toISOString(),
  }

  mockRequests.unshift(newRequest)

  revalidatePath('/')
  revalidatePath('/dashboard')

  return newRequest
}

export async function createOffer(requestId: string) {
  // Моковая функция
  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function closeRequest(requestId: string) {
  // Моковая функция
  const request = mockRequests.find(r => r.id === requestId)
  if (request) {
    request.status = 'closed'
  }
  
  revalidatePath('/')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getRequestContact(requestId: string) {
  // Моковая функция
  return {
    contact_type: 'telegram',
    contact_value: '@example'
  }
}
