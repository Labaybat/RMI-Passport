import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { useAdminGuard } from "../hooks/useAdminGuard";
import supabase from "../lib/supabase/client";
import { useToast } from "../hooks/use-toast";
import { CheckCircleIcon, XCircleIcon, ClockIcon, PencilIcon, EyeIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import AdminComments from "./AdminComments";
// 1. Import for map
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Components for different sections

// Dashboard Stats Interface
interface DashboardStats {
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalUsers: number;
  recentActivity: Array<{
    action: string;
    user: string;
    time: string;
    status: string;
  }>;
  percentageChanges: {
    pending: string;
    approved: string;
    rejected: string;
    users: string;
  };
  processingTimeMetrics: {
    averageProcessingHours: number;
    fastestApprovalHours: number;
    slowestApprovalHours: number;
    totalProcessed: number;
    processingDistribution: {
      lessThan24h: number;
      between24And48h: number;
      between48And72h: number;
      moreThan72h: number;
    };
  };
}

// Components for different sections
const Dashboard: React.FC = () => {
  const { user, profile } = useAuth(); // Get current admin user info
  
  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalUsers: 0,
    recentActivity: [],
    percentageChanges: {
      pending: "+0%",
      approved: "+0%", 
      rejected: "+0%",
      users: "+0%"
    },
    processingTimeMetrics: {
      averageProcessingHours: 0,
      fastestApprovalHours: 0,
      slowestApprovalHours: 0,
      totalProcessed: 0,
      processingDistribution: {
        lessThan24h: 0,
        between24And48h: 0,
        between48And72h: 0,
        moreThan72h: 0
      }
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<string>("7");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [silentRefresh, setSilentRefresh] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // --- Geographic Distribution Aggregation ---
  const [countryCounts, setCountryCounts] = useState<{ [country: string]: number }>({});
  const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries-sans-antarctica.geojson";

  useEffect(() => {
    fetchDashboardData(!isInitialLoad); // Only show loading on initial load
    if (isInitialLoad) setIsInitialLoad(false);
  }, [timeFilter]);
  // Auto-refresh every 30 seconds when autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent refresh - don't show loading
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, timeFilter]);  const fetchDashboardData = async (silent = false) => {
    // Only show loading state if not a silent refresh
    if (!silent) {
      setLoading(true);
    } else {
      setSilentRefresh(true);
    }
    try {
      // Calculate date filters for current and previous periods
      const now = new Date();
      let currentDateFilter: string | null = null;
      let previousDateFilter: string | null = null;
      
      if (timeFilter === "7") {
        currentDateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        previousDateFilter = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      } else if (timeFilter === "30") {
        currentDateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        previousDateFilter = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
      }      // Fetch all applications (try to include admin tracking columns if they exist)
      let applications: any[] = [];
      try {
        const { data, error } = await supabase
          .from("passport_applications")
          .select("status, created_at, updated_at, surname, first_middle_names, last_modified_by_admin_id, last_modified_by_admin_name, country_of_birth")
          .order("updated_at", { ascending: false });
        
        if (error) throw error;
        applications = data || [];
      } catch (error: any) {
        // If admin tracking columns don't exist, fetch without them
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          console.log("Admin tracking columns not found, fetching without them...");
          const { data, error: fallbackError } = await supabase
            .from("passport_applications")
            .select("status, created_at, updated_at, surname, first_middle_names")
            .order("updated_at", { ascending: false });
          
          if (fallbackError) throw fallbackError;
          applications = data || [];
        } else {
          throw error;
        }
      }// Filter applications for current period (using updated_at for more accurate recent activity)
      const currentApps = currentDateFilter 
        ? applications.filter(app => new Date(app.updated_at || app.created_at) >= new Date(currentDateFilter))
        : applications;

      // Filter applications for previous period (for comparison)
      const previousApps = currentDateFilter && previousDateFilter
        ? applications.filter(app => {
            const activityDate = new Date(app.updated_at || app.created_at);
            return activityDate >= new Date(previousDateFilter) && activityDate < new Date(currentDateFilter);
          })
        : [];

      // Count current period applications by status
      const currentPending = currentApps.filter(app => ["submitted", "pending", "draft"].includes(app.status)).length;
      const currentApproved = currentApps.filter(app => app.status === "approved").length;
      const currentRejected = currentApps.filter(app => app.status === "rejected").length;

      // Count previous period applications by status
      const previousPending = previousApps.filter(app => ["submitted", "pending", "draft"].includes(app.status)).length;
      const previousApproved = previousApps.filter(app => app.status === "approved").length;
      const previousRejected = previousApps.filter(app => app.status === "rejected").length;

      // Fetch total users count for current period
      const { count: totalUsers, error: usersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (usersError) throw usersError;

      // Calculate users for previous period (simplified - in real scenario you'd filter by created_at)
      // For now, using a mock calculation since we don't have easy access to user creation dates
      const previousTotalUsers = Math.max(0, (totalUsers || 0) - Math.floor((totalUsers || 0) * 0.1)); // Mock 10% growth      // Calculate percentage changes
      const calculatePercentageChange = (current: number, previous: number): string => {
        if (previous === 0) {
          return current > 0 ? "+100%" : "0%";
        }
        const change = ((current - previous) / previous) * 100;
        const rounded = Math.round(change);
        if (rounded > 0) {
          return `+${rounded}%`;
        } else if (rounded < 0) {
          return `${rounded}%`;
        } else {
          return "0%";
        }
      };

      const percentageChanges = {
        pending: calculatePercentageChange(currentPending, previousPending),
        approved: calculatePercentageChange(currentApproved, previousApproved),
        rejected: calculatePercentageChange(currentRejected, previousRejected),
        users: calculatePercentageChange(totalUsers || 0, previousTotalUsers)
      };      // Fetch recent activity (last 10 applications)
      const recentApps = applications.slice(0, 10);
      const recentActivity = recentApps.map(app => {
        // Use updated_at if available, fallback to created_at
        const activityDate = new Date(app.updated_at || app.created_at);
        const timeAgo = getTimeAgo(activityDate);
        
        let action = "";
        let userName = "";
          switch (app.status) {
          case "submitted":
            action = "Application Submitted";
            // For submitted applications, show applicant name
            userName = [app.surname, app.first_middle_names].filter(Boolean).join(' ') || 'Unknown User';
            break;
          case "pending":
            // Check if this was modified by an admin (has admin tracking info)
            if ((app as any).last_modified_by_admin_name) {
              action = "Application Updated";
              userName = (app as any).last_modified_by_admin_name;
            } else {
              // If no admin tracking, assume it's a new submission
              action = "Application Submitted";
              userName = [app.surname, app.first_middle_names].filter(Boolean).join(' ') || 'Unknown User';
            }
            break;
          case "approved":
            action = "Application Approved";
            // For approved applications, show admin name if available (fallback for now)
            userName = (app as any).last_modified_by_admin_name || 'Admin User';
            break;
          case "rejected":
            action = "Application Rejected";
            // For rejected applications, show admin name if available (fallback for now)
            userName = (app as any).last_modified_by_admin_name || 'Admin User';
            break;
          case "draft":
            action = "Application Started";
            // For drafts, show applicant name
            userName = [app.surname, app.first_middle_names].filter(Boolean).join(' ') || 'Unknown User';
            break;
          default:
            action = "Application Updated";
            // For other updates, check if admin modified it (fallback for now)
            userName = (app as any).last_modified_by_admin_name || [app.surname, app.first_middle_names].filter(Boolean).join(' ') || 'Unknown User';
        }

        return {
          action,
          user: userName,
          time: timeAgo,
          status: app.status === "submitted" ? "pending" : app.status
        };
      });      // Calculate processing time metrics
      const approvedApps = applications.filter(app => app.status === "approved" && app.created_at && app.updated_at);
      let averageProcessingHours = 0;
      let fastestApprovalHours = Infinity;
      let slowestApprovalHours = 0;
      let lessThan24h = 0;
      let between24And48h = 0;
      let between48And72h = 0;
      let moreThan72h = 0;

      if (approvedApps.length > 0) {
        // Calculate processing times
        const processingTimes = approvedApps.map(app => {
          const createdAt = new Date(app.created_at);
          const updatedAt = new Date(app.updated_at);
          const processingTimeHours = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          
          // Update distribution counters
          if (processingTimeHours < 24) {
            lessThan24h++;
          } else if (processingTimeHours < 48) {
            between24And48h++;
          } else if (processingTimeHours < 72) {
            between48And72h++;
          } else {
            moreThan72h++;
          }
          
          return processingTimeHours;
        });
        
        // Calculate metrics
        averageProcessingHours = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
        fastestApprovalHours = Math.min(...processingTimes);
        slowestApprovalHours = Math.max(...processingTimes);
      } else {
        // Default values if no approved applications
        fastestApprovalHours = 0;
      }

      setStats({
        pendingApplications: currentPending,
        approvedApplications: currentApproved,
        rejectedApplications: currentRejected,
        totalUsers: totalUsers || 0,
        recentActivity,
        percentageChanges,
        processingTimeMetrics: {
          averageProcessingHours,
          fastestApprovalHours,
          slowestApprovalHours,
          totalProcessed: approvedApps.length,
          processingDistribution: {
            lessThan24h,
            between24And48h,
            between48And72h,
            moreThan72h
          }
        }
      });
      // Aggregate applications by country_of_birth
      const countryCounter: { [country: string]: number } = {};
      applications.forEach(app => {
        const country = app.country_of_birth?.trim();
        if (country) {
          countryCounter[country] = (countryCounter[country] || 0) + 1;
        }
      });
      setCountryCounts(countryCounter);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      // Only hide loading state if not a silent refresh
      if (!silent) {
        setLoading(false);
      } else {
        setSilentRefresh(false);
      }
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h2>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h2>
        <div className="flex items-center gap-2">
          <select 
            className="border rounded-md px-3 py-2 text-sm bg-white text-gray-900"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-refresh</span>
            </label>            {autoRefresh && (
              <div className={`flex items-center gap-1 text-xs transition-colors duration-200 ${
                silentRefresh ? 'text-blue-600' : 'text-green-600'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  silentRefresh ? 'bg-blue-500 animate-bounce' : 'bg-green-500 animate-pulse'
                }`}></div>
                {silentRefresh ? 'Updating...' : 'Live'}
              </div>
            )}
          </div>          <button 
            className={`bg-white px-3 py-2 rounded-md border hover:bg-gray-50 transition-all duration-200 ${
              silentRefresh ? 'border-blue-300 shadow-sm' : ''
            }`}
            onClick={() => fetchDashboardData(true)}
            disabled={loading || silentRefresh}
          >
            <svg className={`w-5 h-5 text-gray-500 transition-all duration-200 ${
              silentRefresh ? 'text-blue-500 rotate-45' : ''
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-900">{stats.pendingApplications}</p>
                <p className="text-sm text-blue-700">Pending Applications</p>
              </div>
            </div>            <div className="mt-4 flex items-center gap-1 text-blue-600">
              <span className="text-xs">
                {stats.percentageChanges.pending.startsWith('+') ? '↑' : stats.percentageChanges.pending.startsWith('-') ? '↓' : ''}
                {' '}{stats.percentageChanges.pending} from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-900">{stats.approvedApplications}</p>
                <p className="text-sm text-green-700">Approved Applications</p>
              </div>
            </div>            <div className="mt-4 flex items-center gap-1 text-green-600">
              <span className="text-xs">
                {stats.percentageChanges.approved.startsWith('+') ? '↑' : stats.percentageChanges.approved.startsWith('-') ? '↓' : ''}
                {' '}{stats.percentageChanges.approved} from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-900">{stats.rejectedApplications}</p>
                <p className="text-sm text-red-700">Rejected Applications</p>
              </div>
            </div>            <div className="mt-4 flex items-center gap-1 text-red-600">
              <span className="text-xs">
                {stats.percentageChanges.rejected.startsWith('+') ? '↑' : stats.percentageChanges.rejected.startsWith('-') ? '↓' : ''}
                {' '}{stats.percentageChanges.rejected} from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-900">{stats.totalUsers}</p>
                <p className="text-sm text-purple-700">Total Users</p>
              </div>
            </div>            <div className="mt-4 flex items-center gap-1 text-purple-600">
              <span className="text-xs">
                {stats.percentageChanges.users.startsWith('+') ? '↑' : stats.percentageChanges.users.startsWith('-') ? '↓' : ''}
                {' '}{stats.percentageChanges.users} from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                </div>
              ) : (
                stats.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`p-2 rounded-full ${
                      item.status === "pending" || item.status === "submitted" ? "bg-blue-100 text-blue-600" :
                      item.status === "approved" ? "bg-green-100 text-green-600" :
                      item.status === "rejected" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {(item.status === "pending" || item.status === "submitted") && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {item.status === "approved" && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {item.status === "rejected" && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {item.status === "draft" && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500">by {item.user}</p>
                    </div>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Approval Rate</span>
                  <span className="font-medium text-gray-900">
                    {stats.approvedApplications + stats.rejectedApplications > 0 
                      ? Math.round((stats.approvedApplications / (stats.approvedApplications + stats.rejectedApplications)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ 
                      width: `${stats.approvedApplications + stats.rejectedApplications > 0 
                        ? (stats.approvedApplications / (stats.approvedApplications + stats.rejectedApplications)) * 100
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending Applications</span>
                  <span className="font-medium text-gray-900">
                    {stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications > 0
                      ? Math.round((stats.pendingApplications / (stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ 
                      width: `${stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications > 0
                        ? (stats.pendingApplications / (stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications)) * 100
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Applications</span>
                  <span className="font-medium text-gray-900">
                    {stats.pendingApplications + stats.approvedApplications + stats.rejectedApplications}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        {/* Processing Metrics Overview Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Processing Metrics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-blue-600 text-sm font-medium mb-1">Average Processing</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.processingTimeMetrics?.averageProcessingHours.toFixed(1) || "0"} hrs</p>
                <p className="text-xs text-gray-500">Average time to process an application</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-green-600 text-sm font-medium mb-1">Fastest Approval</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.processingTimeMetrics?.fastestApprovalHours.toFixed(1) || "0"} hrs</p>
                <p className="text-xs text-gray-500">Shortest time to approve an application</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-yellow-600 text-sm font-medium mb-1">Slowest Approval</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.processingTimeMetrics?.slowestApprovalHours.toFixed(1) || "0"} hrs</p>
                <p className="text-xs text-gray-500">Longest time to approve an application</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-purple-600 text-sm font-medium mb-1">Total Processed</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.processingTimeMetrics?.totalProcessed || "0"}</p>
                <p className="text-xs text-gray-500">Number of processed applications</p>
              </div>
            </div>
            
            <h3 className="font-medium text-gray-700 mb-3">Processing Time Distribution</h3>
            <div className="h-6 bg-gray-100 rounded-lg overflow-hidden flex">
              {stats.processingTimeMetrics?.processingDistribution && (
                <>
                  <div 
                    className="h-full bg-green-500" 
                    style={{ 
                      width: `${stats.processingTimeMetrics.totalProcessed > 0 
                        ? (stats.processingTimeMetrics.processingDistribution.lessThan24h / stats.processingTimeMetrics.totalProcessed) * 100
                        : 0}%` 
                    }}
                    title={`< 24h (${stats.processingTimeMetrics.processingDistribution.lessThan24h})`}
                  ></div>
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ 
                      width: `${stats.processingTimeMetrics.totalProcessed > 0 
                        ? (stats.processingTimeMetrics.processingDistribution.between24And48h / stats.processingTimeMetrics.totalProcessed) * 100
                        : 0}%` 
                    }}
                    title={`24-48h (${stats.processingTimeMetrics.processingDistribution.between24And48h})`}
                  ></div>
                  <div 
                    className="h-full bg-yellow-500" 
                    style={{ 
                      width: `${stats.processingTimeMetrics.totalProcessed > 0 
                        ? (stats.processingTimeMetrics.processingDistribution.between48And72h / stats.processingTimeMetrics.totalProcessed) * 100
                        : 0}%` 
                    }}
                    title={`48-72h (${stats.processingTimeMetrics.processingDistribution.between48And72h})`}
                  ></div>
                  <div 
                    className="h-full bg-red-500" 
                    style={{ 
                      width: `${stats.processingTimeMetrics.totalProcessed > 0 
                        ? (stats.processingTimeMetrics.processingDistribution.moreThan72h / stats.processingTimeMetrics.totalProcessed) * 100
                        : 0}%` 
                    }}
                    title={`> 72h (${stats.processingTimeMetrics.processingDistribution.moreThan72h})`}
                  ></div>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">&lt; 24h ({stats.processingTimeMetrics?.processingDistribution?.lessThan24h || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">24-48h ({stats.processingTimeMetrics?.processingDistribution?.between24And48h || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">48-72h ({stats.processingTimeMetrics?.processingDistribution?.between48And72h || 0})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-xs text-gray-600">&gt; 72h ({stats.processingTimeMetrics?.processingDistribution?.moreThan72h || 0})</span>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>Efficiency Insights:</p>
              <p className="mt-1">Processing efficiency is calculated based on the time elapsed between submission and decision. Lower average processing times indicate higher administrative efficiency.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(countryCounts).length === 0 ? (
              <div className="text-center text-gray-500 py-8">No country data available.</div>
            ) : (
              <div>
                <div className="w-full max-w-3xl mx-auto" style={{ height: 400 }}>
                  <MapContainer center={[10, 0]} zoom={2} style={{ width: '100%', height: 400 }} scrollWheelZoom={false}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Plot a marker for each country with applications */}
                    {Object.entries(countryCounts).map(([country, count]) => {
                      // Use a simple lookup for country centroids (for demo, only Marshall Islands)
                      // In production, use a full country-to-coordinates mapping or a geocoding API
                      const centroids: { [key: string]: [number, number] } = {
                        'Marshall Islands': [7.1164, 171.1858],
                        // Add more countries as needed
                      };
                      const position = centroids[country];
                      if (!position) return null;
                      return (
                        <Marker key={country} position={position} icon={L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })}>
                          <Popup>
                            <strong>{country}</strong><br />Applications: {count}
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  {Object.entries(countryCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([country, count]) => (
                      <div key={country} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {country}: {count}
                      </div>
                    ))}
                  {Object.keys(countryCounts).length > 8 && (
                    <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">+{Object.keys(countryCounts).length - 8} more</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Applications: React.FC = () => {
  const { user, profile } = useAuth(); // Get current admin user info
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewApp, setViewApp] = useState<any | null>(null);
  const [editApp, setEditApp] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [statusApp, setStatusApp] = useState<any | null>(null);
  const [statusValue, setStatusValue] = useState<string>("");
  const [statusSaving, setStatusSaving] = useState(false);
  const { toast } = useToast();

  // List of document fields and their labels
  const documentFields = [
    { key: "birth_certificate_url", label: "Birth Certificate" },
    { key: "consent_form_url", label: "Consent Form" },
    { key: "marriage_certificate_url", label: "Marriage/Divorce Certificate" },
    { key: "old_passport_url", label: "Old Passport Copy" },
    { key: "signature_url", label: "Signature" },
    { key: "photo_id_url", label: "Photo ID" },
  ];

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("passport_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError("Failed to fetch applications");
        setApplications([]);
      } else {
        setApplications(data || []);
      }
      setLoading(false);
    };
    fetchApplications();
  }, []);

  // Generate signed URLs for all document fields when viewApp changes
  useEffect(() => {
    if (!viewApp) return;
    (async () => {
      const newUrls: { [key: string]: string } = {};
      for (const doc of documentFields) {
        const url = viewApp[doc.key];
        if (url && url.trim() !== "") {
          // Extract the file path from the public URL
          const match = url.match(/passport-documents\/(.+)$/);
          const filePath = match ? match[1] : null;
          if (filePath) {
            const { data, error } = await supabase.storage.from("passport-documents").createSignedUrl(filePath, 300);
            newUrls[doc.key] = error ? "" : data.signedUrl;
          }
        }
      }
      setSignedUrls(newUrls);
    })();
  }, [viewApp]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    setDeletingId(id);
    const { error } = await supabase
      .from("passport_applications")
      .delete()
      .eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({ title: "Error", description: "Failed to delete application." });
    } else {
      setApplications(applications.filter(app => app.id !== id));
      toast({ title: "Deleted", description: "Application deleted." });
    }
  };

  const handleView = (id: string) => {
    const app = applications.find(a => a.id === id);
    setViewApp(app);
  };
  const handleEdit = (id: string) => {
    const app = applications.find(a => a.id === id);
    setEditApp(app);
    setEditForm({ ...app });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };  const handleEditSave = async () => {
    setSaving(true);
    
    // Get admin name for tracking
    const adminName = profile 
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      : 'Admin User';
    
    // Always set progress based on status
    const progress = getProgressForStatus(editForm.status);
    const { error } = await supabase
      .from("passport_applications")
      .update({
        ...editForm,
        progress,
        updated_at: new Date().toISOString(),
        last_modified_by_admin_id: user?.id || null,
        last_modified_by_admin_name: adminName
      })
      .eq("id", editApp.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update application." });
    } else {
      setApplications(applications.map(app => app.id === editApp.id ? { 
        ...app, 
        ...editForm,
        progress,
        updated_at: new Date().toISOString(),
        last_modified_by_admin_id: user?.id || null,
        last_modified_by_admin_name: adminName
      } : app));
      setEditApp(null);
      toast({ title: "Updated", description: "Application updated." });
    }
  };

  const handleStatus = (id: string) => {
    const app = applications.find(a => a.id === id);
    setStatusApp(app);
    setStatusValue(app?.status || "");
  };
  const handleStatusClose = () => setStatusApp(null);  const handleStatusSave = async () => {
    if (!statusApp) return;
    setStatusSaving(true);
    
    // Get admin name for tracking
    const adminName = profile 
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      : 'Admin User';
    
    // Always set progress based on status
    const progress = getProgressForStatus(statusValue);
    const { error } = await supabase
      .from("passport_applications")
      .update({ 
        status: statusValue,
        progress,
        updated_at: new Date().toISOString(),
        last_modified_by_admin_id: user?.id || null,
        last_modified_by_admin_name: adminName
      })
      .eq("id", statusApp.id);
    setStatusSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update status." });
    } else {
      setApplications(applications.map(app => app.id === statusApp.id ? { 
        ...app, 
        status: statusValue,
        progress,
        updated_at: new Date().toISOString(),
        last_modified_by_admin_id: user?.id || null,
        last_modified_by_admin_name: adminName
      } : app));
      setStatusApp(null);
      toast({ title: "Status Updated", description: "Application status updated." });
    }
  };

  const handleViewClose = () => setViewApp(null);
  const handleEditClose = () => setEditApp(null);
  // Print application details
  const handlePrintApplication = () => {
    const printContents = document.getElementById('application-print-content')?.innerHTML;
    if (!printContents) return;
    
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Application Details - ${viewApp ? [viewApp.surname, viewApp.first_middle_names].filter(Boolean).join(' ') : 'Unknown'}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #111827; 
                line-height: 1.5;
              }
              .hidden { display: none !important; }
              .print\\:hidden { display: none !important; }
              .print\\:block { display: block !important; }
              .print\\:inline { display: inline !important; }
              .grid { display: grid; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .gap-6 { gap: 1.5rem; }
              .gap-x-8 { column-gap: 2rem; }
              .gap-y-2\\.5 { row-gap: 0.625rem; }
              .space-y-2\\.5 > * + * { margin-top: 0.625rem; }
              .space-y-6 > * + * { margin-top: 1.5rem; }
              .bg-gray-50 { background-color: #f9fafb; }
              .rounded-lg { border-radius: 0.5rem; }
              .p-4 { padding: 1rem; }
              .border { border: 1px solid #d1d5db; }
              .font-semibold { font-weight: 600; }
              .font-medium { font-weight: 500; }
              .text-lg { font-size: 1.125rem; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .text-gray-900 { color: #111827; }
              .text-gray-800 { color: #1f2937; }
              .text-gray-700 { color: #374151; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mt-4 { margin-top: 1rem; }
              .w-32 { width: 8rem; }
              .shrink-0 { flex-shrink: 0; }
              .flex { display: flex; }
              .font-mono { font-family: ui-monospace, monospace; }
              .whitespace-pre-wrap { white-space: pre-wrap; }
              .bg-white { background-color: white; }
              .col-span-2 { grid-column: span 2 / span 2; }
              @media print {
                body { margin: 0; }
                .print\\:bg-transparent { background-color: transparent !important; }
                .print\\:text-black { color: black !important; }
                .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
                .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
              }
            </style>
          </head>
          <body>
            ${printContents}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // Status badge with icon
  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="w-4 h-4" /> Approved</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><ClockIcon className="w-4 h-4" /> Pending</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="w-4 h-4" /> Rejected</span>;
      case 'submitted':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><ArrowPathIcon className="w-4 h-4" /> Submitted</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status || 'N/A'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Applications Management</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search applications..."
              className="px-3 py-2 border rounded-md text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <select className="border rounded-md px-3 py-2 text-sm bg-white">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>All Time</option>
          </select>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="border-b px-4 py-3 flex items-center gap-4">
          <select className="border rounded-md px-3 py-1.5 text-sm bg-white text-gray-900">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="border rounded-md px-3 py-1.5 text-sm bg-white text-gray-900">
            <option value="all">All Types</option>
            <option value="new">New Passport</option>
            <option value="renewal">Renewal</option>
            <option value="replacement">Replacement</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading applications...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="py-4 px-6 font-medium">APPLICATION ID</th>
                  <th className="py-4 px-6 font-medium">APPLICANT</th>
                  <th className="py-4 px-6 font-medium">TYPE</th>
                  <th className="py-4 px-6 font-medium">SUBMISSION DATE</th>
                  <th className="py-4 px-6 font-medium">STATUS</th>
                  <th className="py-4 px-6 font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-blue-600" style={{ maxWidth: 200, wordBreak: 'break-all' }}>{app.id}</td>
                    <td className="py-4 px-6 whitespace-normal break-words max-w-xs text-gray-900">{[app.surname, app.first_middle_names].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-4 px-6 whitespace-normal break-words max-w-xs text-gray-900">{formatApplicationType(app.application_type)}</td>
                    <td className="py-4 px-6 text-gray-500">{app.submitted_at ? app.submitted_at.split("T")[0] : "-"}</td>
                    <td className="py-4 px-6">
                      {statusBadge(app.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button title="View" className="p-2 rounded-full hover:bg-blue-100 transition" onClick={() => handleView(app.id)}><EyeIcon className="w-5 h-5 text-blue-600" /></button>
                        <button title="Edit" className="p-2 rounded-full hover:bg-gray-100 transition" onClick={() => handleEdit(app.id)}><PencilIcon className="w-5 h-5 text-gray-600" /></button>
                        <button title="Delete" className="p-2 rounded-full hover:bg-red-100 transition" onClick={() => handleDelete(app.id)} disabled={deletingId === app.id}><TrashIcon className="w-5 h-5 text-red-600" /></button>
                        <button title="Update Status" className="p-2 rounded-full hover:bg-indigo-100 transition" onClick={() => handleStatus(app.id)}><ArrowPathIcon className="w-5 h-5 text-indigo-600" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {applications.length} application{applications.length !== 1 ? 's' : ''}
          </div>
          {/* Pagination controls could go here */}
        </div>
      </div>      {/* View Modal */}
      {viewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 relative text-gray-900 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Application Details - {viewApp.id.split('-')[0].toUpperCase()}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintApplication}
                  className="print:hidden px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button 
                  className="print:hidden p-2 hover:bg-gray-100 rounded-full transition-colors" 
                  onClick={handleViewClose}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div id="application-print-content" className="flex-1 overflow-y-auto p-6">
              {/* Applicant Name for Print */}
              <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {[viewApp.surname, viewApp.first_middle_names].filter(Boolean).join(' ')}
                </h1>
                <p className="text-gray-600">Application ID: {viewApp.id}</p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Applicant Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-lg text-gray-900 mb-3">Applicant Information</h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Full Name:</span>
                        <span className="text-gray-900">{[viewApp.surname, viewApp.first_middle_names].filter(Boolean).join(' ') || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Email:</span>
                        <span className="text-gray-900">{viewApp.email || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Phone:</span>
                        <span className="text-gray-900">{viewApp.phone_number || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Address:</span>
                        <span className="text-gray-900">{[viewApp.address_unit, viewApp.street_name, viewApp.city, viewApp.state, viewApp.postal_code].filter(Boolean).join(', ') || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Application Type:</span>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded print:bg-transparent print:text-black print:px-0 print:py-0">
                          {formatApplicationType(viewApp.application_type)}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Current Status:</span>
                        <span className="print:text-black">
                          <span className="print:hidden">{statusBadge(viewApp.status)}</span>
                          <span className="hidden print:inline">{viewApp.status}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-lg text-gray-900 mb-3">Personal Details</h4>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Gender:</span>
                        <span className="text-gray-900">{viewApp.gender || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Date of Birth:</span>
                        <span className="text-gray-900">{viewApp.date_of_birth || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Place of Birth:</span>
                        <span className="text-gray-900">{[viewApp.place_of_birth_city, viewApp.place_of_birth_state, viewApp.country_of_birth].filter(Boolean).join(', ') || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Hair Color:</span>
                        <span className="text-gray-900">{viewApp.hair_color || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Eye Color:</span>
                        <span className="text-gray-900">{viewApp.eye_color || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Height:</span>
                        <span className="text-gray-900">
                          {viewApp.height_feet && viewApp.height_inches ? `${viewApp.height_feet}' ${viewApp.height_inches}"` : '—'}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Marital Status:</span>
                        <span className="text-gray-900">{viewApp.marital_status || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">SSN:</span>
                        <span className="text-gray-900">{viewApp.social_security_number || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Uploaded Documents */}
                <div className="print:hidden">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-semibold text-lg text-gray-900 mb-3">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {documentFields.map(doc => {
                        const url = signedUrls[doc.key];
                        if (!viewApp[doc.key]) return null;
                        return (
                          <div key={doc.key} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="font-medium text-gray-900">{doc.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors" 
                                title={`View ${doc.label}`}
                              >
                                <EyeIcon className="w-4 h-4 text-blue-600" />
                              </a>
                              <a 
                                href={url} 
                                download 
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors" 
                                title={`Download ${doc.label}`}
                              >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                      {documentFields.filter(doc => viewApp[doc.key]).length === 0 && (
                        <p className="text-gray-500 text-sm italic">No documents uploaded</p>
                      )}
                    </div>
                  </div>
                </div>              </div>

              {/* Emergency Contact - Full Width */}
              <div className="col-span-1 lg:col-span-2 mt-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Full Name:</span>
                      <span className="text-gray-900">{viewApp.emergency_full_name || '—'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Phone Number:</span>
                      <span className="text-gray-900">{viewApp.emergency_phone_number || '—'}</span>
                    </div>
                    <div className="flex md:col-span-2">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Address:</span>
                      <span className="text-gray-900">{[viewApp.emergency_address_unit, viewApp.emergency_street_name, viewApp.emergency_city, viewApp.emergency_state, viewApp.emergency_postal_code].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parents Information - Full Width */}
              <div className="col-span-1 lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-3">Parental Information</h4>
                  
                  {/* Father's Information */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2">Father's Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Full Name:</span>
                        <span className="text-gray-900">{viewApp.father_full_name || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Date of Birth:</span>
                        <span className="text-gray-900">{viewApp.father_dob || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Nationality:</span>
                        <span className="text-gray-900">{viewApp.father_nationality || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Place of Birth:</span>
                        <span className="text-gray-900">{[viewApp.father_birth_city, viewApp.father_birth_state, viewApp.father_birth_country].filter(Boolean).join(', ') || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mother's Information */}
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Mother's Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Full Name:</span>
                        <span className="text-gray-900">{viewApp.mother_full_name || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Date of Birth:</span>
                        <span className="text-gray-900">{viewApp.mother_dob || '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Nationality:</span>
                        <span className="text-gray-900">{viewApp.mother_nationality || '—'}</span>
                      </div>
                                           <div className="flex">
                        <span className="font-medium text-gray-700 w-32 shrink-0">Place of Birth:</span>
                        <span className="text-gray-900">{[viewApp.mother_birth_city, viewApp.mother_birth_state, viewApp.mother_birth_country].filter(Boolean).join(', ') || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Meta - Full Width */}
              <div className="col-span-1 lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-3">Application Meta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Progress:</span>
                      <span className="text-gray-900">{viewApp.progress ? `${viewApp.progress}%` : '—'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Submitted At:</span>
                      <span className="text-gray-900">{viewApp.submitted_at ? new Date(viewApp.submitted_at).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Updated At:</span>
                      <span className="text-gray-900">{viewApp.updated_at ? new Date(viewApp.updated_at).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Created At:</span>
                      <span className="text-gray-900">{viewApp.created_at ? new Date(viewApp.created_at).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Application ID:</span>
                      <span className="text-gray-900 font-mono text-xs">{viewApp.id}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32 shrink-0">User ID:</span>
                      <span className="text-gray-900 font-mono text-xs">{viewApp.user_id}</span>
                    </div>
                  </div>
                </div>
              </div>              {/* Admin Comments - Full Width */}
              <div className="col-span-1 lg:col-span-2">
                <AdminComments applicationId={viewApp.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                   <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={handleEditClose}>&times;</button>
            <h3 className="text-xl font-semibold mb-4">Edit Application</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Surname</label>
                <input name="surname" value={editForm.surname || ''} onChange={handleEditChange} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First & Middle Names</label>
                <input name="first_middle_names" value={editForm.first_middle_names || ''} onChange={handleEditChange} className="mt-1 block w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select name="application_type" value={editForm.application_type || ''} onChange={handleEditChange} className="mt-1 block w-full border rounded-md p-2">
                  <option value="new">New Passport</option>
                  <option value="renewal">Renewal</option>
                  <option value="replacement">Replacement</option>
                  <option value="name-change">Name Change</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" value={editForm.status || ''} onChange={handleEditChange} className="mt-1 block w-full border rounded-md p-2">
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {/* Add more fields as needed */}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={handleEditClose}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xs p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={handleStatusClose}>&times;</button>
            <h3 className="text-lg font-semibold mb-4">Update Application Status</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border rounded-md p-2 bg-white text-gray-900"
                value={statusValue}
                onChange={e => setStatusValue(e.target.value)}
              >
                <option className="bg-white text-gray-900" value="submitted">Submitted</option>
                <option className="bg-white text-gray-900" value="pending">Pending</option>
                <option className="bg-white text-gray-900" value="approved">Approved</option>
                <option className="bg-white text-gray-900" value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={handleStatusClose}>Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={handleStatusSave} disabled={statusSaving}>{statusSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Users = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">          <input
            type="text"
            placeholder="Search users..."
            className="px-3 py-2 border rounded-md text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add User</span>
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">1,284</p>
              <p className="text-sm text-blue-700">Total Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">156</p>
              <p className="text-sm text-green-700">Active Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-900">28</p>
              <p className="text-sm text-purple-700">New Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">5</p>
              <p className="text-sm text-orange-700">Pending Approvals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="bg-white rounded-lg border shadow-sm">
      <div className="border-b px-4 py-3 flex items-center gap-4">        <select className="border rounded-md px-3 py-1.5 text-sm bg-white text-gray-900">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="staff">Staff</option>
        </select>
        <select className="border rounded-md px-3 py-1.5 text-sm bg-white text-gray-900">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs">
              <th className="py-4 px-6 font-medium">USER</th>
              <th className="py-4 px-6 font-medium">EMAIL</th>
              <th className="py-4 px-6 font-medium">ROLE</th>
              <th className="py-4 px-6 font-medium">STATUS</th>
              <th className="py-4 px-6 font-medium">JOIN DATE</th>
              <th className="py-4 px-6 font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              { name: "Admin User", email: "admin@rmi.gov", role: "Admin", status: "active", date: "2025-01-01" },
              { name: "John Smith", email: "john@example.com", role: "User", status: "active", date: "2025-03-15" },
              { name: "Sarah Johnson", email: "sarah@example.com", role: "Staff", status: "inactive", date: "2025-04-20" },
              { name: "Michael Brown", email: "michael@example.com", role: "User", status: "pending", date: "2025-05-30" },
              { name: "Emma Davis", email: "emma@example.com", role: "Staff", status: "active", date: "2025-06-01" },
            ].map((user, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-600">{user.email}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'Staff' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-500">{user.date}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing 5 of 24 users
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center">
            <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded">1</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded">2</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded">3</button>
            <span className="px-3 py-1 text-gray-400">...</span>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded">8</button>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Settings = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-gray-800">System Settings</h2>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Save Changes</span>
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Allow New Applications</p>
                <p className="text-sm text-gray-500">Enable or disable new passport applications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Document Upload</p>
                <p className="text-sm text-gray-500">Allow users to upload passport documents</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Temporarily disable the portal for maintenance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Application Processing Time</h4>            <select className="w-full border rounded-md p-2 text-sm bg-white text-gray-900">
              <option value="1-2">1-2 weeks</option>
              <option value="2-3">2-3 weeks</option>
              <option value="3-4">3-4 weeks</option>
              <option value="4-6">4-6 weeks</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Application Updates</p>
                <p className="text-sm text-gray-500">Send notifications for application status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">System Alerts</p>
                <p className="text-sm text-gray-500">Receive notifications about system updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Reports</p>
                <p className="text-sm text-gray-500">Receive daily summary reports</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Frequency</h4>
            <select className="w-full border rounded-md p-2 text-sm">
              <option>Immediately</option>
              <option>Daily Digest</option>
              <option>Weekly Summary</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Session Timeout</p>
                <p className="text-sm text-gray-500">Automatically log out inactive users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Session Timeout Duration</h4>
            <select className="w-full border rounded-md p-2 text-sm">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Version</span>
              <span className="font-medium">2.1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium">June 3, 2025</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Server Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Database Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Connected
              </span>
            </div>
          </div>
          <button className="w-full mt-4 bg-gray-100 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
            Check for Updates
          </button>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Modernized Sidebar and Topbar
const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0v6m0 0H7m6 0h6" /></svg> },
  { id: 'applications', label: 'Applications', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5a2 2 0 012 2z" /></svg> },
  { id: 'users', label: 'Users', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 5.75M8 3.13a4 4 0 010 5.75" /></svg> },
  { id: 'settings', label: 'Settings', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

const Sidebar = ({ activeTab, setActiveTab, onLogout }: { activeTab: string, setActiveTab: (tab: string) => void, onLogout: () => void }) => (
  <aside className="h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white flex flex-col shadow-lg">
    <div className="flex items-center gap-2 px-6 py-6 border-b border-blue-800">
      <img src="/seal.png" alt="Logo" className="w-10 h-10 rounded-full border-2 border-blue-200" />
      <span className="font-bold text-lg tracking-wide">Admin Portal</span>
    </div>
    <nav className="flex-1 py-6 space-y-2">
      {sidebarItems.map(item => (
        <button
          key={item.id}
          className={`w-full flex items-center gap-3 px-6 py-3 rounded-lg transition font-medium text-base hover:bg-blue-800 focus:bg-blue-800 ${activeTab === item.id ? 'bg-blue-800 shadow' : ''}`}
          onClick={() => setActiveTab(item.id)}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
    <div className="px-6 py-4 border-t border-blue-800">
      <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-white font-semibold shadow" onClick={onLogout}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
        Logout
      </button>
    </div>
  </aside>
);

const Topbar = ({ title }: { title: string }) => (
  <header className="w-full bg-white shadow flex items-center justify-between px-8 py-4 sticky top-0 z-30">
       <h1 className="text-2xl font-bold text-blue-900 tracking-wide">RMI Passport Administration</h1>
    <div className="flex items-center gap-4">
      <span className="text-gray-700 font-medium">{title}</span>
      <img src="/seal.png" alt="Seal" className="w-8 h-8 rounded-full border border-blue-200" />
    </div>
  </header>
);

// Helper function for formatting application type
function formatApplicationType(type: string) {
  switch (type) {
    case 'new': return 'New Passport';
    case 'renewal': return 'Renewal';
    case 'replacement': return 'Replacement';
    case 'name-change': return 'Name Change';
    default: return type || '—';
  }
}

// Helper: Map status to progress
function getProgressForStatus(status: string) {
  switch (status) {
    case 'draft': return 10;
    case 'submitted': return 33;
    case 'pending': return 66;
    case 'approved':
    case 'rejected': return 100;
    default: return 0;
  }
}

// Main Admin Page Component
export default function AdminPage() {
  useAdminGuard();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "applications":
        return <Applications />;
      case "users":
        return <Users />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <header className="w-full bg-white shadow flex items-center justify-between px-8 py-4 sticky top-0 z-30">
            <h1 className="text-2xl font-bold text-blue-900 tracking-wide">RMI Passport Administration</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
              <img src="/seal.png" alt="Seal" className="w-8 h-8 rounded-full border border-blue-200" />
            </div>
          </header>

          <main className="p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
