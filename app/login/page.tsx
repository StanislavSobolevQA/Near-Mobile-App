import { Navbar } from '@/components/navbar'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  // ВРЕМЕННО: просто редирект на dashboard
  redirect('/dashboard')
}

