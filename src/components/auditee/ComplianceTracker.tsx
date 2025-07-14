"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, Clock, Target } from "lucide-react"

interface ComplianceData {
  overall_score: number
  total_requirements: number
  completed_requirements: number
  pending_requirements: number
  overdue_requirements: number
  critical_findings: number
  resolved_findings: number
  action_items: {
    total: number
    completed: number
    overdue: number
  }
  compliance_trends: Array<{
    month: string
    score: number
  }>
  gap_analysis: Array<{
    category: string
    current_score: number
    target_score: number
    gap: number
    priority: "high" | "medium" | "low"
  }>
  upcoming_deadlines: Array<{
    id: number
    title: string
    deadline: string
    days_remaining: number
    type: string
  }>
}

const ComplianceTracker: React.FC = () => {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months")

  useEffect(() => {
    fetchComplianceData()
  }, [selectedTimeframe])

  const fetchComplianceData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/company/compliance-status?timeframe=${selectedTimeframe}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      setComplianceData(data)
    } catch (error) {
      console.error("Error fetching compliance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#059669]"
    if (score >= 70) return "text-[#F59E0B]"
    return "text-[#DC2626]"
  }

  const getScoreBackground = (score: number) => {
    if (score >= 90) return "from-[#059669] to-[#047857]"
    if (score >= 70) return "from-[#F59E0B] to-[#D97706]"
    return "from-[#DC2626] to-[#B91C1C]"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-[#DC2626] text-white"
      case "medium":
        return "bg-[#F59E0B] text-white"
      case "low":
        return "bg-[#059669] text-white"
      default:
        return "bg-[#64748B] text-white"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    )
  }

  if (!complianceData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">No Compliance Data</h2>
          <p className="text-[#64748B]">Unable to load compliance information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Compliance Tracker</h1>
            <p className="text-[#64748B]">Monitor your organization's compliance status and progress</p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 mb-8">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" stroke="#E2E8F0" strokeWidth="8" fill="none" />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(complianceData.overall_score / 100) * 314} 314`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={`stop-color-[#059669]`} />
                  <stop offset="100%" className={`stop-color-[#047857]`} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(complianceData.overall_score)}`}>
                  {complianceData.overall_score}%
                </div>
                <div className="text-sm text-[#64748B]">Compliance</div>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-[#1E293B] mb-2">Overall Compliance Score</h2>
          <p className="text-[#64748B]">
            {complianceData.overall_score >= 90
              ? "Excellent compliance status"
              : complianceData.overall_score >= 70
                ? "Good compliance with room for improvement"
                : "Requires immediate attention"}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#059669] to-[#047857] rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{complianceData.completed_requirements}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Completed Requirements</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#059669]">
              {Math.round((complianceData.completed_requirements / complianceData.total_requirements) * 100)}% of total
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{complianceData.pending_requirements}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Pending Requirements</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#F59E0B]">Awaiting completion</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{complianceData.critical_findings}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Critical Findings</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#DC2626]">Requires attention</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E293B]">{complianceData.action_items.overdue}</span>
          </div>
          <h3 className="text-[#64748B] text-sm font-medium mb-1">Overdue Actions</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B5CF6]">
              {complianceData.action_items.completed}/{complianceData.action_items.total} completed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gap Analysis */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Gap Analysis</h3>
          <div className="space-y-4">
            {complianceData.gap_analysis.map((gap, index) => (
              <div key={index} className="border border-[#E2E8F0] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[#1E293B]">{gap.category}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                    {gap.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#64748B] mb-2">
                  <span>Current: {gap.current_score}%</span>
                  <span>Target: {gap.target_score}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] h-2 rounded-full"
                    style={{ width: `${gap.current_score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-[#64748B] mt-1">Gap: {gap.gap}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Upcoming Deadlines</h3>
          <div className="space-y-4">
            {complianceData.upcoming_deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`border-l-4 pl-4 py-2 ${
                  deadline.days_remaining <= 3
                    ? "border-[#DC2626] bg-[#FEF2F2]"
                    : deadline.days_remaining <= 7
                      ? "border-[#F59E0B] bg-[#FEF3C7]"
                      : "border-[#059669] bg-[#F0FDF4]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-[#1E293B]">{deadline.title}</h4>
                    <p className="text-sm text-[#64748B]">Due: {new Date(deadline.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        deadline.days_remaining <= 3
                          ? "text-[#DC2626]"
                          : deadline.days_remaining <= 7
                            ? "text-[#F59E0B]"
                            : "text-[#059669]"
                      }`}
                    >
                      {deadline.days_remaining}
                    </div>
                    <div className="text-xs text-[#64748B]">days left</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Trends */}
      <div className="mt-8 bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="text-lg font-semibold text-[#1E293B] mb-4">Compliance Trends</h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {complianceData.compliance_trends.map((trend, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full bg-gradient-to-t ${getScoreBackground(trend.score)} rounded-t`}
                style={{ height: `${(trend.score / 100) * 200}px` }}
              ></div>
              <div className="text-xs text-[#64748B] mt-2 text-center">
                <div className="font-medium">{trend.score}%</div>
                <div>{trend.month}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ComplianceTracker
