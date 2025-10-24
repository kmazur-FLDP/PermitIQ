import { getUser, getUserProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardCharts } from '@/components/DashboardCharts'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PermitStatusWidget } from '@/components/PermitStatusWidget'
import { YearOverYearWidget } from '@/components/YearOverYearWidget'
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
        <div className="mb-10">
          <div className="relative">
            <h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">
              Dashboard
            </h1>
            <div className="absolute bottom-0 left-0 w-20 h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
          </div>
          <p className="text-lg text-slate-600 mt-4">
            Environmental permit intelligence and analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-blue-600 font-semibold uppercase text-xs tracking-wider">
                Total Permits
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-slate-900 mt-2">
                {stats.totalPermits.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">All ERP permits tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:border-green-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-green-600 font-semibold uppercase text-xs tracking-wider">
                Last 30 Days
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-slate-900 mt-2">
                {stats.recentPermits.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">New permits issued</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:border-cyan-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-cyan-600 font-semibold uppercase text-xs tracking-wider">
                Top County
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-2">
                {stats.topCounty}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{stats.topCountyCount.toLocaleString()} permits</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 hover:border-purple-300">
            <CardHeader className="pb-3">
              <CardDescription className="text-purple-600 font-semibold uppercase text-xs tracking-wider">
                Avg. Acreage
              </CardDescription>
              <CardTitle className="text-4xl font-bold text-slate-900 mt-2">
                {stats.avgAcreage.toFixed(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Acres per permit</p>
            </CardContent>
          </Card>
        </div>

        {/* Permit Status and Year-over-Year Comparison - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Permit Status Widget */}
          <div>
            <PermitStatusWidget statusData={stats.permitStatusData} />
          </div>

          {/* Year-over-Year Comparison Widget */}
          <div>
            <YearOverYearWidget yoyData={stats.yoyData} currentYear={2025} previousYear={2024} />
          </div>
        </div>

        {/* Charts */}
        <div className="mb-10">
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
        <div className="mt-10">
          <AcreageLeaderboard 
            leaderboardData={stats.leaderboardData}
            counties={stats.counties}
            permitTypes={stats.permitTypes}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
