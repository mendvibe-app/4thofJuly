"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Calendar, 
  Plus, 
  Trophy, 
  Edit2, 
  Trash2, 
  Users, 
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertCircle 
} from "lucide-react"
import type { Tournament, TournamentStatus, TournamentPhase } from "@/types/tournament"
import { supabase } from "@/lib/supabase"

interface AdminTournamentManagementProps {
  tournaments: Tournament[]
  onTournamentCreated?: () => void
  onTournamentUpdated?: () => void
  onTournamentDeleted?: () => void
}

export default function AdminTournamentManagement({
  tournaments,
  onTournamentCreated,
  onTournamentUpdated,
  onTournamentDeleted,
}: AdminTournamentManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [status, setStatus] = useState<TournamentStatus>("upcoming")
  const [currentPhase, setCurrentPhase] = useState<TournamentPhase>("registration")

  const resetForm = () => {
    setName("")
    setDate("")
    setStatus("upcoming")
    setCurrentPhase("registration")
    setError("")
  }

  const openCreateDialog = () => {
    resetForm()
    setEditingTournament(null)
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (tournament: Tournament) => {
    setName(tournament.name)
    setDate(tournament.date.split('T')[0]) // Format for date input
    setStatus(tournament.status)
    setCurrentPhase(tournament.currentPhase)
    setEditingTournament(tournament)
    setError("")
    setIsCreateDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Tournament name is required")
      return
    }
    if (!date) {
      setError("Tournament date is required")
      return
    }

    setIsSubmitting(true)

    try {
      if (editingTournament) {
        // Update existing tournament
        const { error: updateError } = await supabase
          .from("tournaments")
          .update({
            name: name.trim(),
            date,
            status,
            current_phase: currentPhase,
          })
          .eq("id", editingTournament.id)

        if (updateError) throw updateError

        if (onTournamentUpdated) onTournamentUpdated()
      } else {
        // Create new tournament
        const { error: createError } = await supabase
          .from("tournaments")
          .insert({
            name: name.trim(),
            date,
            status,
            current_phase: currentPhase,
          })

        if (createError) throw createError

        if (onTournamentCreated) onTournamentCreated()
      }

      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving tournament:", error)
      setError(error instanceof Error ? error.message : "Failed to save tournament")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTournament = async (tournament: Tournament) => {
    if (!confirm(`Are you sure you want to delete "${tournament.name}"? This will also delete all teams and matches for this tournament.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournament.id)

      if (error) throw error

      if (onTournamentDeleted) onTournamentDeleted()
    } catch (error) {
      console.error("Error deleting tournament:", error)
      alert("Failed to delete tournament: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const getStatusBadge = (tournament: Tournament) => {
    switch (tournament.status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
    }
  }

  const getPhaseBadge = (phase: TournamentPhase) => {
    switch (phase) {
      case 'registration':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Registration</Badge>
      case 'pool-play':
        return <Badge variant="outline" className="text-orange-600 border-orange-300">Pool Play</Badge>
      case 'knockout':
        return <Badge variant="outline" className="text-red-600 border-red-300">Knockout</Badge>
    }
  }

  const getStatusIcon = (status: TournamentStatus) => {
    switch (status) {
      case 'upcoming':
        return <Calendar className="w-4 h-4" />
      case 'active':
        return <PlayCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500 rounded-xl text-white">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Tournament Management</h2>
            <p className="text-slate-600 outdoor-text">Create and manage tournaments</p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openCreateDialog}
              className="bg-purple-600 hover:bg-purple-700 outdoor-text"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Tournament
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {editingTournament ? "Edit Tournament" : "Create New Tournament"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tournament-name" className="outdoor-text">Tournament Name *</Label>
                <Input
                  id="tournament-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., 4th of July Tournament 2025"
                  className="mt-1 outdoor-text"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="tournament-date" className="outdoor-text">Tournament Date *</Label>
                <Input
                  id="tournament-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 outdoor-text"
                />
              </div>

              <div>
                <Label htmlFor="tournament-status" className="outdoor-text">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as TournamentStatus)}>
                  <SelectTrigger className="mt-1 outdoor-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tournament-phase" className="outdoor-text">Current Phase</Label>
                <Select value={currentPhase} onValueChange={(value) => setCurrentPhase(value as TournamentPhase)}>
                  <SelectTrigger className="mt-1 outdoor-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="pool-play">Pool Play</SelectItem>
                    <SelectItem value="knockout">Knockout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1 outdoor-text"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 outdoor-text bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? "Saving..." : (editingTournament ? "Update" : "Create")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tournaments List */}
      {tournaments.length === 0 ? (
        <Card className="tournament-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Tournaments</h3>
              <p className="text-slate-600 mb-4">
                Create your first tournament to get started.
              </p>
              <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="tournament-card">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(tournament.status)}
                      <h3 className="text-lg font-bold text-slate-900 truncate">
                        {tournament.name}
                      </h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getStatusBadge(tournament)}
                      {getPhaseBadge(tournament.currentPhase)}
                    </div>
                    
                    <p className="text-slate-600 outdoor-text">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date(tournament.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(tournament)}
                      className="touch-target border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTournament(tournament)}
                      className="touch-target border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 