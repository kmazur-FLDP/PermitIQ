'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

interface DashboardChartsProps {
  topCounties: { county: string; count: number }[]
  topPermitTypes: { type: string; count: number }[]
  permitsByStatus: { status: string; count: number }[]
  trendData: { month: string; count: number }[]
  permitsOverTime: { month: string; count: number }[]
  topApplicants: { applicant: string; count: number }[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export function DashboardCharts({ topCounties, topPermitTypes, permitsByStatus, trendData, permitsOverTime, topApplicants }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Counties Bar Chart */}
      <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Permits by County</CardTitle>
          <CardDescription className="text-slate-600">Top 10 counties with most permits</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCounties}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="county" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
                fontWeight={600}
              />
              <YAxis fontWeight={600} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Permit Types Bar Chart */}
      <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Permits by Type</CardTitle>
          <CardDescription className="text-slate-600">Top 10 permit types</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPermitTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="type" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
                fontWeight={600}
              />
              <YAxis fontWeight={600} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Permit Status Pie Chart */}
      <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Permits by Status</CardTitle>
          <CardDescription className="text-slate-600">Distribution of permit statuses</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={permitsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
                strokeWidth={2}
                stroke="#fff"
              >
                {permitsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontWeight: 600
                }}
              />
              <Legend wrapperStyle={{ fontWeight: 600 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Permits Over Time Line Chart - NEW */}
      <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Permits Over Time</CardTitle>
          <CardDescription className="text-slate-600">Permit volume trend (last 2 years)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={permitsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                fontWeight={600}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis fontWeight={600} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#06b6d4" 
                strokeWidth={3}
                name="Permits"
                dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend Line Chart */}
      <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Permit Issuance Trend</CardTitle>
          <CardDescription className="text-slate-600">Monthly permit activity for current year (2025)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                fontWeight={600}
              />
              <YAxis fontWeight={600} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend wrapperStyle={{ fontWeight: 600 }} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Permits Issued"
                dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Applicants Bar Chart */}
      <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Top Applicants</CardTitle>
          <CardDescription className="text-slate-600">Top 10 applicants by permit count</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topApplicants} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" fontWeight={600} />
              <YAxis 
                dataKey="applicant" 
                type="category" 
                width={200}
                fontSize={12}
                fontWeight={600}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
