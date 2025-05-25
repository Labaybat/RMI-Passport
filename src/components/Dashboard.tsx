"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import supabase from "../lib/supabase/client"
import { useNavigate } from "@tanstack/react-router"

// Define the PassportApplication type based on the Supabase table
// (see attached schema)
type PassportApplication = {
  id: string
  user_id: string
  application_type: string | null
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
}

const PassportDashboard: React.FC = () => {
  const { user, profile, signOut, isConfigured, loading: authLoading } = useAuth()
  const [application, setApplication] = useState<PassportApplication | null>(null)
  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not authenticated, should redirect to login")
      // In a real app, you would redirect here
      // For now, we'll let the App component handle this
    }
  }, [user, authLoading])

  useEffect(() => {
    if (user && isConfigured) {
      fetchApplication()
    } else if (user && !isConfigured) {
      // Create mock application for development
      setApplication({
        id: "mock-app-id",
        user_id: user.id,
        application_type: null,
        surname: null,
        first_middle_names: null,
        social_security_number: null,
        place_of_birth_city: null,
        place_of_birth_state: null,
        country_of_birth: null,
        date_of_birth: null,
        gender: null,
        hair_color: null,
        marital_status: null,
        height_feet: null,
        height_inches: null,
        eye_color: null,
        address_unit: null,
        street_name: null,
        phone_number: null,
        city: null,
        state: null,
        postal_code: null,
        emergency_full_name: null,
        emergency_phone_number: null,
        emergency_address_unit: null,
        emergency_street_name: null,
        emergency_city: null,
        emergency_state: null,
        emergency_postal_code: null,
        father_full_name: null,
        father_dob: null,
        father_nationality: null,
        father_birth_city: null,
        father_birth_state: null,
        father_birth_country: null,
        mother_full_name: null,
        mother_dob: null,
        mother_nationality: null,
        mother_birth_city: null,
        mother_birth_state: null,
        mother_birth_country: null,
        birth_certificate: null,
        consent_form: null,
        marriage_or_divorce_certificate: null,
        old_passport_copy: null,
        signature: null,
        photo_id: null,
        status: "draft",
        progress: 33,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setLoading(false)
    }
  }, [user, isConfigured])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsPopupVisible(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Utility: Validate UUID format
  const isValidUUID = (id: string) => /^[0-9a-fA-F-]{36}$/.test(id)

  const fetchApplication = async () => {
    if (!user || !isConfigured) return
    console.log("[fetchApplication] Current user.id:", user.id, "Type:", typeof user.id)
    if (!isValidUUID(user.id)) {
      alert("Invalid user ID format. Cannot fetch application.")
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from("passport_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
      if (error) {
        console.error("Error fetching application:", error, error.message, error.details)
        alert("Error fetching application: " + (error.message || "Unknown error"))
        return
      }
      setApplication(data && data.length > 0 ? data[0] : null)
    } catch (error) {
      console.error("Unexpected error fetching application:", error)
      alert("Unexpected error fetching application: " + error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = (): string => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const handleStartApplication = async () => {
    if (!user) return

    if (!isConfigured) {
      // Mock application creation for development
      const mockApp: PassportApplication = {
        id: "mock-app-" + Date.now(),
        user_id: user.id,
        application_type: null,
        surname: null,
        first_middle_names: null,
        social_security_number: null,
        place_of_birth_city: null,
        place_of_birth_state: null,
        country_of_birth: null,
        date_of_birth: null,
        gender: null,
        hair_color: null,
        marital_status: null,
        height_feet: null,
        height_inches: null,
        eye_color: null,
        address_unit: null,
        street_name: null,
        phone_number: null,
        city: null,
        state: null,
        postal_code: null,
        emergency_full_name: null,
        emergency_phone_number: null,
        emergency_address_unit: null,
        emergency_street_name: null,
        emergency_city: null,
        emergency_state: null,
        emergency_postal_code: null,
        father_full_name: null,
        father_dob: null,
        father_nationality: null,
        father_birth_city: null,
        father_birth_state: null,
        father_birth_country: null,
        mother_full_name: null,
        mother_dob: null,
        mother_nationality: null,
        mother_birth_city: null,
        mother_birth_state: null,
        mother_birth_country: null,
        birth_certificate: null,
        consent_form: null,
        marriage_or_divorce_certificate: null,
        old_passport_copy: null,
        signature: null,
        photo_id: null,
        status: "draft",
        progress: 10,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setApplication(mockApp)
      console.log("Mock application started successfully!")
      return
    }

    console.log("[handleStartApplication] Current user.id:", user.id, "Type:", typeof user.id)
    if (!isValidUUID(user.id)) {
      alert("Invalid user ID format. Cannot create application.")
      return
    }
    try {
      const { data, error } = await supabase
        .from("passport_applications")
        .insert([
          {
            user_id: user.id,
            status: "draft",
            progress: 10,
          },
        ])
        .select()
        .limit(1)

      if (error) {
        console.error("Error creating application:", error, error.message, error.details)
        alert("Error creating application: " + (error.message || "Unknown error"))
        return
      }

      setApplication(data && data.length > 0 ? data[0] : null)
      console.log("Application started successfully!")
    } catch (error) {
      console.error("Error starting application:", error)
      alert("Unexpected error starting application: " + error)
    }
  }

  const handleDownloadForm = (): void => {
    const link = document.createElement("a")
    link.href = "/consent.pdf" // Updated to match the file you will put in public folder
    link.download = "passport-consent-form.pdf"
    link.click()
    console.log("Form downloaded")
  }

  const handleLogout = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error("Error signing out:", error)
        alert("Failed to log out. Please try again.")
      } else {
        console.log("User signed out successfully. Redirecting to login page...")
        navigate({ to: "/login" })
        // Fallback to ensure navigation
        setTimeout(() => navigate({ to: "/login" }), 1000)
      }
    } catch (err) {
      console.error("Unexpected error during logout:", err)
      alert("An unexpected error occurred. Please try again.")
    }
  }

  const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault()
    navigate({ to: "/my-profile" })
  }

  // Show loading while auth is being determined
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Only redirect if auth is loaded and user is not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 shadow-sm inline-block">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
            >
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.5 0 4.74 1.02 6.36 2.64"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  // Add a configuration status indicator
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl p-4 sm:p-6 md:p-8 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-0">
          <div className="text-center space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm inline-block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-600"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Development Mode</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Supabase environment variables are not configured. The app is running in demo mode with mock data.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <p className="font-medium text-gray-700 mb-2">To connect to Supabase:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>
                  Add <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_URL</code> to your .env file
                </li>
                <li>
                  Add <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your .env file
                </li>
                <li>Restart your development server</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue with Demo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Extract user data from Supabase profiles table - using first_name and last_name
  const getDisplayName = () => {
    // Patch: log profile for debugging
    console.log('Dashboard profile:', profile)
    if (profile && typeof profile.first_name === 'string' && profile.first_name.trim() && typeof profile.last_name === 'string' && profile.last_name.trim()) {
      return `${profile.first_name} ${profile.last_name}`
    } else if (profile && typeof profile.first_name === 'string' && profile.first_name.trim()) {
      return profile.first_name
    } else if (profile && typeof profile.last_name === 'string' && profile.last_name.trim()) {
      return profile.last_name
    } else if (profile && typeof profile.full_name === 'string' && profile.full_name.trim()) {
      return profile.full_name
    } else {
      return user?.email?.split("@")[0] || "User"
    }
  }

  const userDisplayName = getDisplayName()
  const userEmail = user?.email || ""
  const applicationProgress = application?.progress || 0
  const lastUpdated = application?.updated_at
    ? new Date(application.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "No application started"

  console.log("Profile data from Supabase profiles table:", profile) // Debug log to confirm data source
  console.log("Display name:", userDisplayName) // Debug log for name formatting

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
              <div className="hidden sm:block">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Passport Services</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Government Portal</p>
              </div>
            </div>

            {/* Welcome & Profile Section */}
            <div className="flex items-center gap-2 sm:gap-3 relative">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 justify-end">
                  <h1 className="text-xs sm:text-sm font-bold text-gray-800">
                    {getGreeting()}, {userDisplayName}!
                  </h1>
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M9 12l2 2 4-4"></path>
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">{userEmail}</p>
              </div>

              {/* Profile Avatar */}
              <div
                className="relative h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                onClick={() => {
                  setIsPopupVisible(true)
                  if (timeoutRef.current) clearTimeout(timeoutRef.current)
                  timeoutRef.current = setTimeout(() => setIsPopupVisible(false), 3000)
                }}
                onMouseEnter={() => {
                  setIsPopupVisible(true)
                  if (timeoutRef.current) clearTimeout(timeoutRef.current)
                }}
                onMouseLeave={() => {
                  timeoutRef.current = setTimeout(() => setIsPopupVisible(false), 3000)
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
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
                    className="text-white sm:w-5 sm:h-5 md:w-6 md:h-6"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white"></div>
                </div>
              </div>

              {/* Profile Popup */}
              {isPopupVisible && (
                <div
                  ref={popupRef}
                  className="absolute right-0 top-10 sm:top-12 md:top-14 w-48 sm:w-56 rounded-lg bg-white shadow-2xl z-50 border border-gray-100 overflow-hidden animate-in fade-in duration-200"
                  onMouseEnter={() => {
                    if (timeoutRef.current) clearTimeout(timeoutRef.current)
                  }}
                  onMouseLeave={() => {
                    timeoutRef.current = setTimeout(() => setIsPopupVisible(false), 3000)
                  }}
                >
                  <div className="relative">
                    <div className="absolute top-0 right-5 h-2 w-2 bg-white rotate-45 -mt-1 border-t border-l border-gray-100"></div>
                    <div className="p-3 sm:p-4 space-y-2">
                      <a
                        href="#"
                        className="group flex items-center gap-2 sm:gap-3 w-full rounded-md px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 hover:shadow-sm transition-all duration-150 border border-gray-100"
                        onClick={handleProfileClick}
                      >
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm border border-gray-100 text-blue-500 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:shadow-md transition-all duration-150">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="sm:w-4 sm:h-4"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <span>My Profile</span>
                      </a>
                      <button
                        className="group flex items-center gap-2 sm:gap-3 w-full rounded-md px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-600 hover:shadow-sm transition-all duration-150 border border-gray-100"
                        onClick={handleLogout}
                      >
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white shadow-sm border border-gray-100 text-red-500 group-hover:text-red-600 group_hover:border-red-100 group-hover:shadow-md transition-all duration-150">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="sm:w-4 sm:h-4"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                        </div>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6">
            {/* Action Buttons Grid */}
            <div className="grid w-full grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              <button
                className="group relative flex h-14 sm:h-16 items-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-4 sm:px-6 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleStartApplication}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
                <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition-all duration-300 group-hover:bg-blue-200 group-hover:text-blue-700 group-hover:shadow">
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
                    className="sm:w-5 sm:h-5"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
                  {application ? "Continue Application" : "Start Application"}
                </span>
              </button>

              <button
                className="group relative flex h-14 sm:h-16 items-center overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 px-4 sm:px-6 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                onClick={handleDownloadForm}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
                <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 shadow-sm transition-all duration-300 group-hover:bg-purple-200 group-hover:text-purple-700 group-hover:shadow">
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
                    className="sm:w-5 sm:h-5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm sm:text-base font-medium text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
                    Download Consent Form
                  </span>
                  <span className="text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-600">
                    Sign and upload later
                  </span>
                </div>
              </button>

              <button
                className="group relative flex h-14 sm:h-16 items-center overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-teal-50 px-4 sm:px-6 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={() => console.log("Dashboard clicked")}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 to-green-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
                <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm transition-all duration-300 group-hover:bg-green-200 group-hover:text-green-700 group-hover:shadow">
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
                    className="sm:w-5 sm:h-5"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <line x1="3" x2="21" y1="9" y2="9"></line>
                    <line x1="9" x2="9" y1="21" y2="9"></line>
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
                  My Dashboard
                </span>
              </button>

              <button
                className="group relative flex h-14 sm:h-16 items-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 px-4 sm:px-6 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                onClick={() => window.open("/passport-act.pdf", "_blank")}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
                <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm transition-all duration-300 group-hover:bg-amber-200 group-hover:text-amber-700 group-hover:shadow">
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
                    className="sm:w-5 sm:h-5"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <path d="M14 2v6h6"></path>
                    <path d="M16 13H8"></path>
                    <path d="M16 17H8"></path>
                    <path d="M10 9H8"></path>
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
                  View Passport Act PDF
                </span>
              </button>

              <button
                className="group relative flex h-14 sm:h-16 items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 px-4 sm:px-6 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                onClick={() => console.log("Upload Documents clicked")}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
                <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 shadow-sm transition-all duration-300 group-hover:bg-cyan-200 group-hover:text-cyan-700 group-hover:shadow">
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
                    className="sm:w-5 sm:h-5"
                  >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="m16 16-4-4-4 4"></path>
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
                  Upload Documents
                </span>
              </button>

              <button
                className="group relative flex h-14 sm:h-16 items-center overflow-hidden rounded-xl bg-gradient-to-br from-rose-50 to-red-50 px-4 sm:px-6 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                onClick={() => console.log("Photo Guidelines clicked")}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 to-rose-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
                <div className="mr-3 sm:mr-4 flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-sm transition-all duration-300 group-hover:bg-rose-200 group-hover:text-rose-700 group-hover:shadow">
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
                    className="sm:w-5 sm:h-5"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
                  Photo Guidelines
                </span>
              </button>
            </div>

            {/* Application Status Card */}
            <div className="w-full rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 shadow-md">
              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
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
                      className="sm:w-5 sm:h-5"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                  <h2 className="text-base sm:text-lg font-medium text-gray-800">Application Status</h2>
                </div>
                <div className="rounded-full bg-blue-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-blue-700 self-start sm:self-auto">
                  {application && application.status
                    ? application.status.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
                    : "Not Started"}
                </div>
              </div>

              <div className="mb-2 flex justify-between text-[10px] sm:text-xs font-medium text-gray-500">
                <span>Application Started</span>
                <span>Review</span>
                <span>Approval</span>
              </div>

              <div className="relative mb-3 sm:mb-4 h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${applicationProgress}%` }}
                ></div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-[10px] sm:text-xs text-gray-500"></div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-[10px] sm:text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400 sm:w-3.5 sm:h-3.5"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Last Updated: {lastUpdated}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>{applicationProgress}% Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PassportDashboard