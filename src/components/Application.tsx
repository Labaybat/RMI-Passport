"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Input } from "../components/ui/Input"
import { Label } from "../components/ui/Label"
import Button from "../components/ui/Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select"
import { useToast } from "../hooks/use-toast"

// Types
interface FormData {
  // Personal Information
  application_type: string
  last_name: string
  first_middle_names: string
  social_security_number: string
  city_of_birth: string
  state_of_birth: string
  country_of_birth: string
  date_of_birth: string
  gender: string
  hair_color: string
  marital_status: string
  height_feet: string
  height_inches: string
  eye_color: string

  // Contact Information
  house_number: string
  street_name: string
  phone_number: string
  city: string
  state: string
  zip_code: string
  email: string

  // Emergency Contact
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_house_number: string
  emergency_contact_street_name: string
  emergency_contact_city: string
  emergency_contact_state: string
  emergency_contact_postal_code: string

  // Parental Details
  father_name: string
  father_date_of_birth: string
  father_nationality: string
  father_city: string
  father_state: string
  father_country: string
  mother_name: string
  mother_date_of_birth: string
  mother_nationality: string
  mother_city: string
  mother_state: string
  mother_country: string

  // Document Uploads
  birth_certificate: File | null
  consent_form: File | null
  marriage_certificate: File | null
  old_passport: File | null
  signature: File | null
  photo_id: File | null
}

// Utility Components
const FormField: React.FC<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  className?: string
}> = ({ id, label, value, onChange, type = "text", required = false, className = "" }) => {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== ""

  return (
    <div className={`relative ${className}`}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        required={required}
        className={`transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400 ${
          hasValue || focused ? "pt-6" : ""
        }`}
      />
      <Label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          hasValue || focused ? "top-1 text-xs text-blue-600 font-medium" : "top-1/2 -translate-y-1/2 text-gray-500"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    </div>
  )
}

const PhoneInput: React.FC<{
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}> = ({ id, label, value, onChange, required = false }) => {
  const [focused, setFocused] = useState(false)
  const [formattedValue, setFormattedValue] = useState("")
  const hasValue = value !== ""

  useEffect(() => {
    const digitsOnly = value.replace(/\D/g, "")
    let formatted = ""
    if (digitsOnly.length > 0) {
      if (digitsOnly.length <= 3) {
        formatted = digitsOnly
      } else if (digitsOnly.length <= 6) {
        formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`
      } else {
        formatted = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`
      }
    }
    setFormattedValue(formatted)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    if (/^[\d\s()-]*$/.test(input)) {
      const digitsOnly = input.replace(/\D/g, "")
      if (digitsOnly.length <= 10) {
        onChange(digitsOnly)
      }
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type="tel"
        value={formattedValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=" "
        required={required}
        className={`transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400 ${
          hasValue || focused ? "pt-6" : ""
        }`}
        inputMode="tel"
      />
      <Label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          hasValue || focused ? "top-1 text-xs text-blue-600 font-medium" : "top-1/2 -translate-y-1/2 text-gray-500"
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    </div>
  )
}

const FileUpload: React.FC<{
  id: string
  label: string
  accept?: string
  onChange: (file: File | null) => void
  value: File | null
  required?: boolean
}> = ({ id, label, accept, onChange, value, required = false }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onChange(file)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onChange(files[0])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        {required && <span className="text-red-500 text-sm">*</span>}
      </div>

      <input type="file" id={id} ref={inputRef} accept={accept} onChange={handleChange} className="hidden" />

      {!value ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`rounded-full p-3 transition-colors ${isDragOver ? "bg-blue-100" : "bg-gray-100"}`}>
              <svg
                className={`h-6 w-6 transition-colors ${isDragOver ? "text-blue-600" : "text-gray-600"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">
                {accept?.includes("image") && accept?.includes("pdf")
                  ? "PNG, JPG, PDF up to 10MB"
                  : accept?.includes("image")
                    ? "PNG, JPG up to 10MB"
                    : "PDF up to 10MB"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex-shrink-0 text-green-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-900 truncate">{value.name}</p>
                <p className="text-xs text-green-700">{formatFileSize(value.size)}</p>
              </div>
              <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <Button
              type="button"
              onClick={handleRemove}
              variant="ghost"
              className="ml-2 h-8 w-8 p-0 text-green-700 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const ProgressBar: React.FC<{
  currentStep: number
  totalSteps: number
  isCompact?: boolean
}> = ({ currentStep, totalSteps, isCompact = false }) => {
  const stepLabels = [
    "Personal Info",
    "Contact & Delivery",
    "Emergency Contact",
    "Parental Details",
    "Documents",
    "Review",
  ]

  if (isCompact) {
    return (
      <div className="w-full mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
      </div>

      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-blue-800 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        <div className="relative flex justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep

            return (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 relative z-10 ${
                    isCompleted
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                      : isCurrent
                        ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg ring-4 ring-blue-200"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`mt-2 text-xs text-center max-w-20 leading-tight transition-colors duration-300 ${
                    isCurrent
                      ? "text-blue-800 font-semibold"
                      : isCompleted
                        ? "text-green-600 font-medium"
                        : "text-gray-400"
                  }`}
                >
                  {stepLabels[index]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 text-center hidden sm:block">
        <p className="text-sm text-gray-600">
          Currently on: <span className="font-semibold text-blue-800">{stepLabels[currentStep - 1]}</span>
        </p>
      </div>
    </div>
  )
}

// Step Components
const Step1PersonalInfo: React.FC<{
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl font-bold text-blue-900">Passport Application</h2>
        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="applicationType" className="block text-sm font-medium mb-1 text-gray-700">
            Application Type
          </Label>
          <Select
            value={formData.application_type}
            onValueChange={(value) => updateFormData({ application_type: value })}
          >
            <SelectTrigger className="w-full bg-white text-gray-900 placeholder-gray-400">
              <SelectValue placeholder="Select application type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Passport</SelectItem>
              <SelectItem value="renewal">Passport Renewal</SelectItem>
              <SelectItem value="replacement">Replacement (Lost/Stolen)</SelectItem>
              <SelectItem value="name-change">Name Change</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FormField
          id="lastName"
          label="Surname or Family Name"
          value={formData.last_name}
          onChange={(value) => updateFormData({ last_name: value })}
          required
        />

        <FormField
          id="firstMiddleNames"
          label="First and Middle Names"
          value={formData.first_middle_names}
          onChange={(value) => updateFormData({ first_middle_names: value })}
          required
        />

        <FormField
          id="ssn"
          label="Social Security Number"
          value={formData.social_security_number}
          onChange={(value) => updateFormData({ social_security_number: value })}
        />

        <FormField
          id="cityOfBirth"
          label="City or Town of Birth"
          value={formData.city_of_birth}
          onChange={(value) => updateFormData({ city_of_birth: value })}
          required
        />

        <FormField
          id="stateOfBirth"
          label="State (if in U.S.)"
          value={formData.state_of_birth}
          onChange={(value) => updateFormData({ state_of_birth: value })}
        />

        <FormField
          id="countryOfBirth"
          label="Country of Birth"
          value={formData.country_of_birth}
          onChange={(value) => updateFormData({ country_of_birth: value })}
          required
        />

        <div className="relative">
          <Label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1 text-gray-700">
            Date of Birth
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => updateFormData({ date_of_birth: e.target.value })}
            className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="relative">
          <Label htmlFor="gender" className="block text-sm font-medium mb-1 text-gray-700">
            Gender
          </Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => updateFormData({ gender: value })}
          >
            <SelectTrigger className="w-full bg-white text-gray-900 placeholder-gray-400">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Label htmlFor="hairColor" className="block text-sm font-medium mb-1 text-gray-700">
            Hair Color
          </Label>
          <Select
            value={formData.hair_color}
            onValueChange={(value) => updateFormData({ hair_color: value })}
          >
            <SelectTrigger className="w-full bg-white text-gray-900 placeholder-gray-400">
              <SelectValue placeholder="Select hair color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="black">Black</SelectItem>
              <SelectItem value="brown">Brown</SelectItem>
              <SelectItem value="blonde">Blonde</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="gray">Gray</SelectItem>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="bald">Bald/Shaved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Label htmlFor="maritalStatus" className="block text-sm font-medium mb-1 text-gray-700">
            Marital Status
          </Label>
          <Select
            value={formData.marital_status}
            onValueChange={(value) => updateFormData({ marital_status: value })}
          >
            <SelectTrigger className="w-full bg-white text-gray-900 placeholder-gray-400">
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="separated">Separated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="heightFeet"
            label="Height (Feet)"
            value={formData.height_feet}
            onChange={(value) => updateFormData({ height_feet: value })}
            type="number"
          />
          <FormField
            id="heightInches"
            label="Height (Inches)"
            value={formData.height_inches}
            onChange={(value) => updateFormData({ height_inches: value })}
            type="number"
          />
        </div>

        <div className="relative">
          <Label htmlFor="eyeColor" className="block text-sm font-medium mb-1 text-gray-700">
            Eye Color
          </Label>
          <Select
            value={formData.eye_color}
            onValueChange={(value) => updateFormData({ eye_color: value })}
          >
            <SelectTrigger className="w-full bg-white text-gray-900 placeholder-gray-400">
              <SelectValue placeholder="Select eye color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brown">Brown</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="hazel">Hazel</SelectItem>
              <SelectItem value="gray">Gray</SelectItem>
              <SelectItem value="black">Black</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

const Step2ContactInfo: React.FC<{
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl font-bold text-blue-900">Passport Application</h2>
        <h3 className="text-lg font-semibold text-gray-800">Your Contact & Delivery Info</h3>
      </div>

      <div className="space-y-4">
        <FormField
          id="houseNumber"
          label="Unit and/or House Number"
          value={formData.house_number}
          onChange={(value) => updateFormData({ house_number: value })}
          required
        />

        <FormField
          id="streetName"
          label="Street Name"
          value={formData.street_name}
          onChange={(value) => updateFormData({ street_name: value })}
          required
        />

        <PhoneInput
          id="phoneNumber"
          label="Phone Number"
          value={formData.phone_number}
          onChange={(value) => updateFormData({ phone_number: value })}
          required
        />

        <FormField
          id="city"
          label="City or Town"
          value={formData.city}
          onChange={(value) => updateFormData({ city: value })}
          required
        />

        <FormField
          id="state"
          label="State"
          value={formData.state}
          onChange={(value) => updateFormData({ state: value })}
          required
        />

        <FormField
          id="zipCode"
          label="Postal Code"
          value={formData.zip_code}
          onChange={(value) => updateFormData({ zip_code: value })}
          required
        />

        <FormField
          id="email"
          label="Email Address"
          value={formData.email}
          onChange={(value) => updateFormData({ email: value })}
          type="email"
          required
        />
      </div>
    </div>
  )
}

const Step3EmergencyContact: React.FC<{
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl font-bold text-blue-900">Passport Application</h2>
        <h3 className="text-lg font-semibold text-gray-800">Your Emergency Contact Info</h3>
      </div>

      <div className="space-y-4">
        <FormField
          id="emergencyName"
          label="Full Name"
          value={formData.emergency_contact_name}
          onChange={(value) => updateFormData({ emergency_contact_name: value })}
          required
        />

        <PhoneInput
          id="emergencyPhone"
          label="Phone Number"
          value={formData.emergency_contact_phone}
          onChange={(value) => updateFormData({ emergency_contact_phone: value })}
          required
        />

        <FormField
          id="emergencyHouseNumber"
          label="Unit and/or House Number"
          value={formData.emergency_contact_house_number}
          onChange={(value) => updateFormData({ emergency_contact_house_number: value })}
        />

        <FormField
          id="emergencyStreetName"
          label="Street Name"
          value={formData.emergency_contact_street_name}
          onChange={(value) => updateFormData({ emergency_contact_street_name: value })}
        />

        <FormField
          id="emergencyCity"
          label="City or Town"
          value={formData.emergency_contact_city}
          onChange={(value) => updateFormData({ emergency_contact_city: value })}
        />

        <FormField
          id="emergencyState"
          label="State"
          value={formData.emergency_contact_state}
          onChange={(value) => updateFormData({ emergency_contact_state: value })}
        />

        <FormField
          id="emergencyPostalCode"
          label="Postal Code"
          value={formData.emergency_contact_postal_code}
          onChange={(value) => updateFormData({ emergency_contact_postal_code: value })}
        />
      </div>
    </div>
  )
}

const Step4ParentInfo: React.FC<{
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl font-bold text-blue-900">Passport Application</h2>
        <h3 className="text-lg font-semibold text-gray-800">Parental Details</h3>
      </div>

      <div className="space-y-8">
        {/* Father Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Father</h4>

          <FormField
            id="fatherName"
            label="Father's Full Name"
            value={formData.father_name}
            onChange={(value) => updateFormData({ father_name: value })}
            required
          />

          <div className="relative">
            <Label htmlFor="fatherDob" className="block text-sm font-medium mb-1 text-gray-700">
              Father's Date of Birth
            </Label>
            <Input
              id="fatherDob"
              type="date"
              value={formData.father_date_of_birth}
              onChange={(e) => updateFormData({ father_date_of_birth: e.target.value })}
              className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          <FormField
            id="fatherNationality"
            label="Nationality"
            value={formData.father_nationality}
            onChange={(value) => updateFormData({ father_nationality: value })}
          />

          <FormField
            id="fatherCity"
            label="City or Town"
            value={formData.father_city}
            onChange={(value) => updateFormData({ father_city: value })}
          />

          <FormField
            id="fatherState"
            label="State"
            value={formData.father_state}
            onChange={(value) => updateFormData({ father_state: value })}
          />

          <FormField
            id="fatherCountry"
            label="Country"
            value={formData.father_country}
            onChange={(value) => updateFormData({ father_country: value })}
          />
        </div>

        {/* Mother Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Mother</h4>

          <FormField
            id="motherName"
            label="Mother's Full Name"
            value={formData.mother_name}
            onChange={(value) => updateFormData({ mother_name: value })}
            required
          />

          <div className="relative">
            <Label htmlFor="motherDob" className="block text-sm font-medium mb-1 text-gray-700">
              Mother's Date of Birth
            </Label>
            <Input
              id="motherDob"
              type="date"
              value={formData.mother_date_of_birth}
              onChange={(e) => updateFormData({ mother_date_of_birth: e.target.value })}
              className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          <FormField
            id="motherNationality"
            label="Nationality"
            value={formData.mother_nationality}
            onChange={(value) => updateFormData({ mother_nationality: value })}
          />

          <FormField
            id="motherCity"
            label="City or Town"
            value={formData.mother_city}
            onChange={(value) => updateFormData({ mother_city: value })}
          />

          <FormField
            id="motherState"
            label="State"
            value={formData.mother_state}
            onChange={(value) => updateFormData({ mother_state: value })}
          />

          <FormField
            id="motherCountry"
            label="Country"
            value={formData.mother_country}
            onChange={(value) => updateFormData({ mother_country: value })}
          />
        </div>
      </div>
    </div>
  )
}

const Step5FileUploads: React.FC<{
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}> = ({ formData, updateFormData }) => {
  const documentTypes = [
    {
      key: "birth_certificate" as keyof FormData,
      label: "Birth Certificate",
      description: "Official birth certificate or certified copy",
      accept: "image/*, application/pdf",
      required: true,
    },
    {
      key: "consent_form" as keyof FormData,
      label: "Consent Form",
      description: "Parental consent form (if under 18)",
      accept: "image/*, application/pdf",
      required: true,
    },
    {
      key: "marriage_certificate" as keyof FormData,
      label: "Marriage/Divorce Certificate",
      description: "If applicable for name change verification",
      accept: "image/*, application/pdf",
      required: false,
    },
    {
      key: "old_passport" as keyof FormData,
      label: "Previous Passport",
      description: "Copy of your most recent passport (if renewal)",
      accept: "image/*, application/pdf",
      required: false,
    },
    {
      key: "signature" as keyof FormData,
      label: "Signature Sample",
      description: "Clear image of your signature on white paper",
      accept: "image/*",
      required: true,
    },
    {
      key: "photo_id" as keyof FormData,
      label: "Photo Identification",
      description: "Driver's license, state ID, or other government-issued ID",
      accept: "image/*",
      required: true,
    },
  ]

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    updateFormData({ [field]: file } as Partial<FormData>)
  }

  const getUploadedCount = () => {
    return documentTypes.filter((doc) => formData[doc.key] !== null).length
  }

  const getRequiredCount = () => {
    return documentTypes.filter((doc) => doc.required).length
  }

  const getRequiredUploadedCount = () => {
    return documentTypes.filter((doc) => doc.required && formData[doc.key] !== null).length
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl font-bold text-blue-900">Passport Application</h2>
        <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
        <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto">
          Please upload the required documents. All files should be clear and legible.
        </p>
      </div>

      {/* Progress Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 text-sm sm:text-base">Upload Progress</h4>
              <p className="text-xs sm:text-sm text-blue-700">
                {getUploadedCount()} of {documentTypes.length} documents uploaded
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">
                {getRequiredUploadedCount()}/{getRequiredCount()}
              </div>
              <p className="text-xs text-blue-700">Required</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 w-full bg-blue-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(getUploadedCount() / documentTypes.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes.map((doc) => (
          <Card key={doc.key} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex-shrink-0 p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                    {doc.label}
                    {doc.required && <span className="text-red-500 text-xs sm:text-sm">*</span>}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{doc.description}</p>
                </div>
              </div>

              <FileUpload
                id={doc.key}
                label=""
                accept={doc.accept}
                onChange={(file) => handleFileChange(doc.key, file)}
                value={formData[doc.key] as File | null}
                required={doc.required}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Tips */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-3 sm:p-4">
          <h4 className="font-medium text-amber-900 mb-1 sm:mb-2 text-sm sm:text-base">📋 Upload Tips</h4>
          <ul className="text-xs sm:text-sm text-amber-800 space-y-0.5 sm:space-y-1">
            <li>• Ensure documents are clear and all text is readable</li>
            <li>• File size should not exceed 10MB per document</li>
            <li>• Accepted formats: PDF, JPG, PNG</li>
            <li>• Scan or photograph documents in good lighting</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

const Step6Review: React.FC<{
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}> = ({ formData, updateFormData }) => {
  const ReviewItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="grid grid-cols-2 text-sm py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-900">{value || "Not provided"}</span>
    </div>
  )

  const DocumentStatus: React.FC<{ name: string; file: File | null }> = ({ name, file }) => (
    <div className="grid grid-cols-2 text-sm py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 font-medium">{name}:</span>
      <span className={`flex items-center ${file ? "text-green-600" : "text-red-500"}`}>
        {file ? (
          <>
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Uploaded
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Not uploaded
          </>
        )}
      </span>
    </div>
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center text-blue-900 mb-2">Passport Application</h2>
      <h3 className="text-lg font-semibold text-center mb-6 block">Review and Submit</h3>
      <p className="text-sm text-gray-600 mb-4">Please review all information before submitting.</p>

      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6">
            <CardTitle className="text-base font-medium text-gray-800">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReviewItem label="Application Type" value={formData.application_type} />
            <ReviewItem label="Last Name" value={formData.last_name} />
            <ReviewItem label="First and Middle Names" value={formData.first_middle_names} />
            <ReviewItem label="SSN" value={formData.social_security_number} />
            <ReviewItem label="City of Birth" value={formData.city_of_birth} />
            <ReviewItem label="State of Birth" value={formData.state_of_birth} />
            <ReviewItem label="Country of Birth" value={formData.country_of_birth} />
            <ReviewItem label="Date of Birth" value={formData.date_of_birth} />
            <ReviewItem label="Gender" value={formData.gender} />
            <ReviewItem label="Hair Color" value={formData.hair_color} />
            <ReviewItem label="Marital Status" value={formData.marital_status} />
            <ReviewItem label="Height" value={`${formData.height_feet}'${formData.height_inches}"`} />
            <ReviewItem label="Eye Color" value={formData.eye_color} />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6">
            <CardTitle className="text-base font-medium text-gray-800">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReviewItem label="House Number" value={formData.house_number} />
            <ReviewItem label="Street Name" value={formData.street_name} />
            <ReviewItem label="Phone Number" value={formData.phone_number} />
            <ReviewItem label="City" value={formData.city} />
            <ReviewItem label="State" value={formData.state} />
            <ReviewItem label="Zip Code" value={formData.zip_code} />
            <ReviewItem label="Email" value={formData.email} />
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6">
            <CardTitle className="text-base font-medium text-gray-800">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReviewItem label="Name" value={formData.emergency_contact_name} />
            <ReviewItem label="Phone" value={formData.emergency_contact_phone} />
            <ReviewItem label="House Number" value={formData.emergency_contact_house_number} />
            <ReviewItem label="Street Name" value={formData.emergency_contact_street_name} />
            <ReviewItem label="City" value={formData.emergency_contact_city} />
            <ReviewItem label="State" value={formData.emergency_contact_state} />
            <ReviewItem label="Postal Code" value={formData.emergency_contact_postal_code} />
          </CardContent>
        </Card>

        {/* Parental Details */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6">
            <CardTitle className="text-base font-medium text-gray-800">Parental Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Father</h4>
              <div className="ml-4 space-y-2">
                <ReviewItem label="Name" value={formData.father_name} />
                <ReviewItem label="Date of Birth" value={formData.father_date_of_birth} />
                <ReviewItem label="Nationality" value={formData.father_nationality} />
                <ReviewItem label="City" value={formData.father_city} />
                <ReviewItem label="State" value={formData.father_state} />
                <ReviewItem label="Country" value={formData.father_country} />
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Mother</h4>
              <div className="ml-4 space-y-2">
                <ReviewItem label="Name" value={formData.mother_name} />
                <ReviewItem label="Date of Birth" value={formData.mother_date_of_birth} />
                <ReviewItem label="Nationality" value={formData.mother_nationality} />
                <ReviewItem label="City" value={formData.mother_city} />
                <ReviewItem label="State" value={formData.mother_state} />
                <ReviewItem label="Country" value={formData.mother_country} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Documents */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6">
            <CardTitle className="text-base font-medium text-gray-800">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <DocumentStatus name="Birth Certificate" file={formData.birth_certificate} />
            <DocumentStatus name="Consent Form" file={formData.consent_form} />
            <DocumentStatus name="Marriage/Divorce Certificate" file={formData.marriage_certificate} />
            <DocumentStatus name="Old Passport Copy" file={formData.old_passport} />
            <DocumentStatus name="Signature" file={formData.signature} />
            <DocumentStatus name="Photo ID" file={formData.photo_id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main Apply Component
export default function Apply() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    application_type: "",
    last_name: "",
    first_middle_names: "",
    social_security_number: "",
    city_of_birth: "",
    state_of_birth: "",
    country_of_birth: "",
    date_of_birth: "",
    gender: "",
    hair_color: "",
    marital_status: "",
    height_feet: "",
    height_inches: "",
    eye_color: "",

    // Contact Information
    house_number: "",
    street_name: "",
    phone_number: "",
    city: "",
    state: "",
    zip_code: "",
    email: "",

    // Emergency Contact
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_house_number: "",
    emergency_contact_street_name: "",
    emergency_contact_city: "",
    emergency_contact_state: "",
    emergency_contact_postal_code: "",

    // Parental Details
    father_name: "",
    father_date_of_birth: "",
    father_nationality: "",
    father_city: "",
    father_state: "",
    father_country: "",
    mother_name: "",
    mother_date_of_birth: "",
    mother_nationality: "",
    mother_city: "",
    mother_state: "",
    mother_country: "",

    // Document Uploads
    birth_certificate: null,
    consent_form: null,
    marriage_certificate: null,
    old_passport: null,
    signature: null,
    photo_id: null,
  })

  const formRef = useRef<HTMLDivElement>(null)
  const totalSteps = 6
  const { toast } = useToast()

  // Media queries
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 640)
      setIsLandscape(window.innerHeight <= 500 && window.innerWidth > window.innerHeight)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Reset view when changing steps
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSubmit = async () => {
    try {
      // Here you would typically send the data to your Supabase backend
      console.log("Form submitted:", formData)

      toast({
        title: "Application Submitted",
        description: "Your passport application has been submitted successfully!",
      })

      // Reset form or redirect
      // navigate('/success') // if using router
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "There was an error submitting your application. Please try again.",
      })
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PersonalInfo formData={formData} updateFormData={updateFormData} />
      case 2:
        return <Step2ContactInfo formData={formData} updateFormData={updateFormData} />
      case 3:
        return <Step3EmergencyContact formData={formData} updateFormData={updateFormData} />
      case 4:
        return <Step4ParentInfo formData={formData} updateFormData={updateFormData} />
      case 5:
        return <Step5FileUploads formData={formData} updateFormData={updateFormData} />
      case 6:
        return <Step6Review formData={formData} updateFormData={updateFormData} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl">
        <Card className="bg-white shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8" ref={formRef}>
          <CardHeader className={`pb-2 ${isLandscape ? "mb-0" : ""}`}>
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} isCompact={isSmallScreen || isLandscape} />
          </CardHeader>

          <CardContent className={`pt-0 ${isLandscape ? "py-2" : ""}`}>{renderStep()}</CardContent>

          <div
            className={`flex border-t border-gray-100 pt-6 ${
              currentStep === 1 ? "justify-center" : "justify-between"
            } ${isLandscape ? "py-2" : ""}`}
          >
            {currentStep > 1 && (
              <Button onClick={handleBack} className="bg-blue-900 text-white hover:bg-blue-800 w-24">
                Back
              </Button>
            )}
            {currentStep === totalSteps ? (
              <Button onClick={handleSubmit} className="bg-blue-900 hover:bg-blue-800 w-24">
                Submit
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-blue-900 hover:bg-blue-800 w-24">
                Next
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}