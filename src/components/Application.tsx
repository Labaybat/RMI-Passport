"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Input } from "../components/ui/Input"
import { Label } from "../components/ui/Label"
import Button from "../components/ui/Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select"
import { useToast } from "../hooks/use-toast"
import supabase from "../lib/supabase/client";
import { useAuth } from "../contexts/AuthContext"
import { useRouter } from '@tanstack/react-router';

// Types
interface FormData {
  id?: string;
  user_id?: string;
  application_type: string;
  surname: string;
  first_middle_names: string;
  social_security_number: string;
  place_of_birth_city: string;
  place_of_birth_state: string;
  country_of_birth: string;
  date_of_birth: string;
  gender: string;
  hair_color: string;
  marital_status: string;
  height_feet: string;
  height_inches: string;
  eye_color: string;
  address_unit: string;
  street_name: string;
  phone_number: string;
  city: string;
  state: string;
  postal_code: string;
  emergency_full_name: string;
  emergency_phone_number: string;
  emergency_address_unit: string;
  emergency_street_name: string;
  emergency_city: string;
  emergency_state: string;
  emergency_postal_code: string;
  father_full_name: string;
  father_dob: string;
  father_nationality: string;
  father_birth_city: string;
  father_birth_state: string;
  father_birth_country: string;
  mother_full_name: string;
  mother_dob: string;
  mother_nationality: string;
  mother_birth_city: string;
  mother_birth_state: string;
  mother_birth_country: string;
  birth_certificate: string;
  consent_form: string;
  marriage_or_divorce_certificate: string;
  old_passport_copy: string;
  signature: string;
  photo_id: string;
  // Add missing _url fields for document uploads
  birth_certificate_url?: string;
  consent_form_url?: string;
  marriage_certificate_url?: string;
  old_passport_url?: string;
  signature_url?: string;
  photo_id_url?: string;
  status?: string;
  submitted_at?: string;
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
        className={`transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400 font-medium ${
          hasValue || focused ? "pt-6" : ""
        }`}
      />
      <Label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          hasValue || focused ? "top-1 text-xs text-blue-600 font-medium" : "top-1/2 -translate-y-1/2 text-gray-500"
        }`}
        required={required}
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
        required={required}        className={`transition-all duration-200 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400 font-medium ${
          hasValue || focused ? "pt-6" : ""
          }`}
        inputMode="tel"
      />
      <Label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          hasValue || focused ? "top-1 text-xs text-blue-600 font-medium" : "top-1/2 -translate-y-1/2 text-gray-500"
        }`}
        required={required}
      >
        {label}
        <span className="text-red-500 ml-1">*</span>
      </Label>
    </div>
  )
}

const FileUpload: React.FC<{
  id: string
  label: string
  accept?: string
  onChange: (file: File | "") => void
  value: string // This is now the signed URL
  required?: boolean
}> = ({ id, label, accept, onChange, value, required = false }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    onChange(file ? file : "")
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
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
                <p className="text-sm font-medium text-green-900 truncate">Uploaded</p>
                {value && (
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline">View</a>
                )}
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

// Helper to upload file to Supabase Storage and get public URL
async function uploadDocumentToSupabase(file: File, userId: string, docType: string) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${docType}_${Date.now()}.${fileExt}`; // Store directly under userId folder
  const { error: uploadError } = await supabase.storage
    .from("passport-documents")
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data: publicUrlData } = supabase.storage.from("passport-documents").getPublicUrl(filePath);
  return publicUrlData?.publicUrl || "";
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
          <Label htmlFor="applicationType" className="block text-sm font-medium mb-1 text-gray-700" required>
            Application Type
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.application_type}
            onValueChange={(value) => updateFormData({ application_type: value })}
            required
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
          value={formData.surname}
          onChange={(value) => updateFormData({ surname: value })}
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
          required
        />

        <FormField
          id="cityOfBirth"
          label="City of Birth"
          value={formData.place_of_birth_city}
          onChange={(value) => updateFormData({ place_of_birth_city: value })}
          required
        />

        <FormField
          id="stateOfBirth"
          label="State (if in U.S.)"
          value={formData.place_of_birth_state}
          onChange={(value) => updateFormData({ place_of_birth_state: value })}
        />

        <FormField
          id="countryOfBirth"
          label="Country of Birth"
          value={formData.country_of_birth}
          onChange={(value) => updateFormData({ country_of_birth: value })}
          required
        />

        <div className="relative">
          <Label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1 text-gray-700" required>
            Date of Birth
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => updateFormData({ date_of_birth: e.target.value })}
            className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
            required
          />
        </div>

        <div className="relative">
          <Label htmlFor="gender" className="block text-sm font-medium mb-1 text-gray-700" required>
            Gender
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => updateFormData({ gender: value })}
            required
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
          <Label htmlFor="hairColor" className="block text-sm font-medium mb-1 text-gray-700" required>
            Hair Color
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.hair_color}
            onValueChange={(value) => updateFormData({ hair_color: value })}
            required
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
          <Label htmlFor="maritalStatus" className="block text-sm font-medium mb-1 text-gray-700" required>
            Marital Status
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.marital_status}
            onValueChange={(value) => updateFormData({ marital_status: value })}
            required
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
            required
          />
          <FormField
            id="heightInches"
            label="Height (Inches)"
            value={formData.height_inches}
            onChange={(value) => updateFormData({ height_inches: value })}
            type="number"
            required
          />
        </div>

        <div className="relative">
          <Label htmlFor="eyeColor" className="block text-sm font-medium mb-1 text-gray-700" required>
            Eye Color
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select
            value={formData.eye_color}
            onValueChange={(value) => updateFormData({ eye_color: value })}
            required
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
              <SelectItem value="amber">Amber</SelectItem>
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
          value={formData.address_unit}
          onChange={(value) => updateFormData({ address_unit: value })}
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
          id="postalCode"
          label="Postal Code"
          value={formData.postal_code}
          onChange={(value) => updateFormData({ postal_code: value })}
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
          value={formData.emergency_full_name}
          onChange={(value) => updateFormData({ emergency_full_name: value })}
          required
        />

        <PhoneInput
          id="emergencyPhone"
          label="Phone Number"
          value={formData.emergency_phone_number}
          onChange={(value) => updateFormData({ emergency_phone_number: value })}
          required
        />

        <FormField
          id="emergencyHouseNumber"
          label="Unit and/or House Number"
          value={formData.emergency_address_unit}
          onChange={(value) => updateFormData({ emergency_address_unit: value })}
          required
        />

        <FormField
          id="emergencyStreetName"
          label="Street Name"
          value={formData.emergency_street_name}
          onChange={(value) => updateFormData({ emergency_street_name: value })}
          required
        />

        <FormField
          id="emergencyCity"
          label="City or Town"
          value={formData.emergency_city}
          onChange={(value) => updateFormData({ emergency_city: value })}
          required
        />

        <FormField
          id="emergencyState"
          label="State"
          value={formData.emergency_state}
          onChange={(value) => updateFormData({ emergency_state: value })}
          required
        />

        <FormField
          id="emergencyPostalCode"
          label="Postal Code"
          value={formData.emergency_postal_code}
          onChange={(value) => updateFormData({ emergency_postal_code: value })}
          required
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
            value={formData.father_full_name}
            onChange={(value) => updateFormData({ father_full_name: value })}
            required
          />

          <div className="relative">
            <Label htmlFor="fatherDob" className="block text-sm font-medium mb-1 text-gray-700" required>
              Father's Date of Birth
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="fatherDob"
              type="date"
              value={formData.father_dob}
              onChange={(e) => updateFormData({ father_dob: e.target.value })}
              className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          <FormField
            id="fatherNationality"
            label="Nationality"
            value={formData.father_nationality}
            onChange={(value) => updateFormData({ father_nationality: value })}
            required
          />

          <FormField
            id="fatherCity"
            label="City or Town"
            value={formData.father_birth_city}
            onChange={(value) => updateFormData({ father_birth_city: value })}
            required
          />

          <FormField
            id="fatherState"
            label="State"
            value={formData.father_birth_state}
            onChange={(value) => updateFormData({ father_birth_state: value })}
            required
          />

          <FormField
            id="fatherCountry"
            label="Country"
            value={formData.father_birth_country}
            onChange={(value) => updateFormData({ father_birth_country: value })}
            required
          />
        </div>

        {/* Mother Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Mother</h4>

          <FormField
            id="motherName"
            label="Mother's Full Name"
            value={formData.mother_full_name}
            onChange={(value) => updateFormData({ mother_full_name: value })}
            required
          />

          <div className="relative">
            <Label htmlFor="motherDob" className="block text-sm font-medium mb-1 text-gray-700" required>
              Mother's Date of Birth
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="motherDob"
              type="date"
              value={formData.mother_dob}
              onChange={(e) => updateFormData({ mother_dob: e.target.value })}
              className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          <FormField
            id="motherNationality"
            label="Nationality"
            value={formData.mother_nationality}
            onChange={(value) => updateFormData({ mother_nationality: value })}
            required
          />

          <FormField
            id="motherCity"
            label="City or Town"
            value={formData.mother_birth_city}
            onChange={(value) => updateFormData({ mother_birth_city: value })}
            required
          />

          <FormField
            id="motherState"
            label="State"
            value={formData.mother_birth_state}
            onChange={(value) => updateFormData({ mother_birth_state: value })}
            required
          />

          <FormField
            id="motherCountry"
            label="Country"
            value={formData.mother_birth_country}
            onChange={(value) => updateFormData({ mother_birth_country: value })}
            required
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
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Store signed URLs for each doc
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});

  const documentTypes = [
    {
      key: "birth_certificate" as keyof FormData,
      label: "Birth Certificate",
      description: "Official birth certificate or certified copy",
      accept: "image/*, application/pdf",
      required: true,
      urlField: "birth_certificate_url"
    },
    {
      key: "consent_form" as keyof FormData,
      label: "Consent Form",
      description: "Parental consent form (if under 18)",
      accept: "image/*, application/pdf",
      required: true,
      urlField: "consent_form_url"
    },
    {
      key: "marriage_or_divorce_certificate" as keyof FormData,
      label: "Marriage/Divorce Certificate",
      description: "If applicable for name change verification",
      accept: "image/*, application/pdf",
      required: false,
      urlField: "marriage_certificate_url"
    },
    {
      key: "old_passport_copy" as keyof FormData,
      label: "Previous Passport",
      description: "Copy of your most recent passport (if renewal)",
      accept: "image/*, application/pdf",
      required: false,
      urlField: "old_passport_url"
    },
    {
      key: "signature" as keyof FormData,
      label: "Signature Sample",
      description: "Clear image of your signature on white paper",
      accept: "image/*",
      required: true,
      urlField: "signature_url"
    },
    {
      key: "photo_id" as keyof FormData,
      label: "Photo Identification",
      description: "Driver's license, state ID, or other government-issued ID",
      accept: "image/*",
      required: true,
      urlField: "photo_id_url"
    },
  ];

  // Generate signed URL for a file path
  const getSignedUrl = async (urlField: string) => {
    const url = formData[urlField as keyof FormData] as string;
    if (!url) return "";
    // Extract the file path from the public URL
    const match = url.match(/passport-documents\/(.+)$/);
    const filePath = match ? match[1] : null;
    if (!filePath) return "";
    const { data, error } = await supabase.storage.from("passport-documents").createSignedUrl(filePath, 300); // 300s expiry
    if (error) return "";
    return data.signedUrl;
  };

  // When a file is uploaded or formData changes, update signed URLs
  useEffect(() => {
    (async () => {
      const newUrls: { [key: string]: string } = {};
      for (const doc of documentTypes) {
        if (formData[doc.urlField as keyof FormData]) {
          newUrls[doc.key] = await getSignedUrl(doc.urlField);
        }
      }
      setSignedUrls(newUrls);
    })();
    // eslint-disable-next-line
  }, [formData.birth_certificate_url, formData.consent_form_url, formData.marriage_certificate_url, formData.old_passport_url, formData.signature_url, formData.photo_id_url]);

  const handleFileChange = async (field: keyof FormData, urlField: string, file: File | "") => {
    if (!user) return;
    setUploadError(null);
    if (!file) {
      updateFormData({ [field]: "", [urlField]: "" });
      setSignedUrls((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    setUploading(field as string);
    try {
      const publicUrl = await uploadDocumentToSupabase(file as File, user.id, field as string);
      updateFormData({ [field]: file.name, [urlField]: publicUrl });
      // Signed URL will be generated by useEffect
    } catch (error: any) {
      setUploadError(error.message || "Could not upload file.");
    } finally {
      setUploading(null);
    }
  };

  const getUploadedCount = () => documentTypes.filter(dt => formData[dt.urlField as keyof FormData]).length;
  const getRequiredCount = () => documentTypes.filter(dt => dt.required).length;
  const getRequiredUploadedCount = () => documentTypes.filter(dt => dt.required && formData[dt.urlField as keyof FormData]).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl font-bold text-blue-900">Passport Application</h2>
        <h3 className="text-lg font-semibold text-gray-800">Upload Required Documents</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {documentTypes.map((doc) => (
          <div key={doc.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{doc.label}</span>
            </div>
            <p className="text-xs text-gray-500">{doc.description}</p>
            <FileUpload
              id={doc.key}
              label={doc.label}
              accept={doc.accept}
              value={signedUrls[doc.key] || ""}
              required={doc.required}
              onChange={(file) => handleFileChange(doc.key, doc.urlField, file)}
            />
            {uploading === doc.key && (
              <div className="text-xs text-blue-600 mt-1">Uploading...</div>
            )}
            {uploadError && uploading === doc.key && (
              <div className="text-xs text-red-600 mt-1">{uploadError}</div>
            )}
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-700 mt-4">
        Uploaded: {getUploadedCount()} / {documentTypes.length} &nbsp;|
        &nbsp;Required: {getRequiredUploadedCount()} / {getRequiredCount()}
      </div>
    </div>
  );
}

const Step6Review: React.FC<{
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
}> = ({ formData, updateFormData }) => {
  const [editingSections, setEditingSections] = useState({
    personal: false,
    contact: false,
    emergency: false,
    parental: false,
  })
  const [editBuffer, setEditBuffer] = useState<FormData>(formData)

  useEffect(() => {
    setEditBuffer(formData)
  }, [formData])

  const handleEdit = (section: keyof typeof editingSections) => {
    setEditingSections((prev) => ({ ...prev, [section]: true }))
  }
  const handleSave = (section: keyof typeof editingSections) => {
    updateFormData(editBuffer)
    setEditingSections((prev) => ({ ...prev, [section]: false }))
  }
  const handleCancel = (section: keyof typeof editingSections) => {
    setEditBuffer(formData)
    setEditingSections((prev) => ({ ...prev, [section]: false }))
  }
  const handleBufferChange = (data: Partial<FormData>) => {
    setEditBuffer((prev) => ({ ...prev, ...data }))
  }

  const ReviewItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="grid grid-cols-2 text-sm py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className="text-gray-900">{value || "Not provided"}</span>
    </div>
  )

  // Use the same signedUrls logic as Step5FileUploads
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const documentTypes = [
    { key: "birth_certificate", label: "Birth Certificate", urlField: "birth_certificate_url" },
    { key: "consent_form", label: "Consent Form", urlField: "consent_form_url" },
    { key: "marriage_or_divorce_certificate", label: "Marriage/Divorce Certificate", urlField: "marriage_certificate_url" },
    { key: "old_passport_copy", label: "Old Passport Copy", urlField: "old_passport_url" },
    { key: "signature", label: "Signature", urlField: "signature_url" },
    { key: "photo_id", label: "Photo ID", urlField: "photo_id_url" },
  ];

  useEffect(() => {
    (async () => {
      const newUrls: { [key: string]: string } = {};
      for (const doc of documentTypes) {
        const url = formData[doc.urlField as keyof FormData] as string;
        if (url && url.trim() !== "") {
          // Extract the file path from the public URL
          const match = url.match(/passport-documents\/(.+)$/) || url.match(/passport-documents\/(.+)$/);
          const filePath = match ? match[1] : url;
          if (filePath) {
            const { data, error } = await supabase.storage.from("passport-documents").createSignedUrl(filePath, 300);
            newUrls[doc.key] = error ? "" : data.signedUrl;
          }
        }
      }
      setSignedUrls(newUrls);
    })();
    // eslint-disable-next-line
  }, [formData.birth_certificate_url, formData.consent_form_url, formData.marriage_certificate_url, formData.old_passport_url, formData.signature_url, formData.photo_id_url]);

  const DocumentStatus: React.FC<{ name: string; url: string; docKey: string }> = ({ name, url, docKey }) => (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-gray-700 font-medium w-48">{name}:</span>
      {signedUrls[docKey] ? (
        <a href={signedUrls[docKey]} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">View</a>
      ) : (
        <span className="text-gray-500">Not uploaded</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center text-blue-900 mb-2">Passport Application</h2>
      <h3 className="text-lg font-semibold text-center mb-6 block">Review and Submit</h3>
      <p className="text-sm text-gray-600 mb-4">Please review all information before submitting.</p>
      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium text-gray-800">Personal Information</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:gap-2 sm:items-center sm:justify-end mt-2 sm:mt-0">
              {editingSections.personal ? (
                <>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-green-600 flex items-center justify-center text-base" onClick={() => handleSave('personal')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save
                  </Button>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-red-600 flex items-center justify-center text-base" onClick={() => handleCancel('personal')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-blue-600 flex items-center justify-center text-base" onClick={() => handleEdit('personal')}>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L5 11.828a2 2 0 010-2.828L9 13z" /></svg>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {editingSections.personal ? (
              <div className="space-y-2">
                <div className="relative">
                  <Label htmlFor="applicationType" className="block text-sm font-medium mb-1 text-gray-700" required>
                    Application Type
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={editBuffer.application_type}
                    onValueChange={v => handleBufferChange({ application_type: v })}
                    required
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
                <FormField id="lastName" label="Last Name" value={editBuffer.surname} onChange={v => handleBufferChange({ surname: v })} required />
                <FormField id="firstMiddleNames" label="First and Middle Names" value={editBuffer.first_middle_names} onChange={v => handleBufferChange({ first_middle_names: v })} required />
                <FormField id="ssn" label="SSN" value={editBuffer.social_security_number} onChange={v => handleBufferChange({ social_security_number: v })} required />
                <FormField id="cityOfBirth" label="City of Birth" value={editBuffer.place_of_birth_city} onChange={v => handleBufferChange({ place_of_birth_city: v })} required />
                <FormField id="stateOfBirth" label="State of Birth" value={editBuffer.place_of_birth_state} onChange={v => handleBufferChange({ place_of_birth_state: v })} />
                <FormField id="countryOfBirth" label="Country of Birth" value={editBuffer.country_of_birth} onChange={v => handleBufferChange({ country_of_birth: v })} required />
                <div className="relative">
                  <Label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1 text-gray-700" required>
                    Date of Birth
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editBuffer.date_of_birth}
                    onChange={e => handleBufferChange({ date_of_birth: e.target.value })}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="gender" className="block text-sm font-medium mb-1 text-gray-700" required>
                    Gender
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={editBuffer.gender}
                    onValueChange={v => handleBufferChange({ gender: v })}
                    required
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
                  <Label htmlFor="hairColor" className="block text-sm font-medium mb-1 text-gray-700" required>
                    Hair Color
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={editBuffer.hair_color}
                    onValueChange={v => handleBufferChange({ hair_color: v })}
                    required
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
                  <Label htmlFor="maritalStatus" className="block text-sm font-medium mb-1 text-gray-700" required>
                    Marital Status
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={editBuffer.marital_status}
                    onValueChange={v => handleBufferChange({ marital_status: v })}
                    required
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
                  <FormField id="heightFeet" label="Height (Feet)" value={editBuffer.height_feet} onChange={v => handleBufferChange({ height_feet: v })} type="number" required />
                  <FormField id="heightInches" label="Height (Inches)" value={editBuffer.height_inches} onChange={v => handleBufferChange({ height_inches: v })} type="number" required />
                </div>
                <div className="relative">
                  <Label htmlFor="eyeColor" className="block text-sm font-medium mb-1 text-gray-700" required>
                    Eye Color
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={editBuffer.eye_color}
                    onValueChange={v => handleBufferChange({ eye_color: v })}
                    required
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
                      <SelectItem value="amber">Amber</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <ReviewItem label="Application Type" value={formData.application_type} />
                <ReviewItem label="Last Name" value={formData.surname} />
                <ReviewItem label="First and Middle Names" value={formData.first_middle_names} />
                <ReviewItem label="SSN" value={formData.social_security_number} />
                <ReviewItem label="City of Birth" value={formData.place_of_birth_city} />
                <ReviewItem label="State of Birth" value={formData.place_of_birth_state} />
                <ReviewItem label="Country of Birth" value={formData.country_of_birth} />
                <ReviewItem label="Date of Birth" value={formData.date_of_birth} />
                <ReviewItem label="Gender" value={formData.gender} />
                <ReviewItem label="Hair Color" value={formData.hair_color} />
                <ReviewItem label="Marital Status" value={formData.marital_status} />
                <ReviewItem label="Height" value={`${formData.height_feet}'${formData.height_inches}"`} />
                <ReviewItem label="Eye Color" value={formData.eye_color} />
              </>
            )}
          </CardContent>
        </Card>
        {/* Contact Information */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium text-gray-800">Contact Information</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:gap-2 sm:items-center sm:justify-end mt-2 sm:mt-0">
              {editingSections.contact ? (
                <>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-green-600 flex items-center justify-center text-base" onClick={() => handleSave('contact')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save
                  </Button>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-red-600 flex items-center justify-center text-base" onClick={() => handleCancel('contact')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-blue-600 flex items-center justify-center text-base" onClick={() => handleEdit('contact')}>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L5 11.828a2 2 0 010-2.828L9 13z" /></svg>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {editingSections.contact ? (
              <div className="space-y-2">
                <FormField id="houseNumber" label="House Number" value={editBuffer.address_unit} onChange={v => handleBufferChange({ address_unit: v })} required />
                <FormField id="streetName" label="Street Name" value={editBuffer.street_name} onChange={v => handleBufferChange({ street_name: v })} required />
                <PhoneInput id="phoneNumber" label="Phone Number" value={editBuffer.phone_number} onChange={v => handleBufferChange({ phone_number: v })} required />
                <FormField id="city" label="City" value={editBuffer.city} onChange={v => handleBufferChange({ city: v })} required />
                <FormField id="state" label="State" value={editBuffer.state} onChange={v => handleBufferChange({ state: v })} required />
                <FormField id="postalCode" label="Postal Code" value={editBuffer.postal_code} onChange={v => handleBufferChange({ postal_code: v })} required />
              </div>
            ) : (
              <>
                <ReviewItem label="House Number" value={formData.address_unit} />
                <ReviewItem label="Street Name" value={formData.street_name} />
                <ReviewItem label="Phone Number" value={formData.phone_number} />
                <ReviewItem label="City" value={formData.city} />
                <ReviewItem label="State" value={formData.state} />
                <ReviewItem label="Postal Code" value={formData.postal_code} />
              </>
            )}
          </CardContent>
        </Card>
        {/* Emergency Contact */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium text-gray-800">Emergency Contact</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:gap-2 sm:items-center sm:justify-end mt-2 sm:mt-0">
              {editingSections.emergency ? (
                <>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-green-600 flex items-center justify-center text-base" onClick={() => handleSave('emergency')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save
                  </Button>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-red-600 flex items-center justify-center text-base" onClick={() => handleCancel('emergency')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-blue-600 flex items-center justify-center text-base" onClick={() => handleEdit('emergency')}>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L5 11.828a2 2 0 010-2.828L9 13z" /></svg>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {editingSections.emergency ? (
              <div className="space-y-2">
                <FormField id="emergencyName" label="Name" value={editBuffer.emergency_full_name} onChange={v => handleBufferChange({ emergency_full_name: v })} required />
                <PhoneInput id="emergencyPhone" label="Phone" value={editBuffer.emergency_phone_number} onChange={v => handleBufferChange({ emergency_phone_number: v })} required />
                <FormField id="emergencyHouseNumber" label="House Number" value={editBuffer.emergency_address_unit} onChange={v => handleBufferChange({ emergency_address_unit: v })} required />
                <FormField id="emergencyStreetName" label="Street Name" value={editBuffer.emergency_street_name} onChange={v => handleBufferChange({ emergency_street_name: v })} required />
                <FormField id="emergencyCity" label="City" value={editBuffer.emergency_city} onChange={v => handleBufferChange({ emergency_city: v })} required />
                <FormField id="emergencyState" label="State" value={editBuffer.emergency_state} onChange={v => handleBufferChange({ emergency_state: v })} required />
                <FormField id="emergencyPostalCode" label="Postal Code" value={editBuffer.emergency_postal_code} onChange={v => handleBufferChange({ emergency_postal_code: v })} required />
              </div>
            ) : (
              <>
                <ReviewItem label="Name" value={formData.emergency_full_name} />
                <ReviewItem label="Phone" value={formData.emergency_phone_number} />
                <ReviewItem label="House Number" value={formData.emergency_address_unit} />
                <ReviewItem label="Street Name" value={formData.emergency_street_name} />
                <ReviewItem label="City" value={formData.emergency_city} />
                <ReviewItem label="State" value={formData.emergency_state} />
                <ReviewItem label="Postal Code" value={formData.emergency_postal_code} />
              </>
            )}
          </CardContent>
        </Card>
        {/* Parental Details */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium text-gray-800">Parental Details</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:gap-2 sm:items-center sm:justify-end mt-2 sm:mt-0">
              {editingSections.parental ? (
                <>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-green-600 flex items-center justify-center text-base" onClick={() => handleSave('parental')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save
                  </Button>
                  <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-red-600 flex items-center justify-center text-base" onClick={() => handleCancel('parental')}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="h-12 min-h-[44px] min-w-[120px] w-full sm:w-auto px-4 text-blue-600 flex items-center justify-center text-base" onClick={() => handleEdit('parental')}>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L5 11.828a2 2 0 010-2.828L9 13z" /></svg>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {editingSections.parental ? (
              <div className="space-y-2">
                <FormField id="fatherName" label="Father's Name" value={editBuffer.father_full_name} onChange={v => handleBufferChange({ father_full_name: v })} required />
                <div className="grid grid-cols-2 gap-4">
                  <FormField id="fatherDob" label="Father's Date of Birth" value={editBuffer.father_dob} onChange={v => handleBufferChange({ father_dob: v })} type="date" required />
                  <FormField id="fatherNationality" label="Father's Nationality" value={editBuffer.father_nationality} onChange={v => handleBufferChange({ father_nationality: v })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField id="fatherCity" label="Father's City" value={editBuffer.father_birth_city} onChange={v => handleBufferChange({ father_birth_city: v })} required />
                  <FormField id="fatherState" label="Father's State" value={editBuffer.father_birth_state} onChange={v => handleBufferChange({ father_birth_state: v })} required />
                </div>
                <FormField id="fatherCountry" label="Father's Country" value={editBuffer.father_birth_country} onChange={v => handleBufferChange({ father_birth_country: v })} required />

                <FormField id="motherName" label="Mother's Name" value={editBuffer.mother_full_name} onChange={v => handleBufferChange({ mother_full_name: v })} required />
                <div className="grid grid-cols-2 gap-4">
                  <FormField id="motherDob" label="Mother's Date of Birth" value={editBuffer.mother_dob} onChange={v => handleBufferChange({ mother_dob: v })} type="date" required />
                  <FormField id="motherNationality" label="Mother's Nationality" value={editBuffer.mother_nationality} onChange={v => handleBufferChange({ mother_nationality: v })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField id="motherCity" label="Mother's City" value={editBuffer.mother_birth_city} onChange={v => handleBufferChange({ mother_birth_city: v })} required />
                  <FormField id="motherState" label="Mother's State" value={editBuffer.mother_birth_state} onChange={v => handleBufferChange({ mother_birth_state: v })} required />
                </div>
                <FormField id="motherCountry" label="Mother's Country" value={editBuffer.mother_birth_country} onChange={v => handleBufferChange({ mother_birth_country: v })} required />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">Father</h4>
                  <div className="ml-4 space-y-2">
                    <ReviewItem label="Name" value={formData.father_full_name} />
                    <ReviewItem label="Date of Birth" value={formData.father_dob} />
                    <ReviewItem label="Nationality" value={formData.father_nationality} />
                    <ReviewItem label="City" value={formData.father_birth_city} />
                    <ReviewItem label="State" value={formData.father_birth_state} />
                    <ReviewItem label="Country" value={formData.father_birth_country} />
                  </div>
                </div>
                <div>
                 
                  <h4 className="font-medium text-gray-800 mb-2">Mother</h4>
                  <div className="ml-4 space-y-2">
                    <ReviewItem label="Name" value={formData.mother_full_name} />
                    <ReviewItem label="Date of Birth" value={formData.mother_dob} />
                    <ReviewItem label="Nationality" value={formData.mother_nationality} />
                    <ReviewItem label="City" value={formData.mother_birth_city} />
                    <ReviewItem label="State" value={formData.mother_birth_state} />
                    <ReviewItem label="Country" value={formData.mother_birth_country} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Uploaded Documents */}
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 py-3 px-6">
            <CardTitle className="text-base font-medium text-gray-800">Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {documentTypes.map(doc => (
              <DocumentStatus key={doc.key} name={doc.label} url={formData[doc.urlField as keyof FormData] as string} docKey={doc.key} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ProgressBar component for step navigation
const ProgressBar: React.FC<{ currentStep: number; totalSteps: number; isCompact?: boolean }> = ({ currentStep, totalSteps, isCompact = false }) => {
  const percent = Math.max(0, Math.min(100, Math.round((currentStep - 1) / (totalSteps - 1) * 100)))
  return (
    <div className={isCompact ? "py-2" : "py-4"}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-blue-900">Step {currentStep} of {totalSteps}</span>
        <span className="text-xs font-medium text-blue-700">{percent}%</span>
      </div>
      <div className={`w-full bg-blue-100 rounded-full h-2 ${isCompact ? 'h-1.5' : 'h-2'}`}> 
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-700 h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// Main Apply Component
export default function Apply() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    application_type: "",
    surname: "",
    first_middle_names: "",
    social_security_number: "",
    place_of_birth_city: "",
    place_of_birth_state: "",
    country_of_birth: "",
    date_of_birth: "",
    gender: "",
    hair_color: "",
    marital_status: "",
    height_feet: "",
    height_inches: "",
    eye_color: "",
    // Contact Information
    address_unit: "",
    street_name: "",
    phone_number: "",
    city: "",
    state: "",
    postal_code: "",

   
    // Emergency Contact
    emergency_full_name: "",
    emergency_phone_number: "",
    emergency_address_unit: "",
    emergency_street_name: "",
    emergency_city: "",
    emergency_state: "",
    emergency_postal_code: "",

    // Parental Details
    father_full_name: "",
    father_dob: "",
    father_nationality: "",
    father_birth_city: "",
    father_birth_state: "",
    father_birth_country: "",
    mother_full_name: "",
    mother_dob: "",
    mother_nationality: "",
    mother_birth_city: "",
    mother_birth_state: "",
    mother_birth_country: "",

    // // Document Uploads
    birth_certificate: "",
    consent_form: "",
    marriage_or_divorce_certificate: "",
    old_passport_copy: "",
    signature: "",
    photo_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const totalSteps = 6;
  const { toast } = useToast();
  const { user } = useAuth();  const router = useRouter();
  // Media queries
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [hasParsedUrl, setHasParsedUrl] = useState(false); // Track if we've already parsed the URL
  const [shouldCreateDraft, setShouldCreateDraft] = useState(false); // Control draft creation

  // Parse URL search params once when component mounts
  useEffect(() => {
    if (hasParsedUrl) return;
    setHasParsedUrl(true);
      // Get search parameters from URL
    const searchParams = new URLSearchParams(window.location.search);
    const newParam = searchParams.get('new');
    
    // Check for both string 'true' and boolean true (from react-router)
    const isNewParam = newParam === 'true' || newParam === true || newParam === 'true"' || newParam === '"true"' || newParam === '"true';
    
    // Only set to create draft if explicitly requested
    setShouldCreateDraft(isNewParam);
    
    console.log("[Application] URL parameters parsed, new=", newParam, "shouldCreateDraft=", isNewParam);
  }, [hasParsedUrl]);

  // Check screen size and orientation
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
      setIsLandscape(window.innerHeight / window.innerWidth < 1);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Helper: Check if a form is incomplete (required fields null/empty)
  const isIncomplete = (app: any) => {
    // List of required fields (adjust as needed)
    const required = [
      "application_type",
      "surname",
      "first_middle_names",
      "social_security_number",
      "place_of_birth_city",
      "place_of_birth_state",
      "country_of_birth",
      "date_of_birth",
      "gender",
      "hair_color",
      "marital_status",
      "height_feet",
      "height_inches",
      "eye_color",
      "address_unit",
      "street_name",
      "phone_number",
      "city",
      "state",
      "postal_code",
      "emergency_full_name",
      "emergency_phone_number",
      "emergency_address_unit",
      "emergency_street_name",
      "emergency_city",
      "emergency_state",
      "emergency_postal_code",
      "father_full_name",
      "father_dob",
      "father_nationality",
      "mother_full_name",
      "mother_dob",
      "mother_nationality"
    ];
    return (
      app.status === "draft" || required.some((f) => !app[f] || app[f] === "")
    );
  };  // On mount: check for existing draft or create new - with double-check logic
  useEffect(() => {
    let isMounted = true;
    let alreadyCreatedDraft = false; // Flag to prevent duplicate creation
    
    const fetchOrCreateDraft = async () => {
      if (!user?.id) return;
      setLoading(true);
      console.log("[Application] Starting fetchOrCreateDraft, checking for draft applications");
      
      // Check if we already have a draft - this must run first
      const { data, error } = await supabase
        .from("passport_applications")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "draft")
        .order("updated_at", { ascending: false });

      // If we found ANY drafts, use the most recent one
      if (!error && data && data.length > 0) {
        const draft = data[0];
        console.log("[Application] Found existing draft(s):", data.length, "- Using most recent:", draft.id);
        
        if (isMounted) {
          setFormData((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(draft).map(([k, v]) => [k, v === null ? "" : v])
            ),
          }));
          setApplicationId(draft.id);
        }
        setLoading(false);
        return;
      }
      
      // We got here, so no draft exists - create one, but only if we haven't already AND we should create one
      if (alreadyCreatedDraft) {
        console.log("[Application] Preventing duplicate draft creation");
        setLoading(false);
        return;
      }
      
      // Only create a new draft if URL param indicates we should, or if there are no drafts yet
      // This prevents auto-creation when navigating directly to /apply
      if (!shouldCreateDraft && !hasParsedUrl) {
        console.log("[Application] Waiting for URL parameters to be parsed before creating draft");
        setLoading(false);
        return;
      }
      
      if (!shouldCreateDraft) {
        console.log("[Application] URL parameter 'new' is not 'true', skipping draft creation");
        setLoading(false);
        return;
      }
      
      console.log("[Application] No existing draft found, creating new draft application");
      alreadyCreatedDraft = true; // Set flag to prevent duplicate creation
      
      const insertPayload = {
        user_id: user.id,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        application_type: formData.application_type || "new", // Always include application_type
      };
      
      const { data: newApp, error: insertError } = await supabase
        .from("passport_applications")
        .insert([insertPayload])
        .select();
        
      if (insertError) {
        console.error("[Application] Error creating new draft:", insertError);
        setLoading(false);
        return;
      }
      
      if (isMounted && newApp && newApp[0]) {
        console.log("[Application] Successfully created new draft:", newApp[0].id);
        // Double-check that we don't have other drafts
        const { data: checkData } = await supabase
          .from("passport_applications")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "draft")
          .order("updated_at", { ascending: false });
          
        if (checkData && checkData.length > 1) {
          console.warn("[Application] WARNING: Multiple drafts exist after creation:", checkData.length);
        }
        
        setFormData((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(newApp[0]).map(([k, v]) => [k, v === null ? "" : v])
          ),
        }));
        setApplicationId(newApp[0].id);
      }
      setLoading(false);
    };
      fetchOrCreateDraft();
    return () => { isMounted = false; };
    // eslint-disable-next-line
  }, [user?.id, shouldCreateDraft, hasParsedUrl]);

  // As user progresses, update the draft in Supabase  // Define valid columns once, outside of functions for reuse
  const validColumns = [
    "user_id",
    "application_type",
    "surname",
    "first_middle_names",
    "social_security_number",
    "place_of_birth_city",
    "place_of_birth_state",
    "country_of_birth",
    "date_of_birth",
    "gender",
    "hair_color",
    "marital_status",
    "height_feet",
    "height_inches",
    "eye_color",
    "address_unit",
    "street_name",
    "phone_number",
    "city",
    "state",
    "postal_code",
    "emergency_full_name",
    "emergency_phone_number",
    "emergency_address_unit",
    "emergency_street_name",
    "emergency_city",
    "emergency_state",
    "emergency_postal_code",
    "father_full_name",
    "father_dob",
    "father_nationality",
    "father_birth_city",
    "father_birth_state",
    "father_birth_country",
    "mother_full_name",
    "mother_dob",
    "mother_nationality",
    "mother_birth_city",
    "mother_birth_state",
    "mother_birth_country",
    "birth_certificate",
    "consent_form",
    "marriage_or_divorce_certificate",
    "old_passport_copy",
    "signature",
    "photo_id",
    "birth_certificate_url",
    "consent_form_url",
    "marriage_certificate_url",
    "old_passport_url",
    "signature_url",
    "photo_id_url"
  ];

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data };
      // Prevent update if loading (insert not finished)
      if (applicationId && !loading) {
        (async () => {
          // Create a clean update object with only valid columns
          const cleanUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
          
          // Only include fields from data that are in our valid columns list
          Object.keys(data).forEach(key => {
            if (validColumns.includes(key)) {
              cleanUpdate[key] = data[key as keyof typeof data];
            }
          });
          
          // Convert height fields to integers if they exist in this update
          if (cleanUpdate.height_feet !== undefined) {
            cleanUpdate.height_feet = parseInt(cleanUpdate.height_feet, 10) || 0;
          }
          
          if (cleanUpdate.height_inches !== undefined) {
            cleanUpdate.height_inches = parseInt(cleanUpdate.height_inches, 10) || 0;
          }
            const { error } = await supabase
            .from("passport_applications")
            .update(cleanUpdate)
            .eq("id", applicationId);
            
          if (error) {
            console.error("[Application] Error updating form data:", error);
          }
        })();
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }  // Submission handler
  const handleSubmit = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      // Prepare the update payload with only valid columns
      // (using the validColumns array defined above)
      
      // Build a clean payload with only valid columns
      const cleanPayload: Record<string, any> = {};
      
      // Copy only valid fields from formData to cleanPayload
      validColumns.forEach(column => {
        if (formData.hasOwnProperty(column)) {
          cleanPayload[column] = formData[column as keyof FormData];
        }
      });
      
      // Convert height fields to integers
      if (cleanPayload.height_feet) {
        cleanPayload.height_feet = parseInt(cleanPayload.height_feet, 10);
      }
      
      if (cleanPayload.height_inches) {
        cleanPayload.height_inches = parseInt(cleanPayload.height_inches, 10);
      }
      
      // Add required status fields
      cleanPayload.status = "submitted";
      cleanPayload.submitted_at = new Date().toISOString();
      cleanPayload.updated_at = new Date().toISOString();
      
      console.log("[Application] Submitting application with clean payload:", cleanPayload);

      const { error } = await supabase
        .from("passport_applications")
        .update(cleanPayload)
        .eq("id", applicationId);      if (error) {
        console.error("[Application] Submission error:", error);
        toast({
          title: "Submission Error",
          description: `Error: ${error.message || "There was an error submitting your application."}`
        });
      } else {
        // Show success toast
        toast({
          title: 'Application submitted!',
          description: 'You can track your application status or progress anytime from your dashboard.'
        });
        // Redirect after short delay
        setTimeout(() => {
        router.navigate({ to: "/dashboard" });
      }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your application. Please try again.'
      });
    }
    setLoading(false);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Loading application...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl">
        <Card className="bg-white shadow-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
          <CardHeader className={`pb-2 ${isLandscape ? "mb-0" : ""}`} >
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} isCompact={isSmallScreen || isLandscape} />
          </CardHeader>
          <CardContent className={`pt-0 ${isLandscape ? "py-2" : ""}`}>{renderStep()}</CardContent>
          <div
            className={`flex border-t border-gray-100 pt-6 ${currentStep === 1 ? "justify-center" : "justify-between"} ${isLandscape ? "py-2" : ""}`}
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