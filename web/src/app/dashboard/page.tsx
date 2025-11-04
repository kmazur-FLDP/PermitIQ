import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PermitStatusWidget } from '@/components/PermitStatusWidget'
import { YearOverYearWidget } from '@/components/YearOverYearWidget'
import dynamic from 'next/dynamic'

// Lazy load heavy components for better performance
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts').then(mod => ({ default: mod.DashboardCharts })), {
  ssr: true,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="bg-white border border-slate-200 shadow-md">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="h-6 w-40 bg-slate-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] bg-slate-100 animate-pulse rounded-lg"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

const AcreageLeaderboard = dynamic(() => import('@/components/AcreageLeaderboard').then(mod => ({ default: mod.AcreageLeaderboard })), {
  ssr: true,
  loading: () => (
    <Card className="bg-white border border-slate-200 shadow-md">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded"></div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

// Enable ISR with 5-minute revalidation for better performance
export const revalidate = 300 // Revalidate every 5 minutes

async function getDashboardStats() {
  const supabase = await createClient()
  
  // Parallelize all database queries for much faster loading
  // Note: Using RPC functions instead of materialized views for real-time consistency
  const [
    countyStatsResult,
    permitTypeStatsResult,
    statusStatsResult,
    monthlyStatsResult,
    timeStatsResult,
    applicantStatsResult,
    statusBreakdownResult,
    yoyComparisonResult,
    leaderboardResult,
    recentPermitsResult
  ] = await Promise.all([
    // Get top counties using RPC function (bypasses RLS)
    supabase.rpc('get_dashboard_county_stats'),
    
    // Get top permit types using RPC function (bypasses RLS)
    supabase.rpc('get_dashboard_permit_type_stats'),
    
    // Get permit status breakdown using RPC function
    supabase.rpc('get_permit_status_breakdown'),
    
    // Get monthly trends for current year (2025) - Permit Issuance Trend
    supabase
      .from('dashboard_monthly_trends')
      .select('month, permit_count')
      .gte('month', `${new Date().getFullYear()}-01-01`)
      .lte('month', `${new Date().getFullYear()}-12-31`)
      .order('month', { ascending: true }),
    
    // Get permits over time (last 12 months) using RPC function (bypasses RLS)
    supabase.rpc('get_dashboard_permits_over_time'),
    
    // Get top applicants
    supabase
      .from('dashboard_applicant_stats')
      .select('applicant_name, permit_count')
      .limit(10),
    
    // Get permit status breakdown using RPC function (for widget)
    supabase.rpc('get_permit_status_breakdown'),
    
    // Get year-over-year comparison using RPC function
    supabase.rpc('get_year_over_year_comparison'),
    
    // Get acreage leaderboard using RPC function
    supabase.rpc('get_acreage_leaderboard'),
    
    // Get permits from last 30 days (direct query)
    supabase
      .from('erp_permits')
      .select('permit_number', { count: 'exact', head: true })
      .gte('issue_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  ])
  
  // Extract data and handle errors
  const { data: countyStats, error: countyError } = countyStatsResult
  if (countyError) console.error('County Stats Error:', countyError)
  
  const { data: permitTypeStats, error: permitTypeError } = permitTypeStatsResult
  if (permitTypeError) console.error('Permit Type Stats Error:', permitTypeError)
  
  const { data: statusStats, error: statusStatsError } = statusStatsResult
  if (statusStatsError) console.error('Status Stats Error:', statusStatsError)
  
  const { data: monthlyStats } = monthlyStatsResult
  
  const { data: timeStats, error: timeError } = timeStatsResult
  if (timeError) console.error('Permits Over Time Error:', timeError)
  
  const { data: applicantStats } = applicantStatsResult
  
  const { data: statusBreakdown, error: statusBreakdownError } = statusBreakdownResult
  if (statusBreakdownError) console.error('Status Breakdown Error:', statusBreakdownError)
  
  const { data: yoyComparison, error: yoyError } = yoyComparisonResult
  if (yoyError) console.error('Year-over-Year Comparison Error:', yoyError)
  
  const { data: leaderboard, error: leaderboardError } = leaderboardResult
  if (leaderboardError) console.error('Acreage Leaderboard Error:', leaderboardError)
  
  const { count: recentPermitsCount, error: recentPermitsError } = recentPermitsResult
  if (recentPermitsError) console.error('Recent Permits Error:', recentPermitsError)
  
  // Transform data
  const topCounties = (countyStats || []).map((row: { county: string; permit_count: number }) => ({
    county: row.county,
    count: row.permit_count
  }))
  
  const topPermitTypes = (permitTypeStats || []).map((row: { permit_type: string; permit_count: number }) => ({
    type: row.permit_type,
    count: row.permit_count
  }))
  
  // Note: permitsByStatus is now calculated from statusBreakdown (same data, just reformatted)
  const permitsByStatus = (statusStats || []).map((row: { status_category: string; permit_count: number }) => ({
    status: row.status_category,
    count: row.permit_count
  }))
  
  const trendData = (monthlyStats || []).map((row: { month: string; permit_count: number }) => ({
    month: new Date(row.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    count: row.permit_count
  }))
  
  const permitsOverTime = (timeStats || []).map((row: { month: string; permit_count: number }) => ({
    month: row.month,
    count: row.permit_count
  }))
  
  const topApplicants = (applicantStats || []).map((row: { applicant_name: string; permit_count: number }) => ({
    applicant: row.applicant_name,
    count: row.permit_count
  }))
  
  const permitStatusData = (statusBreakdown || []).map((row: { status_category: string; permit_count: number; percentage: number }) => ({
    status_category: row.status_category,
    permit_count: row.permit_count,
    percentage: row.percentage
  }))
  
  const yoyData = (yoyComparison || []).map((row: { metric: string; current_year_value: number; previous_year_value: number; change_count: number; change_percentage: number }) => ({
    metric: row.metric,
    current_year_value: row.current_year_value,
    previous_year_value: row.previous_year_value,
    change_count: row.change_count,
    change_percentage: row.change_percentage
  }))
  
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
  
  // Calculate overall stats from status breakdown (ensures consistency)
  const totalPermits = (statusBreakdown || []).reduce((sum: number, row: { permit_count: number }) => sum + row.permit_count, 0)
  
  // Get recent permits count from direct query (last 30 days)
  const recentPermits = recentPermitsCount || 0
  
  // Calculate average acreage from county stats
  const avgAcreage = (countyStats || []).length > 0
    ? Math.round(((countyStats || []).reduce((sum: number, row: { avg_acreage: number }) => sum + (row.avg_acreage || 0), 0) / (countyStats || []).length) * 100) / 100
    : 0
  
  return {
    totalPermits,
    recentPermits,
    topCounties,
    topPermitTypes,
    permitsByStatus,
    trendData,
    permitsOverTime,
    topApplicants,
    avgAcreage,
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
  const stats = await getDashboardStats()

  return (
    <DashboardLayout userEmail={null} userRole={null}>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="relative">
            <h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">
              Dashboard
            </h1>
            <div className="absolute bottom-0 left-0 w-20 h-1 bg-linear-to-r from-blue-600 to-cyan-500"></div>
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
