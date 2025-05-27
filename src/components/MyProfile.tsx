import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import Button from '../components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { useToast } from '../hooks/use-toast'
import { User, Save, Mail, Calendar, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase/client'
import { useNavigate } from '@tanstack/react-router'

interface Profile {
  first_name: string
  last_name: string
  phone?: string
  gender?: string
  date_of_birth?: string
  email?: string
  updated_at?: string
}

export default function MyProfile() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  // profile: last saved data from Supabase (for summary)
  const [profile, setProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    email: '',
    updated_at: '',
  })
  // formProfile: local form state (for editing)
  const [formProfile, setFormProfile] = useState<Profile>({
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    email: '',
    updated_at: '',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [lastSignIn, setLastSignIn] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  // Fetch full profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, gender, date_of_birth, updated_at')
        .eq('id', user.id)
        .single()
      if (data) {
        // Ensure all fields are strings for controlled inputs
        const loadedProfile = {
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          gender: data.gender ?? '',
          date_of_birth: data.date_of_birth ?? '',
          updated_at: data.updated_at ?? '',
          email: user.email || '',
        }
        setProfile(loadedProfile)
        setFormProfile(loadedProfile)
      } else {
        // If no profile exists, clear both states
        setProfile({
          first_name: '',
          last_name: '',
          phone: '',
          gender: '',
          date_of_birth: '',
          updated_at: '',
          email: user.email || '',
        })
        setFormProfile({
          first_name: '',
          last_name: '',
          phone: '',
          gender: '',
          date_of_birth: '',
          updated_at: '',
          email: user.email || '',
        })
      }
      if (error) {
        toast({ title: 'Error', description: error.message })
      }
    }
    fetchProfile()
    if (user) {
      supabase.auth.getUser().then(({ data }) => {
        setLastSignIn(data?.user?.last_sign_in_at || null)
        setCreatedAt(data?.user?.created_at || null)
      })
    }
  }, [user])

  // Handle form input changes (only updates formProfile)
  const handleInputChange = (field: keyof Profile, value: string) => {
    setFormProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Save changes to Supabase
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    // Only update fields that are strings or null
    const updatePayload = {
      first_name: formProfile.first_name || null,
      last_name: formProfile.last_name || null,
      phone: formProfile.phone || null,
      gender: formProfile.gender || null,
      date_of_birth: formProfile.date_of_birth || null,
      updated_at: new Date().toISOString(), // Force update the updated_at field
    }
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      toast({ title: 'Error', description: error.message })
    } else {
      toast({ title: 'Success', description: 'Profile updated successfully!' })
      // Refetch profile to get updated_at and update both states
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, gender, date_of_birth, updated_at')
        .eq('id', user.id)
        .single()
      if (data) {
        const loadedProfile = {
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          gender: data.gender ?? '',
          date_of_birth: data.date_of_birth ?? '',
          updated_at: data.updated_at ?? '',
          email: user.email || '',
        }
        setProfile(loadedProfile)
        setFormProfile(loadedProfile)
      }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading profile...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">You must be logged in to view your profile.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-3xl">
        <div className="w-full max-w-3xl p-4 sm:p-6 md:p-8 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-0">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-gray-600 mt-1 text-lg">Manage your personal information and account settings</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Main Profile Form */}
            <div>
              <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-6 rounded-t-xl bg-gradient-to-r from-gray-50 to-white">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-800">Personal Information</span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    Update your profile details below. Changes will be saved to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSaveChanges} className="space-y-8">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="first_name" className="text-sm font-semibold text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="first_name"
                          type="text"
                          value={formProfile.first_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('first_name', e.target.value)}
                          placeholder="Enter your first name"
                          className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12 text-gray-900 placeholder-gray-400 bg-white"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="last_name" className="text-sm font-semibold text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          type="text"
                          value={formProfile.last_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('last_name', e.target.value)}
                          placeholder="Enter your last name"
                          className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12 text-gray-900 placeholder-gray-400 bg-white"
                        />
                      </div>
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formProfile.phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12 text-gray-900 placeholder-gray-400 bg-white"
                      />
                      <p className="text-xs text-gray-500 ml-1">Include country code (e.g., +1, +44, +69)</p>
                    </div>

                    {/* Date of Birth Field */}
                    <div className="space-y-3">
                      <Label htmlFor="date_of_birth" className="text-sm font-semibold text-gray-700">
                        Date of Birth
                      </Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={formProfile.date_of_birth || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('date_of_birth', e.target.value)}
                        placeholder="Enter your date of birth"
                        className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12 text-gray-900 placeholder-gray-400 bg-white"
                      />
                    </div>

                    {/* Gender Field */}
                    <div className="space-y-3">
                      <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                        Gender
                      </Label>
                      <Select value={formProfile.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger id="gender" className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12 text-gray-900 bg-white">
                          <SelectValue placeholder="Select your gender" className="text-gray-900" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Save Button */}
                    <div className="pt-8 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {saving ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Saving Changes...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => navigate({ to: '/dashboard' })}
                          className="flex-1 sm:flex-none rounded-lg h-12 px-8 font-semibold border-gray-300 hover:bg-gray-50 transition-all duration-200"
                        >
                          Dashboard
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Account Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Information Card */}
              <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader className="pb-4 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-3 text-lg">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800">Account Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm text-gray-900 truncate font-medium">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-purple-50/50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">User ID</p>
                      <p className="text-sm text-gray-900 font-mono font-medium">{user.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-green-50/50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Sign In</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {lastSignIn ? new Date(lastSignIn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-orange-50/50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Member Since</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {createdAt ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-gray-200 rounded-lg">
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profile Last Updated</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Summary Card */}
              <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader className="pb-4 rounded-t-xl">
                  <CardTitle className="text-lg font-semibold text-gray-800">Profile Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Full Name</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {profile.first_name} {profile.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Phone</span>
                      <span className="text-sm font-semibold text-gray-900">{profile.phone}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Gender</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {profile.gender?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Date of Birth</span>
                      <span className="text-sm font-semibold text-gray-900">{profile.date_of_birth}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm text-green-700 font-medium">Profile Active</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}