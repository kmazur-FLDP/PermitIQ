import { DashboardLayout } from '@/components/DashboardLayout'
import { PermitMap } from '@/components/PermitMap'

export default async function MapPage() {
  return (
    <DashboardLayout userEmail={null} userRole={null}>
      <div className="h-[calc(100vh-6rem)] relative">
        <PermitMap />
      </div>
    </DashboardLayout>
  )
}
