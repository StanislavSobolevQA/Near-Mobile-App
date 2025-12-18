import { getRequests, getUserProfile } from '@/app/actions/requests'
import { sanitizeRequests } from '@/lib/utils'
import { DashboardClient } from './page-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { SafeRequest } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Загружаем профиль пользователя для получения района
  let userDistrict: string | undefined
  try {
    const profile = await getUserProfile(user.id)
    userDistrict = profile?.district
  } catch (error) {
    console.error('Error loading user profile:', error)
  }

  // Загружаем запросы
  let requests: SafeRequest[] = []
  try {
    const fetchedRequests = await getRequests()
    // Удаляем contact_value для безопасности (не передаем в клиентский компонент)
    requests = sanitizeRequests(fetchedRequests)
  } catch (error) {
    console.error('Error loading requests:', error)
    requests = []
  }

  return (
    <DashboardClient
      initialRequests={requests}
      userDistrict={userDistrict}
    />
  )
}
