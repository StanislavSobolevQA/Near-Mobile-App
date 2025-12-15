import { notFound } from 'next/navigation'
import { RequestViewClient } from './request-view-client'
import { Navbar } from '@/components/navbar'
import { getRequests } from '@/app/actions/requests'

export default async function RequestPage({ params }: { params: { id: string } }) {
  // ВРЕМЕННО: загружаем из моковых данных
  const requests = await getRequests()
  const request = requests.find(r => r.id === params.id)

  if (!request) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <RequestViewClient
        request={request as any}
        offers={[]}
        isAuthor={false}
        userId={undefined}
      />
    </>
  )
}
