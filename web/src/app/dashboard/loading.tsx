import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DashboardLayout } from '@/components/DashboardLayout'

export default function DashboardLoading() {
  return (
    <DashboardLayout userEmail={null} userRole={null}>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section Skeleton */}
        <div className="mb-10">
          <div className="relative">
            <div className="h-12 w-64 bg-slate-200 animate-pulse rounded-lg mb-3"></div>
            <div className="absolute bottom-0 left-0 w-20 h-1 bg-linear-to-r from-blue-400 to-cyan-400 opacity-50"></div>
          </div>
          <div className="h-6 w-96 bg-slate-200 animate-pulse rounded mt-4"></div>
        </div>

        {/* Key Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white border border-slate-200 shadow-md">
              <CardHeader className="pb-3">
                <div className="h-4 w-24 bg-slate-200 animate-pulse rounded mb-3"></div>
                <div className="h-10 w-32 bg-slate-300 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-28 bg-slate-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Widgets Skeleton - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-white border border-slate-200 shadow-md">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="h-6 w-48 bg-slate-200 animate-pulse rounded"></div>
                <div className="h-4 w-64 bg-slate-100 animate-pulse rounded mt-2"></div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-20 bg-slate-100 animate-pulse rounded-xl"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white border border-slate-200 shadow-md">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="h-6 w-40 bg-slate-200 animate-pulse rounded"></div>
                  <div className="h-4 w-56 bg-slate-100 animate-pulse rounded mt-2"></div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[300px] bg-slate-100 animate-pulse rounded-lg"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard Skeleton */}
        <div className="mt-10">
          <Card className="bg-white border border-slate-200 shadow-md">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="h-6 w-48 bg-slate-200 animate-pulse rounded"></div>
              <div className="h-4 w-64 bg-slate-100 animate-pulse rounded mt-2"></div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
