import { getUser, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DashboardCharts } from '@/components/DashboardCharts'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PermitStatusWidget } from '@/components/PermitStatusWidget'
import { YearOverYearWidget } from '@/components/YearOverYearWidget'
import { ExpiringPermitsWidget } from '@/components/ExpiringPermitsWidget'
import { AcreageLeaderboard } from '@/components/AcreageLeaderboard'

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
  
  // Get permit status breakdown using RPC function
  const { data: statusBreakdown, error: statusBreakdownError } = await supabase
    .rpc('get_permit_status_breakdown')
  
  if (statusBreakdownError) {
    console.error('Status Breakdown Error:', statusBreakdownError)
  }
  
  const permitStatusData = (statusBreakdown || []).map((row: { status_category: string; permit_count: number; percentage: number }) => ({
    status_category: row.status_category,
    permit_count: row.permit_count,
    percentage: row.percentage
  }))
  
  // Get year-over-year comparison using RPC function
  const { data: yoyComparison, error: yoyError } = await supabase
    .rpc('get_year_over_year_comparison')
  
  if (yoyError) {
    console.error('Year-over-Year Comparison Error:', yoyError)
  }
  
  const yoyData = (yoyComparison || []).map((row: { metric: string; current_year_value: number; previous_year_value: number; change_count: number; change_percentage: number }) => ({
    metric: row.metric,
    current_year_value: row.current_year_value,
    previous_year_value: row.previous_year_value,
    change_count: row.change_count,
    change_percentage: row.change_percentage
  }))
  
  // Get expiring permits summary using RPC function
  const { data: expiringPermits, error: expiringError } = await supabase
    .rpc('get_expiring_permits_summary')
  
  if (expiringError) {
    console.error('Expiring Permits Error:', expiringError)
  }
  
  const expiringData = (expiringPermits || []).map((row: { time_period: string; days_range: string; permit_count: number; total_acreage: number }) => ({
    time_period: row.time_period,
    days_range: row.days_range,
    permit_count: row.permit_count,
    total_acreage: row.total_acreage
  }))
  
  // Get acreage leaderboard using RPC function
  const { data: leaderboard, error: leaderboardError } = await supabase
    .rpc('get_acreage_leaderboard')
  
  if (leaderboardError) {
    console.error('Acreage Leaderboard Error:', leaderboardError)
  }
  
  const leaderboardData = (leaderboard || []).map((row: { rank: number; permit_number: string; applicant_name: string; project_name: string; county: string; permit_type: string; acreage: number; issue_date: string; permit_status: string }) => ({
    rank: row.rank,
    permit_number: row.permit_number,
    applicant_name: row.applicant_name,
    project_name: row.project_name,
    county: row.county,
    permit_type: row.permit_type,
    acreage: row.acreage,
    issue_date: row.issue_date,
    permit_status: row.permit_status
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
    permitStatusData,
    yoyData,
    expiringData,
    leaderboardData,
    counties: topCounties.map(c => c.county),
    permitTypes: topPermitTypes.map(t => t.type),
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

        {/* Permit Status and Year-over-Year Comparison - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Permit Status Widget */}
          <div className="animate-slide-in" style={{ animationDelay: '0.35s' }}>
            <PermitStatusWidget statusData={stats.permitStatusData} />
          </div>

          {/* Year-over-Year Comparison Widget */}
          <div className="animate-slide-in" style={{ animationDelay: '0.38s' }}>
            <YearOverYearWidget yoyData={stats.yoyData} currentYear={2025} previousYear={2024} />
          </div>
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

        {/* Acreage Leaderboard - Below Charts */}
        <div className="mt-8 animate-slide-in" style={{ animationDelay: '0.45s' }}>
          <AcreageLeaderboard 
            leaderboardData={stats.leaderboardData}
            counties={stats.counties}
            permitTypes={stats.permitTypes}
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
