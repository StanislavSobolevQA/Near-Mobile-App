import { getRequests } from '@/app/actions/requests'
import { DashboardClient } from './page-client'
import { Navbar } from '@/components/navbar'

export default async function DashboardPage() {
  // ВРЕМЕННО: убрана проверка авторизации
  
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
      userDistrict={undefined}
    />
  )
}
