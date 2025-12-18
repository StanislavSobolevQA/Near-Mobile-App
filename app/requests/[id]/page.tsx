import { notFound } from 'next/navigation'
import { RequestViewClient } from './request-view-client'
import { Navbar } from '@/components/navbar'
import { getRequestById, getOffers } from '@/app/actions/requests'
import { createClient } from '@/lib/supabase/server'

export default async function RequestPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const request = await getRequestById(params.id)

  if (!request) {
    notFound()
  }

  let offers: any[] = []
  if (user && user.id === request.author_id) {
    offers = await getOffers(request.id)
  }

  return (
    <>
      <Navbar />
      <RequestViewClient
        request={request}
        offers={offers}
        isAuthor={user?.id === request.author_id}
        userId={user?.id}
      />
    </>
  )
}
