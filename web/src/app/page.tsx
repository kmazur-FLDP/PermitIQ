import { redirect } from 'next/navigation'

export default function Home() {
  // Public site - redirect all users to dashboard
  redirect('/dashboard')
}
