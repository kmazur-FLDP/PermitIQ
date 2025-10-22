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
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold">PermitIQ</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/map">
                <Button variant="ghost">Map View</Button>
              </Link>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Environmental Permit Intelligence
            <span className="block text-blue-600 mt-2">Powered by Real-Time Data</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track, analyze, and monitor 40,000+ environmental permits across Florida.
            Get competitive intelligence and stay ahead of market trends.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                View Dashboard
              </Button>
            </Link>
            <Link href="/map">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Explore Map
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold">40,382</CardTitle>
              <CardDescription>Active Permits</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold">67</CardTitle>
              <CardDescription>Counties Covered</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold">Daily</CardTitle>
              <CardDescription>Automated Updates</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold">Real-Time</CardTitle>
              <CardDescription>Alert Notifications</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Powerful Features for Environmental Professionals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Map className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Interactive Mapping</CardTitle>
              <CardDescription>
                Visualize all permits on an interactive map with clustering, filtering, and detailed popups
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Track trends, identify hotspots, and analyze permit patterns across counties and applicants
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>
                Get notified when competitors file permits or activity occurs near your projects
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Competitor Tracking</CardTitle>
              <CardDescription>
                Monitor specific companies and get automatic matching against all permit applications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Revision History</CardTitle>
              <CardDescription>
                Track changes to permits over time and analyze permit modification patterns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Secure access controls for administrators, staff, and clients with customizable permissions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardHeader className="text-center py-12">
            <CardTitle className="text-3xl mb-4">Ready to Get Started?</CardTitle>
            <CardDescription className="text-blue-100 text-lg mb-6">
              Access comprehensive permit data and competitive intelligence today
            </CardDescription>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">© 2025 PermitIQ. All rights reserved.</p>
            <p className="text-sm">
              Data sourced from Southwest Florida Water Management District
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
