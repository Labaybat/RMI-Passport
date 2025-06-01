import type React from "react"
import { useNavigate } from "@tanstack/react-router"
import Button from "./ui/Button"

// Simple icon components using SVG
const CameraIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
)

const XIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
)

const AlertCircleIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

// Alert component
interface AlertProps {
  children: React.ReactNode
  className?: string
}

const Alert: React.FC<AlertProps> = ({ children, className = "" }) => (
  <div className={`rounded-lg border p-4 ${className}`}>{children}</div>
)

const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => <div className={`text-sm ${className}`}>{children}</div>

const PhotoGuideline: React.FC = () => {
  const navigate = useNavigate();

  const rules = [
    "Must be in color, taken within the last 6 months",
    "Plain white background",
    "Neutral facial expression, eyes open",
    "No glasses, hats, or head coverings (unless for religious purposes)",
    "Photo size: 35mm width x 45mm height",
    "JPEG or PNG format only",
    "Maximum file size: 5MB",
  ]

  const goodExamples = [
    "Neutral Expression: Face is relaxed, with a natural, neutral look.",
    "Even Lighting: The face is evenly lit with no shadows or bright spots.",
    "Hair Pulled Back: Hair is tied or brushed away to fully reveal the face.",
    "Plain White Background: A clean, white background with no distractions.",
    "Face Centered & Straight: Head is centered and looking directly at the camera.",
    "No Glasses: No eyewear that could obstruct the eyes or cause glare.",
    "Closed Mouth: Mouth is closed naturally, with no exaggerated expressions.",
  ]

  const badExamples = [
    "Smiling with Teeth: Smiles with teeth are too expressive and not permitted.",
    "Harsh Shadows on Face: Uneven lighting causes dark shadows and unclear features.",
    "Hair Covering Parts of Face: Hair blocks portions of the eyes, cheeks, or forehead.",
    "Patterned or Colored Background: Distracting or non-neutral backgrounds are not allowed.",
    "Face Tilted or Turned: Head is not level or is turned away from the camera.",
    "Wearing Glasses: Eyeglasses may cause glare, shadows, or cover the eyes.",
    "Open Mouth: Mouth is open or mid-speech, which is not acceptable.",
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <div className="container mx-auto px-4 py-8 flex flex-col min-h-[80vh]">
          <div className="mx-auto max-w-3xl w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Passport Photo Guidelines</h1>
              <p className="text-lg text-gray-600">
                Please follow the official RMI passport photo rules to avoid delays in processing.
              </p>
            </div>

            {/* Photo Requirements Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CameraIcon />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Photo Requirements</h2>
              </div>

              <div className="space-y-4 mb-8">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 text-green-600">
                      <CheckCircleIcon />
                    </div>
                    <p className="text-gray-700 leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>

              {/* Helpful Callout */}
              <Alert className="bg-blue-50 border-blue-200 mb-8">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600">
                    <AlertCircleIcon />
                  </div>
                  <AlertDescription className="text-blue-800">
                    <strong>Need help taking your photo?</strong> Visit a local photo service or ask a trusted person to
                    help you follow these steps.
                  </AlertDescription>
                </div>
              </Alert>
            </div>

            {/* Good Photo Examples */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="text-green-600">
                    <CheckCircleIcon />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">✅ GOOD PHOTO Examples</h2>
              </div>

              <div className="space-y-4">
                {goodExamples.map((example, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 text-green-600">
                      <CheckCircleIcon />
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm">{example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bad Photo Examples */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="text-red-600">
                    <XIcon />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">❌ BAD PHOTO Examples</h2>
              </div>

              <div className="space-y-4">
                {badExamples.map((example, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1 text-red-600">
                      <XIcon />
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm">{example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Tips Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Tips</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Lighting</h4>
                  <p className="text-gray-600 text-sm">
                    Use natural lighting or soft, even artificial light. Avoid harsh shadows on your face.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Positioning</h4>
                  <p className="text-gray-600 text-sm">Face the camera directly with your head centered in the frame.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Clothing</h4>
                  <p className="text-gray-600 text-sm">Wear clothing that contrasts with the white background.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Quality</h4>
                  <p className="text-gray-600 text-sm">
                    Ensure the photo is sharp, clear, and in focus with good resolution.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pb-8 pt-4">
              <Button
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all duration-200"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoGuideline
