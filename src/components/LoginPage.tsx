import { useState, useEffect } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import supabase from "../lib/supabase/client"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Correct the navigate function usage
  const navigateToDashboard = () => navigate({ to: "/dashboard" })

  useEffect(() => {
    if (!authLoading && user) {
      navigateToDashboard()
    }
  }, [authLoading, user, navigateToDashboard])

  // Fix implicit 'any' type for 'e'
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (!email.trim() || !password.trim()) {
      setLoading(false)
      toast.error("Please enter both email and password.")
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }

      // Immediately fetch session to confirm it's active
      let sessionData = null;
      for (let i = 0; i < 10; i++) { // Try for up to ~2 seconds
        const { data: sessionResult } = await supabase.auth.getSession();
        if (sessionResult && sessionResult.session && sessionResult.session.user) {
          sessionData = sessionResult;
          break;
        }
        await new Promise(res => setTimeout(res, 200));
      }
      if (!sessionData || !sessionData.session || !sessionData.session.user) {
        toast.error("Login failed: could not establish session.");
        setLoading(false);
        return;
      }
      const user = sessionData.session.user;
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
      let profileInserted = false;
      if ((!profile || profile.length === 0) && !profileError) {
        const meta = user.user_metadata || {};
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          first_name: meta.first_name || "",
          last_name: meta.last_name || "",
          phone: meta.phone || "",
          gender: meta.gender || "",
          date_of_birth: meta.dob || meta.date_of_birth || ""
        });
        if (insertError) {
          toast.error("Could not create user profile. Please contact support.");
          console.error("Profile insert failed:", insertError);
        } else {
          profileInserted = true;
        }
      }
      toast.success("Login successful! Redirecting...", { duration: 5000 });
      setLoading(false);
      // Wait a short delay to ensure context is ready (especially on mobile)
      setTimeout(() => {
        navigateToDashboard();
      }, profileInserted ? 600 : 300);
    } catch (error) {
      toast.error("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] min-h-screen w-full overflow-y-auto flex items-center justify-center bg-gradient-to-br from-blue-50 to-white text-gray-800 px-4 py-10">
      <div className="bg-white p-8 sm:p-10 rounded-3xl w-full max-w-lg border border-gray-200 flex flex-col items-center backdrop-blur-sm shadow-md hover:shadow-2xl transition-shadow duration-500">
        <img src="/seal.png" alt="Marshall Islands Seal" className="w-24 h-24 mb-6 drop-shadow-lg" />
        <h2 className="text-3xl font-bold mb-2 text-center text-[#1e3a8a]">RMI Passport Portal</h2>
        <p className="mb-6 text-sm text-gray-500 text-center">
          Enter your email below to login to your account
        </p>
        <form className="w-full flex flex-col space-y-4" onSubmit={handleLogin}>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="peer w-full px-4 pt-6 pb-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
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
              className="peer w-full px-4 pt-6 pb-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-transparent"
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-500"
            >
              Password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
