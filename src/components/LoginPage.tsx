import { useState, useEffect } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"

export function LoginPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showSuspendedMessage, setShowSuspendedMessage] = useState(false)
    useEffect(() => {
    if (!authLoading && user && profile) {
      // Check if user account is suspended
      if (profile.status === "suspended") {
        console.log("[Login] User account is suspended")
        setShowSuspendedMessage(true)
        // Sign out the suspended user
        supabase.auth.signOut()
        return
      }
      
      // Only redirect non-suspended users
      if (profile.role === "admin" || profile.role === "staff") {
        navigate({ to: "/admin" })
      } else {
        navigate({ to: "/dashboard" })
      }
    }
  }, [authLoading, user, profile, navigate])

  // Fix implicit 'any' type for 'e'
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    console.log("[Login] Starting login process...")

    try {
      // Clear any existing session first
      await supabase.auth.signOut()
      
      if (!email.trim() || !password.trim()) {
        setLoading(false)
        toast.error("Please enter both email and password.")
        return
      }

      // Step 1: Sign in
      console.log("[Login] Attempting sign in...")
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })

      if (signInError) {
        console.error("[Login] Sign in error:", signInError)
        toast.error(signInError.message)
        setLoading(false)
        return
      }

      if (!signInData?.user) {
        console.error("[Login] No user data after sign in")
        toast.error("Login failed: no user data")
        setLoading(false)
        return
      }

      // Step 2: Verify session is active
      console.log("[Login] Verifying session...")
      let verifiedSession = null
      for (let i = 0; i < 10; i++) { // Increase retries for mobile reliability
        const { data: sessionResult, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error("[Login] Session verification error:", sessionError)
          toast.error("Session verification failed. Please try again.")
          setLoading(false)
          return
        }
        if (sessionResult?.session?.user?.id === signInData.user.id) {
          verifiedSession = sessionResult.session
          break
        }
        await new Promise(res => setTimeout(res, 500)) // Slightly longer delay for mobile
      }      if (!verifiedSession) {
        console.error("[Login] Could not verify session")
        toast.error("Login failed: session verification error")
        setLoading(false)
        return
      }

      console.log("[Login] Session verified successfully")

      // Step 3: Ensure profile exists
      console.log("[Login] Checking profile...")
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", signInData.user.id)
        .single()
        
      if (profileError && profileError.code !== "PGRST116") { // PGRST116 = not found
        console.error("[Login] Profile check error:", profileError)
        toast.error("Error checking user profile")
        setLoading(false)
        return
      }
      
      // Check if user account is suspended
      if (profile && profile.status === "suspended") {
        console.log("[Login] User account is suspended")
        toast.error("Your account has been suspended. Please contact support for assistance.")
        setShowSuspendedMessage(true)
        
        // Sign out the suspended user
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (!profile) {        console.log("[Login] Creating new profile...")
        const meta = signInData.user.user_metadata || {}
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: signInData.user.id,
            email: signInData.user.email,
            first_name: meta.first_name || "",
            last_name: meta.last_name || "",
            phone: meta.phone || "",
            gender: meta.gender || "",
            date_of_birth: meta.dob || meta.date_of_birth || "",
            status: "active" // Set default status to active for new users
          })

        if (insertError) {
          console.error("[Login] Profile creation error:", insertError)
          toast.error("Could not create user profile")
          setLoading(false)
          return
        }
      }

      // Success! Set states and redirect
      console.log("[Login] Success, preparing to redirect...")
      toast.success("Login successful! Redirecting...")
      setLoading(false)
      await new Promise(res => setTimeout(res, 500))
      console.log("[Login] Redirecting based on role...")
      // Remove any redirect or navigation here
      setLoading(false)
    } catch (error) {
      console.error("[Login] Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setLoading(false)
    }
  }

  // Show loading state in button
  const buttonText = loading ? (
    <>
      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>Logging in...</span>
    </>
  ) : "Login"

  // Important points from the Passport Act, 2020
  const passportActPoints = [
    "The Passport Act, 2020 regulates passport application and issuance in the Republic of the Marshall Islands.",
    "Three types of passports: Regular (blue), Official (black), and Diplomatic (red).",
    "Only lawful citizens of the Republic are eligible to receive passports.",
    "Applications require proof of citizenship through birth certificates or court decrees.",
    "Regular passports are valid for 10 years; Official and Diplomatic for 5 years.",
    "Incompetents and minors require legal guardian consent for passport applications.",
    "Passports can be revoked for false information, criminal activity, or if lost/stolen.",
    "Sale, forgery, or solicitation of passports is prohibited with penalties up to $10,000 and 10 years imprisonment.",
    "Temporary identification documents may be issued in emergencies when passport books are unavailable."
  ]

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white py-8 px-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        {/* Left Column - Login Form - Made Smaller */}
        <div className="md:w-2/5 bg-gray-50 p-6 md:p-8 flex flex-col items-center justify-center">
          {/* Square-shaped Login Card */}
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 p-8 transition-shadow hover:shadow-xl">
            {/* Seal Image styled like SignUp page */}
            <img src="/seal.png" alt="Marshall Islands Seal" className="w-24 h-24 mx-auto mb-6 drop-shadow-lg" />            <h2 className="text-3xl font-bold mb-2 text-center text-[#1e3a8a]">RMI Passport Portal</h2>
            
            {showSuspendedMessage ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Account Suspended</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Your account has been suspended. Please contact support for assistance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-500 text-center">
                Enter your credentials to access your account
              </p>
            )}
            
            <form className={`w-full flex flex-col space-y-3 ${showSuspendedMessage ? 'opacity-50 pointer-events-none' : ''}`} onSubmit={handleLogin}>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
                >
                  Email address
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                />
                <label
                  htmlFor="password"
                  className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
                >
                  Password
                </label>
              </div>              <button
                type="submit"
                disabled={loading || showSuspendedMessage}
                className={`w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-900 transition flex items-center justify-center gap-2 shadow-lg ${showSuspendedMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {showSuspendedMessage ? "Account Suspended" : buttonText}
              </button>
              
              <div className="flex justify-end">
                <Link to="/recover-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <p className="text-center text-sm text-gray-500 mt-4">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Column - Passport Act Information */}
        <div className="md:w-3/5 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white p-8 md:p-12">
          <div className="fade-in">
            <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Passport Act, 2020 Highlights</h3>
            <ul className="space-y-4">
              {passportActPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <p className="text-sm md:text-base text-blue-100">{point}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-sm text-blue-300 italic border-t border-blue-400 pt-4">
            Passport Act, 2020 (43MIRCCh.11) - Republic of the Marshall Islands
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
