import { redirect } from 'next/navigation'

export default function LoginPage() {
  // Site is now public - redirect to dashboard
  redirect('/dashboard')
}
