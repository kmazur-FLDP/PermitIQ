import { getUser, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DashboardCharts } from '@/components/DashboardCharts'

async function getDashboardStats() {
  const supabase = await createClient()
  
  // Get overall stats from materialized view
  const { data: overallStats } = await supabase
    .from('dashboard_overall_stats')
    .select('*')
    .single()
  
  // Get top permit types using RPC function (bypasses RLS)
  const { data: permitTypeStats, error: permitTypeError } = await supabase
    .rpc('get_dashboard_permit_type_stats')
  
  if (permitTypeError) {
    console.error('Permit Type Stats Error:', permitTypeError)
  }
  
  const topPermitTypes = (permitTypeStats || []).map((row: { permit_type: string; permit_count: number }) => ({
    type: row.permit_type,
    count: row.permit_count
  }))
  
  // Get permit status breakdown
  const { data: statusStats } = await supabase
    .from('dashboard_status_stats')
    .select('status, permit_count')
  
  const permitsByStatus = statusStats?.map((row: { status: string; permit_count: number }) => ({
    status: row.status,
    count: row.permit_count
  })) || []
  
  // Get monthly trends (last 12 months)
  const { data: monthlyStats } = await supabase
    .from('dashboard_monthly_trends')
    .select('month, permit_count')
    .order('month', { ascending: true })
    .limit(12)
  
  const trendData = monthlyStats?.map(row => ({
    month: new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    count: row.permit_count
  })) || []
  
  // Get top applicants
  const { data: applicantStats } = await supabase
    .from('dashboard_applicant_stats')
    .select('applicant_name, permit_count')
    .limit(10)
  
  const topApplicants = applicantStats?.map(row => ({
    applicant: row.applicant_name,
    count: row.permit_count
  })) || []
  
  return {
    totalPermits: overallStats?.total_permits || 0,
    recentPermits: overallStats?.permits_last_30_days || 0,
    topPermitTypes,
    permitsByStatus,
    trendData,
    topApplicants,
    avgAcreage: Math.round((overallStats?.avg_acreage || 0) * 100) / 100,
    topPermitType: topPermitTypes[0]?.type || 'N/A',
    topPermitTypeCount: topPermitTypes[0]?.count || 0,
  }
}

export default async function DashboardPage() {
  const user = await getUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect('/login')
  }

  const stats = await getDashboardStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold">PermitIQ</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/map">
                <Button variant="outline" size="sm">
                  Map View
                </Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <span className="text-sm text-gray-600 hidden sm:block">
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
            Environmental permit intelligence and analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Permits</CardDescription>
              <CardTitle className="text-3xl">{stats.totalPermits.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">All ERP permits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Last 30 Days</CardDescription>
              <CardTitle className="text-3xl">{stats.recentPermits.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">New permits issued</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Top Permit Type</CardDescription>
              <CardTitle className="text-2xl">{stats.topPermitType}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">{stats.topPermitTypeCount.toLocaleString()} permits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. Acreage</CardDescription>
              <CardTitle className="text-3xl">{stats.avgAcreage.toFixed(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Per permit</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <DashboardCharts 
          topPermitTypes={stats.topPermitTypes}
          permitsByStatus={stats.permitsByStatus}
          trendData={stats.trendData}
          topApplicants={stats.topApplicants}
        />

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access key features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/map" className="block">
                  <Button className="w-full" size="lg">
                    View Interactive Map
                  </Button>
                </Link>
                <Link href="/competitors" className="block">
                  <Button className="w-full" size="lg" variant="outline">
                    Competitor Watchlist
                  </Button>
                </Link>
                <Link href="/alerts" className="block">
                  <Button className="w-full" size="lg" variant="outline">
                    Alert Notifications
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
