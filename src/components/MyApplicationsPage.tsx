"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import Button from "./ui/Button"
import MessageModal from "./MessageModal" // Import the MessageModal component
import Footer from "./Footer"

// Define the PassportApplication type based on the Supabase table
type PassportApplication = {
  id: string
  user_id: string
  application_type: string | null
  [key: string]: any // Add index signature to allow dynamic key access
  surname: string | null
  first_middle_names: string | null
  social_security_number: string | null
  place_of_birth_city: string | null
  place_of_birth_state: string | null
  country_of_birth: string | null
  date_of_birth: string | null
  gender: string | null
  hair_color: string | null
  marital_status: string | null
  height_feet: number | null
  height_inches: number | null
  eye_color: string | null
  address_unit: string | null
  street_name: string | null
  phone_number: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  emergency_full_name: string | null
  emergency_phone_number: string | null
  emergency_address_unit: string | null
  emergency_street_name: string | null
  emergency_city: string | null
  emergency_state: string | null
  emergency_postal_code: string | null
  father_full_name: string | null
  father_dob: string | null
  father_nationality: string | null
  father_birth_city: string | null
  father_birth_state: string | null
  father_birth_country: string | null
  mother_full_name: string | null
  mother_dob: string | null
  mother_nationality: string | null
  mother_birth_city: string | null
  mother_birth_state: string | null
  mother_birth_country: string | null
  birth_certificate: string | null
  consent_form: string | null
  marriage_or_divorce_certificate: string | null
  old_passport_copy: string | null
  signature: string | null
  photo_id: string | null
  status: string | null
  progress: number | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  email?: string | null
}

const MyApplicationsPage: React.FC = () => {
  const { user, signOut, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<PassportApplication[]>([])
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [viewApp, setViewApp] = useState<PassportApplication | null>(null)
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({})
  // Add states for message functionality
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [currentApplicationId, setCurrentApplicationId] = useState<string>("")
  const [currentApplicationTitle, setCurrentApplicationTitle] = useState<string>("")
  const [applicationMessagesCount, setApplicationMessagesCount] = useState<{[key: string]: number}>({})

  // Define document field mappings with storage keys and display keys
  const documentFields = [
    { key: "birth_certificate", label: "Birth Certificate", storageKey: "birth_certificate_url" },
    { key: "consent_form", label: "Consent Form", storageKey: "consent_form_url" },
    { key: "marriage_or_divorce_certificate", label: "Marriage/Divorce Certificate", storageKey: "marriage_certificate_url" },
    { key: "old_passport_copy", label: "Old Passport Copy", storageKey: "old_passport_url" },
    { key: "signature", label: "Signature", storageKey: "signature_url" },
    { key: "photo_id", label: "Photo ID", storageKey: "photo_id_url" },
  ]

  // Fetch session and profile
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      setLoading(true)
      let sessionData = null
      // Wait for a valid session
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession()
        if (data && data.session && data.session.user) {
          sessionData = data
          break
        }
        await new Promise(res => setTimeout(res, 200))
      }
      
      if (!sessionData || !sessionData.session || !sessionData.session.user) {
        setSession(null)
        setProfile(null)
        setLoading(false)
        navigate({ to: "/login" })
        return
      }
      
      setSession(sessionData.session)
      
      // Fetch profile from Supabase
      const userId = sessionData.session.user.id
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
        
      if (error || !profileData) {
        setProfile(null)
        setLoading(false)
        navigate({ to: "/login" })
        return
      }
      
      setProfile(profileData)
      setLoading(false)
    }
    
    fetchSessionAndProfile()
  }, [navigate])

  // Fetch all applications and subscribe to updates
  useEffect(() => {
    if (!session || !isConfigured) return
    
    let subscription: any = null
    
    const fetchAndSubscribe = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from("passport_applications")
          .select("*")
          .eq("user_id", session.user.id)
          .order("updated_at", { ascending: false })
          
        if (!error && data) {
          setApplications(data)
        }
        
        // Set up real-time subscription for updates
        subscription = supabase
          .channel('passport_applications_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'passport_applications',
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload: any) => {
              // Refetch all applications on any change
              supabase
                .from("passport_applications")
                .select("*")
                .eq("user_id", session.user.id)
                .order("updated_at", { ascending: false })
                .then(({ data }) => {
                  if (data) setApplications(data)
                })
            }
          )
          .subscribe()
      } catch (err) {
        console.error("Error fetching applications:", err)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchAndSubscribe()
    
    // Clean up subscription on unmount
    return () => {
      if (subscription) supabase.removeChannel(subscription)
    }
  }, [session?.user?.id, isConfigured])

  // New effect to fetch unread message counts for all applications
  useEffect(() => {
    if (!session?.user?.id || !applications.length) return
    
    const fetchUnreadMessageCounts = async () => {
      // For each application, count unread messages from admins
      const counts: {[key: string]: number} = {}
        for (const app of applications) {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', app.id)
          .eq('sender_type', 'admin')
          .eq('read_by_user', false)
        
        if (!error && count !== null) {
          counts[app.id] = count
        }
      }
      
      setApplicationMessagesCount(counts)
    }
    
    fetchUnreadMessageCounts()
    
    // Set up subscription for new messages
    const channel = supabase
      .channel('messages_count')
      .on(
        'postgres_changes',        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_type=eq.admin`
        },
        async (payload) => {
          const msg = payload.new as any
          const appId = msg.application_id
          
          // Check if this application belongs to the current user
          const isUserApp = applications.some(app => app.id === appId)
          if (!isUserApp) return
          
          setApplicationMessagesCount(prev => ({
            ...prev,
            [appId]: (prev[appId] || 0) + 1
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_type=eq.admin`
        },
        async (payload) => {
          const msg = payload.new as any
          const appId = msg.application_id
          
          // Check if this application belongs to the current user
          const isUserApp = applications.some(app => app.id === appId)
          if (!isUserApp) return
            // If message was marked as read by user, decrease the count
          if (msg.read_by_user && payload.old && !payload.old.read_by_user) {
            setApplicationMessagesCount(prev => ({
              ...prev,
              [appId]: Math.max(0, (prev[appId] || 0) - 1)
            }))
          }
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [applications, session?.user?.id])  // Utility: Map status to progress if progress is missing
  const getProgress = (app: PassportApplication) => {
    // Only use database progress if it's a positive number, otherwise use status-based mapping
    if (typeof app.progress === 'number' && app.progress > 0) return app.progress
    
    switch (app.status) {
      case 'draft': return 25
      case 'submitted': return 50
      case 'pending': return 75
      case 'approved': return 100
      case 'rejected': return 100
      default: return 0
    }
  }

  // Check if user has any draft applications
  const hasDraftApplications = () => {
    return applications.some(app => app.status === 'draft');
  }

  // Utility: Dynamic status message
  const getStatusMessage = (app: PassportApplication) => {
    const name = [app.surname, app.first_middle_names].filter(Boolean).join(' ')
    
    switch (app.status) {
      case 'draft': return `Continue application for ${name || 'Unnamed'}`
      case 'submitted': return `Application for ${name || 'Unnamed'} submitted`
      case 'pending': return `Application for ${name || 'Unnamed'} is in review`
      case 'approved': return `Application for ${name || 'Unnamed'} has been approved`
      case 'rejected': return `Application for ${name || 'Unnamed'} has been rejected`
      default: return `Application for ${name || 'Unnamed'}`
    }
  }

  // Handle navigation to dashboard
  const handleBackToDashboard = () => {
    navigate({ to: "/dashboard" })
  }

  // Handle starting a new application
  const handleStartNewApplication = () => {
    navigate({ to: "/apply", search: { new: true } })
  }  // Handle continuing an existing draft
  const handleContinueApplication = (appId: string) => {
    navigate({ to: "/apply", search: { id: appId } })
  }  // Handle view application details
  const handleViewApplication = async (appId: string) => {
    try {
      const app = applications.find(a => a.id === appId)
      if (app) {
        console.log("Viewing application:", app)
        setViewApp(app)
        
        // Generate signed URLs before displaying the modal
        await generateSignedUrls(app)
        
        // The state update might not be reflected immediately in this function,
        // so we'll add a small delay before logging for debugging purposes
        setTimeout(() => {
          console.log("Current signed URLs state:", signedUrls)
        }, 100)
      }
    } catch (error) {
      console.error("Error handling view application:", error)
    }
  }
  
  // Handle closing the view application modal
  const handleViewClose = () => {
    setViewApp(null)
    setSignedUrls({})
  }
  // Generate signed URLs for all document fields
  const generateSignedUrls = async (application: PassportApplication) => {
    const newUrls: { [key: string]: string } = {}
    
    for (const doc of documentFields) {
      try {
        // First try to get URL from the application using the storageKey (what's saved in DB)
        // This is the field that actually contains the full URL
        const documentUrl = application[doc.storageKey] || application[doc.key]
        
        console.log(`Document "${doc.label}" - Field key: ${doc.key}, Storage key: ${doc.storageKey}`)
        console.log(`Document URL from application: ${documentUrl}`)
        
        if (documentUrl && typeof documentUrl === 'string' && documentUrl.trim() !== "") {
          // Extract the file path from the public URL
          const match = documentUrl.match(/passport-documents\/(.+)$/)
          const filePath = match ? match[1] : null
          
          console.log(`Extracted file path: ${filePath}`)
          
          if (filePath) {
            const { data, error } = await supabase.storage
              .from("passport-documents")
              .createSignedUrl(filePath, 300) // URL valid for 5 minutes
              
            if (error) {
              console.error(`Error getting signed URL for ${doc.label}:`, error)
              continue
            }
            
            // Store using the key for consistency with the view rendering
            newUrls[doc.key] = data.signedUrl
            console.log(`Generated signed URL for ${doc.label}: ${data.signedUrl.substring(0, 50)}...`)
          } else {
            console.warn(`Could not extract file path from URL: ${documentUrl}`)
          }
        } else {
          console.log(`No document URL found for ${doc.label}`)
        }
      } catch (error) {
        console.error(`Error processing document ${doc.label}:`, error)
      }
    }
    
    setSignedUrls(newUrls)
  }
  
  // Handle printing application details
  const handlePrintApplication = () => {
    window.print()
  }
  
  // Format application type for display
  const formatApplicationType = (type: string | null): string => {
    if (!type) return "Standard Passport"
    
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }
  
  // Handle refresh button click
  const handleRefresh = async () => {
    if (!session) return
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from("passport_applications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        
      if (!error && data) {
        setApplications(data)
      } else if (error) {
        console.error("Error refreshing applications:", error)
      }
    } catch (err) {
      console.error("Unexpected error refreshing applications:", err)
    } finally {
      setLoading(false)
    }
  }
  // Handle opening message modal
  const handleOpenMessages = (app: PassportApplication) => {
    const name = [app.surname, app.first_middle_names].filter(Boolean).join(' ') || 'Unnamed'
    const id = app.id.slice(-8).toUpperCase()
    
    setCurrentApplicationId(app.id)
    setCurrentApplicationTitle(`${name} - ${id}`)
    setMessageModalOpen(true)
    
    // Clear notification count for this application
    setApplicationMessagesCount(prev => ({
      ...prev,
      [app.id]: 0
    }))
  }
    // Handle closing message modal
  const handleCloseMessages = async () => {
    setMessageModalOpen(false)
    setCurrentApplicationId("")
    setCurrentApplicationTitle("")
    
    // Re-fetch unread message count for the application that was just closed
    if (currentApplicationId && session?.user?.id) {
      // Add a small delay to ensure database operations have completed
      setTimeout(async () => {
        try {          const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('application_id', currentApplicationId)
            .eq('sender_type', 'admin')
            .eq('read_by_user', false)
          
          if (!error && count !== null) {
            setApplicationMessagesCount(prev => ({
              ...prev,
              [currentApplicationId]: count
            }))
            console.log(`🔄 Updated message count for ${currentApplicationId}: ${count}`)
          }
        } catch (error) {
          console.error('Error refreshing message count:', error)
        }
      }, 500)
    }
  }

  // Show loading while session or profile is being determined
  if (loading || !session || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    )
  }

  // Smart display name logic: fallback to 'User' if first/last name missing or empty
  const getDisplayName = () => {
    const first = typeof profile.first_name === "string" ? profile.first_name.trim() : ""
    const last = typeof profile.last_name === "string" ? profile.last_name.trim() : ""
    
    if (first && last) return `${first} ${last}`
    if (first) return first
    if (last) return last
    
    // fallback: try email, else 'User'
    if (typeof profile.email === "string" && profile.email.includes("@")) {
      return profile.email.split("@")[0]
    }
    
    return "User"
  }
  
  const userDisplayName = getDisplayName()

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl p-4 sm:p-6 md:p-8 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-0">
        <div className="flex flex-col space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-100">
            {/* Logo Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
                <img src="/seal.png" alt="Official Seal" className="h-8 w-8 sm:h-12 sm:w-12 object-contain" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Passport Services</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">My Applications</p>
              </div>
            </div>

            {/* Welcome Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <h1 className="text-xs sm:text-sm font-bold text-gray-800">
                  Hello, {userDisplayName}!
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500">{profile?.email || ""}</p>
              </div>
            </div>
          </div>          {/* Page Title and Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">My Applications</h2>
              <p className="text-sm text-gray-500">View and manage all your passport applications</p>
            </div>              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">              <Button 
                className="bg-indigo-500 text-white hover:bg-indigo-600 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm flex items-center justify-center shadow-sm"
                onClick={handleBackToDashboard}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-1.5"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back to Dashboard
              </Button>              <Button 
                className="bg-cyan-500 text-white hover:bg-cyan-600 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm flex items-center justify-center shadow-sm"
                onClick={handleRefresh}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-1.5"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                Refresh
              </Button>              {!hasDraftApplications() && (
                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 sm:px-5 rounded-md text-xs sm:text-sm flex items-center justify-center shadow-sm"
                  onClick={handleStartNewApplication}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1.5"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Start New Application
                </Button>
              )}
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4 sm:space-y-6">
            {applications.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 text-center">
                <div className="flex justify-center mb-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="40" 
                    height="40" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-gray-400"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <path d="M14 2v6h6"></path>
                    <path d="M16 13H8"></path>
                    <path d="M16 17H8"></path>
                    <path d="M10 9H8"></path>
                  </svg>
                </div>
                <h3 className="text-gray-700 font-medium text-lg mb-2">No Applications Found</h3>
                <p className="text-gray-500 mb-6">You haven't started any passport applications yet. Create your first application to get started.</p>                <Button 
                  className="bg-blue-600 text-white hover:bg-blue-700 py-2 px-5 rounded-md inline-flex items-center text-sm shadow-md"
                  onClick={handleStartNewApplication}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Start Application
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-700">
                    {applications.length} Application{applications.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>                {applications.map((app) => {
                  const progress = getProgress(app);
                  const statusMsg = getStatusMessage(app);
                  
                  const lastUpdated = app.updated_at ? 
                    new Date(app.updated_at).toLocaleDateString("en-US", { 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    }) : "N/A";
                  
                  // Get application details
                  const applicantName = [app.first_middle_names, app.surname].filter(Boolean).join(' ') || 'Unnamed';
                  const applicationId = app.id.slice(-8).toUpperCase(); // Last 8 chars of ID
                  const submittedDate = app.submitted_at ? 
                    new Date(app.submitted_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    }) : "Not submitted";
                  
                  return (
                    <div 
                      key={app.id} 
                      className={`bg-white rounded-lg shadow-md border ${
                        app.status === 'approved' ? 'border-green-200' : 
                        app.status === 'rejected' ? 'border-red-200' : 
                        app.status === 'draft' ? 'border-amber-200' : 
                        'border-blue-200'
                      } p-4 sm:p-6`}
                    >
                      {/* Application Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                            {applicantName}
                          </h3>
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <span>ID: {applicationId}</span>
                            <span className="mx-2">•</span>
                            <span>Created: {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                          app.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          app.status === 'draft' ? 'bg-amber-100 text-amber-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Unknown'}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="mb-2 flex justify-between text-xs font-medium text-gray-500">
                          <span>Application Started</span>
                          <span>Review</span>
                          <span>Approval</span>
                        </div>
                        <div className="relative mb-2 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`absolute h-full rounded-full ${
                              app.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                              app.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                              app.status === 'draft' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                              'bg-gradient-to-r from-blue-400 to-blue-600'
                            } transition-all duration-500 ease-out`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{progress}% Complete</span>
                          <span>Last Updated: {lastUpdated}</span>
                        </div>
                      </div>
                      
                      {/* Application Details */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-500">Application Type</span>
                          <span className="font-medium text-gray-800">{app.application_type || "Standard Passport"}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-gray-500">Submission Date</span>
                          <span className="font-medium text-gray-800">{submittedDate}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3">                        {app.status === 'draft' ? (
                          <Button 
                            className="bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 rounded-md text-xs sm:text-sm shadow-sm flex items-center"
                            onClick={() => handleContinueApplication(app.id)}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="mr-1.5"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                            Continue Application
                          </Button>                        ) : (                          <Button 
                            className="bg-purple-600 text-white hover:bg-purple-700 py-2 px-4 rounded-md text-xs sm:text-sm shadow-sm flex items-center"
                            onClick={() => handleViewApplication(app.id)}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="mr-1.5"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View Details
                          </Button>                        )}
                          {app.status === 'approved' && (<Button 
                            className="bg-green-600 text-white hover:bg-green-700 py-2 px-4 rounded-md text-xs sm:text-sm shadow-sm flex items-center"
                            onClick={() => {
                              // In a real implementation, this would download a certificate
                              // For now, just show an alert
                              window.alert(`Certificate for application ${app.id} would be downloaded here.`)
                            }}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="mr-1.5"
                            >
                              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                              <path d="M7 11l5 5 5-5" />
                              <path d="M12 4v12" />
                            </svg>
                            Download Certificate
                          </Button>
                        )}
                        {/* Updated Messages button */}                        <Button 
                          className="bg-teal-600 text-white hover:bg-teal-700 py-2 px-4 rounded-md text-xs sm:text-sm ml-auto flex items-center shadow-sm"
                          onClick={() => handleOpenMessages(app)}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="mr-1.5"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          Messages
                          {(applicationMessagesCount[app.id] || 0) > 0 && (
                            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-medium">
                              {applicationMessagesCount[app.id]}
                            </span>
                          )}
                        </Button>
                      </div>
                      
                      {/* Space for future commenting system */}
                      <div className="hidden">
                        {/* This will be implemented in the future */}
                      </div>
                    </div>
                  );
                })}
              </>            )}
          </div>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
      
      {/* Application Details Modal */}
      {viewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 relative text-gray-900 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Application Details - {viewApp.id.slice(-8).toUpperCase()}
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
                        <span className={`inline-block text-xs px-2 py-1 rounded print:bg-transparent print:text-black print:px-0 print:py-0 ${
                          viewApp.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          viewApp.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          viewApp.status === 'draft' ? 'bg-amber-100 text-amber-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {viewApp.status ? viewApp.status.charAt(0).toUpperCase() + viewApp.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                    </div>                  </div>
                </div>
                
                {/* Right Column: Personal Details Only */}
                <div className="space-y-6">
                  {/* Personal Details - Moved to right column */}
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
                        <span className="text-gray-900">{viewApp.social_security_number || '—'}</span>                      </div>
                    </div>                  </div>
                  
                  {/* No Uploaded Documents here - Moved to bottom */}
                </div>
              </div>
              
              {/* Emergency Contact - Full Width */}
              <div className="mt-6">
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

              {/* Parental Information - Full Width */}
              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-3">Parental Information</h4>
                  
                  {/* Father's Information */}
                  <h5 className="font-medium text-md text-gray-800 mb-2 mt-1">Father's Information</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm mb-4">
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
                    <div className="flex md:col-span-2">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Place of Birth:</span>
                      <span className="text-gray-900">{[viewApp.father_birth_city, viewApp.father_birth_state, viewApp.father_birth_country].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                  </div>
                  
                  {/* Mother's Information */}
                  <h5 className="font-medium text-md text-gray-800 mb-2 mt-4">Mother's Information</h5>
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
                    <div className="flex md:col-span-2">
                      <span className="font-medium text-gray-700 w-32 shrink-0">Place of Birth:</span>
                      <span className="text-gray-900">{[viewApp.mother_birth_city, viewApp.mother_birth_state, viewApp.mother_birth_country].filter(Boolean).join(', ') || '—'}</span>                    </div>
                  </div>
                </div>
              </div>
              
              {/* Uploaded Documents - Moved to bottom */}
              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-3">Uploaded Documents</h4>
                  <div className="space-y-2">
                    {documentFields.map(doc => {
                      const url = signedUrls[doc.key];
                      // Check both the display key and storage key for document existence
                      const documentExists = !!(viewApp[doc.key] || viewApp[doc.storageKey]);
                      
                      // For debugging, add to the console 
                      console.log(`Document ${doc.label} - exists: ${documentExists}, url: ${url ? 'Yes' : 'No'}`);
                      
                      // Skip if document doesn't exist or no signed URL generated
                      if (!documentExists || !url) return null;
                      
                      return (
                        <div key={doc.key} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </a>
                            <a 
                              href={url} 
                              download 
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors" 
                              title={`Download ${doc.label}`}
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                    {/* Show message if no documents are found or if no signed URLs were generated */}
                    {documentFields.filter(doc => (viewApp[doc.key] || viewApp[doc.storageKey]) && signedUrls[doc.key]).length === 0 && (
                      <p className="text-gray-500 text-sm italic">No documents available to view</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Application Timeline - Moved to the bottom */}
              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-3">Application Timeline</h4>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-100 p-2 mt-1">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Application Created</p>
                        <p className="text-gray-500 text-xs">{new Date(viewApp.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                      {viewApp.submitted_at && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-amber-100 p-2 mt-1">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Application Submitted</p>
                          <p className="text-gray-500 text-xs">{new Date(viewApp.submitted_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                      {viewApp.status === 'approved' && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-green-100 p-2 mt-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Application Approved</p>
                          <p className="text-gray-500 text-xs">{new Date(viewApp.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                      {viewApp.status === 'rejected' && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-red-100 p-2 mt-1">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Application Rejected</p>
                          <p className="text-gray-500 text-xs">{new Date(viewApp.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Progress - Moved to the bottom */}
              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-3">Application Progress</h4>
                  <div className="text-sm">
                    <div className="mb-2 flex justify-between text-xs font-medium text-gray-500">
                      <span>Application Started</span>
                      <span>Review</span>
                      <span>Approval</span>
                    </div>
                    <div className="relative mb-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`absolute h-full rounded-full ${
                          viewApp.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                          viewApp.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                          viewApp.status === 'draft' ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                          'bg-gradient-to-r from-blue-400 to-blue-600'
                        } transition-all duration-500 ease-out`}
                        style={{ width: `${viewApp.progress || getProgress(viewApp)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{viewApp.progress || getProgress(viewApp)}% Complete</span>
                      <span>Last Updated: {new Date(viewApp.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3 print:hidden">                <Button
                  className="bg-gray-600 text-white hover:bg-gray-700 py-2 px-4 rounded-md text-sm shadow-sm"
                  onClick={handleViewClose}
                >
                  Close
                </Button>
                {viewApp.status === 'draft' && (
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 rounded-md text-sm shadow-sm"
                    onClick={() => {
                      handleViewClose();
                      handleContinueApplication(viewApp.id);
                    }}
                  >
                    Continue Editing
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}      
      {/* Add Message Modal */}
      <MessageModal 
        isOpen={messageModalOpen}
        onClose={handleCloseMessages}
        applicationId={currentApplicationId}
        applicationTitle={currentApplicationTitle}
      />
    </div>
  )
}

export default MyApplicationsPage
