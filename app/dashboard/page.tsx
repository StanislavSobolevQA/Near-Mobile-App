import { getRequests } from '@/app/actions/requests'
import { DashboardClient } from './page-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Загружаем запросы
  let requests = []
  try {
    requests = await getRequests()
  } catch (error) {
    console.error('Error loading requests:', error)
    requests = []
  }

  return (
    <DashboardClient
      initialRequests={requests as any}
      userDistrict={undefined} // TODO: Load from profile
    />
  )
}
