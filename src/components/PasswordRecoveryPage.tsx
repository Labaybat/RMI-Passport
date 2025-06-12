import { useState } from "react"
import { Link } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import toast from "react-hot-toast"
import Footer from "./Footer"

export function PasswordRecoveryPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)

  const handleRecoveryRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (!email.trim()) {
        toast.error("Please enter your email address.")
        setLoading(false)
        return
      }
      
      // Check if user exists first
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .limit(1)
        
      if (profileError) {
        console.error("[Recovery] Profile check error:", profileError)
      }
        
      // If no profile found, still proceed with reset to avoid leaking information about which emails exist
      console.log("[Recovery] Sending reset link to:", email)
      
      // Request password reset from Supabase Auth API
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        console.error("[Recovery] Error sending recovery email:", error)
        toast.error("There was a problem sending the recovery email. Please try again.")
        setLoading(false)
        return
      }
      
      // Always show success message even if email doesn't exist (security best practice)
      setResetSent(true)
      toast.success("If this email exists in our system, a recovery link has been sent.")
      setLoading(false)
    } catch (error) {
      console.error("[Recovery] Unexpected error:", error)
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
      <span>Processing...</span>
    </>
  ) : "Send Recovery Link"
  // Security tips for the right column
  const securityTips = [
    "Always use a strong, unique password for your passport account.",
    "Check that you're on the official RMI Passport Portal website before entering credentials.",
    "Never share your password recovery links with anyone.",
    "If you didn't request a password reset, contact support immediately.",    "Consider using a password manager to generate and store secure passwords.",
    "Enable two-factor authentication when available for extra security.",
    "Regularly update your password and security questions.",
    "Avoid accessing your account on public or shared computers."
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white py-8 px-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        {/* Left Column - Recovery Form */}
        <div className="md:w-2/5 bg-gray-50 p-6 md:p-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            {resetSent ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 transition-shadow hover:shadow-xl">
                <div className="flex justify-center mb-6">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Check Your Email</h2>
                <p className="mb-6 text-center text-gray-600">
                  If an account exists with the email {email}, we've sent a recovery link.
                  Please check your inbox and follow the instructions to reset your password.
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
                <h2 className="text-2xl font-bold mb-2 text-center text-[#1e3a8a]">Password Recovery</h2>
                <p className="mb-6 text-center text-gray-500">
                  Enter the email address associated with your account to receive a password reset link
                </p>
                <form className="w-full flex flex-col space-y-4" onSubmit={handleRecoveryRequest}>
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-900 transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    {buttonText}
                  </button>

                  <div className="flex justify-between items-center">
                    <Link to="/login" className="text-sm text-blue-600 hover:underline">
                      Back to Login
                    </Link>
                    <Link to="/signup" className="text-sm text-blue-600 hover:underline">
                      Create Account
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>        {/* Right Column - Security Information */}
        <div className="md:w-3/5 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white p-8 md:p-12">
          <div className="fade-in">
            <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Account Security Tips</h3>
            <ul className="space-y-4">
              {securityTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <p className="text-sm md:text-base text-blue-100">{tip}</p>
              </li>
            ))}          </ul>          <div className="mt-6 text-sm text-blue-300 italic border-t border-blue-400 pt-4">
            RMI Passport Portal - Republic of the Marshall Islands
          </div>
          
          {/* Footer - Blue theme version */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-blue-400">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-blue-200">
              <div className="flex items-center gap-4">
                <a 
                  href="/terms-and-conditions" 
                  className="hover:text-white transition-colors duration-200 underline underline-offset-2"
                >
                  Terms and Conditions
                </a>
                <a 
                  href="mailto:support@passportservices.gov" 
                  className="hover:text-white transition-colors duration-200"
                >
                  Contact Support
                </a>
              </div>
              <p className="text-center sm:text-right">
                © {new Date().getFullYear()} Passport Services. All rights reserved.
              </p>
            </div>
          </div>          </div>
        </div>
      </div>
    </div>
  )
}
