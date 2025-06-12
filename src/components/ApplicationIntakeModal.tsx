import React, { useState } from 'react';
import Button from './ui/Button';
import { X, FileText, AlertCircle } from 'lucide-react';
import supabase from '../lib/supabase/client';

interface ApplicationIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (intakeData: ApplicationIntakeData) => void;
}

export interface ApplicationIntakeData {
  applicantRelationship: 'myself' | 'child' | 'guardianship' | 'others';
  specificRelationship?: string;
  applicantAge: number;
  currentLocation: string;
  hasPreviousRmiPassport: boolean;
  previousPassportDetails?: string;
}

const ApplicationIntakeModal: React.FC<ApplicationIntakeModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [currentStep, setCurrentStep] = useState(1);  const [formData, setFormData] = useState<ApplicationIntakeData>({
    applicantRelationship: 'myself',
    specificRelationship: '',
    applicantAge: 18,
    currentLocation: '',
    hasPreviousRmiPassport: false,
    previousPassportDetails: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Check if specific relationship is required and provided
        if ((formData.applicantRelationship === 'guardianship' || formData.applicantRelationship === 'others') && 
            !formData.specificRelationship?.trim()) {
          newErrors.specificRelationship = formData.applicantRelationship === 'guardianship' 
            ? 'Please specify your relationship to this person'
            : 'Please specify your relationship to the applicant';
        }
        break;case 2:
        if (!formData.applicantAge || formData.applicantAge < 1) {
          newErrors.applicantAge = 'Please enter a valid age';
        } else if (formData.applicantRelationship === 'child' && formData.applicantAge > 17) {
          newErrors.applicantAge = 'Children must be 17 years old or younger. Adults 18+ can apply for themselves.';
        } else if (formData.applicantRelationship === 'myself' && formData.applicantAge < 18) {
          newErrors.applicantAge = 'According to Marshall Islands Passport Act Section 133-134, minors under 18 cannot apply for themselves. A parent or legal guardian must apply on your behalf.';
        } else if (formData.applicantAge > 120) {
          newErrors.applicantAge = 'Please enter a valid age';
        }
        break;
      case 3:
        if (!formData.currentLocation.trim()) {
          newErrors.currentLocation = 'Please enter your current location';
        }
        break;
      case 4:
        // Previous passport is always selected (radio buttons)
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Save intake data to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {        const { error } = await supabase
          .from('application_intake')
          .insert({
            user_id: user.id,
            applicant_relationship: formData.applicantRelationship,
            specific_relationship: formData.specificRelationship || null,
            applicant_age: formData.applicantAge,
            current_location: formData.currentLocation,
            has_previous_rmi_passport: formData.hasPreviousRmiPassport,
            previous_passport_details: formData.previousPassportDetails || null,
            status: 'pending',
          });

        if (error) {
          console.error('Error saving intake data:', error);
        }
      }

      onContinue(formData);
    } catch (error) {
      console.error('Error submitting intake form:', error);
    }
  };
  const getRelationshipText = () => {
    switch (formData.applicantRelationship) {
      case 'myself': return 'your';
      case 'child': return 'your child\'s';
      case 'guardianship': return 'their';
      case 'others': return 'their';
      default: return 'the applicant\'s';
    }
  };
  const getPreviousPassportText = () => {
    switch (formData.applicantRelationship) {
      case 'myself': return {
        yes: 'Yes, I have/had an RMI passport',
        no: 'No, this is my first RMI passport',
        unsure: 'Not sure/I don\'t remember'
      };
      case 'child': return {
        yes: 'Yes, my child has/had an RMI passport',
        no: 'No, this is my child\'s first RMI passport',
        unsure: 'Not sure/I don\'t remember'
      };
      case 'guardianship': return {
        yes: 'Yes, they have/had an RMI passport',
        no: 'No, this is their first RMI passport',
        unsure: 'Not sure/I don\'t remember'
      };
      case 'others': return {
        yes: 'Yes, they have/had an RMI passport',
        no: 'No, this is their first RMI passport',
        unsure: 'Not sure/I don\'t remember'
      };
      default: return {
        yes: 'Yes',
        no: 'No',
        unsure: 'Not sure'
      };
    }
  };const getRequiredDocuments = () => {
    const baseDocuments = [
      'Birth certificate',
      'Photo identification',
      'Passport photo (2x2 inches, white background)',
    ];

    // Add additional documents based on responses
    if (formData.applicantRelationship === 'child') {
      baseDocuments.push('Parental consent form', 'Parent/guardian identification');
    }
      if (formData.applicantRelationship === 'guardianship') {
      baseDocuments.push('Legal guardianship documents', 'Guardian identification');
    }
    
    if (formData.applicantRelationship === 'others') {
      baseDocuments.push('Proof of relationship or authorization', 'Your identification');
    }

    if (formData.hasPreviousRmiPassport) {
      baseDocuments.push('Previous RMI passport (if available)');
    }

    if (formData.applicantAge < 16) {
      baseDocuments.push('Both parents\' identification or consent');
    }

    return baseDocuments;
  };

  return (    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Start New Application</h2>
              <p className="text-sm text-gray-600">Step {currentStep} of 5</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>        {/* Step Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    step === currentStep
                      ? 'bg-blue-600 scale-125'
                      : step < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                />
                {step < 5 && (
                  <div className={`w-8 h-0.5 mx-1 ${step < currentStep ? 'bg-blue-300' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>{/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Step 1: Who are you applying for? */}          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Who are you applying for?</h3>
              <div className="space-y-3">
                {[
                  { value: 'myself', label: 'Myself' },
                  { value: 'child', label: 'My child' },
                  { value: 'guardianship', label: 'Someone I have legal guardianship for' },
                  { value: 'others', label: 'Others' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="applicantRelationship"
                      value={option.value}
                      checked={formData.applicantRelationship === option.value}
                      onChange={(e) => setFormData({ ...formData, applicantRelationship: e.target.value as any })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
              
              {/* Conditional relationship specification field */}
              {(formData.applicantRelationship === 'guardianship' || formData.applicantRelationship === 'others') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.applicantRelationship === 'guardianship' 
                      ? 'What is your relationship to this person?' 
                      : 'What is your relationship to the applicant?'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.specificRelationship || ''}
                    onChange={(e) => setFormData({ ...formData, specificRelationship: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    placeholder={formData.applicantRelationship === 'guardianship' 
                      ? 'e.g., Grandparent, Uncle, Aunt, Family friend with legal guardianship' 
                      : 'e.g., Spouse, Sibling, Parent, Grandparent, Friend'}
                  />
                  {errors.specificRelationship && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.specificRelationship}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Age */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                What is {getRelationshipText()} age?
              </h3>
              <div>                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.applicantAge}
                  onChange={(e) => setFormData({ ...formData, applicantAge: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter age"
                />
                {errors.applicantAge && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.applicantAge}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Current Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Where are you currently living?</h3>              <div>
                <input
                  type="text"
                  value={formData.currentLocation}
                  onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter your current location (e.g., Majuro, Marshall Islands)"
                />
                {errors.currentLocation && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.currentLocation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Previous RMI Passport */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Previous RMI passport history</h3>
              <div className="space-y-3">
                {[
                  { value: true, label: getPreviousPassportText().yes },
                  { value: false, label: getPreviousPassportText().no },
                ].map((option) => (
                  <label key={option.value.toString()} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="hasPreviousRmiPassport"
                      value={option.value.toString()}
                      checked={formData.hasPreviousRmiPassport === option.value}
                      onChange={(e) => setFormData({ ...formData, hasPreviousRmiPassport: e.target.value === 'true' })}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
              {formData.hasPreviousRmiPassport && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional details (optional)
                  </label>                  <textarea
                    value={formData.previousPassportDetails}
                    onChange={(e) => setFormData({ ...formData, previousPassportDetails: e.target.value })}
                    placeholder="e.g., passport number, expiration date, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Required Documents */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">📋 Required Documents</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-3">
                  You must have all these documents ready before proceeding:
                </p>
                <ul className="space-y-2">
                  {getRequiredDocuments().map((doc, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-blue-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  📸 Need help with passport photos? View our{' '}
                  <button className="underline font-medium hover:text-amber-900">
                    photo guidelines
                  </button>{' '}
                  for detailed requirements.
                </p>
              </div>
            </div>
          )}
        </div>        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0"><Button
            variant="ghost"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-6"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={handleNext}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === 5 ? 'Continue to Application' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationIntakeModal;
