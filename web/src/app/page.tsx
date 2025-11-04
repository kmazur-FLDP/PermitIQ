import { redirect } from 'next/navigation'

export default function Home() {
  // Public site - redirect all users to dashboard
  // Using permanent redirect to avoid redirect loops
  redirect('/dashboard')
}

// Force static generation to prevent middleware issues
export const dynamic = 'force-static'
