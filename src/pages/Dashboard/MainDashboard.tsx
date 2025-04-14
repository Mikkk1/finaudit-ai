"use client"

import { useState } from "react"
import { FileText, Users, Activity, TrendingUp, Briefcase, FileCheck, Clock, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react"
import { Card } from "../../components/ui/Card.tsx"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// StatsCard component
function StatsCard({ title, value, change, icon: Icon }) {
  const isPositive = !change ? true : Number.parseFloat(change) >= 0

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border">
      <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
        <h3 className="text-sm font-medium text-slate-gray">{title}</h3>
        <div className="p-2 bg-gradient-to-br from-navy-blue/10 to-navy-blue/5 rounded-full">
          <Icon className="h-4 w-4 text-navy-blue" />
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="text-xl font-bold text-dark-text">{value}</div>
        {change !== undefined && (
          <p className={`text-xs flex items-center font-medium ${isPositive ? "text-success-green" : "text-error-red"}`}>
            {isPositive ? (
              <ArrowUp className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 mr-1" />
            )}
            {change}
          </p>
        )}
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const [currentStatsIndex, setCurrentStatsIndex] = useState(0)

  const allStats = [
    [
      { title: "Total Documents", value: "1,245", icon: FileText, change: "+12%" },
      { title: "Active Users", value: "345", icon: Users, change: "+5%" },
      { title: "System Activity", value: "789", icon: Activity, change: "+8%" },
      { title: "Growth Rate", value: "15%", icon: TrendingUp, change: "+2%" },
    ],
    [
      { title: "Projects", value: "67", icon: Briefcase, change: "+7%" },
      { title: "Completed Tasks", value: "567", icon: FileCheck, change: "+9%" },
      { title: "Average Session Time", value: "45 mins", icon: Clock, change: "-3%" },
      { title: "Open Alerts", value: "12", icon: AlertTriangle, change: "+1%" },
    ],
  ]

  const chartColors = {
    primary: ["rgba(0, 51, 102, 0.8)", "rgba(0, 77, 153, 0.8)"],
    success: ["rgba(5, 150, 105, 0.8)", "rgba(4, 120, 87, 0.8)"],
    warning: ["rgba(249, 115, 22, 0.8)", "rgba(234, 88, 12, 0.8)"],
    error: ["rgba(220, 38, 38, 0.8)", "rgba(185, 28, 28, 0.8)"],
    accent: ["rgba(245, 158, 11, 0.8)", "rgba(217, 119, 6, 0.8)"],
    neutral: ["rgba(100, 116, 139, 0.8)", "rgba(71, 85, 105, 0.8)"],
  }

  // Chart data
  const documentTypeData = {
    labels: ["Contracts", "Invoices", "Reports", "Agreements"],
    datasets: [
      {
        label: "Document Types",
        data: [300, 50, 100, 80],
        backgroundColor: [
          chartColors.primary[0],
          chartColors.accent[0],
          chartColors.success[0],
          chartColors.neutral[0],
        ],
        borderWidth: 1,
      },
    ],
  }

  const workflowCompletionData = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        label: "Workflow Completion",
        data: [70, 20, 10],
        backgroundColor: [chartColors.success[0], chartColors.accent[0], chartColors.warning[0]],
        borderWidth: 1,
      },
    ],
  }

  const userActivityData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "User Activity",
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: chartColors.primary[0],
        backgroundColor: "rgba(0, 51, 102, 0.1)",
        tension: 0.4,
        pointBackgroundColor: chartColors.primary[1],
      },
    ],
  }

  const aiAnalysisAccuracyData = {
    labels: ["Category A", "Category B", "Category C", "Category D"],
    datasets: [
      {
        label: "AI Analysis Accuracy",
        data: [88, 92, 78, 90],
        backgroundColor: [
          chartColors.success[0],
          chartColors.primary[0],
          chartColors.accent[0],
          chartColors.neutral[0],
        ],
        borderWidth: 1,
      },
    ],
  }

  const auditComplianceData = {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    datasets: [
      {
        label: "Audit Compliance",
        data: [95, 96, 97, 98],
        fill: true,
        backgroundColor: "rgba(0, 51, 102, 0.1)",
        borderColor: chartColors.primary[0],
        tension: 0.4,
        pointBackgroundColor: chartColors.primary[1],
      },
    ],
  }

  const userRoleData = {
    labels: ["Admin", "Editor", "Viewer"],
    datasets: [
      {
        label: "User Roles",
        data: [30, 40, 30],
        backgroundColor: [chartColors.primary[0], chartColors.accent[0], chartColors.success[0]],
        borderWidth: 1,
      },
    ],
  }

  const documentActivityData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Document Activity",
        data: [150, 200, 180, 220],
        fill: true,
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        borderColor: chartColors.accent[0],
        tension: 0.4,
        pointBackgroundColor: chartColors.accent[1],
      },
    ],
  }

  const workflowStepPerformanceData = {
    labels: ["Step 1", "Step 2", "Step 3", "Step 4"],
    datasets: [
      {
        label: "Workflow Performance",
        data: [90, 85, 92, 88],
        backgroundColor: [
          chartColors.success[0],
          chartColors.accent[0],
          chartColors.primary[0],
          chartColors.neutral[0],
        ],
        borderWidth: 1,
      },
    ],
  }

  const aiConfidenceData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        label: "AI Confidence",
        data: [75, 20, 5],
        backgroundColor: [chartColors.success[0], chartColors.warning[0], chartColors.error[0]],
        borderWidth: 1,
      },
    ],
  }

  const integrationActivityData = {
    labels: ["Salesforce", "Slack", "Google Drive"],
    datasets: [
      {
        label: "Integration Activity",
        data: [40, 30, 30],
        backgroundColor: [chartColors.primary[0], chartColors.accent[0], chartColors.success[0]],
        borderWidth: 1,
      },
    ],
  }

  // Common chart options for better appearance
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow charts to be smaller
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 10, // Smaller font size
          },
          padding: 10, // Smaller padding
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1E293B',
        bodyColor: '#1E293B',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 8, // Smaller padding
        cornerRadius: 6, // Smaller radius
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12, // Smaller font size
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 10, // Smaller font size
        }
      }
    }
  }

  // Custom styles for swiper
  const swiperCustomStyles = `
    .swiper-pagination-bullet {
      width: 8px;
      height: 8px;
      background: #94A3B8;
      opacity: 0.5;
      transition: all 0.3s ease;
      display: none;
    }
    .swiper-pagination-bullet-active {
      opacity: 1;
      background: #003366;
      width: 16px;
      border-radius: 4px;
    }
    .swiper-button-next, .swiper-button-prev {
      color: #003366;
      background: rgba(255, 255, 255, 0.9);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    .swiper-button-next:hover, .swiper-button-prev:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.05);
    }
    .swiper-button-next:after, .swiper-button-prev:after {
      font-size: 14px;
      font-weight: bold;
    }
  `

  return (
    <div className="flex-1 space-y-6 p-6 pt-4 bg-primary-bg">
      {/* Inject custom swiper styles */}
      <style jsx global>{swiperCustomStyles}</style>

      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-navy-blue to-navy-blue-light p-6 rounded-lg shadow-md mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-white">Company Dashboard</h2>
        <p className="text-white/80 mt-1 text-sm">Analytics & Performance Overview</p>
      </div>

      {/* Stats Cards with Enhanced Swiper Slider */}
      <div className="mb-6">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          onSlideChange={(swiper) => setCurrentStatsIndex(swiper.activeIndex)}
          className="stats-swiper"
        >
          {allStats.map((statGroup, index) => (
            <SwiperSlide key={index}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statGroup.map((stat) => (
                  <StatsCard key={stat.title} {...stat} />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Charts - Now 2 per row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Row 1 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Document Types</h3>
            <div className="h-48">
              <Pie data={documentTypeData} options={chartOptions} />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Workflow Completion</h3>
            <div className="h-48">
              <Doughnut data={workflowCompletionData} options={chartOptions} />
            </div>
          </div>
        </Card>

        {/* Row 2 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">User Activity</h3>
            <div className="h-48">
              <Line data={userActivityData} options={chartOptions} />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">AI Analysis Accuracy</h3>
            <div className="h-48">
              <Bar data={aiAnalysisAccuracyData} options={{ ...chartOptions, indexAxis: "y" }} />
            </div>
          </div>
        </Card>

        {/* Row 3 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Audit Compliance Trends</h3>
            <div className="h-48">
              <Line data={auditComplianceData} options={chartOptions} />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">User Role Distribution</h3>
            <div className="h-48">
              <Pie data={userRoleData} options={chartOptions} />
            </div>
          </div>
        </Card>

        {/* Row 4 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Document Activity</h3>
            <div className="h-48">
              <Line data={documentActivityData} options={chartOptions} />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Workflow Performance</h3>
            <div className="h-48">
              <Bar data={workflowStepPerformanceData} options={chartOptions} />
            </div>
          </div>
        </Card>

        {/* Row 5 */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">AI Confidence Scores</h3>
            <div className="h-48">
              <Doughnut data={aiConfidenceData} options={chartOptions} />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border h-64">
          <div className="p-4">
            <h3 className="text-md font-semibold mb-2 text-navy-blue">Integration Activity</h3>
            <div className="h-48">
              <Doughnut data={integrationActivityData} options={chartOptions} />
            </div>
          </div>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-light-border mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-navy-blue to-navy-blue-light bg-clip-text text-transparent">Key Insights</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-success-green/10 to-success-green/5 border border-success-green/20">
              <p className="text-dark-text text-sm"><span className="font-semibold">+15%</span> Document processing efficiency this quarter</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-navy-blue/10 to-navy-blue/5 border border-navy-blue/20">
              <p className="text-dark-text text-sm"><span className="font-semibold">-30%</span> Manual review time with AI-assisted audits</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-soft-gold/10 to-soft-gold/5 border border-soft-gold/20">
              <p className="text-dark-text text-sm"><span className="font-semibold">98.5%</span> All-time high compliance rate</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-slate-gray/10 to-slate-gray/5 border border-slate-gray/20">
              <p className="text-dark-text text-sm"><span className="font-semibold">-2 days</span> Average processing time with workflow automation</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}