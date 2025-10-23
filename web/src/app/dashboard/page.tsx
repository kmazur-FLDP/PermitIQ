import { getUser, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DashboardCharts } from '@/components/DashboardCharts'
import { DashboardLayout } from '@/components/DashboardLayout'

async function getDashboardStats() {
  const supabase = await createClient()
  
  // Get overall stats from materialized view
  const { data: overallStats } = await supabase
    .from('dashboard_overall_stats')
    .select('*')
    .single() as { data: { total_permits: number; permits_last_30_days: number; avg_acreage: number } | null }
  
  // Get top counties using RPC function (bypasses RLS)
  const { data: countyStats, error: countyError } = await supabase
    .rpc('get_dashboard_county_stats')
  
  if (countyError) {
    console.error('County Stats Error:', countyError)
  }
  
  const topCounties = (countyStats || []).map((row: { county: string; permit_count: number }) => ({
    county: row.county,
    count: row.permit_count
  }))

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
  
  // Get monthly trends for current year (2025) - Permit Issuance Trend
  const currentYear = new Date().getFullYear()
  const { data: monthlyStats } = await supabase
    .from('dashboard_monthly_trends')
    .select('month, permit_count')
    .gte('month', `${currentYear}-01-01`)
    .lte('month', `${currentYear}-12-31`)
    .order('month', { ascending: true })
  
  const trendData = (monthlyStats || []).map((row: { month: string; permit_count: number }) => ({
    month: new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    count: row.permit_count
  }))
  
  // Get permits over time (last 12 months) using RPC function (bypasses RLS)
  const { data: timeStats, error: timeError } = await supabase
    .rpc('get_dashboard_permits_over_time')
  
  if (timeError) {
    console.error('Permits Over Time Error:', timeError)
  }
  
  const permitsOverTime = (timeStats || []).map((row: { month: string; permit_count: number }) => ({
    month: row.month,
    count: row.permit_count
  }))
  
  // Get top applicants
  const { data: applicantStats } = await supabase
    .from('dashboard_applicant_stats')
    .select('applicant_name, permit_count')
    .limit(10)
  
  const topApplicants = (applicantStats || []).map((row: { applicant_name: string; permit_count: number }) => ({
    applicant: row.applicant_name,
    count: row.permit_count
  }))
  
  return {
    totalPermits: overallStats?.total_permits || 0,
    recentPermits: overallStats?.permits_last_30_days || 0,
    topCounties,
    topPermitTypes,
    permitsByStatus,
    trendData,
    permitsOverTime,
    topApplicants,
    avgAcreage: Math.round((overallStats?.avg_acreage || 0) * 100) / 100,
    topCounty: topCounties[0]?.county || 'N/A',
    topCountyCount: topCounties[0]?.count || 0,
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
    <DashboardLayout userEmail={user.email || null} userRole={profile?.role || null}>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-slate-600">
            Environmental permit intelligence and analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-white/40 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-in">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-600 font-semibold flex items-center">
                <span className="mr-2">📊</span> Total Permits
              </CardDescription>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {stats.totalPermits.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">All ERP permits tracked</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/40 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardDescription className="text-teal-600 font-semibold flex items-center">
                <span className="mr-2">📅</span> Last 30 Days
              </CardDescription>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">
                {stats.recentPermits.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">New permits issued</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/40 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardDescription className="text-cyan-600 font-semibold flex items-center">
                <span className="mr-2">🏆</span> Top County
              </CardDescription>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-500 bg-clip-text text-transparent">
                {stats.topCounty}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{stats.topCountyCount.toLocaleString()} permits</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/40 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-600 font-semibold flex items-center">
                <span className="mr-2">📏</span> Avg. Acreage
              </CardDescription>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                {stats.avgAcreage.toFixed(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Acres per permit</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <DashboardCharts 
            topCounties={stats.topCounties}
            topPermitTypes={stats.topPermitTypes}
            permitsByStatus={stats.permitsByStatus}
            trendData={stats.trendData}
            permitsOverTime={stats.permitsOverTime}
            topApplicants={stats.topApplicants}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <Card className="glass-effect border-white/40 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <span className="mr-2">⚡</span> Quick Actions
              </CardTitle>
              <CardDescription className="text-base">Access key features and tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/map" className="block group">
                  <Button className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transform group-hover:scale-105 transition-all duration-300">
                    <span className="mr-2 text-2xl">🗺️</span>
                    View Interactive Map
                  </Button>
                </Link>
                <Link href="/competitors" className="block group">
                  <Button className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 shadow-lg hover:shadow-xl transform group-hover:scale-105 transition-all duration-300">
                    <span className="mr-2 text-2xl">👥</span>
                    Competitor Watchlist
                  </Button>
                </Link>
                <Link href="/alerts" className="block group">
                  <Button className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-teal-600 to-blue-500 hover:from-teal-700 hover:to-blue-600 shadow-lg hover:shadow-xl transform group-hover:scale-105 transition-all duration-300">
                    <span className="mr-2 text-2xl">🔔</span>
                    Alert Notifications
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
