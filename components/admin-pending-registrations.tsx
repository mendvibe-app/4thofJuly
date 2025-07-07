"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Clock, 
  Check, 
  X, 
  Users, 
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import type { PendingRegistration, Tournament } from "@/types/tournament"
import { supabase } from "@/lib/supabase"
import { useAdmin } from "@/hooks/use-admin"

interface AdminPendingRegistrationsProps {
  pendingRegistrations: PendingRegistration[]
  tournaments: Tournament[]
  onRegistrationUpdated?: () => void
}

export default function AdminPendingRegistrations({
  pendingRegistrations,
  tournaments,
  onRegistrationUpdated,
}: AdminPendingRegistrationsProps) {
  const { adminName } = useAdmin()
  const [reviewingRegistration, setReviewingRegistration] = useState<PendingRegistration | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const openReviewDialog = (registration: PendingRegistration) => {
    setReviewingRegistration(registration)
    setAdminNotes(registration.adminNotes || "")
    setError("")
    setIsReviewDialogOpen(true)
  }

  const handleApproveRegistration = async (registration: PendingRegistration, notes?: string) => {
    setIsSubmitting(true)
    setError("")

    try {
      // First, approve the registration
      const { error: approveError } = await supabase
        .from("pending_team_registrations")
        .update({
          status: 'approved',
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminName || 'Admin'
        })
        .eq("id", registration.id)

      if (approveError) throw approveError

      // Then, create the actual team
      const { error: teamError } = await supabase
        .from("teams")
        .insert({
          tournament_id: registration.tournamentId,
          name: registration.teamName,
          players: registration.players,
          paid: false, // Teams start as unpaid
          wins: 0,
          losses: 0,
          points_for: 0,
          points_against: 0,
        })

      if (teamError) throw teamError

      if (onRegistrationUpdated) onRegistrationUpdated()
      setIsReviewDialogOpen(false)
    } catch (error) {
      console.error("Error approving registration:", error)
      setError(error instanceof Error ? error.message : "Failed to approve registration")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectRegistration = async (registration: PendingRegistration, notes?: string) => {
    setIsSubmitting(true)
    setError("")

    try {
      const { error: rejectError } = await supabase
        .from("pending_team_registrations")
        .update({
          status: 'rejected',
          admin_notes: notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminName || 'Admin'
        })
        .eq("id", registration.id)

      if (rejectError) throw rejectError

      if (onRegistrationUpdated) onRegistrationUpdated()
      setIsReviewDialogOpen(false)
    } catch (error) {
      console.error("Error rejecting registration:", error)
      setError(error instanceof Error ? error.message : "Failed to reject registration")
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickApprove = async (registration: PendingRegistration) => {
    if (!confirm(`Approve registration for "${registration.teamName}"?`)) {
      return
    }
    await handleApproveRegistration(registration)
  }

  const quickReject = async (registration: PendingRegistration) => {
    if (!confirm(`Reject registration for "${registration.teamName}"?`)) {
      return
    }
    await handleRejectRegistration(registration)
  }

  const getStatusBadge = (status: PendingRegistration['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
    }
  }

  const getTournamentName = (tournamentId: number) => {
    const tournament = tournaments.find(t => t.id === tournamentId)
    return tournament?.name || `Tournament ${tournamentId}`
  }

  const pendingCount = pendingRegistrations.filter(r => r.status === 'pending').length
  const approvedCount = pendingRegistrations.filter(r => r.status === 'approved').length
  const rejectedCount = pendingRegistrations.filter(r => r.status === 'rejected').length

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500 rounded-xl text-white">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Pending Registrations</h2>
          <p className="text-slate-600 outdoor-text">Review and approve team registrations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="tournament-card">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-slate-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="tournament-card">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-slate-600">Approved</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="tournament-card">
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-sm text-slate-600">Rejected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations List */}
      {pendingRegistrations.length === 0 ? (
        <Card className="tournament-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Registrations</h3>
              <p className="text-slate-600">
                No team registrations have been submitted yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRegistrations.map((registration) => (
            <Card key={registration.id} className="tournament-card">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 truncate">
                        {registration.teamName}
                      </h3>
                      {getStatusBadge(registration.status)}
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <p className="text-slate-600 outdoor-text flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {registration.players.join(" & ")}
                      </p>
                      
                      <p className="text-slate-600 outdoor-text flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {getTournamentName(registration.tournamentId)}
                      </p>
                      
                      {registration.contactInfo && (
                        <p className="text-slate-600 outdoor-text flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {registration.contactInfo}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-500">
                      Submitted {new Date(registration.submittedAt).toLocaleDateString()} at {new Date(registration.submittedAt).toLocaleTimeString()}
                    </p>
                    
                    {registration.reviewedAt && (
                      <p className="text-sm text-slate-500">
                        Reviewed by {registration.reviewedBy} on {new Date(registration.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                    
                    {registration.adminNotes && (
                      <div className="mt-2 p-2 bg-slate-50 rounded border">
                        <p className="text-sm text-slate-600">
                          <strong>Admin Notes:</strong> {registration.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {registration.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => quickApprove(registration)}
                          disabled={isSubmitting}
                          className="touch-target bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => quickReject(registration)}
                          disabled={isSubmitting}
                          className="touch-target border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openReviewDialog(registration)}
                          className="touch-target border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Review
                        </Button>
                      </>
                    )}
                    
                    {registration.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReviewDialog(registration)}
                        className="touch-target border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Review Registration
            </DialogTitle>
          </DialogHeader>
          
          {reviewingRegistration && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900">{reviewingRegistration.teamName}</h3>
                <p className="text-slate-600">
                  {reviewingRegistration.players.join(" & ")}
                </p>
                <p className="text-slate-600">
                  Tournament: {getTournamentName(reviewingRegistration.tournamentId)}
                </p>
                {reviewingRegistration.contactInfo && (
                  <p className="text-slate-600">
                    Contact: {reviewingRegistration.contactInfo}
                  </p>
                )}
                <p className="text-sm text-slate-500">
                  Submitted: {new Date(reviewingRegistration.submittedAt).toLocaleString()}
                </p>
                {getStatusBadge(reviewingRegistration.status)}
              </div>

              <div>
                <Label htmlFor="admin-notes" className="outdoor-text">Admin Notes (optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this registration..."
                  className="mt-1 outdoor-text resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {reviewingRegistration.status === 'pending' ? (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleRejectRegistration(reviewingRegistration, adminNotes)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="flex-1 outdoor-text border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {isSubmitting ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    onClick={() => handleApproveRegistration(reviewingRegistration, adminNotes)}
                    disabled={isSubmitting}
                    className="flex-1 outdoor-text bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {isSubmitting ? "Approving..." : "Approve"}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsReviewDialogOpen(false)}
                  className="w-full outdoor-text"
                >
                  Close
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 