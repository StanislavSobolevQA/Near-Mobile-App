import { getRequests, getUserProfile, getMyOffers, getUserOfferIds } from '@/app/actions/requests'
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

  // Загружаем открытые запросы (для таба "Нужна помощь")
  let requests: SafeRequest[] = []
  try {
    const fetchedRequests = await getRequests(undefined, 'open')
    // Удаляем contact_value для безопасности (не передаем в клиентский компонент)
    requests = sanitizeRequests(fetchedRequests)
  } catch (error) {
    console.error('Error loading requests:', error)
    requests = []
  }

  // Загружаем запросы, на которые пользователь откликнулся (для таба "Могу помочь")
  let myOffers: SafeRequest[] = []
  let userOfferIds: string[] = []
  try {
    const fetchedMyOffers = await getMyOffers()
    myOffers = sanitizeRequests(fetchedMyOffers)
    userOfferIds = await getUserOfferIds()
  } catch (error) {
    console.error('Error loading my offers:', error)
    myOffers = []
  }

  return (
    <DashboardClient
      initialRequests={requests}
      initialMyOffers={myOffers}
      userOfferIds={userOfferIds}
      userDistrict={userDistrict}
    />
  )
}
