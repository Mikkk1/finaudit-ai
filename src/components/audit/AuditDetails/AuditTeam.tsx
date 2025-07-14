"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/Card.tsx"
import { Badge } from "../../ui/badge.tsx"
import { Button } from "../../ui/button.tsx"
import { Users, Mail, Plus, UserCheck, Award, Clock, Shield, Star } from "lucide-react"

interface AuditTeamProps {
  auditId: number
  auditData: any
}

const AuditTeam: React.FC<AuditTeamProps> = ({ auditId, auditData }) => {
  const assignedAuditors = auditData?.assigned_auditors || []

  const getRoleColor = (role: string) => {
    switch (role) {
      case "lead_auditor":
        return "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20"
      case "senior_auditor":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
      case "auditor":
        return "bg-[#059669]/10 text-[#059669] border-[#059669]/20"
      case "junior_auditor":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
      case "specialist":
        return "bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20"
      default:
        return "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/20"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "lead_auditor":
        return <Star className="w-4 h-4" />
      case "senior_auditor":
        return <Award className="w-4 h-4" />
      case "specialist":
        return <Shield className="w-4 h-4" />
      default:
        return <UserCheck className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] bg-clip-text text-transparent">
              Audit Team
            </h2>
            <p className="text-[#64748B] mt-1">Manage your audit team members and their roles</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {assignedAuditors.length === 0 ? (
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-[#64748B]" />
            </div>
            <h3 className="text-xl font-semibold text-[#1E293B] mb-2">No team members assigned</h3>
            <p className="text-[#64748B] mb-6">Add auditors to your team to get started with collaborative auditing</p>
            <Button className="bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#004D99] hover:to-[#0066CC] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add First Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedAuditors.map((auditor: any, index: number) => (
            <Card
              key={auditor.id || index}
              className="border-[#E2E8F0] shadow-sm hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center text-white font-semibold shadow-lg group-hover:scale-110 transition-transform duration-200">
                        {auditor.name
                          ? auditor.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                          : auditor.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#059669] to-[#047857] rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-[#1E293B] mb-1">
                        {auditor.name || auditor}
                      </CardTitle>
                      {auditor.email && (
                        <p className="text-sm text-[#64748B] flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {auditor.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {auditor.role && (
                    <Badge className={`${getRoleColor(auditor.role)} border font-medium flex items-center gap-1`}>
                      {getRoleIcon(auditor.role)}
                      {auditor.role.replace("_", " ").toUpperCase()}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Enhanced Role Information */}
                {auditor.role && (
                  <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getRoleColor(auditor.role).replace("/10", "/20")}`}>
                        {getRoleIcon(auditor.role)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {auditor.role.replace("_", " ").toUpperCase()}
                        </p>
                        <p className="text-xs text-[#64748B]">Primary role in this audit</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Specializations */}
                {auditor.specializations && auditor.specializations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#3B82F6]" />
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {auditor.specializations.map((spec: string, specIndex: number) => (
                        <Badge
                          key={specIndex}
                          className="bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 border text-xs"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Certifications */}
                {auditor.certifications && auditor.certifications.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#F59E0B]" />
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {auditor.certifications.map((cert: string, certIndex: number) => (
                        <Badge
                          key={certIndex}
                          className="bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20 border text-xs"
                        >
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#003366]/20 transition-all duration-200 bg-transparent"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all duration-200 bg-transparent"
                  >
                    <UserCheck className="w-4 h-4" />
                  </Button>
                </div>

                {/* Enhanced Assignment Date */}
                {auditor.assigned_at && (
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <p className="text-xs text-[#94A3B8] flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Assigned {new Date(auditor.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enhanced Team Statistics */}
      <Card className="border-[#E2E8F0] shadow-lg bg-gradient-to-br from-white to-[#F8FAFC]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-[#1E293B]">
            <div className="p-2 bg-gradient-to-br from-[#059669] to-[#047857] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            Team Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-[#3B82F6]/5 to-[#1D4ED8]/5 rounded-xl border border-[#3B82F6]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#3B82F6] mb-2">{assignedAuditors.length}</div>
              <div className="text-sm font-medium text-[#64748B]">Total Members</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#8B5CF6]/5 to-[#7C3AED]/5 rounded-xl border border-[#8B5CF6]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#8B5CF6] mb-2">
                {assignedAuditors.filter((a: any) => a.role === "lead_auditor").length}
              </div>
              <div className="text-sm font-medium text-[#64748B]">Lead Auditors</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#059669]/5 to-[#047857]/5 rounded-xl border border-[#059669]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#059669] to-[#047857] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#059669] mb-2">
                {assignedAuditors.filter((a: any) => a.role === "senior_auditor").length}
              </div>
              <div className="text-sm font-medium text-[#64748B]">Senior Auditors</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#F59E0B]/5 to-[#D97706]/5 rounded-xl border border-[#F59E0B]/10 hover:shadow-sm transition-all duration-200">
              <div className="p-3 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl mx-auto w-fit mb-4 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#F59E0B] mb-2">100%</div>
              <div className="text-sm font-medium text-[#64748B]">Availability</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditTeam
