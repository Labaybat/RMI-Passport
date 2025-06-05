import { useState, useEffect } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import toast from "react-hot-toast"

export function SignUpPage() {
  const navigate = useNavigate()
  // Add state for consent agreement
  const [hasAgreed, setHasAgreed] = useState(false)

  // Check if user previously agreed (so they don't have to agree again on refresh)
  useEffect(() => {
    const previouslyAgreed = localStorage.getItem("passport_consent_agreed")
    if (previouslyAgreed === "true") {
      setHasAgreed(true)
    }
  }, [])

  // Consent agreement handler
  const handleAgree = () => {
    localStorage.setItem("passport_consent_agreed", "true")
    // Add animation timeout to make transition smoother
    setTimeout(() => {
      setHasAgreed(true)
    }, 100)
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
                {hasAgreed 
                  ? "Thank you for agreeing to our legal terms. Please complete the registration form."
                  : "Please read and agree to the legal requirements before proceeding with your application."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Consent or Signup Form */}
        <div className="md:w-3/5 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white p-8 md:p-12">
          {!hasAgreed ? (
            /* Consent Content */
            <div className="fade-in">
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
          ) : (
            /* Signup Form - Fades in after consent in the right column */
            <div className={`transition-all duration-500 ${hasAgreed ? "fade-in" : "opacity-0"}`}>
              <h3 className="text-2xl font-bold mb-6 border-b border-blue-400 pb-3">Sign Up</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { id: "firstName", label: "First Name" },
                  { id: "lastName", label: "Last Name" },
                  { id: "phone", label: "Phone Number" },
                  { id: "email", label: "Email" },
                  { id: "password", label: "Password", type: "password" },
                  { id: "confirmPassword", label: "Confirm Password", type: "password" }
                ].map(({ id, label, type }) => (
                  <div key={id} className="relative">
                    <input
                      type={type || "text"}
                      name={id}
                      id={id}
                      placeholder=" "
                      value={formData[id as keyof typeof formData]}
                      onChange={handleChange}
                      className="peer block w-full rounded-md border border-white/20 bg-white/10 px-4 pt-5 pb-2 text-sm text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 placeholder-transparent"
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
                    "Sign Up"
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
          )}
        </div>
      </div>
    </div>
  )
}
