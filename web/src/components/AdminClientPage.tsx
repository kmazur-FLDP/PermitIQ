'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  last_login_at: string | null
}

interface ETLStats {
  last_run_date: string | null
  last_run_status: string | null
  last_records_updated: number | null
  total_runs_today: number
  total_runs_this_week: number
  avg_duration_seconds: number | null
  success_rate: number | null
}

interface ETLRun {
  id: number
  run_date: string
  status: string
  records_fetched: number
  records_inserted: number
  records_updated: number
  records_failed: number
  duration_seconds: number
  error_message: string | null
}

export default function AdminClientPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [etlStats, setETLStats] = useState<ETLStats | null>(null)
  const [recentETLRuns, setRecentETLRuns] = useState<ETLRun[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'user' })

  const supabase = createClient()

  const loadUsers = useCallback(async () => {
    // Use the SECURITY DEFINER function to bypass RLS
    const { data, error } = await supabase.rpc('get_all_users')

    if (error) {
      console.error('Error loading users:', error)
    } else if (data) {
      console.log('Loaded users:', data.length, 'users')
      setUsers(data as UserProfile[])
    }
  }, [supabase])

  const loadETLStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_etl_stats')
    if (!error && data) {
      setETLStats(data as ETLStats)
    }
  }, [supabase])

  const loadRecentETLRuns = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_recent_etl_runs')
    if (!error && data) {
      setRecentETLRuns(data as ETLRun[])
    }
  }, [supabase])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        loadUsers(),
        loadETLStats(),
        loadRecentETLRuns()
      ])
      setLoading(false)
    }
    loadData()
  }, [loadUsers, loadETLStats, loadRecentETLRuns])

  async function handleUpdateUser(userId: string, updates: Partial<UserProfile>) {
    // Use the admin function to update user
    const { error } = await supabase.rpc('admin_update_user', {
      user_id: userId,
      new_full_name: updates.full_name || null,
      new_role: updates.role || null
    })

    if (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user: ' + error.message)
    } else {
      await loadUsers()
      setEditingUser(null)
      setIsDialogOpen(false)
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    // Use the admin function to delete user
    const { error } = await supabase.rpc('admin_delete_user', {
      user_id: userId
    })

    if (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user: ' + error.message)
    } else {
      await loadUsers()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* ETL Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Last ETL Run</CardDescription>
              <CardTitle className="text-2xl">
                {etlStats?.last_run_date 
                  ? new Date(etlStats.last_run_date).toLocaleDateString()
                  : 'Never'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">
                Status: <span className={etlStats?.last_run_status === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {etlStats?.last_run_status || 'Unknown'}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Records Updated</CardDescription>
              <CardTitle className="text-3xl">
                {etlStats?.last_records_updated?.toLocaleString() || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Last run</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Success Rate (30d)</CardDescription>
              <CardTitle className="text-3xl">
                {etlStats?.success_rate?.toFixed(1) || 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">{etlStats?.total_runs_this_week || 0} runs this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg Duration</CardDescription>
              <CardTitle className="text-3xl">
                {etlStats?.avg_duration_seconds?.toFixed(0) || 0}s
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent ETL Runs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent ETL Runs</CardTitle>
            <CardDescription>Last 10 ETL job executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fetched</TableHead>
                    <TableHead>Inserted</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentETLRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>{new Date(run.run_date).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          run.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {run.status}
                        </span>
                      </TableCell>
                      <TableCell>{run.records_fetched.toLocaleString()}</TableCell>
                      <TableCell>{run.records_inserted.toLocaleString()}</TableCell>
                      <TableCell>{run.records_updated.toLocaleString()}</TableCell>
                      <TableCell>{run.records_failed.toLocaleString()}</TableCell>
                      <TableCell>{run.duration_seconds}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              <Button onClick={() => {
                setNewUser({ email: '', full_name: '', role: 'user' })
                setEditingUser(null)
                setIsDialogOpen(true)
              }}>
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user)
                              setIsDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit/Create User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information and permissions' : 'Add a new user to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editingUser ? editingUser.full_name || '' : newUser.full_name}
                  onChange={(e) => editingUser 
                    ? setEditingUser({ ...editingUser, full_name: e.target.value })
                    : setNewUser({ ...newUser, full_name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingUser ? editingUser.role : newUser.role}
                  onValueChange={(value) => editingUser
                    ? setEditingUser({ ...editingUser, role: value })
                    : setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (editingUser) {
                  handleUpdateUser(editingUser.id, {
                    full_name: editingUser.full_name,
                    role: editingUser.role
                  })
                } else {
                  // TODO: Implement create user via Supabase Auth Admin API
                  alert('Create user functionality requires backend implementation')
                  setIsDialogOpen(false)
                }
              }}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
