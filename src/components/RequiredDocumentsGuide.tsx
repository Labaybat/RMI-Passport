import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Footer from './Footer';
import { 
  DocumentTextIcon, 
  IdentificationIcon, 
  PhotoIcon,
  UserGroupIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

// Type definitions
interface Document {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  required: boolean;
  note?: string;
}

interface DocumentCategory {
  title: string;
  description: string;
  documents: Document[];
}

interface DocumentCategories {
  myself: DocumentCategory;
  child: DocumentCategory;
  guardianship: DocumentCategory;
  others: DocumentCategory;
}

const RequiredDocumentsGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<keyof DocumentCategories>('myself');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    photoGuidelines: false,
    additionalInfo: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const documentCategories: DocumentCategories = {
    myself: {
      title: "Applying for Yourself",
      description: "Documents required when applying for your own passport",
      documents: [
        {
          name: "Birth certificate",
          icon: DocumentTextIcon,
          description: "Official birth certificate issued by the government",
          required: true
        },
        {
          name: "Photo identification",
          icon: IdentificationIcon,
          description: "Valid driver's license, state ID, or other government-issued photo ID",
          required: true
        },
        {
          name: "Passport photo (45mm height x 35mm width)",
          icon: PhotoIcon,
          description: "Recent passport-style photograph meeting RMI specifications",
          required: true
        },
        {
          name: "Copy of social security card",
          icon: DocumentTextIcon,
          description: "Clear copy of your social security card",
          required: true
        },
        {
          name: "Consent form",
          icon: DocumentTextIcon,
          description: "Completed passport application consent form",
          required: true
        }
      ]
    },
    child: {
      title: "Applying for Your Child",
      description: "Documents required when applying for your child's passport",
      documents: [
        {
          name: "Your child's birth certificate",
          icon: DocumentTextIcon,
          description: "Official birth certificate of the child",
          required: true
        },
        {
          name: "Your child's photo identification",
          icon: IdentificationIcon,
          description: "Valid photo ID (if available for first-time applications)",
          required: true,
          note: "(if available for first-time applications)"
        },
        {
          name: "Passport photo (45mm height x 35mm width)",
          icon: PhotoIcon,
          description: "Recent passport-style photograph of the child",
          required: true
        },
        {
          name: "Copy of your child's social security card",
          icon: DocumentTextIcon,
          description: "Clear copy of the child's social security card",
          required: true
        },
        {
          name: "Parental consent form",
          icon: DocumentTextIcon,
          description: "Completed parental consent form",
          required: true
        },
        {
          name: "Parent identification",
          icon: IdentificationIcon,
          description: "Valid photo ID of the parent/guardian applying",
          required: true
        }
      ]
    },
    guardianship: {
      title: "Legal Guardianship",
      description: "Documents required when applying for someone under your legal guardianship",
      documents: [
        {
          name: "Birth certificate",
          icon: DocumentTextIcon,
          description: "Official birth certificate of the applicant",
          required: true
        },
        {
          name: "Photo identification",
          icon: IdentificationIcon,
          description: "Valid photo ID of the applicant",
          required: true
        },
        {
          name: "Passport photo (45mm height x 35mm width)",
          icon: PhotoIcon,
          description: "Recent passport-style photograph of the applicant",
          required: true
        },
        {
          name: "Legal guardianship documents",
          icon: DocumentTextIcon,
          description: "Court-issued legal guardianship papers",
          required: true
        },
        {
          name: "Guardian identification",
          icon: IdentificationIcon,
          description: "Valid photo ID of the legal guardian",
          required: true
        },
        {
          name: "Copy of birth certificate",
          icon: DocumentTextIcon,
          description: "Additional copy of the applicant's birth certificate",
          required: true
        }
      ]
    },
    others: {
      title: "Other Relationships",
      description: "Documents required when applying for someone else (spouse, sibling, etc.)",
      documents: [
        {
          name: "Birth certificate",
          icon: DocumentTextIcon,
          description: "Official birth certificate of the applicant",
          required: true
        },
        {
          name: "Photo identification",
          icon: IdentificationIcon,
          description: "Valid photo ID of the applicant",
          required: true
        },
        {
          name: "Passport photo (45mm height x 35mm width)",
          icon: PhotoIcon,
          description: "Recent passport-style photograph of the applicant",
          required: true
        },
        {
          name: "Proof of relationship or authorization",
          icon: DocumentTextIcon,
          description: "Documentation proving your relationship or authorization to apply",
          required: true
        },
        {
          name: "Your identification",
          icon: IdentificationIcon,
          description: "Valid photo ID of the person submitting the application",
          required: true
        },
        {
          name: "Copy of birth certificate",
          icon: DocumentTextIcon,
          description: "Additional copy of the applicant's birth certificate",
          required: true
        }
      ]
    }
  };

  const photoGuidelines = [
    "Photo must be 45mm in height and 35mm in width",
    "Recent photograph taken within the last 6 months",
    "Clear, high-quality image with no blur or pixelation",
    "Plain white or off-white background",
    "Head should be centered and facing directly forward",
    "Eyes must be open and clearly visible",
    "Neutral expression with mouth closed",
    "No headwear unless for religious purposes",
    "No glasses unless medically necessary",
    "Good lighting with no shadows on face or background"
  ];
  const additionalNotes = [
    "All documents must be original or certified copies",
    "Documents in foreign languages must be translated by a certified translator",
    "Previous RMI passport should be included if available",
    "Additional documents may be requested during the review process",
    "For minors under 18, parental consent is required according to Section 133-134 of the Passport Act",
    "Processing times may vary based on document completeness and completeness of application"
  ];return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <div className="container mx-auto px-4 py-8 flex flex-col min-h-[80vh]">
          <div className="mx-auto max-w-3xl w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white -mx-4 sm:-mx-6 md:-mx-8 -mt-4 sm:-mt-6 md:-mt-8 mb-8 rounded-t-2xl sm:rounded-t-3xl">
              <div className="px-4 sm:px-6 md:px-8 py-12">
                <div className="text-center">
                  <DocumentTextIcon className="w-16 h-16 mx-auto mb-4" />
                  <h1 className="text-4xl font-bold mb-4">Required Documents Guide</h1>
                  <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                    Complete guide to all documents required for your Republic of Marshall Islands passport application
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              {/* Category Selection */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                    <UserGroupIcon className="w-8 h-8 text-blue-600" />
                    Select Application Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">              {Object.entries(documentCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as keyof DocumentCategories)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    activeSection === key
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <h3 className={`font-semibold text-lg mb-2 ${
                    activeSection === key ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {category.title}
                  </h3>
                  <p className={`text-sm ${
                    activeSection === key ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {category.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Requirements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">
              Required Documents: {documentCategories[activeSection].title}
            </CardTitle>
            <p className="text-gray-600">{documentCategories[activeSection].description}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentCategories[activeSection].documents.map((doc, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <doc.icon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      {doc.note && (
                        <span className="text-sm text-blue-600 font-medium">{doc.note}</span>
                      )}
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-gray-600 text-sm">{doc.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Important Note</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Additional documents may be requested during the review process based on your specific circumstances.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Guidelines */}
        <Card className="mb-8">
          <CardHeader>
            <button
              onClick={() => toggleSection('photoGuidelines')}
              className="w-full flex items-center justify-between text-left"
            >
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <PhotoIcon className="w-8 h-8 text-blue-600" />
                Passport Photo Guidelines
              </CardTitle>
              {expandedSections.photoGuidelines ? (
                <ChevronUpIcon className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-6 h-6 text-gray-500" />
              )}
            </button>
          </CardHeader>
          {expandedSections.photoGuidelines && (
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">Photo Requirements</h3>
                  <div className="space-y-3">
                    {photoGuidelines.map((guideline, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{guideline}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <PhotoIcon className="w-6 h-6 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Photo Specifications</h4>
                  </div>
                  <div className="space-y-2 text-sm text-amber-800">
                    <p><strong>Dimensions:</strong> 45mm (height) x 35mm (width)</p>
                    <p><strong>Resolution:</strong> Minimum 300 DPI</p>
                    <p><strong>Background:</strong> Plain white or off-white</p>
                    <p><strong>File Format:</strong> JPEG or PNG (for digital submissions)</p>
                    <p><strong>Age:</strong> Photo must be taken within last 6 months</p>
                  </div>
                  <div className="mt-4 p-3 bg-amber-100 rounded border border-amber-300">
                    <p className="text-xs text-amber-900">
                      <strong>Tip:</strong> Many photo studios and pharmacies offer passport photo services that meet these specifications.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <button
              onClick={() => toggleSection('additionalInfo')}
              className="w-full flex items-center justify-between text-left"
            >
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <InformationCircleIcon className="w-8 h-8 text-blue-600" />
                Additional Information
              </CardTitle>
              {expandedSections.additionalInfo ? (
                <ChevronUpIcon className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronDownIcon className="w-6 h-6 text-gray-500" />
              )}
            </button>
          </CardHeader>
          {expandedSections.additionalInfo && (
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">Important Notes</h3>
                  <div className="space-y-3">
                    {additionalNotes.map((note, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Document Checklist</h4>
                    <p className="text-sm text-green-800">
                      Before submitting your application, ensure all required documents are complete, legible, and meet the specified requirements.
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">Processing Time</h4>
                    <p className="text-sm text-yellow-800">
                      Complete applications with all required documents typically process faster. Missing documents may cause delays.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                    <p className="text-sm text-blue-800">
                      If you have questions about document requirements, contact the passport office for assistance.
                    </p>
                  </div>                </div>
              </div>
            </CardContent>
          )}
        </Card>
            </div>
            
            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequiredDocumentsGuide;
