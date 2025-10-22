import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

export default async function Home() {
  const user = await getUser()
  
  // Redirect to dashboard if authenticated, otherwise to login
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
