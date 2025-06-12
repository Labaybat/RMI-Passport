import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl p-4 sm:p-6 md:p-8 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border-0">
        
        {/* Header Section */}
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-100 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
              <img src="/seal.png" alt="Official Seal" className="h-8 w-8 sm:h-12 sm:w-12 object-contain" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Terms and Conditions</h1>
              <p className="text-xs sm:text-sm text-gray-500">Government Portal Terms of Service</p>
            </div>
          </div>
            <button
            onClick={() => window.history.back()}
            className="group relative flex h-10 sm:h-12 items-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 px-3 sm:px-4 shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
            <div className="mr-2 flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition-all duration-300 group-hover:bg-blue-200 group-hover:text-blue-700">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
              Back
            </span>
          </button>
        </div>

        {/* Terms Content */}
        <div className="space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto pr-2">
          
          <section className="bg-blue-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              By accessing and using this passport application system, you accept and agree to be bound by the terms and provisions of this agreement. 
              If you do not agree to abide by the above, please do not use this service. These terms apply to all users of the system.
            </p>
          </section>

          <section className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">2. Use License & Security</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
              Permission is granted to temporarily access and use this system for personal, non-commercial passport application purposes only. 
              This license does not include the right to:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 ml-4 space-y-2">
              <li>Modify or copy the system materials</li>
              <li>Use the service for any commercial purpose or public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations</li>
              <li>Share your account credentials with unauthorized persons</li>
            </ul>
          </section>

          <section className="bg-amber-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">3. User Account Responsibilities</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. 
              You agree to:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 ml-4 space-y-2">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Keep your login credentials secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Use the service only for lawful passport application purposes</li>
              <li>Update your information promptly when changes occur</li>
            </ul>
          </section>

          <section className="bg-indigo-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">4. Privacy and Data Protection</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
              We are committed to protecting your privacy and personal information. The personal data you provide will be:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 ml-4 space-y-2">
              <li>Used solely for processing your passport application</li>
              <li>Protected using industry-standard security measures</li>
              <li>Not shared with third parties without your explicit consent, except as required by law</li>
              <li>Retained only for as long as necessary to fulfill the stated purposes</li>
              <li>Subject to government data protection regulations</li>
            </ul>
          </section>

          <section className="bg-rose-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">5. Application Process & Accuracy</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
              By submitting a passport application through this system, you acknowledge that:
            </p>
            <ul className="list-disc list-inside text-sm sm:text-base text-gray-700 ml-4 space-y-2">
              <li>All information provided is accurate and truthful to the best of your knowledge</li>
              <li>False information may result in application rejection or legal consequences</li>
              <li>Processing times may vary based on application complexity and volume</li>
              <li>Additional documentation may be requested during the review process</li>
              <li>Fees paid are non-refundable except in specific circumstances</li>
            </ul>
          </section>

          <section className="bg-purple-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">6. Limitation of Liability</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              In no event shall the passport services or its suppliers be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use 
              the materials on this system. Because some jurisdictions do not allow limitations on implied warranties, or 
              limitations of liability for consequential or incidental damages, these limitations may not apply to you.
            </p>
          </section>

          <section className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-200 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">7. Modifications & Updates</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              We may revise these terms of service at any time without notice. By using this system, 
              you are agreeing to be bound by the then current version of these terms of service. 
              Material changes will be posted with reasonable advance notice when possible.
            </p>
          </section>

          <section className="bg-teal-50 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">8. Contact Information</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="bg-white p-4 rounded-lg border border-teal-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Email Support</p>
                  <p className="text-teal-600">support@passportservices.gov</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Phone Support</p>
                  <p className="text-teal-600">+1 (555) 123-4567</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-medium text-gray-900 mb-1">Mailing Address</p>
                  <p className="text-gray-700">123 Government Plaza, Capital City, State 12345</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()} | © {new Date().getFullYear()} Passport Services. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;