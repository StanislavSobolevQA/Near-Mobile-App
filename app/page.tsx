import { getRequests } from '@/app/actions/requests'
import { HomeClient } from './page-client'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Загружаем открытые запросы для главной страницы
  try {
    const requests = await getRequests()
    return <HomeClient initialRequests={requests as any} user={user} />
  } catch (error) {
    console.error('Error loading requests:', error)
    // Возвращаем пустой массив если ошибка (таблицы еще не созданы)
    return <HomeClient initialRequests={[]} user={user} />
  }
}
