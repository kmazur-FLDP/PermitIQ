import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

export default async function Home() {
  const user = await getUser()
  
  // Redirect to map if authenticated, otherwise to login
  if (user) {
    redirect('/map')
  } else {
    redirect('/login')
  }
}
