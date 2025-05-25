import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Button } from '../components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { useToast } from '../hooks/use-toast'
import { User, Save, Mail, Calendar, Shield } from 'lucide-react'

interface Profile {
  first_name: string
  last_name: string
  phone: string
  gender: string
}

export default function MyProfile() {
  // Mock user data
  const [profile, setProfile] = useState<Profile>({
    first_name: "John",
    last_name: "Doe",
    phone: "+6921234567",
    gender: "male",
  })

  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Mock user account info
  const mockUser = {
    email: "john.doe@example.com",
    id: "user_123456789",
    last_sign_in_at: "2024-01-15T10:30:00Z",
    created_at: "2023-06-01T14:20:00Z",
  }

  // Handle form input changes
  const handleInputChange = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle form submission (mock save)
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)

    // Simulate API call delay
    setTimeout(() => {
      setSaving(false)
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })
      console.log("Profile data saved:", profile)
    }, 1500)
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
                          value={profile.first_name}
                          onChange={(e) => handleInputChange("first_name", e.target.value)}
                          placeholder="Enter your first name"
                          className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="last_name" className="text-sm font-semibold text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          type="text"
                          value={profile.last_name}
                          onChange={(e) => handleInputChange("last_name", e.target.value)}
                          placeholder="Enter your last name"
                          className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12"
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
                        value={profile.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12"
                      />
                      <p className="text-xs text-gray-500 ml-1">Include country code (e.g., +1, +44, +69)</p>
                    </div>

                    {/* Gender Field */}
                    <div className="space-y-3">
                      <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                        Gender
                      </Label>
                      <Select value={profile.gender} onValueChange={(value) => handleInputChange("gender", value)}>
    <SelectTrigger id="gender" className="w-full rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 h-12">
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
                          variant="outline"
                          onClick={() =>
                            setProfile({
                              first_name: "John",
                              last_name: "Doe",
                              phone: "+6921234567",
                              gender: "male",
                            })
                          }
                          className="flex-1 sm:flex-none rounded-lg h-12 px-8 font-semibold border-gray-300 hover:bg-gray-50 transition-all duration-200"
                        >
                          Reset to Default
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
                      <p className="text-sm text-gray-900 truncate font-medium">{mockUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-purple-50/50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">User ID</p>
                      <p className="text-sm text-gray-900 font-mono font-medium">{mockUser.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-green-50/50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Sign In</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {new Date(mockUser.last_sign_in_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
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
                        {new Date(mockUser.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
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
                        {profile.gender.replace("_", " ")}
                      </span>
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