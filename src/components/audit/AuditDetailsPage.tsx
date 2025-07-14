"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../ui/button.tsx"
import { ArrowLeft, Calendar, User, Building } from "lucide-react"
import AuditDetailsActions from "./AuditDetails/AuditDetailsActions.tsx"
import AuditDetailsTabs from "./AuditDetails/AuditDetailsTabs.tsx"
import { useAxios } from "../../hooks/useAxios.ts"

interface AuditDetail {
  id: number
  name: string
  description: string
  financial_audit_type: string
  status: "planned" | "in_progress" | "completed" | "cancelled" | "pending_approval"
  approval_status: "pending" | "approved" | "rejected" | "requires_revision"
  progress: number
  deadline: string
  start_date: string
  end_date: string
  materiality_threshold: number
  estimated_budget: number
  complexity_score: number
  ai_confidence_score: number
  industry_type: string
  compliance_frameworks: string[]
  audit_methodology: string
  scope: string
  created_by: string
  created_at: string
  updated_at: string
  requires_approval: boolean
  ai_risk_score: number
  ai_suggestions: any
  historical_data_used: any
  assigned_auditors: Array<{
    id: number
    name: string
    email: string
    role: string
  }>
  document_requirements: Array<{
    id: number
    document_type: string
    deadline: string
    is_mandatory: boolean
    status: "pending" | "submitted" | "approved" | "rejected"
    submissions_count: number
  }>
  findings: Array<{
    id: number
    title: string
    severity: "critical" | "major" | "minor" | "informational"
    status: "open" | "resolved" | "in_progress"
    created_at: string
  }>
  meetings: Array<{
    id: number
    title: string
    meeting_type: string
    scheduled_time: string
    status: "scheduled" | "completed" | "cancelled"
  }>
  risk_assessments: Array<{
    id: number
    category: string
    risk_level: string
    description: string
    confidence_score: number
  }>
}

const AuditDetailsPage: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>()
  const navigate = useNavigate()
  const axios = useAxios()
  const [audit, setAudit] = useState<AuditDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Fetching audit detail for ID:", auditId)
    if (auditId) {
      fetchAuditDetail(Number.parseInt(auditId))
    }
  }, [auditId])

  const fetchAuditDetail = async (auditId: number) => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/audits/${auditId}`)
      console.log("Audit detail fetched successfully:", response.data)
      setAudit(response.data.audit)
    } catch (error: any) {
      console.error("Error fetching audit detail:", error)
      const errorMessage = error.response?.data?.detail || "Failed to fetch audit details"
      alert(errorMessage)
      navigate("/audits")
    } finally {
      setLoading(false)
    }
  }

  const handleAuditUpdate = () => {
    if (auditId) {
      fetchAuditDetail(Number.parseInt(auditId))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-8xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-[#E2E8F0] rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-8 bg-[#E2E8F0] rounded w-1/3"></div>
                <div className="h-4 bg-[#E2E8F0] rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-[#E2E8F0] rounded-xl"></div>
              <div className="h-32 bg-[#E2E8F0] rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-8xl mx-auto">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building className="w-10 h-10 text-[#64748B]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E293B] mb-4">Audit Not Found</h1>
            <p className="text-[#64748B] mb-6">The requested audit could not be found.</p>
            <Button
              onClick={() => navigate("/audits")}
              className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Audits
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/audits")}
              className="p-3 hover:bg-[#F1F5F9] transition-all duration-200 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
                {audit.name}
              </h1>
              <div className="flex items-center gap-6 text-sm text-[#64748B]">
                <div className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
                  <div className="w-2 h-2 bg-[#059669] rounded-full"></div>
                  <span className="capitalize font-medium">{audit.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Created by {audit.created_by}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(audit.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{audit.financial_audit_type.replace("_", " ").toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <AuditDetailsActions
            auditId={audit.id}
            auditStatus={audit.status}
            auditApprovalStatus={audit.approval_status}
            onStartAudit={handleAuditUpdate}
            onPauseAudit={handleAuditUpdate}
            onViewRequirements={() => console.log("View requirements")}
            onAddRequirement={() => console.log("Add requirement")}
          />
        </div>

        {/* Enhanced Tabs */}
        <AuditDetailsTabs auditId={audit.id} auditData={audit} />
      </div>
    </div>
  )
}

export default AuditDetailsPage
