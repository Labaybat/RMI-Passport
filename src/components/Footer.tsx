import React from 'react';
import { Link } from '@tanstack/react-router';

const Footer: React.FC = () => {
  return (
    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <Link 
            to="/terms-and-conditions" 
            className="hover:text-blue-600 transition-colors duration-200 underline underline-offset-2"
          >
            Terms and Conditions
          </Link>
          <a 
            href="mailto:support@passportservices.gov" 
            className="hover:text-blue-600 transition-colors duration-200"
          >
            Contact Support
          </a>
        </div>
        <p className="text-center sm:text-right">
          © {new Date().getFullYear()} Passport Services. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;