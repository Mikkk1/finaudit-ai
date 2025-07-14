"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Button } from "../../ui/button.tsx"
import { Input } from "../../ui/input.tsx"
import { Textarea } from "../../ui/textarea.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs.tsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select.tsx"
import { Alert, AlertDescription } from "../../ui/alert.tsx"
import { Progress } from "../../ui/progress.tsx"
import {
  Search,
  Plus,
  CalendarIcon,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  Bot,
  MessageSquare,
  Upload,
  Download,
  Eye,
  Send,
  MapPin,
  Link,
  User,
  Target,
  Activity,
  Zap,
} from "lucide-react"
import { format } from "date-fns"

interface Finding {
  id: number
  finding_id: string
  title: string
  description: string
  finding_type: string
  severity: "critical" | "major" | "minor" | "informational"
  status: "open" | "in_progress" | "resolved" | "closed"
  ai_detected: boolean
  ai_confidence_score: number
  ai_risk_score: number
  ai_recommendations: string[]
  document_id?: number
  document_page?: number
  document_section?: string
  meeting_id?: number
  assigned_to?: string
  assigned_date?: string
  due_date?: string
  resolved_date?: string
  evidence: any
  remediation_plan?: string
  remediation_status?: string
  remediation_notes?: string
  created_by: string
  created_at: string
  updated_at: string
  audit?: {
    id: number
    name: string
  }
  comments_count: number
}

interface Meeting {
  id: number
  meeting_id: string
  title: string
  description?: string
  meeting_type: string
  scheduled_time: string
  end_time?: string
  duration_minutes: number
  location?: string
  meeting_url?: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  organizer: string
  participants: string[]
  agenda: string[]
  minutes?: string
  action_items: any[]
  ai_summary?: string
  created_by: string
  created_at: string
  audit?: {
    id: number
    name: string
  }
}

interface Comment {
  id: number
  comment: string
  comment_type: string
  created_by: string
  created_at: string
}

interface DashboardStats {
  total_findings: number
  open_findings: number
  critical_findings: number
  ai_detected_findings: number
  upcoming_meetings: number
}

export default function AuditFindings() {
  // State management
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") // Assuming token is stored in localStorage
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }
  const [activeTab, setActiveTab] = useState("dashboard")
  const [findings, setFindings] = useState<Finding[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [findingForm, setFindingForm] = useState({
    audit_id: 1, // Default audit ID - you might want to make this dynamic
    title: "",
    description: "",
    finding_type: "compliance",
    severity: "medium",
    assigned_to: "",
    due_date: "",
    remediation_plan: "",
  })

  const [meetingForm, setMeetingForm] = useState({
    audit_id: 1, // Default audit ID
    title: "",
    description: "",
    meeting_type: "progress",
    scheduled_time: "",
    duration_minutes: 60,
    location: "",
    meeting_url: "",
    organizer: "",
    participants: [] as string[],
    agenda: [] as string[],
  })

  const [newComment, setNewComment] = useState("")
  const [commentType, setCommentType] = useState("general")

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    severity: "",
    type: "",
    assigned_to: "",
    search: "",
  })

  // Dialog states
  const [showFindingDialog, setShowFindingDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showFindingDetails, setShowFindingDetails] = useState(false)
  const [showMeetingDetails, setShowMeetingDetails] = useState(false)

  // Load data on component mount
  useEffect(() => {
    loadDashboardStats()
    loadFindings()
    loadMeetings()
  }, [])

  // API calls
  const loadDashboardStats = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/findings/dashboard/stats", {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch dashboard stats")
      const data = await response.json()
      setDashboardStats(data.stats)
    } catch (err) {
      setError("Failed to load dashboard stats")
      console.error(err)
    }
  }

  const loadFindings = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })

      const response = await fetch(`http://127.0.0.1:8000/api/findings?${queryParams}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch findings")
      const data = await response.json()
      setFindings(data.findings)
    } catch (err) {
      setError("Failed to load findings")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadMeetings = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        per_page: '20'
      });
      
      const response = await fetch(`http://127.0.0.1:8000/api/findings/meetings/all?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error("Failed to fetch meetings");
      const data = await response.json();
      setMeetings(data.meetings);
    } catch (err) {
      setError("Failed to load meetings");
      console.error(err);
    }
  };

  const createFinding = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/findings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(findingForm),
      })

      if (!response.ok) throw new Error("Failed to create finding")

      setShowFindingDialog(false)
      setFindingForm({
        audit_id: 1,
        title: "",
        description: "",
        finding_type: "compliance",
        severity: "medium",
        assigned_to: "",
        due_date: "",
        remediation_plan: "",
      })
      loadFindings()
      loadDashboardStats()
    } catch (err) {
      setError("Failed to create finding")
      console.error(err)
    }
  }

  const createMeeting = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/findings/meetings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(meetingForm),
      })

      if (!response.ok) throw new Error("Failed to create meeting")

      setShowMeetingDialog(false)
      setMeetingForm({
        audit_id: 1,
        title: "",
        description: "",
        meeting_type: "progress",
        scheduled_time: "",
        duration_minutes: 60,
        location: "",
        meeting_url: "",
        organizer: "",
        participants: [],
        agenda: [],
      })
      loadMeetings()
      loadDashboardStats()
    } catch (err) {
      setError("Failed to create meeting")
      console.error(err)
    }
  }

  const updateFindingStatus = async (findingId: number, status: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/findings/${findingId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update finding status")

      loadFindings()
      loadDashboardStats()
    } catch (err) {
      setError("Failed to update finding status")
      console.error(err)
    }
  }

  const loadFindingComments = async (findingId: number) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/findings/${findingId}/comments`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to fetch comments")
      const data = await response.json()
      setComments(data.comments)
    } catch (err) {
      setError("Failed to load comments")
      console.error(err)
    }
  }

  const addComment = async () => {
    if (!selectedFinding || !newComment.trim()) return

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/findings/${selectedFinding.id}/comments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          comment: newComment,
          comment_type: commentType,
        }),
      })

      if (!response.ok) throw new Error("Failed to add comment")

      setNewComment("")
      loadFindingComments(selectedFinding.id)
    } catch (err) {
      setError("Failed to add comment")
      console.error(err)
    }
  }

  const analyzeDocumentWithAI = async (file: File) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("audit_id", "1") // Default audit ID

      const token = localStorage.getItem("authToken") // Get token for FormData request
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch("http://127.0.0.1:8000/api/findings/ai/analyze-document", {
        method: "POST",
        headers: headers, // Use the headers object directly for FormData
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to analyze document")

      const data = await response.json()
      alert(`${data.findings_count} findings detected by AI`)
      loadFindings()
      loadDashboardStats()
    } catch (err) {
      setError("Failed to analyze document")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Utility functions
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white"
      case "major":
        return "bg-orange-500 text-white"
      case "minor":
        return "bg-yellow-500 text-white"
      case "informational":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Findings</p>
                <p className="text-2xl font-bold">{dashboardStats?.total_findings || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Findings</p>
                <p className="text-2xl font-bold text-red-600">{dashboardStats?.open_findings || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Findings</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardStats?.critical_findings || 0}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Detected</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardStats?.ai_detected_findings || 0}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Meetings</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats?.upcoming_meetings || 0}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setShowFindingDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Finding
            </Button>
            <Button onClick={() => setShowMeetingDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) analyzeDocumentWithAI(file)
                }}
              />
              AI Document Analysis
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {findings.slice(0, 5).map((finding) => (
              <div
                key={finding.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {finding.ai_detected && <Bot className="h-4 w-4 text-purple-500" />}
                  <div>
                    <p className="font-medium">{finding.title}</p>
                    <p className="text-sm text-gray-600">{finding.finding_id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                  <Badge variant="outline" className={getStatusColor(finding.status)}>
                    {finding.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFinding(finding)
                      loadFindingComments(finding.id)
                      setShowFindingDetails(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render Findings List
  const renderFindings = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search findings..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="informational">Informational</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadFindings} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <div className="space-y-4">
        {findings.map((finding) => (
          <Card key={finding.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{finding.title}</h3>
                    {finding.ai_detected && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Detected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{finding.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>ID: {finding.finding_id}</span>
                    <span>Type: {finding.finding_type}</span>
                    {finding.assigned_to && <span>Assigned: {finding.assigned_to}</span>}
                    {finding.due_date && <span>Due: {format(new Date(finding.due_date), "MMM dd, yyyy")}</span>}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {finding.comments_count}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSeverityColor(finding.severity)}>{finding.severity}</Badge>
                  <Badge variant="outline" className={getStatusColor(finding.status)}>
                    {finding.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFinding(finding)
                      loadFindingComments(finding.id)
                      setShowFindingDetails(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {finding.ai_detected && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">AI Analysis</span>
                    <div className="flex space-x-4 text-xs text-purple-600">
                      <span>Confidence: {(finding.ai_confidence_score * 100).toFixed(0)}%</span>
                      <span>Risk: {(finding.ai_risk_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  {finding.ai_recommendations && finding.ai_recommendations.length > 0 && (
                    <div className="text-sm text-purple-700">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {finding.ai_recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Render Meetings
  const renderMeetings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audit Meetings</h2>
        <Button onClick={() => setShowMeetingDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <Card key={meeting.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{meeting.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {meeting.meeting_type.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(new Date(meeting.scheduled_time), "PPP p")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{meeting.duration_minutes} minutes</span>
                    </div>
                    {meeting.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    {meeting.meeting_url && (
                      <div className="flex items-center space-x-2">
                        <Link className="h-4 w-4" />
                        <a
                          href={meeting.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Organizer: {meeting.organizer}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{meeting.participants.length} participants</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getMeetingStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMeeting(meeting)
                      setShowMeetingDetails(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Finding Module</h1>
          <p className="text-gray-600 mt-1">Comprehensive audit findings and meeting management</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="findings" className="mt-6">
          {renderFindings()}
        </TabsContent>

        <TabsContent value="meetings" className="mt-6">
          {renderMeetings()}
        </TabsContent>
      </Tabs>

      {/* Create Finding Dialog */}
      <Dialog open={showFindingDialog} onOpenChange={setShowFindingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Finding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Finding Title"
              value={findingForm.title}
              onChange={(e) => setFindingForm({ ...findingForm, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={findingForm.description}
              onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={findingForm.finding_type}
                onValueChange={(value) => setFindingForm({ ...findingForm, finding_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Finding Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={findingForm.severity}
                onValueChange={(value) => setFindingForm({ ...findingForm, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="informational">Informational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Assigned To"
                value={findingForm.assigned_to}
                onChange={(e) => setFindingForm({ ...findingForm, assigned_to: e.target.value })}
              />
              <Input
                type="date"
                placeholder="Due Date"
                value={findingForm.due_date}
                onChange={(e) => setFindingForm({ ...findingForm, due_date: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Remediation Plan"
              value={findingForm.remediation_plan}
              onChange={(e) => setFindingForm({ ...findingForm, remediation_plan: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFindingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createFinding}>Create Finding</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Meeting Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Meeting Title"
              value={meetingForm.title}
              onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={meetingForm.description}
              onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={meetingForm.meeting_type}
                onValueChange={(value) => setMeetingForm({ ...meetingForm, meeting_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Meeting Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kickoff">Kickoff</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="exit">Exit</SelectItem>
                  <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Duration (minutes)"
                value={meetingForm.duration_minutes}
                onChange={(e) => setMeetingForm({ ...meetingForm, duration_minutes: Number.parseInt(e.target.value) })}
              />
            </div>
            <Input
              type="datetime-local"
              value={meetingForm.scheduled_time}
              onChange={(e) => setMeetingForm({ ...meetingForm, scheduled_time: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Location"
                value={meetingForm.location}
                onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
              />
              <Input
                placeholder="Meeting Link"
                value={meetingForm.meeting_url}
                onChange={(e) => setMeetingForm({ ...meetingForm, meeting_url: e.target.value })}
              />
            </div>
            <Input
              placeholder="Organizer"
              value={meetingForm.organizer}
              onChange={(e) => setMeetingForm({ ...meetingForm, organizer: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createMeeting}>Schedule Meeting</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finding Details Dialog */}
      <Dialog open={showFindingDetails} onOpenChange={setShowFindingDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finding Details</DialogTitle>
          </DialogHeader>
          {selectedFinding && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Finding ID</label>
                  <p className="text-sm text-gray-600">{selectedFinding.finding_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(selectedFinding.status)}>{selectedFinding.status}</Badge>
                    <Select
                      value={selectedFinding.status}
                      onValueChange={(value) => updateFindingStatus(selectedFinding.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <p className="text-sm text-gray-600 mt-1">{selectedFinding.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-gray-600 mt-1">{selectedFinding.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedFinding.finding_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Badge className={getSeverityColor(selectedFinding.severity)}>{selectedFinding.severity}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedFinding.assigned_to || "Unassigned"}</p>
                </div>
              </div>

              {selectedFinding.ai_detected && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-700 mb-2">AI Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="text-xs text-purple-600">Confidence Score</label>
                      <Progress value={selectedFinding.ai_confidence_score * 100} className="mt-1" />
                      <span className="text-xs text-purple-600">
                        {(selectedFinding.ai_confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <label className="text-xs text-purple-600">Risk Score</label>
                      <Progress value={selectedFinding.ai_risk_score * 100} className="mt-1" />
                      <span className="text-xs text-purple-600">
                        {(selectedFinding.ai_risk_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {selectedFinding.ai_recommendations && selectedFinding.ai_recommendations.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-purple-700">AI Recommendations</label>
                      <ul className="list-disc list-inside mt-1 text-sm text-purple-600">
                        {selectedFinding.ai_recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedFinding.remediation_plan && (
                <div>
                  <label className="text-sm font-medium">Remediation Plan</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedFinding.remediation_plan}</p>
                </div>
              )}

              {/* Comments Section */}
              <div>
                <h4 className="font-medium mb-3">Comments ({comments.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">{comment.created_by}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.created_at), "MMM dd, yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                      {comment.comment_type !== "general" && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {comment.comment_type}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    className="min-h-[80px]"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-between items-center">
                    <Select value={commentType} onValueChange={setCommentType}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="resolution">Resolution</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Meeting Details Dialog */}
      <Dialog open={showMeetingDetails} onOpenChange={setShowMeetingDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meeting Details</DialogTitle>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Meeting ID</label>
                  <p className="text-sm text-gray-600">{selectedMeeting.meeting_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getMeetingStatusColor(selectedMeeting.status)}>{selectedMeeting.status}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <p className="text-sm text-gray-600 mt-1">{selectedMeeting.title}</p>
              </div>

              {selectedMeeting.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedMeeting.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Scheduled Date</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(selectedMeeting.scheduled_time), "PPP p")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedMeeting.duration_minutes} minutes</p>
                </div>
              </div>

              {selectedMeeting.location && (
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedMeeting.location}</p>
                </div>
              )}

              {selectedMeeting.meeting_url && (
                <div>
                  <label className="text-sm font-medium">Meeting Link</label>
                  <a
                    href={selectedMeeting.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 block"
                  >
                    {selectedMeeting.meeting_url}
                  </a>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Organizer</label>
                <p className="text-sm text-gray-600 mt-1">{selectedMeeting.organizer}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Participants</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMeeting.participants.map((participant, index) => (
                    <Badge key={index} variant="outline">
                      {participant}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Agenda</label>
                  <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                    {selectedMeeting.agenda.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedMeeting.minutes && (
                <div>
                  <label className="text-sm font-medium">Meeting Minutes</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMeeting.minutes}</p>
                  </div>
                </div>
              )}

              {selectedMeeting.ai_summary && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">AI Summary</h4>
                  <p className="text-sm text-blue-600">{selectedMeeting.ai_summary}</p>
                </div>
              )}

              {selectedMeeting.action_items && selectedMeeting.action_items.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Action Items</label>
                  <div className="mt-1 space-y-2">
                    {selectedMeeting.action_items.map((item, index) => (
                      <div key={index} className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <p className="text-sm text-gray-700">{item.description || item}</p>
                        {item.assignee && <p className="text-xs text-gray-500 mt-1">Assigned to: {item.assignee}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
