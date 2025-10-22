import { getUser, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold">PermitIQ</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name || user.email}
              </span>
              <form action="/auth/logout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {profile?.full_name || 'User'}!
          </p>
        </div>

        {/* Profile Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium">Email:</span>
                <p className="text-sm text-gray-600">{profile?.email || user.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Role:</span>
                <p className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profile?.role || 'user'}
                  </span>
                </p>
              </div>
              {profile?.default_county && (
                <div>
                  <span className="text-sm font-medium">Default County:</span>
                  <p className="text-sm text-gray-600">{profile.default_county}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>System overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Permits:</span>
                  <span className="text-2xl font-bold">40,382</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Counties:</span>
                  <span className="text-2xl font-bold">67</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                View Map
              </Button>
              <Button className="w-full" variant="outline">
                Search Permits
              </Button>
              <Button className="w-full" variant="outline">
                View Alerts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Features Coming Soon</CardTitle>
            <CardDescription>We&apos;re building amazing features for you</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>User Authentication & Profiles</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <span>Interactive Permit Map with 40k+ markers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <span>Real-time Statistics & Trend Charts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <span>Competitor Watchlist & Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <span>Smart Alerts & Notifications</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
