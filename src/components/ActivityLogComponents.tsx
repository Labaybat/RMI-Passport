import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import supabase from "../lib/supabase/client";
import { useToast } from "../hooks/use-toast";
import { logAdminActivity, getDeviceInfo } from "../lib/admin-logging";
import { 
  ClockIcon, 
  UserIcon, 
  ShieldCheckIcon,
  FunnelIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

// Define interface for admin activity log entry
interface ActivityLogEntry {
  id: string;
  created_at: string;
  user_id: string;
  user_name: string;
  action: string;
  record_id?: string;
  ip_address?: string;
  device_info?: string;
  details?: string;
  is_admin: boolean;
  user_role?: string; // Adding user role to properly display role in UI
}

// Sample mock data for activity log
const mockActivityData: ActivityLogEntry[] = [  {
    id: '1',
    created_at: '2025-06-13T12:45:00Z',
    user_id: 'admin-123',
    user_name: 'Francis Admin',
    action: 'Login',
    ip_address: '192.168.1.1',
    device_info: 'Chrome / Windows',
    is_admin: true,
    user_role: 'admin'
  },  {
    id: '2',
    created_at: '2025-06-13T13:30:00Z',
    user_id: 'staff-456',
    user_name: 'Francis debrum',
    action: 'Reviewed application',
    record_id: '#12345',
    ip_address: '192.168.1.2',
    device_info: 'Safari / Mac',
    details: 'Preliminary review completed',
    is_admin: false,
    user_role: 'staff'
  },  {
    id: '3',
    created_at: '2025-06-13T14:15:00Z',
    user_id: 'admin-123',
    user_name: 'Francis Admin',
    action: 'Changed application status',
    record_id: '#12345',
    ip_address: '192.168.1.1',
    device_info: 'Chrome / Windows',
    details: 'Changed status from Pending to Approved',
    is_admin: true,
    user_role: 'admin'
  },  {
    id: '4',
    created_at: '2025-06-12T09:20:00Z',
    user_id: 'staff-789',
    user_name: 'Rebecca Johnson',
    action: 'Document verification',
    record_id: '#12346',
    ip_address: '192.168.1.3',
    device_info: 'Firefox / Linux',
    details: 'Verified birth certificate',
    is_admin: false,
    user_role: 'staff'
  },  {
    id: '5',
    created_at: '2025-06-12T10:05:00Z',
    user_id: 'admin-123',
    user_name: 'Francis Admin',
    action: 'Updated system settings',
    ip_address: '192.168.1.1',
    device_info: 'Chrome / Windows',
    details: 'Modified rate limiting parameters',
    is_admin: true,
    user_role: 'admin'
  },  {
    id: '6',
    created_at: '2025-06-11T15:45:00Z',
    user_id: 'staff-456',
    user_name: 'Francis debrum',
    action: 'Logout',
    ip_address: '192.168.1.2',
    device_info: 'Safari / Mac',
    is_admin: false,
    user_role: 'staff'
  },  {
    id: '7',
    created_at: '2025-06-11T16:30:00Z',
    user_id: 'admin-890',
    user_name: 'Sarah Thompson',
    action: 'Bulk application processing',
    ip_address: '192.168.1.4',
    device_info: 'Edge / Windows',
    details: 'Processed 15 pending applications',
    is_admin: true,
    user_role: 'admin'
  }
];

// Format date function
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

// Format a user's full name from first and last name, or return a fallback
function formatUserName(firstName?: string, lastName?: string, fallback: string = 'Unknown User'): string {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return fullName || fallback;
}

// Function to get applicant full name from passport_applications table
const getApplicantName = async (applicationId: string): Promise<string> => {
  if (!applicationId) return 'Unknown';
  
  try {
    const { data, error } = await supabase
      .from('passport_applications')
      .select('surname, first_middle_names')
      .eq('id', applicationId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching applicant name:', error);
      return 'Unknown';
    }
    
    const fullName = [data.first_middle_names, data.surname]
      .filter(Boolean)
      .join(' ')
      .trim();
    
    return fullName || 'Unknown';
  } catch (err) {
    console.error('Unexpected error fetching applicant name:', err);
    return 'Unknown';
  }
};

// Log activity event helper function that can be exported for use in other components
export const logActivityEvent = async (action: string, recordId?: string, details?: any) => {
  try {
    const user = await supabase.auth.getUser();
    if (user && user.data && user.data.user) {      // Fetch the user's role and name from the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.data.user.id)
        .single();
      
      // Default to user role if not found, use the correct role if available
      const isAdmin = profileData?.role === 'admin';      // Generate user's full name
      const userFullName = profileData ? 
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() : '';
      
      // Check if this is an application-related activity
      let enrichedDetails = details;
      
      // If we have a record ID and it seems to be a passport application
      if (recordId && 
          (action.includes('Application') || 
           action.includes('Comment') || 
           action.includes('Message') ||
           action.includes('Document'))) {
        
        // Get the applicant's name from the database
        const applicantName = await getApplicantName(recordId);
        
        // Enrich details with applicant name if it's not already there
        enrichedDetails = {
          ...details,
          applicantName: applicantName
        };
      }        // Note: IP address collection requires server-side integration
        // Client-side JavaScript can't reliably get the user's real IP address
        // A server-side function or API endpoint would be needed for this
        await logAdminActivity({
        userId: user.data.user.id,
        userName: userFullName || user.data.user.email || 'Admin User',
        action,
        recordId,
        details: enrichedDetails,
        isAdmin: isAdmin,
        ipAddress: "client-side-unavailable", // We need a server-side solution to get real IP
        deviceInfo: getDeviceInfo()
      });
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
  
// Activity Log ActionBadge component
const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  // Define background color based on action type
  const getBadgeColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return 'bg-green-100 text-green-800';
    if (actionLower.includes('logout')) return 'bg-gray-100 text-gray-800';
    if (actionLower.includes('review')) return 'bg-blue-100 text-blue-800';
    if (actionLower.includes('approved') || actionLower.includes('approve')) return 'bg-green-100 text-green-800';
    if (actionLower.includes('rejected') || actionLower.includes('reject')) return 'bg-red-100 text-red-800';
    if (actionLower.includes('change') || actionLower.includes('update')) return 'bg-yellow-100 text-yellow-800';
    if (actionLower.includes('verif')) return 'bg-purple-100 text-purple-800';
    if (actionLower.includes('upload') || actionLower.includes('document')) return 'bg-indigo-100 text-indigo-800';
    if (actionLower.includes('bulk') || actionLower.includes('process')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(action)}`}>
      {action}
    </span>
  );
};

// Activity Log Filters component
const ActivityFilters: React.FC<{
  onFilterChange: (filters: any) => void;
  filters: any;
}> = ({ onFilterChange, filters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      dateRange: 'all',
      userType: 'all',
      actionType: 'all',
      searchQuery: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-gray-800 font-medium hover:bg-gray-50"
      >
        <FunnelIcon className="w-4 h-4" />
        <span>Filters</span>
        {(filters.dateRange !== 'all' || filters.userType !== 'all' || filters.actionType !== 'all') && (
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-lg shadow-lg border p-4 z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Filter Activities</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            {/* User Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localFilters.userType}
                onChange={(e) => handleFilterChange('userType', e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="admin">Administrators</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            
            {/* Action Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={localFilters.actionType}                onChange={(e) => handleFilterChange('actionType', e.target.value)}
              >
                <option value="all">All Actions</option>                <option value="login">Login/Logout</option>
                <option value="status">Status Changes</option>
                <option value="settings">System Settings</option>
                <option value="delete">Deletions</option>
                <option value="user">User Management</option>
                <option value="comment">Comments</option>
                <option value="message">Messages</option>
              </select>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button 
                onClick={applyFilters}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              >
                Apply
              </button>
              <button 
                onClick={resetFilters}
                className="px-4 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ActivityLog Search component
const ActivitySearch: React.FC<{
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
}> = ({ searchQuery, setSearchQuery, onSearch }) => {
  return (
    <div className="relative flex-1 max-w-lg">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        className="block w-full py-2 pl-10 pr-12 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search by user, action, or record ID..."
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <button onClick={onSearch} className="text-blue-600 hover:text-blue-800">
          Search
        </button>
      </div>
    </div>
  );
};

// Activity Log Entry component
const ActivityLogEntryRow: React.FC<{ entry: ActivityLogEntry }> = ({ entry }) => {
  return (
    <div className="py-3 px-4 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">          <div className={`p-2 rounded-full ${
            entry.user_role === 'admin' ? 'bg-purple-100' : 
            entry.user_role === 'staff' ? 'bg-blue-100' : 
            'bg-gray-100'
          }`}>
            {entry.user_role === 'admin' ? (
              <ShieldCheckIcon className="w-5 h-5 text-purple-700" />
            ) : entry.user_role === 'staff' ? (
              <UserIcon className="w-5 h-5 text-blue-700" />
            ) : (
              <UserIcon className="w-5 h-5 text-gray-700" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{entry.user_name}</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                entry.user_role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                entry.user_role === 'staff' ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {entry.user_role ? entry.user_role.charAt(0).toUpperCase() + entry.user_role.slice(1) : (entry.is_admin ? 'Admin' : 'Staff')}
              </span>
            </div>
              <div className="flex items-center gap-2 mt-1">
              <ActionBadge action={entry.action} />
              {entry.record_id && (
                <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                  Record: {entry.record_id}
                </span>
              )}
            </div>
            
            {/* Parse and display details, handling both string and JSON formats */}
            {entry.details && (() => {
              try {
                // Try to parse as JSON if it's a string
                const detailsObj = typeof entry.details === 'string' ? 
                  JSON.parse(entry.details) : entry.details;
                
                return (
                  <div className="text-sm text-gray-700 mt-1">
                    {/* Display applicant name if available */}
                    {detailsObj.applicantName && (
                      <p className="font-medium text-gray-900 mb-1">
                        Applicant: {detailsObj.applicantName}
                      </p>
                    )}
                    
                    {/* Display other key details */}
                    {Object.entries(detailsObj)
                      .filter(([key]) => key !== 'applicantName') // Skip applicant name as it's shown above
                      .map(([key, value]) => (
                        <p key={key} className="mb-0.5">
                          <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {String(value)}
                        </p>
                      ))
                    }
                  </div>
                );
              } catch (e) {
                // Fallback to showing as raw string if not valid JSON
                return <p className="text-sm text-gray-800 mt-1 font-medium">{entry.details}</p>;
              }
            })()}
            
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-700">
              {entry.ip_address && (
                <span className="bg-gray-100 px-2 py-1 rounded">IP: {entry.ip_address}</span>
              )}
              {entry.device_info && (
                <span className="bg-gray-100 px-2 py-1 rounded">{entry.device_info}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded whitespace-nowrap">
            {formatDate(entry.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Main Activity Log Component
const ActivityLog: React.FC = () => {
  const { toast } = useToast();  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityLogEntry[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [silentRefresh, setSilentRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'all',
    userType: 'all',
    actionType: 'all',
    searchQuery: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20; // Limit to 20 entries per page
  // State for activity summary data
  const [activitySummary, setActivitySummary] = useState({ today: 0, yesterday: 0 });
  const [uniqueUsers, setUniqueUsers] = useState({ staff: 0, admin: 0 });  /**
   * Fetch activity log data from Supabase
   * @param silent When true, won't show loading state
   * This reduces UI flicker during auto-refresh
   */  const fetchActivityData = async (silent = false) => {
    try {
      if (silent) {
        setSilentRefresh(true);
      } else {
        setLoading(true);
      }
      
      // Build the query based on filters
      let countQuery = supabase.from('admin_activity_log').select('*', { count: 'exact', head: true });
      let query = supabase.from('admin_activity_log').select('*');
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        switch(filters.dateRange) {
          case 'today':
            query = query.gte('created_at', today.toISOString());
            countQuery = countQuery.gte('created_at', today.toISOString());
            break;
          case 'yesterday':
            query = query.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString());
            countQuery = countQuery.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString());
            break;
          case 'week':
            query = query.gte('created_at', weekAgo.toISOString());
            countQuery = countQuery.gte('created_at', weekAgo.toISOString());
            break;
          case 'month':
            query = query.gte('created_at', monthAgo.toISOString());
            countQuery = countQuery.gte('created_at', monthAgo.toISOString());
            break;
        }
      }
        // User type filter - we'll handle this later when we join with profiles
      // For now, still use is_admin for counting purposes
      if (filters.userType !== 'all') {
        countQuery = countQuery.eq('is_admin', filters.userType === 'admin');
      }
        // Action type filter
      if (filters.actionType !== 'all') {
        // Special case for login/logout to handle both activities
        if (filters.actionType === 'login') {
          query = query.or('action.ilike.%login%,action.ilike.%logout%');
          countQuery = countQuery.or('action.ilike.%login%,action.ilike.%logout%');
        } else {
          query = query.ilike('action', `%${filters.actionType}%`);
          countQuery = countQuery.ilike('action', `%${filters.actionType}%`);
        }
      }
      
      // Search query
      if (filters.searchQuery.trim() !== '') {
        query = query.or(`user_name.ilike.%${filters.searchQuery}%,action.ilike.%${filters.searchQuery}%,record_id.ilike.%${filters.searchQuery}%`);
        countQuery = countQuery.or(`user_name.ilike.%${filters.searchQuery}%,action.ilike.%${filters.searchQuery}%,record_id.ilike.%${filters.searchQuery}%`);
      }
      
      // Get total count before pagination
      const { count, error: countError } = await countQuery;
      
      if (!countError) {
        setTotalCount(count || 0);
      }
      
      // Order by most recent first
      query = query.order('created_at', { ascending: false });
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // If no real data yet, use mock data for demonstration
      let transformedData = [];
      if (!data || data.length === 0) {
        transformedData = mockActivityData;
        toast({
          title: "Demo Mode",
          description: "Using sample data until activity logs are populated"
        });
      } else {
        // Transform the data if needed
        const userIds = data.map(item => item.user_id).filter(Boolean);
        const uniqueUserIds = [...new Set(userIds)];
          // Fetch user roles and names from profiles table
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, role, first_name, last_name')
          .in('id', uniqueUserIds);
        
        // Create maps for user role and name lookups
        const userRoleMap = {};
        const userNameMap = {};
        
        if (profilesData) {
          profilesData.forEach(profile => {
            userRoleMap[profile.id] = profile.role;              // Create full name from first and last name
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            userNameMap[profile.id] = fullName || null; // Only set if not empty
          });
        }
        
        transformedData = data.map(item => {
          // Parse details properly - keep as object if possible
          let parsedDetails = item.details;
          if (typeof item.details === 'string') {
            try {
              parsedDetails = JSON.parse(item.details);
            } catch (e) {
              // If not valid JSON, keep as string
              parsedDetails = item.details;
            }
          }
            // Get user role from map, default to is_admin flag if not found
          const userRole = userRoleMap[item.user_id] || (item.is_admin ? 'admin' : 'staff');
          
          // Use the user's full name from profiles if available, otherwise keep the existing name
          // This ensures we show proper names instead of emails where possible
          const userName = userNameMap[item.user_id] || item.user_name;
          
          return {
            id: item.id,
            created_at: item.created_at,
            user_id: item.user_id,
            user_name: userName,
            action: item.action,
            record_id: item.record_id,
            ip_address: item.ip_address,
            device_info: item.device_info,
            details: parsedDetails,
            is_admin: userRole === 'admin', // Update is_admin based on actual role
            user_role: userRole
          };
        });
      }
          // Apply post-fetch user type filtering
        if (filters.userType !== 'all') {
          const filteredData = transformedData.filter(item => 
            filters.userType === 'admin' 
              ? item.user_role === 'admin' 
              : item.user_role === 'staff'
          );
          setActivityData(filteredData);
        } else {
          setActivityData(transformedData);
        }

      // No longer logging "Viewed Activity Log" entries as requested
    } catch (error) {
      console.error('Error fetching activity data:', error);
      // Only show error toast if not in silent mode
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch activity data. Please try again."
        });
      }    } finally {
      // Update the last updated timestamp
      setLastUpdated(new Date());
      
      if (silent) {
        setSilentRefresh(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Fetch summary statistics for activity log
  const fetchActivitySummary = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Query for today's activities
      const { data: todayData, error: todayError } = await supabase
        .from('admin_activity_log')
        .select('id')
        .gte('created_at', today.toISOString());
      
      // Query for yesterday's activities
      const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('admin_activity_log')
        .select('id')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());
      
      if (!todayError && !yesterdayError) {
        setActivitySummary({
          today: todayData?.length || 0,
          yesterday: yesterdayData?.length || 0
        });
      }
        // Query for unique users
      const { data: userData, error: userError } = await supabase
        .from('admin_activity_log')
        .select('user_id')
        .order('created_at', { ascending: false });
      
      if (!userError && userData) {
        // Extract unique user IDs
        const uniqueUserIds = [...new Set(userData.map(e => e.user_id))];
        
        // Get role information from profiles table
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, role')
          .in('id', uniqueUserIds);
        
        // Create maps for role lookup
        const userRoleMap = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            userRoleMap[profile.id] = profile.role;
          });
        }
        
        // Count unique staff and admin users
        const uniqueStaff = new Set();
        const uniqueAdmin = new Set();
        
        uniqueUserIds.forEach(userId => {
          const role = userRoleMap[userId];
          if (role === 'admin') {
            uniqueAdmin.add(userId);
          } else {
            uniqueStaff.add(userId);
          }
        });
        
        setUniqueUsers({
          staff: uniqueStaff.size,
          admin: uniqueAdmin.size
        });
      }
    } catch (error) {
      console.error('Error fetching activity summary:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchActivityData();
    fetchActivitySummary(); // Fetch summary data independently
  }, [filters, currentPage]);
  // Update data periodically if auto-refresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Initial fetch for summary only, main data is already fetched
    fetchActivitySummary();
    
    const interval = setInterval(() => {
      // Only trigger a refresh if we're not already refreshing
      if (!silentRefresh) {
        // Refresh both data and summary silently without showing loading state
        fetchActivityData(true); // Pass true for silent mode
        fetchActivitySummary();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, silentRefresh]);

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    setFilters({ ...filters, searchQuery });
  };
    const handleFilterChange = (newFilters: any) => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilters(newFilters);
  };

  return (
    <div className="p-6 space-y-6">      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600">Monitor admin and staff activities</p>
        </div>        <div className="flex flex-col items-end gap-2"><div className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm hover:shadow transition-all ${autoRefresh ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => {
                  setCurrentPage(1); // Reset to first page when toggling auto-refresh
                  setAutoRefresh(e.target.checked);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-refresh</span>
            </label>{autoRefresh && (
              <div className={`flex items-center gap-1 text-xs ${silentRefresh ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-2 h-2 rounded-full ${
                  silentRefresh ? 'bg-blue-500 animate-bounce' : 'bg-green-500 animate-pulse'
                }`}></div>
                <span className="font-medium">{silentRefresh ? 'Updating...' : 'Live'}</span>
              </div>
            )}
          </div>          <button
            onClick={() => {
              setCurrentPage(1); // Reset to first page on manual refresh
              fetchActivityData();
            }}
            className={`px-4 py-2 rounded-lg transition ${
              silentRefresh 
              ? 'bg-gray-100 text-blue-600 border border-blue-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={loading || silentRefresh}
          >
            <ArrowPathIcon className={`w-4 h-4 inline mr-2 ${silentRefresh ? 'animate-spin' : ''}`} />            {silentRefresh ? 'Updating...' : 'Refresh'}
          </button>
          <p className="text-xs text-gray-500 self-end">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Activity</p>
              <p className="text-2xl font-bold text-gray-900">{activitySummary.today}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Yesterday's Activity</p>
              <p className="text-2xl font-bold text-gray-900">{activitySummary.yesterday}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-full bg-indigo-100 mr-4">
              <UserIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueUsers.staff}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 rounded-full bg-amber-100 mr-4">
              <ShieldCheckIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Admins</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueUsers.admin}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Log */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-xl font-semibold text-gray-900">Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <ActivitySearch 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              onSearch={handleSearch} 
            />
            
            <ActivityFilters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
            />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activityData.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              {activityData.map(entry => (
                <ActivityLogEntryRow key={entry.id} entry={entry} />
              ))}
              
              {activityData.length > 0 && (
                <div className="p-3 bg-gray-50 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {totalCount > 0 ? (
                      `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} of ${totalCount} activities`
                    ) : (
                      `Showing ${activityData.length} activities`
                    )}
                  </span>
                  
                  {/* Pagination controls */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={`px-3 py-1 border rounded text-gray-800 font-medium bg-white hover:bg-gray-100 transition ${currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </button>
                    
                    {totalCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Page</span>
                        <select
                          className="border rounded px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={currentPage}
                          onChange={(e) => setCurrentPage(Number(e.target.value))}
                        >
                          {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm font-medium text-gray-700">
                          of {Math.ceil(totalCount / itemsPerPage)}
                        </span>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setCurrentPage(prev => totalCount > prev * itemsPerPage ? prev + 1 : prev)}
                      className={`px-3 py-1 border rounded text-gray-800 font-medium bg-white hover:bg-gray-100 transition ${totalCount <= currentPage * itemsPerPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={totalCount <= currentPage * itemsPerPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="rounded-full bg-gray-100 p-3">
                <ClockIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No activity found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;

// Export individual components for reuse in other admin components
export {
  ActivityLogEntryRow,
  ActivityFilters,
  ActivitySearch,
  ActionBadge
  // logActivityEvent is already exported above, so don't include it here
};
