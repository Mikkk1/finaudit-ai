"""
Audit services and utility functions
"""
from fastapi import HTTPException
import bcrypt
import os
import uuid
import secrets
import string
import google.generativeai as genai
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, and_, or_
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.models import *

# Configure Gemini AI
genai.configure(api_key="AIzaSyC9kRGz-cMVvEIXPpfsySl_eZt3OzgVpgE")

class AuditValidationService:
    def __init__(self, db: Session):
        self.db = db
    
    def validate_audit_creation(self, audit_data) -> dict:
        errors = []
        warnings = []
        suggestions = []
        
        # Date logic validation
        if audit_data.start_date >= audit_data.end_date:
            errors.append("Start date must be before end date")
        
        if audit_data.end_date >= audit_data.deadline:
            errors.append("End date must be before deadline")
        
        # Budget validation
        if audit_data.estimated_budget:
            ratio = audit_data.estimated_budget / audit_data.materiality_threshold
            if ratio < 0.1:
                warnings.append("Budget seems low compared to materiality threshold")
            elif ratio > 10:
                warnings.append("Budget seems high compared to materiality threshold")
        
        # High-value audit check
        if audit_data.materiality_threshold > 100000:
            suggestions.append("This audit requires management approval due to high materiality threshold")
        
        # Timeline validation
        duration = (audit_data.deadline - audit_data.start_date).days
        if duration < 14:
            warnings.append("Audit timeline is very tight (less than 2 weeks)")
        elif duration > 180:
            warnings.append("Audit timeline is very long (more than 6 months)")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions
        }
    
    def check_auditor_availability(self, auditor_emails: List[str], start_date: datetime, end_date: datetime) -> List[Dict]:
        results = []
        
        for email in auditor_emails:
            auditor = self.db.query(User).filter(User.email == email).first()
            if not auditor:
                continue
            
            # Check availability
            conflicts = self.db.query(AuditorAvailability).filter(
                AuditorAvailability.auditor_id == auditor.id,
                AuditorAvailability.availability_type == 'busy',
                or_(
                    and_(AuditorAvailability.start_date <= start_date, AuditorAvailability.end_date >= start_date),
                    and_(AuditorAvailability.start_date <= end_date, AuditorAvailability.end_date >= end_date),
                    and_(AuditorAvailability.start_date >= start_date, AuditorAvailability.end_date <= end_date)
                )
            ).all()
            
            # Check current workload
            current_audits = self.db.execute(
                text("""
                    SELECT COUNT(*) as count
                    FROM audit_auditor_assignments aaa
                    JOIN audits a ON aaa.audit_id = a.id
                    WHERE aaa.auditor_id = :auditor_id 
                    AND aaa.is_active = true
                    AND a.status = 'in_progress'
                    AND (
                        (a.start_date <= :start_date AND a.end_date >= :start_date) OR
                        (a.start_date <= :end_date AND a.end_date >= :end_date) OR
                        (a.start_date >= :start_date AND a.end_date <= :end_date)
                    )
                """),
                {"auditor_id": auditor.id, "start_date": start_date, "end_date": end_date}
            ).fetchone()
            
            availability_record = self.db.query(AuditorAvailability).filter(
                AuditorAvailability.auditor_id == auditor.id
            ).first()
            
            max_capacity = availability_record.max_concurrent_audits if availability_record else 3
            current_workload = current_audits.count if current_audits else 0
            
            results.append({
                "auditor_id": auditor.id,
                "is_available": len(conflicts) == 0 and current_workload < max_capacity,
                "conflicts": [{
                    "start_date": c.start_date.isoformat(),
                    "end_date": c.end_date.isoformat(),
                    "type": c.availability_type
                } for c in conflicts],
                "current_workload": current_workload,
                "max_capacity": max_capacity
            })
        
        return results

class AIEnhancementService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_historical_insights(self, audit_data) -> Dict[str, Any]:
        # Find similar historical audits
        similar_audits = self.db.query(Audit).filter(
            Audit.financial_audit_type == audit_data.financial_audit_type,
            Audit.status == AuditStatus.completed,
            Audit.materiality_threshold.between(
                audit_data.materiality_threshold * 0.5,
                audit_data.materiality_threshold * 2.0
            )
        ).limit(5).all()
        
        if not similar_audits:
            return {"message": "No similar historical audits found"}
        
        # Analyze historical data
        avg_duration = sum([(a.end_date - a.start_date).days for a in similar_audits if a.end_date and a.start_date]) / len(similar_audits)
        avg_findings = sum([len(a.findings) for a in similar_audits]) / len(similar_audits)
        
        return {
            "similar_audits_count": len(similar_audits),
            "average_duration_days": avg_duration,
            "average_findings_count": avg_findings,
            "recommendations": [
                f"Based on similar audits, expect approximately {int(avg_findings)} findings",
                f"Typical duration for this type of audit is {int(avg_duration)} days",
                "Consider focusing on high-risk areas identified in similar audits"
            ]
        }
    
    async def generate_intelligent_requirements(self, audit_data, risk_assessment: Dict) -> List[Dict]:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Based on the following audit parameters and risk assessment, generate specific document requirements:
        
        Audit Type: {audit_data.financial_audit_type}
        Industry: {audit_data.industry_type}
        Compliance Frameworks: {audit_data.compliance_frameworks}
        Materiality Threshold: ${audit_data.materiality_threshold:,.2f}
        Risk Assessment: {risk_assessment}
        
        Generate a JSON list of document requirements with:
        - document_type: specific document name
        - priority: high/medium/low
        - deadline_offset_days: days from audit start
        - validation_rules: specific validation criteria
        - ai_priority_score: 0-10 based on risk
        
        Focus on the highest risk areas and compliance requirements.
        """
        
        try:
            response = model.generate_content(prompt)
            import json
            requirements = json.loads(response.text)
            return requirements
        except Exception as e:
            # Fallback requirements
            return [
                {
                    "document_type": "Financial Statements",
                    "priority": "high",
                    "deadline_offset_days": 7,
                    "validation_rules": {"required_fields": ["balance_sheet", "income_statement"]},
                    "ai_priority_score": 9
                }
            ]
    
    async def match_auditors_intelligently(self, audit_data, available_auditors: List[User]) -> List[Dict]:
        # Score auditors based on specializations, past performance, and availability
        scored_auditors = []
        
        for auditor in available_auditors:
            score = 0
            reasons = []
            
            # Specialization match
            if auditor.specializations:
                if audit_data.financial_audit_type in auditor.specializations:
                    score += 30
                    reasons.append("Specialized in this audit type")
                
                if audit_data.industry_type in auditor.specializations:
                    score += 20
                    reasons.append("Industry experience")
            
            # Compliance framework experience
            for framework in audit_data.compliance_frameworks:
                if auditor.certifications and framework in auditor.certifications:
                    score += 15
                    reasons.append(f"{framework.upper()} certified")
            
            # Past performance (mock calculation)
            completed_audits = self.db.execute(
                text("""
                    SELECT COUNT(*) as count
                    FROM audit_auditor_assignments aaa
                    JOIN audits a ON aaa.audit_id = a.id
                    WHERE aaa.auditor_id = :auditor_id 
                    AND a.status = 'completed'
                """),
                {"auditor_id": auditor.id}
            ).fetchone()
            
            if completed_audits and completed_audits.count > 5:
                score += 10
                reasons.append("Experienced auditor")
            
            scored_auditors.append({
                "auditor_id": auditor.id,
                "name": f"{auditor.f_name} {auditor.l_name}",
                "email": auditor.email,
                "match_score": score,
                "reasons": reasons,
                "hourly_rate": auditor.hourly_rate
            })
        
        return sorted(scored_auditors, key=lambda x: x["match_score"], reverse=True)

# Utility Functions
def generate_secure_password(length: int = 12) -> str:
    """Generate a secure temporary password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

async def generate_ai_risk_assessment(
    financial_audit_type: str,
    scope: str,
    materiality_threshold: float,
    db: Session
) -> dict:
    """Generate AI-powered risk assessment using Gemini"""
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Get historical risk patterns
    historical_risks = db.query(AIRiskAssessment).join(Audit).filter(
        Audit.financial_audit_type == financial_audit_type
    ).limit(10).all()
    
    historical_context = ""
    if historical_risks:
        risk_patterns = {}
        for risk in historical_risks:
            if risk.risk_category not in risk_patterns:
                risk_patterns[risk.risk_category] = []
            risk_patterns[risk.risk_category].append(risk.risk_level.value)
        
        historical_context = f"Historical risk patterns for {financial_audit_type}: {risk_patterns}"
    
    prompt = f"""
    As a senior financial audit expert with access to historical data, analyze the following audit parameters:
    
    Audit Type: {financial_audit_type}
    Scope: {scope}
    Materiality Threshold: ${materiality_threshold:,.2f}
    Historical Context: {historical_context}
    
    Provide a comprehensive risk assessment with:
    1. Risk categories with levels (low, medium, high, critical)
    2. Confidence scores (0-1) based on data quality and historical patterns
    3. Detailed descriptions and AI reasoning
    4. Suggested focus areas for each risk
    5. Overall risk score (0-10) with justification
    6. Key recommendations prioritized by risk level
    
    Consider industry best practices, regulatory requirements, and historical audit outcomes.
    
    Format as JSON:
    {{
        "risk_categories": [
            {{
                "category": "string",
                "level": "high|medium|low|critical",
                "confidence": 0.95,
                "description": "string",
                "reasoning": "string with historical context",
                "focus_areas": ["area1", "area2"]
            }}
        ],
        "overall_risk_score": 7.5,
        "confidence": 0.9,
        "key_recommendations": ["rec1", "rec2"],
        "historical_insights": "insights from similar audits"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        import json
        ai_assessment = json.loads(response.text)
        return ai_assessment
    except Exception as e:
        # Enhanced fallback with historical context
        return {
            "risk_categories": [
                {
                    "category": "High-Value Transactions",
                    "level": "high",
                    "confidence": 0.8,
                    "description": f"Transactions above ${materiality_threshold:,.2f} require detailed review",
                    "reasoning": "Large transactions pose higher risk of errors or fraud based on historical patterns",
                    "focus_areas": ["Authorization", "Supporting Documentation", "Approval Workflow"]
                },
                {
                    "category": "Internal Controls",
                    "level": "medium",
                    "confidence": 0.7,
                    "description": "Assessment of internal control effectiveness",
                    "reasoning": "Control deficiencies commonly found in similar audits",
                    "focus_areas": ["Segregation of Duties", "Management Review", "Documentation"]
                }
            ],
            "overall_risk_score": 6.5,
            "confidence": 0.75,
            "key_recommendations": [
                "Focus on high-value transactions above materiality threshold",
                "Review internal control design and implementation",
                "Test management review controls"
            ],
            "historical_insights": "Based on similar audits, expect 2-3 medium findings on average"
        }

async def generate_document_requirements(
    audit_id: int,
    financial_audit_type: str,
    db: Session
):
    """Generate document requirements based on financial audit type"""
    
    # Get templates for this audit type
    templates = db.query(FinancialDocumentTemplate).filter(
        FinancialDocumentTemplate.financial_audit_type == financial_audit_type
    ).all()
    
    for template in templates:
        requirement = DocumentRequirement(
            audit_id=audit_id,
            document_type=template.document_type,
            required_fields=template.validation_rules or {},
            validation_rules=template.validation_rules or {},
            deadline=datetime.utcnow() + timedelta(days=14),  # 2 weeks default
            is_mandatory=template.is_mandatory,
            auto_escalate=True,
            created_by=1  # System generated
        )
        db.add(requirement)
def get_password_hash(password: str) -> str:
    try:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except ValueError as e:
        raise HTTPException(status_code=500, detail="Error processing password")

async def invite_auditor_with_credentials(
    audit_id: int,
    email: str,
    invited_by: int,
    db: Session
):
    """Invite auditor with auto-generated credentials and send email"""
    # Generate secure temporary password
    temp_password = generate_secure_password()
    
    # Get company ID from the inviting user
    inviting_user = db.query(User).filter(User.id == invited_by).first()
    if not inviting_user:
        raise ValueError("Inviting user not found")
    
    # Create invitation record
    invitation = AuditorInvitation(
        company_id=inviting_user.company_id,
        email=email,
        invited_by=invited_by,
        role="auditor",
        temp_password=temp_password,
        token=str(uuid.uuid4()),
        expires_at=datetime.utcnow() + timedelta(days=7),
        message="You have been invited to join our audit platform"
    )
    
    db.add(invitation)
    db.commit()
    password = get_password_hash(temp_password)
    # Create user record with auditor role
    user = User(
        username=email.split('@')[0],
        email=email,
        hashed_password=password,  # Note: In production, hash this password
        role=UserRole.auditor,
        f_name="",
        l_name="",
        company_id=inviting_user.company_id,
        is_active=False,  # User needs to confirm email to activate
        availability_status="available"
    )
    
    db.add(user)
    db.commit()
    
    # Send email with credentials
    await send_auditor_invitation_email(
        email=email,
        temp_password=temp_password,
        token=invitation.token,
        audit_id=audit_id,
        inviting_user=inviting_user
    )
    
    return invitation

async def send_auditor_invitation_email(
    email: str,
    temp_password: str,
    token: str,
    audit_id: int,
    inviting_user: User
):
    """Send invitation email to auditor with credentials"""
    try:
        # Email configuration
        sender_email = "minhalawais1@gmail.com"  # Your Gmail address
        sender_password = "ibcf vrxn euoa qdci"  # Your Gmail app password

        # Create message
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = email
        message["Subject"] = "Invitation to Join Audit Platform"
        
        # Email body
        body = f"""
        <html>
            <body>
                <h2>Audit Platform Invitation</h2>
                <p>You have been invited by {inviting_user.f_name} {inviting_user.l_name} to participate in audit ID: {audit_id}.</p>
                <p>Your temporary credentials:</p>
                <ul>
                    <li>Email: {email}</li>
                    <li>Temporary Password: {temp_password}</li>
                </ul>
                <p>Please click the link below to activate your account and set a new password:</p>
                <p><a href="http://yourapp.com/activate?token={token}">Activate Account</a></p>
                <p>This invitation will expire in 7 days.</p>
                <p>If you didn't request this invitation, please ignore this email.</p>
                <br>
                <p>Best regards,</p>
                <p>Audit Platform Team</p>
            </body>
        </html>
        """
        
        message.attach(MIMEText(body, "html"))
        
        # Send email
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
            
    except Exception as e:
        print(f"Failed to send invitation email: {e}")
        raise

async def schedule_kickoff_meeting(
    audit_id: int,
    created_by: int,
    db: Session
) -> AuditMeeting:
    """Auto-schedule kickoff meeting 48 hours after audit creation"""
    
    kickoff_time = datetime.utcnow() + timedelta(hours=48)
    
    meeting = AuditMeeting(
        audit_id=audit_id,
        title="Audit Kickoff Meeting",
        meeting_type=MeetingType.kickoff,
        scheduled_time=kickoff_time,
        duration_minutes=90,
        location="Virtual Meeting",
        meeting_url="https://meet.google.com/auto-generated-link",
        status=MeetingStatus.scheduled,
        created_by=created_by
    )
    
    db.add(meeting)
    db.flush()
    
    # Add default agenda items
    agenda_items = [
        {"title": "Audit Scope Review", "time_allocation": 20, "order_index": 1},
        {"title": "Document Requirements Walkthrough", "time_allocation": 30, "order_index": 2},
        {"title": "Timeline and Milestones", "time_allocation": 20, "order_index": 3},
        {"title": "Q&A and Next Steps", "time_allocation": 20, "order_index": 4}
    ]
    
    for item in agenda_items:
        agenda = MeetingAgendaItem(
            meeting_id=meeting.id,
            title=item["title"],
            time_allocation=item["time_allocation"],
            order_index=item["order_index"]
        )
        db.add(agenda)
    
    return meeting

def calculate_overall_progress(audit_id: int, db: Session) -> float:
    """Calculate overall audit progress"""
    # This is a simplified calculation - you can make it more sophisticated
    requirements_weight = 0.4
    findings_weight = 0.3
    meetings_weight = 0.3
    
    # Requirements progress
    total_reqs = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    ).count()
    
    completed_reqs = db.query(DocumentRequirement).join(
        DocumentSubmission
    ).filter(
        DocumentRequirement.audit_id == audit_id,
        DocumentSubmission.verification_status == EvidenceStatus.approved
    ).count()
    
    req_progress = (completed_reqs / total_reqs * 100) if total_reqs > 0 else 0
    
    # Findings progress
    total_findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id
    ).count()
    
    resolved_findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id,
        AuditFinding.status == FindingStatus.resolved
    ).count()
    
    findings_progress = (resolved_findings / total_findings * 100) if total_findings > 0 else 0
    
    # Meetings progress
    total_meetings = db.query(AuditMeeting).filter(
        AuditMeeting.audit_id == audit_id
    ).count()
    
    completed_meetings = db.query(AuditMeeting).filter(
        AuditMeeting.audit_id == audit_id,
        AuditMeeting.status == MeetingStatus.completed
    ).count()
    
    meetings_progress = (completed_meetings / total_meetings * 100) if total_meetings > 0 else 0
    
    # Calculate weighted average
    overall = (
        req_progress * requirements_weight +
        findings_progress * findings_weight +
        meetings_progress * meetings_weight
    )
    
    return round(overall, 1)

def calculate_complexity_score(audit_data, ai_assessment: Dict) -> float:
    """Calculate audit complexity score (1-10)"""
    score = 5.0  # Base score
    
    # Materiality threshold impact
    if audit_data.materiality_threshold > 1000000:
        score += 2
    elif audit_data.materiality_threshold > 100000:
        score += 1
    
    # Compliance frameworks
    score += len(audit_data.compliance_frameworks) * 0.5
    
    # AI risk score impact
    if ai_assessment.get("overall_risk_score", 5) > 7:
        score += 1.5
    
    # Timeline pressure
    duration = (audit_data.deadline - audit_data.start_date).days
    if duration < 30:
        score += 1
    
    return min(10.0, max(1.0, score))

def estimate_audit_hours(complexity_score: float, audit_data) -> float:
    """Estimate audit hours based on complexity"""
    base_hours = 40  # Base hours for simple audit
    
    # Complexity multiplier
    hours = base_hours * (complexity_score / 5.0)
    
    # Audit type specific adjustments
    type_multipliers = {
        "vendor_payments": 1.2,
        "revenue_recognition": 1.5,
        "tax_compliance": 1.3,
        "payroll_audit": 1.1,
        "custom": 1.4
    }
    
    multiplier = type_multipliers.get(audit_data.financial_audit_type, 1.0)
    hours *= multiplier
    
    # Compliance framework overhead
    hours += len(audit_data.compliance_frameworks) * 8
    
    return round(hours, 1)

async def send_meeting_invites(meeting_id: int, db: Session, is_update: bool = False):
    """Send meeting invitations to all attendees"""
    try:
        meeting = db.query(AuditMeeting).options(
            joinedload(AuditMeeting.attendees).joinedload(MeetingAttendee.user),
            joinedload(AuditMeeting.audit)
        ).filter(AuditMeeting.id == meeting_id).first()
        
        if not meeting:
            return
        
        # In a real implementation, this would send actual emails or calendar invites
        # For now, we'll just log it
        print(f"{'Updating' if is_update else 'Sending'} invites for meeting {meeting.id}")
        
        # Update attendee statuses
        for attendee in meeting.attendees:
            attendee.has_confirmed = False  # Reset confirmation status if meeting was updated
            
        db.commit()
        
    except Exception as e:
        print(f"Failed to send meeting invites: {e}")

def generate_meeting_minutes_template(meeting_type: str) -> str:
    """Generate a basic meeting minutes template based on meeting type"""
    templates = {
        "kickoff": """# Kickoff Meeting Minutes

## Attendees:
- 

## Agenda Items:
1. 

## Discussion Points:
- 

## Action Items:
- 

## Next Steps:
1. 
""",
        "progress": """# Progress Meeting Minutes

## Attendees:
- 

## Status Updates:
- 

## Issues/Blockers:
- 

## Action Items:
- 

## Next Steps:
1. 
""",
        "exit": """# Exit Meeting Minutes

## Attendees:
- 

## Audit Findings Summary:
- 

## Recommendations:
- 

## Action Items:
- 

## Next Steps:
1. 
"""
    }
    
    return templates.get(meeting_type, """# Meeting Minutes

## Attendees:
- 

## Discussion:
- 

## Decisions:
- 

## Action Items:
- 
""")