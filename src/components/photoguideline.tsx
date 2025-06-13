import type React from "react"
import { useNavigate } from "@tanstack/react-router"
import Button from "./ui/Button"
import Footer from "./Footer"

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
    "Photo must be 45mm in height and 35mm in width",
    "Recent photograph taken within the last 6 months",
    "Clear, high-quality image with no blur or pixelation",
    "Plain white or off-white background",
    "Head should be centered and facing directly forward",
    "Eyes must be open and clearly visible",
    "Neutral expression with mouth closed",
    "No headwear unless for religious purposes",
    "No glasses unless medically necessary",
    "Good lighting with no shadows on face or background",
    "JPEG or PNG format for digital submissions",
    "Minimum 300 DPI resolution"
  ]
  const goodExamples = [
    "Neutral Expression: Face is relaxed with a natural, neutral look and mouth closed",
    "Even Lighting: Face is evenly lit with no harsh shadows or bright spots",
    "Hair Pulled Back: Hair is arranged to fully reveal the face and forehead",
    "Plain White Background: Clean, white or off-white background with no distractions",
    "Face Centered & Straight: Head is centered and looking directly at the camera",
    "Clear Eyes: Eyes are open, clearly visible, and looking at the camera",
    "Proper Dimensions: Photo meets exact 45mm height x 35mm width specifications",
    "High Quality: Sharp, clear image with good resolution (minimum 300 DPI)"
  ]
  const badExamples = [
    "Smiling or Open Mouth: Smiles with teeth or open mouth expressions are not permitted",
    "Harsh Shadows: Uneven lighting causing dark shadows or unclear facial features",
    "Hair Covering Face: Hair blocking portions of the eyes, cheeks, or forehead",
    "Colored or Patterned Background: Non-white backgrounds or distracting patterns",
    "Tilted or Turned Head: Head not level or turned away from the camera",
    "Wearing Glasses: Eyeglasses may cause glare, reflections, or obstruct the eyes",
    "Blurry or Low Quality: Out of focus, pixelated, or low-resolution images",
    "Wrong Dimensions: Photos that don't meet the 45mm x 35mm size requirements"
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <div className="container mx-auto px-4 py-8 flex flex-col min-h-[80vh]">
          <div className="mx-auto max-w-3xl w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-between">            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Passport Photo Guidelines</h1>
              <p className="text-lg text-gray-600 mb-4">
                Follow these official RMI passport photo requirements to ensure your application is processed without delays.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Photos that don't meet these requirements will cause delays in processing your passport application. 
                  Take time to review all guidelines carefully before taking or submitting your photo.
                </p>
              </div>
            </div>{/* Photo Requirements Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CameraIcon />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Photo Requirements</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">General Requirements</h3>
                  <div className="space-y-3">
                    {rules.map((rule, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-1 text-green-600">
                          <CheckCircleIcon />
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CameraIcon />
                    <h4 className="font-semibold text-amber-900">Photo Specifications</h4>
                  </div>
                  <div className="space-y-2 text-sm text-amber-800">
                    <p><strong>Dimensions:</strong> 45mm (height) x 35mm (width)</p>
                    <p><strong>Resolution:</strong> Minimum 300 DPI</p>
                    <p><strong>Background:</strong> Plain white or off-white</p>
                    <p><strong>File Format:</strong> JPEG or PNG (for digital submissions)</p>
                    <p><strong>Age:</strong> Photo must be taken within last 6 months</p>
                    <p><strong>File Size:</strong> Maximum 5MB</p>
                  </div>
                  <div className="mt-4 p-3 bg-amber-100 rounded border border-amber-300">
                    <p className="text-xs text-amber-900">
                      <strong>Professional Tip:</strong> Many photo studios and pharmacies offer passport photo services that meet these exact specifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Helpful Callout */}
              <Alert className="bg-blue-50 border-blue-200 mb-8">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600">
                    <AlertCircleIcon />
                  </div>
                  <AlertDescription className="text-blue-800">
                    <strong>Need help taking your photo?</strong> Visit a local photo service or ask a trusted person to
                    help you follow these guidelines. Incorrect photos will delay your application processing.
                  </AlertDescription>
                </div>
              </Alert>
            </div>            {/* Good Photo Examples */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="text-green-600">
                    <CheckCircleIcon />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">GOOD PHOTO EXAMPLES</h2>
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
            </div>            {/* Bad Photo Examples */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="text-red-600">
                    <XIcon />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">BAD PHOTO EXAMPLES</h2>
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
            </div>            {/* Additional Tips Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Additional Tips for Perfect Photos</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                      Lighting
                    </h4>
                    <p className="text-green-800 text-sm">
                      Use natural daylight or soft, even artificial light. Avoid direct sunlight, flash, or harsh shadows on your face.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                      Positioning
                    </h4>
                    <p className="text-blue-800 text-sm">
                      Face the camera directly with your head centered and level. Keep your shoulders square to the camera.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                      Clothing & Appearance
                    </h4>
                    <p className="text-purple-800 text-sm">
                      Wear clothing that contrasts with the white background. Avoid white or very light-colored clothing.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
                      Image Quality
                    </h4>
                    <p className="text-orange-800 text-sm">
                      Ensure the photo is sharp, clear, and in focus with good resolution. Check for any blur or pixelation before submitting.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Professional Services Note */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Professional Photography Services</h4>
                <p className="text-gray-700 text-sm">
                  If you're unsure about taking your own photo, consider visiting a professional photography service. 
                  Many pharmacies, photo studios, and postal services offer passport photo services that guarantee 
                  compliance with official requirements.
                </p>
              </div>
            </div>            <div className="flex flex-col sm:flex-row justify-center gap-4 pb-8 pt-4">
              <Button
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all duration-200"
                onClick={() => navigate({ to: "/required-documents" })}
              >
                View All Required Documents
              </Button>
              <Button
                className="px-6 py-3 rounded-xl bg-gray-600 text-white font-semibold shadow-md hover:bg-gray-700 transition-all duration-200"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                Back to Dashboard
              </Button>
            </div>
            
            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoGuideline
