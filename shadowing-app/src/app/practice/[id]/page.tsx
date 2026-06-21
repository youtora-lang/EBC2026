import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PracticeClient from './PracticeClient'

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) notFound()

  return <PracticeClient session={session} />
}
