import { useState, useEffect } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import toast from "react-hot-toast"

export function SignUpPage() {
  const navigate = useNavigate()
  // Add state for consent agreement
  const [hasAgreed, setHasAgreed] = useState(false)
  
  // Add states for email verification flow
  const [step, setStep] = useState<"consent" | "email" | "verify" | "signup">("consent")
  const [verificationEmail, setVerificationEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null)

  // Navigation state to track step direction for animations
  const [previousStep, setPreviousStep] = useState<"consent" | "email" | "verify" | "signup">("consent")
  
  // Function to determine the appropriate animation class based on step navigation
  const getStepAnimation = () => {
    // First render or consent step
    if (previousStep === step) {
      return "fade-in";
    }
    
    // Special case for consent to email transition
    if (previousStep === "consent" && step === "email") {
      return "cross-fade-in";
    }
    
    // Special case for verify to signup transition (final step)
    if (previousStep === "verify" && step === "signup") {
      return "cross-fade-in"; // We'll use the specialized CSS selector for this
    }
    
    // Moving forward in the flow
    if (previousStep === "email" && step === "verify") {
      return "slide-right-in";
    }
    
    // Moving backward in the flow (from verify to email, or signup to verify)
    if (
      (previousStep === "verify" && step === "email") ||
      (previousStep === "signup" && step === "verify")
    ) {
      return "slide-left-in";
    }
    
    // Default animation
    return "fade-in";
  }
  
  // Helper function to determine step indicator styling
  const getStepIndicatorClass = (stepToCheck: "consent" | "email" | "verify" | "signup") => {
    if (stepToCheck === step) {
      return "step-indicator step-active";
    } else if (
      (step === "email" && stepToCheck === "consent") ||
      (step === "verify" && ["consent", "email"].includes(stepToCheck)) ||
      (step === "signup" && ["consent", "email", "verify"].includes(stepToCheck))
    ) {
      return "step-indicator step-completed";
    }
    return "step-indicator step-upcoming";
  }
  
  // Check if user previously agreed (so they don't have to agree again on refresh)
  useEffect(() => {
    const previouslyAgreed = localStorage.getItem("passport_consent_agreed")
    if (previouslyAgreed === "true") {
      setHasAgreed(true)
      setStep("email")
    }
    
    // Check for stored rate limit information
    const rateLimitInfo = localStorage.getItem("passport_rate_limit")
    if (rateLimitInfo) {
      const { until } = JSON.parse(rateLimitInfo)
      const limitUntil = new Date(until)
      
      // Only apply the rate limit if it's still valid
      if (limitUntil > new Date()) {
        setRateLimitedUntil(limitUntil)
      } else {
        // Clear expired rate limit
        localStorage.removeItem("passport_rate_limit")
      }
    }
  }, [])
  
  // Effect to update countdown timer when rate limited
  useEffect(() => {
    if (!rateLimitedUntil) return
    
    const interval = setInterval(() => {
      const now = new Date()
      if (rateLimitedUntil <= now) {
        setRateLimitedUntil(null)
        localStorage.removeItem("passport_rate_limit")
        clearInterval(interval)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [rateLimitedUntil])

  // Format the rate limit time remaining
  const formatTimeRemaining = () => {
    if (!rateLimitedUntil) return ""
    
    const now = new Date()
    const diffMs = rateLimitedUntil.getTime() - now.getTime()
    
    if (diffMs <= 0) return "0 seconds"
    
    const diffSecs = Math.floor(diffMs / 1000)
    const minutes = Math.floor(diffSecs / 60)
    const seconds = diffSecs % 60
    
    return minutes > 0 
      ? `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}` 
      : `${seconds} second${seconds !== 1 ? 's' : ''}`
  }

  // Consent agreement handler
  const handleAgree = () => {
    localStorage.setItem("passport_consent_agreed", "true")
    
    // Create a more sophisticated transition effect
    const consentSection = document.querySelector('.consent-section')
    if (consentSection) {
      // First add a fade-out effect
      consentSection.classList.remove('fade-in')
      consentSection.classList.add('fade-out')
    }
    
    // Add animation timeout with a cascade effect
    setTimeout(() => {
      setHasAgreed(true)
      setPreviousStep(step)
      setStep("email")
      
      // Focus on the email input field after transition completes
      setTimeout(() => {
        const emailInput = document.getElementById('verification-email')
        if (emailInput) {
          emailInput.focus()
        }
      }, 500)
    }, 300) // Increased from 100ms to 300ms for smoother effect
  }

  // Email submission handler
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Check if rate limited
    if (rateLimitedUntil && rateLimitedUntil > new Date()) {
      toast.error(`Please wait ${formatTimeRemaining()} before requesting another verification code.`)
      return
    }
    
    setIsSubmittingEmail(true)

    if (!verificationEmail.trim() || !verificationEmail.includes('@')) {
      toast.error("Please enter a valid email address")
      setIsSubmittingEmail(false)
      return
    }

    try {
      // Call our Edge Function to send the verification code
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ email: verificationEmail })
        }
      )

      const result = await response.json()

      // Handle rate limiting response
      if (response.status === 429) {
        const retryAfter = result.retryAfter || 3600 // Default to 1 hour if not specified
        const retryDate = new Date()
        retryDate.setSeconds(retryDate.getSeconds() + retryAfter)
        
        // Store rate limit info
        localStorage.setItem("passport_rate_limit", JSON.stringify({ 
          until: retryDate.toISOString() 
        }))
        
        setRateLimitedUntil(retryDate)
        toast.error("Too many verification attempts. Please try again later.")
        setIsSubmittingEmail(false)
        return
      }

      if (!response.ok || !result.success) {
        toast.error("Failed to send verification code. Please try again.")
        setIsSubmittingEmail(false)
        return
      }

      // Send success message without exposing verification code
      toast.success(`Verification code sent to ${verificationEmail}. Please check your inbox.`)
      
      // Create a smooth transition animation
      const emailSection = document.querySelector('.email-section')
      if (emailSection) {
        emailSection.classList.add('slide-left-out')
      }
      
      // Add animation timeout for a smoother transition
      setTimeout(() => {
        setPreviousStep(step)
        setStep("verify")
        
        // Focus on the code input after transition
        setTimeout(() => {
          const codeInput = document.getElementById('verification-code')
          if (codeInput) {
            codeInput.focus()
          }
        }, 500)
        
        setIsSubmittingEmail(false)
      }, 300)
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setIsSubmittingEmail(false)
    }
  }

  // Code verification handler
  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsVerifyingCode(true)

    if (!verificationCode.trim()) {
      toast.error("Please enter the verification code")
      setIsVerifyingCode(false)
      return
    }

    try {
      // Check the code against the database
      const { data, error } = await supabase
        .from("recovery_codes")
        .select("*")
        .eq("email", verificationEmail)
        .eq("code", verificationCode)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .limit(1)

      if (error) {
        console.error("Error verifying code:", error)
        toast.error("Error verifying code. Please try again.")
        setIsVerifyingCode(false)
        return
      }

      if (!data || data.length === 0) {
        toast.error("Invalid or expired verification code")
        setIsVerifyingCode(false)
        return
      }

      // Mark the code as used using our helper function
      const { data: markResult, error: markError } = await supabase
        .rpc('mark_code_as_used', {
          p_email: verificationEmail,
          p_code: verificationCode
        })
      
      if (markError) {
        console.error("Error marking code as used:", markError)
        // Continue anyway since verification succeeded
      }

      // Initialize form data with verified email
      setFormData({
        ...formData,
        email: verificationEmail
      })

      // Create an enhanced smooth transition animation with special cross-fade
      const verifySection = document.querySelector('.verify-section')
      if (verifySection) {
        // First add a more elegant exit animation
        verifySection.classList.add('slide-left-out')
      }
      
      toast.success("Email verified successfully!")
      
      // Add a cascading delay to make the transition smoother
      setTimeout(() => {
        setPreviousStep(step)
        setStep("signup")
        
        // Focus on the first name field after transition
        setTimeout(() => {
          // Target the specific signup section for custom entrance effect
          const signupSection = document.querySelector('.signup-section')
          if (signupSection) {
            signupSection.classList.add('cross-fade-in')
          }
          
          // Auto-focus on the first input field for better UX
          const firstNameInput = document.querySelector('input[name="firstName"]') as HTMLInputElement
          if (firstNameInput) {
            firstNameInput.focus()
          }
        }, 400)
        
        setIsVerifyingCode(false)
      }, 300)
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setIsVerifyingCode(false)
    }
  }

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    firstName: string
    lastName: string
    dob: string
    gender: string
    phone: string
    email: string
    password: string
    confirmPassword: string
  }>({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const requiredFields: (keyof typeof formData)[] = ["firstName", "lastName", "dob", "gender", "phone", "email", "password", "confirmPassword"]
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        setLoading(false)
        toast.error("Please fill out all required fields.")
        return
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setLoading(false)
      toast.error("Passwords do not match.")
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          dob: formData.dob,
          gender: formData.gender,
          phone: formData.phone
        }
      }
    })

    if (error) {
      setLoading(false)
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Try logging in or resetting your password.")
      } else {
        toast.error(error.message)
      }
    } else {
      // Profile update after successful signup
      const user = data?.user;
      if (user && user.id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            date_of_birth: formData.dob,
            gender: formData.gender,
            phone: formData.phone
          })
          .eq("id", user.id);
        if (profileError) {
          toast.error("Signup succeeded, but failed to update profile: " + profileError.message);
        } else {
          toast.success("Signup and profile update successful! Please check your email to confirm your account.", { duration: 5000 });
        }
      } else {
        toast.success("Signup successful! Please check your email to confirm your account.", { duration: 5000 });
      }
      setLoading(false)
      navigate({ to: "/login" })
    }
  }

  // Legal notices for consent page
  const legalPoints = [
    "According to the Passport Act, 2020, you must be a lawful citizen of the Republic of the Marshall Islands to receive a passport.",
    "False information on your passport application may result in revocation of your passport and legal action.",
    "Sale, forgery, or solicitation of passports is prohibited with penalties up to $10,000 and 10 years imprisonment.",
    "By proceeding with your application, you confirm you understand the legal requirements for passport issuance in RMI.",
    "Applications require proof of citizenship through birth certificates or court decrees.",
    "Passport applications by minors require legal guardian consent.",
    "All information provided must be truthful and accurate, with penalties for providing false information."
  ]

  // Render the appropriate content based on the step
  const renderStepContent = () => {
    if (!hasAgreed || step === "consent") {
      return (
        /* Consent Content */
        <div className={`consent-section ${getStepAnimation()}`}>
          {/* Step indicator */}
          <div className="step-progress">
            <div className={getStepIndicatorClass("consent")}></div>
            <div className={getStepIndicatorClass("email")}></div>
            <div className={getStepIndicatorClass("verify")}></div>
            <div className={getStepIndicatorClass("signup")}></div>
          </div>
          
          <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Legal Requirements & Consent</h3>
          <ul className="space-y-4 mb-8">
            {legalPoints.map((point, index) => (
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
          <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg">
            <p className="text-blue-50 mb-5">By clicking "I Agree", you acknowledge you understand and accept these legal requirements.</p>
            <button
              onClick={handleAgree}
              className="w-full bg-white text-blue-800 hover:bg-blue-50 py-3 px-6 rounded-lg font-medium transition-all shadow-lg flex justify-center items-center gap-2"
            >
              I Agree and Wish to Proceed
            </button>
          </div>
          <div className="mt-6 text-sm text-blue-300 italic border-t border-blue-400 pt-4">
            Passport Act, 2020 (43MIRCCh.11) - Republic of the Marshall Islands
          </div>
        </div>
      );
    } else if (step === "email") {
      return (
        /* Email Verification Step */
        <div className={`email-section ${getStepAnimation()}`}>
          {/* Step indicator */}
          <div className="step-progress">
            <div className={getStepIndicatorClass("consent")}></div>
            <div className={getStepIndicatorClass("email")}></div>
            <div className={getStepIndicatorClass("verify")}></div>
            <div className={getStepIndicatorClass("signup")}></div>
          </div>
          
          <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Verify Your Email</h3>
          <p className="text-blue-100 mb-6">Please enter your email address to receive a verification code.</p>
          
          {rateLimitedUntil && rateLimitedUntil > new Date() && (
            <div className="mb-6 p-4 bg-red-800/40 border border-red-400/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-100 font-medium">Rate limit exceeded</p>
                  <p className="text-red-200 text-sm mt-1">Too many verification attempts. Please try again in {formatTimeRemaining()}.</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                id="verification-email"
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
                placeholder=" "
                className="peer block w-full rounded-md border border-white/20 bg-white/10 px-4 pt-5 pb-2 text-sm text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 placeholder-transparent"
              />
              <label
                htmlFor="verification-email"
                className="absolute left-4 top-2 text-xs text-blue-200 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-blue-200/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-white bg-transparent px-1 pointer-events-none"
              >
                Email Address
              </label>
            </div>
            <button
              type="submit"
              disabled={isSubmittingEmail || (rateLimitedUntil !== null && rateLimitedUntil > new Date())}
              className={`w-full py-3 px-4 rounded-lg font-medium transition flex justify-center items-center gap-2 shadow-lg mt-4 ${
                isSubmittingEmail || (rateLimitedUntil !== null && rateLimitedUntil > new Date()) 
                  ? "bg-white/50 text-blue-800 cursor-not-allowed" 
                  : "bg-white text-blue-800 hover:bg-blue-50"
              }`}
            >
              {isSubmittingEmail ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending Code...
                </>
              ) : rateLimitedUntil !== null && rateLimitedUntil > new Date() ? (
                "Please Wait..."
              ) : (
                "Send Verification Code"
              )}
            </button>
            <p className="text-center text-sm text-blue-200 mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-white hover:underline">Sign in</Link>
            </p>
          </form>
          <div className="mt-6 text-sm text-blue-300 italic border-t border-blue-400 pt-4">
            Passport Act, 2020 (43MIRCCh.11) - Republic of the Marshall Islands
          </div>
        </div>
      );
    } else if (step === "verify") {
      return (
        /* Code Verification Step */
        <div className={`verify-section ${getStepAnimation()}`}>
          {/* Step indicator */}
          <div className="step-progress">
            <div className={getStepIndicatorClass("consent")}></div>
            <div className={getStepIndicatorClass("email")}></div>
            <div className={getStepIndicatorClass("verify")}></div>
            <div className={getStepIndicatorClass("signup")}></div>
          </div>
          
          <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Enter Verification Code</h3>
          <p className="text-blue-100 mb-6">We've sent a verification code to <strong>{verificationEmail}</strong>. Please enter it below.</p>
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="relative">
              <div className="mb-2 text-white/80 text-sm">Enter the 6-digit code:</div>
              <div className="flex justify-center pb-2">
                <input
                  type="text"
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-48 text-center tracking-[0.5em] py-3 text-xl font-bold bg-white/20 border border-white/30 rounded-lg text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                  autoComplete="one-time-code"
                />
              </div>
              <div className="mt-2 text-center text-blue-200 text-sm">
                Code expires in 30 minutes
              </div>
            </div>
            <button
              type="submit"
              disabled={isVerifyingCode || verificationCode.length !== 6}
              className={`w-full py-3 px-4 rounded-lg font-medium transition flex justify-center items-center gap-2 shadow-lg mt-4 ${
                verificationCode.length === 6 && !isVerifyingCode
                  ? "bg-white text-blue-800 hover:bg-blue-50"
                  : "bg-white/50 text-blue-800 cursor-not-allowed"
              }`}
            >
              {isVerifyingCode ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>
            <p className="text-center text-sm text-blue-200 mt-4">
              Didn't receive a code?{" "}
              <button 
                type="button" 
                onClick={() => setStep("email")} 
                className="text-white hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Try again
              </button>
            </p>
          </form>
          <div className="mt-6 text-sm text-blue-300 italic border-t border-blue-400 pt-4">
            Passport Act, 2020 (43MIRCCh.11) - Republic of the Marshall Islands
          </div>
        </div>
      );
    } else {
      return (
        /* Signup Form - Final step after email verification */
        <div className={`signup-section ${getStepAnimation()}`}>
          {/* Step indicator */}
          <div className="step-progress">
            <div className={getStepIndicatorClass("consent")}></div>
            <div className={getStepIndicatorClass("email")}></div>
            <div className={getStepIndicatorClass("verify")}></div>
            <div className={getStepIndicatorClass("signup")}></div>
          </div>
          
          <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Complete Your Registration</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: "firstName", label: "First Name" },
              { id: "lastName", label: "Last Name" },
              { id: "phone", label: "Phone Number" },
              { id: "email", label: "Email", disabled: true },
              { id: "password", label: "Password", type: "password" },
              { id: "confirmPassword", label: "Confirm Password", type: "password" }
            ].map(({ id, label, type, disabled }) => (
              <div key={id} className="relative">
                <input
                  type={type || "text"}
                  name={id}
                  id={id}
                  placeholder=" "
                  value={formData[id as keyof typeof formData]}
                  onChange={handleChange}
                  disabled={disabled}
                  className={`peer block w-full rounded-md border border-white/20 bg-white/10 px-4 pt-5 pb-2 text-sm text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 placeholder-transparent ${disabled ? 'opacity-70' : ''}`}
                />
                <label
                  htmlFor={id}
                  className="absolute left-4 top-2 text-xs text-blue-200 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-blue-200/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-white bg-transparent px-1 pointer-events-none"
                >
                  {label}
                </label>
                </div>
            ))}

            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="gender" className="block mb-1 text-sm font-medium text-blue-100">Gender</label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                  style={{ color: 'white' }}
                >
                  <option value="" className="text-gray-900">Select</option>
                  <option value="male" className="text-gray-900">Male</option>
                  <option value="female" className="text-gray-900">Female</option>
                  <option value="non-binary" className="text-gray-900">Non-binary</option>
                  <option value="prefer_not_to_say" className="text-gray-900">Prefer not to say</option>
                </select>
              </div>
              <div className="flex-1">
                <label htmlFor="dob" className="block mb-1 text-sm font-medium text-blue-100">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  id="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-blue-800 hover:bg-blue-50 py-3 px-4 rounded-lg font-medium transition flex justify-center items-center gap-2 shadow-lg mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing Up...
                </>
              ) : (
                "Complete Registration"
              )}
            </button>

            <p className="text-center text-sm text-blue-200 mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-white hover:underline">Sign in</Link>
            </p>
          </form>
          
          <div className="mt-6 text-sm text-blue-300 italic border-t border-blue-400 pt-4">
            Passport Act, 2020 (43MIRCCh.11) - Republic of the Marshall Islands
          </div>
        </div>
      );
    }
  };

  // Update previousStep when step changes
  useEffect(() => {
    if (step !== previousStep) {
      setPreviousStep(step);
    }
  }, [step]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white py-8 px-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        {/* Left Column - Seal and Portal Title */}
        <div className="md:w-2/5 bg-gray-50 p-8 md:p-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm p-8 flex flex-col items-center">
            <img src="/seal.png" alt="Marshall Islands Seal" className="w-36 h-36 mx-auto drop-shadow-lg" />
            <h2 className="text-3xl font-bold mt-6 mb-2 text-center text-[#1e3a8a]">RMI Passport Portal</h2>
            <p className="mb-4 text-center text-gray-500">Republic of the Marshall Islands</p>
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-100 mt-4">
              <p className="text-sm text-gray-600 italic">
                {!hasAgreed 
                  ? "Please read and agree to the legal requirements before proceeding with your application."
                  : step === "email" 
                    ? "Enter your email to receive a verification code."
                    : step === "verify"
                      ? "Enter the verification code sent to your email."
                      : "Complete your registration to proceed with your application."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Dynamic Content based on step */}
        <div className="md:w-3/5 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white p-8 md:p-12">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}
