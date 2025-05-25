import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import toast from "react-hot-toast"

export function SignUpPage() {
  const navigate = useNavigate()

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
      toast.success("Signup successful! Please check your email to confirm your account.", { duration: 5000 })
      setLoading(false)
      navigate({ to: "/login" })
    }
  }

  return (
    <div className="min-h-[100dvh] w-full overflow-y-auto flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 py-10 text-gray-800">
      <div className="bg-white p-8 sm:p-10 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 flex flex-col items-center">
        <img src="/seal.png" alt="Seal" className="w-24 h-24 mb-6 drop-shadow-lg" />
        <h2 className="text-3xl font-bold mb-2 text-center text-[#1e3a8a]">RMI Passport Portal</h2>
        <h3 className="text-lg text-gray-500 mb-6 text-center">Sign Up</h3>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {[
            { id: "firstName", label: "First Name" },
            { id: "lastName", label: "Last Name" },
            { id: "phone", label: "Phone Number" },
            { id: "email", label: "Email" },
            { id: "password", label: "Password", type: "password" },
            { id: "confirmPassword", label: "Confirm Password", type: "password" }
          ].map(({ id, label, type }) => (
            <div key={id} className="relative space-y-1">
              <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
              <input
                type={type || "text"}
                name={id}
                id={id}
                placeholder={label}
                value={formData[id as keyof typeof formData]}
                onChange={handleChange}
                className="peer block w-full rounded-md border border-gray-300 bg-white px-4 pt-5 pb-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          ))}

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="gender" className="block mb-1 text-sm font-medium text-gray-600">Gender</label>
              <select
                name="gender"
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="dob" className="block mb-1 text-sm font-medium text-gray-600">Date of Birth</label>
              <input
                type="date"
                name="dob"
                id="dob"
                value={formData.dob}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing Up...
              </>
            ) : (
              "Sign Up"
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
