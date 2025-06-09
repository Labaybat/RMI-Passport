import { useState, useEffect } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import toast from "react-hot-toast"

export function PasswordResetPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResetSuccessful, setIsResetSuccessful] = useState(false)
  
  // Check if we have a reset token in the URL hash on initial load
  // Supabase automatically adds this to the URL hash when redirecting from email
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    const refreshToken = hashParams.get("refresh_token")
    const type = hashParams.get("type")
    
    // Log only that we received a token, not the token itself
    if (accessToken) {
      console.log("[Reset] Received reset token type:", type)
    } else {
      console.log("[Reset] No reset token found in URL")
      toast.error("Invalid or missing reset token. Please request a new password reset link.")
    }
  }, [])
  
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Validate passwords
      if (!newPassword.trim() || !confirmPassword.trim()) {
        toast.error("Please enter both password fields")
        setLoading(false)
        return
      }
      
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long")
        setLoading(false)
        return
      }
      
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match")
        setLoading(false)
        return
      }
      
      // The 'access_token' in the URL hash is automatically used by Supabase
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      })
      
      if (error) {
        console.error("[Reset] Error resetting password:", error)
        toast.error(error.message || "Error resetting password. Please try again.")
        setLoading(false)
        return
      }
      
      // Password reset successful
      console.log("[Reset] Password reset successful")
      setIsResetSuccessful(true)
      toast.success("Password has been reset successfully!")
      setLoading(false)
      
      // Clear the URL hash for security
      window.history.replaceState(null, document.title, window.location.pathname)
    } catch (error) {
      console.error("[Reset] Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setLoading(false)
    }
  }
  
  // Redirect to login after successful reset after a few seconds
  useEffect(() => {
    if (isResetSuccessful) {
      const timer = setTimeout(() => {
        navigate({ to: "/login" })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isResetSuccessful, navigate])
  
  // Show loading state in button
  const buttonText = loading ? (
    <>
      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>Processing...</span>
    </>
  ) : "Reset Password"
    // Strong password creation guidelines
  const passwordGuidelines = [
    "Use at least 8 characters - the longer the better.",
    "Include a mix of uppercase and lowercase letters.",
    "Add numbers and special characters (e.g., !@#$%^&*).",
    "Avoid using personal information like name or birthdate.",
    "Don't reuse passwords from other websites or services.",
    "Avoid common dictionary words or predictable patterns.",
    "Consider using a passphrase made of multiple random words.",
    "Change your password periodically, especially for important accounts."
  ]

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white py-8 px-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        {/* Left Column - Reset Form */}
        <div className="md:w-2/5 bg-gray-50 p-6 md:p-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            {isResetSuccessful ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 transition-shadow hover:shadow-xl">
                <div className="flex justify-center mb-6">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Password Reset Successful!</h2>
                <p className="mb-6 text-center text-gray-600">
                  Your password has been reset successfully. You will be redirected to the login page shortly.
                </p>
                <div className="flex flex-col space-y-3">
                  <Link to="/login" className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition text-center">
                    Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 transition-shadow hover:shadow-xl">
                <img src="/seal.png" alt="Marshall Islands Seal" className="w-24 h-24 mx-auto mb-6 drop-shadow-lg" />
                <h2 className="text-2xl font-bold mb-2 text-center text-[#1e3a8a]">Reset Password</h2>
                <p className="mb-6 text-center text-gray-500">
                  Enter your new password below
                </p>
                <form className="w-full flex flex-col space-y-4" onSubmit={handleResetPassword}>
                  <div className="relative">
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder=" "
                      autoComplete="new-password"
                      className="peer w-full px-4 pt-6 pb-2 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                    />
                    <label
                      htmlFor="new-password"
                      className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
                    >
                      New Password
                    </label>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder=" "
                      autoComplete="new-password"
                      className="peer w-full px-4 pt-6 pb-2 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
                    />
                    <label
                      htmlFor="confirm-password"
                      className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
                    >
                      Confirm New Password
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-900 transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    {buttonText}
                  </button>

                  <div className="flex justify-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">
                      Back to Login
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>        {/* Right Column - Password Guidelines */}
        <div className="md:w-3/5 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white p-8 md:p-12">
          <div className="fade-in">
            <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Strong Password Guidelines</h3>
            <ul className="space-y-4">
              {passwordGuidelines.map((guideline, index) => (
              <li key={index} className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <p className="text-sm md:text-base text-blue-100">{guideline}</p>
              </li>
            ))}
          </ul>          <div className="mt-6 text-sm text-blue-300 italic border-t border-blue-400 pt-4">
            RMI Passport Portal - Republic of the Marshall Islands
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
