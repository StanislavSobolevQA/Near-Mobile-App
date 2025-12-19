import { MyRequestsClient } from './my-requests-client'
import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sanitizeRequests } from '@/lib/utils'
import type { SafeRequest } from '@/lib/types'

export default async function MyRequestsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Загружаем запросы пользователя
  let requests: SafeRequest[] = []
  try {
    const { data: userRequests, error } = await supabase
      .from('requests')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user requests:', error)
    } else {
      requests = sanitizeRequests(userRequests || [])
    }
  } catch (error) {
    console.error('Error loading requests:', error)
  }

  return (
    <>
      <Navbar />
      <MyRequestsClient initialRequests={requests} />
    </>
  )
}

