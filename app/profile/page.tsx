import { ProfileClient } from './profile-client'
import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/app/actions/requests'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Загружаем профиль пользователя
  let profile = null
  try {
    profile = await getUserProfile(user.id)
  } catch (error) {
    console.error('Error loading user profile:', error)
  }
  
  return (
    <>
      <Navbar />
      <ProfileClient user={user} initialProfile={profile} />
    </>
  )
}

