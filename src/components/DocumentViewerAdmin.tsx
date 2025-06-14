import React, { useEffect, useState, useCallback, useRef } from 'react';
import supabase from '../lib/supabase/client';
import { EyeIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

interface DocumentViewerAdminProps {
  formData: any;
  updateFormData: (data: any) => void;
}

interface DocumentField {
  key: string;
  label: string;
}

// File upload component for admin document management
const FileUploadAdmin: React.FC<{
  id: string;
  label: string;
  accept?: string;
  onChange: (file: File | "") => void;
  onClose: () => void;
}> = ({ id, label, accept = "image/jpeg,image/png,application/pdf", onChange, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const validateFileSelection = (file: File): boolean => {
    setFileError(null);
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFileError(`Unsupported file type: ${file.type}. Please upload a JPEG, PNG, or PDF file.`);
      return false;
    }
    
    // Validate file size
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      setFileError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit. Please upload a smaller file.`);
      return false;
    }
    
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (validateFileSelection(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (validateFileSelection(files[0])) {
        setSelectedFile(files[0]);
      }
    }
  };
  
  const handleUpload = () => {
    if (selectedFile) {
      setIsUploading(true);
      onChange(selectedFile);
    }
  };
  
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} bytes`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-800">Upload new {label}</h4>
        <button 
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700"
          type="button"
        >
          Cancel
        </button>
      </div>
      
      <input type="file" id={id} ref={inputRef} accept={accept} onChange={handleChange} className="hidden" />
      
      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-all duration-200 ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={`rounded-full p-2 transition-colors ${isDragOver ? "bg-blue-100" : "bg-gray-100"}`}>
              <svg
                className={`h-4 w-4 transition-colors ${isDragOver ? "text-blue-600" : "text-gray-600"}`}
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
              <p className="text-xs font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              {selectedFile.type.includes('image') ? (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-800 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)} • {selectedFile.type.split('/')[1].toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full"
                title="Remove file"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {!isUploading ? (
            <button
              onClick={handleUpload}
              className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              disabled={!!fileError}
              type="button"
            >
              Upload File
            </button>
          ) : (
            <div className="mt-3 flex justify-center items-center gap-2 py-2 bg-blue-50 rounded-md">
              <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              <p className="text-sm text-blue-600">Uploading...</p>
            </div>
          )}
        </div>
      )}
      
      {fileError && (
        <div className="text-xs text-red-600 mt-1">
          {fileError}
        </div>
      )}
    </div>
  );
};

const DocumentViewerAdmin: React.FC<DocumentViewerAdminProps> = ({ formData, updateFormData }) => {
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string | null }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingDocKey, setDeletingDocKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingUpload, setProcessingUpload] = useState<boolean>(false);
    // Get the current user from context - for admin users, we'll use the application's user ID if available
  const userId = formData?.user_id || 'admin';  // Define document fields based on your database schema
  const documentFields: DocumentField[] = [
    { key: "birth_certificate_url", label: "Birth Certificate" },
    { key: "consent_form_url", label: "Consent Form" },
    { key: "marriage_certificate_url", label: "Marriage/Divorce Certificate" },
    { key: "old_passport_url", label: "Old Passport Copy" },
    { key: "signature_url", label: "Signature" },
    { key: "photo_id_url", label: "Photo ID" },
    { key: "social_security_card_url", label: "Social Security Card" },
    { key: "passport_photo_url", label: "Passport Photo" },
    { key: "relationship_proof_url", label: "Relationship Proof" },
    { key: "parent_guardian_id_url", label: "Parent/Guardian ID" },
    { key: "legal_guardianship_docs_url", label: "Legal Guardianship Documents" },
    { key: "guardian_id_url", label: "Guardian ID" },
    { key: "representative_id_url", label: "Representative ID" },
  ];
  // Document type mapping for upload (updated to match database schema)
  const documentTypeMapping: { [key: string]: string } = {
    "birth_certificate_url": "birth_certificate",
    "consent_form_url": "consent_form",
    "marriage_certificate_url": "marriage_or_divorce_certificate",
    "old_passport_url": "old_passport_copy",
    "signature_url": "signature",
    "photo_id_url": "photo_id",
    "social_security_card_url": "social_security_card",
    "passport_photo_url": "passport_photo",
    "relationship_proof_url": "relationship_proof",
    "parent_guardian_id_url": "parent_guardian_id",
    "legal_guardianship_docs_url": "legal_guardianship_docs",
    "guardian_id_url": "guardian_id",
    "representative_id_url": "representative_id"
  };
  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      return `Unsupported file type. Please upload a JPEG, PNG, or PDF file.`;
    }
    
    if (file.size > maxSizeInBytes) {
      return `File size exceeds 10MB limit. Please upload a smaller file.`;
    }
    
    return null;
  };

  // Helper function to upload file to Supabase Storage
  const uploadDocumentToSupabase = async (file: File, userId: string, docType: string) => {
    // Validate file before upload
    const validationError = validateFile(file);
    if (validationError) throw new Error(validationError);
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${docType}_${Date.now()}.${fileExt}`; // Store directly under userId folder
    
    // Add content type to ensure proper handling of the file
    const { error: uploadError } = await supabase.storage
      .from("passport-documents")
      .upload(filePath, file, { 
        upsert: true,
        contentType: file.type 
      });
      
    if (uploadError) throw uploadError;
    
    const { data: publicUrlData } = supabase.storage.from("passport-documents").getPublicUrl(filePath);
    return publicUrlData?.publicUrl || "";
  };// Handle file upload for a document
  const handleFileUpload = async (key: string, file: File | "") => {
    setUploadError(null);
    if (!file) {
      setUploadingDocKey(null);
      return;
    }
    
    setProcessingUpload(true);
    
    try {
      const docType = documentTypeMapping[key];
      const publicUrl = await uploadDocumentToSupabase(file as File, userId, docType);
      
      // Update form data with the new document URL
      const updatedData = {
        ...formData,
        [key]: publicUrl
      };
      
      updateFormData(updatedData);
      
      // Show success message
      const documentLabel = documentFields.find(doc => doc.key === key)?.label || "Document";
      setSuccessMessage(`${documentLabel} was successfully uploaded`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Clear upload state
      setUploadingDocKey(null);
      
      // Generate new signed URL for the uploaded document
      await generateSignedUrlForDocument(key, publicUrl);
      
    } catch (error: any) {
      console.error("Error uploading document:", error);
      setUploadError(error.message || "Could not upload file");
      setUploadingDocKey(null);
    } finally {
      setProcessingUpload(false);
    }
  };  // Generate signed URL for a specific document
  const generateSignedUrlForDocument = async (key: string, publicUrl: string) => {
    if (!publicUrl || publicUrl.trim() === '') {
      // If the document URL is empty, clear any existing signed URL
      setSignedUrls(prev => ({
        ...prev,
        [key]: null
      }));
      return;
    }
    
    try {
      const match = publicUrl.match(/passport-documents\/(.+)$/);
      const filePath = match ? match[1] : null;
      
      if (filePath) {
        const { data, error } = await supabase.storage
          .from("passport-documents")
          .createSignedUrl(filePath, 3600); // 60 minutes expiry
        
        if (error) {
          console.error(`Error generating signed URL for ${key}:`, error);
          // Set a special error status in signedUrls
          setSignedUrls(prev => ({
            ...prev,
            [key]: 'error'
          }));
          return;
        }
        
        if (data) {
          setSignedUrls(prev => ({
            ...prev,
            [key]: data.signedUrl
          }));
          return data.signedUrl;
        }
      } else {
        console.error(`Invalid file path extracted from URL: ${publicUrl}`);
        // Set a special error status in signedUrls
        setSignedUrls(prev => ({
          ...prev,
          [key]: 'error'
        }));
      }
    } catch (error) {
      console.error(`Error generating signed URL for ${key}:`, error);
      // Set a special error status in signedUrls
      setSignedUrls(prev => ({
        ...prev,
        [key]: 'error'
      }));
    }
  };
  // Generate signed URLs for documents
  const generateSignedUrls = useCallback(async () => {
    if (!formData) return;
    
    // Don't show loading state to the user, just do it in background
    setLoading(true);
      try {
      // Initialize with default state - null for documents that don't exist
      const newUrls: { [key: string]: string | null } = {};
      
      // Reset URLs for all document fields
      documentFields.forEach(doc => {
        const url = formData[doc.key];
        // If no document URL in formData, set to null (no document)
        if (!url || url.trim() === '') {
          newUrls[doc.key] = null;
        }
        // Otherwise, leave undefined to indicate we need to fetch a URL
      });
      
      const urlGenerationPromises = [];
      
      for (const doc of documentFields) {
        const url = formData[doc.key];
        if (url && url.trim() !== "") {
          // Extract the file path from the public URL
          const match = url.match(/passport-documents\/(.+)$/);
          const filePath = match ? match[1] : null;
          
          if (filePath) {
            // Create a promise for each URL generation
            const urlPromise = (async () => {
              try {
                const { data, error } = await supabase.storage
                  .from("passport-documents")
                  .createSignedUrl(filePath, 3600); // 60 minutes expiry
                
                if (error) {
                  console.error(`Error generating signed URL for ${doc.label}:`, error);
                  return { key: doc.key, url: 'error' };
                }
                
                if (data) {
                  return { key: doc.key, url: data.signedUrl };
                }
                
                return { key: doc.key, url: 'error' };
              } catch (urlError) {
                console.error(`Exception generating signed URL for ${doc.label}:`, urlError);
                return { key: doc.key, url: 'error' };
              }
            })();
            
            urlGenerationPromises.push(urlPromise);
          } else {
            // Invalid URL format
            newUrls[doc.key] = 'error';
          }
        }
      }
      
      // Wait for all URL generations to complete in parallel
      const results = await Promise.all(urlGenerationPromises);
      
      // Update the URLs object with results
      results.forEach(result => {
        if (result) {
          newUrls[result.key] = result.url;
        }
      });
      
      // Update the URLs we have
      setSignedUrls(newUrls);
      
    } catch (err) {
      console.error("Error generating signed URLs:", err);
    } finally {
      setLoading(false);
    }  }, [formData, documentFields]);
  
  // Set up a recurring timer to refresh URLs every 45 minutes to prevent expiry
  useEffect(() => {
    if (!formData) return;
    
    // Initial URL generation
    generateSignedUrls();
    
    // Set up background refresh every 45 minutes (3/4 of the 60 minute expiry)
    const refreshInterval = setInterval(() => {
      generateSignedUrls();
    }, 45 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [formData]); // Only depend on formData to avoid infinite loops
    // Function to handle document deletion
  const handleDeleteDocument = async (key: string) => {
    if (!formData || !formData[key]) return;
    
    // Ask for confirmation
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Set which document is being deleted for UI feedback
      setDeletingDocKey(key);
      
      const url = formData[key];
      const match = url.match(/passport-documents\/(.+)$/);
      const filePath = match ? match[1] : null;
      
      if (!filePath) {
        throw new Error("Could not extract file path from document URL");
      }
      
      // Delete the file from storage
      const { error } = await supabase.storage
        .from("passport-documents")
        .remove([filePath]);
        
      if (error) {
        console.error("Supabase storage error:", error);
        throw new Error(`Failed to delete file from storage: ${error.message}`);
      }
        // Update the formData to remove the document URL
      const updatedData = {
        ...formData,
        [key]: ""
      };
      
      // Clear the signed URL immediately for this document
      setSignedUrls(prev => ({
        ...prev,
        [key]: null
      }));
      
      // Update the form data
      updateFormData(updatedData);
      
      // Clear any error states
      setUploadError(null);
      
      // Show success message and clear it after 3 seconds
      const documentLabel = documentFields.find(doc => doc.key === key)?.label || "Document";
      setSuccessMessage(`${documentLabel} was successfully deleted and will remain visible for future uploads`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Clear deletion state
      setDeletingDocKey(null);
      
    } catch (err: any) {
      console.error("Error deleting document:", err);
      
      // Show user-friendly error message
      const documentLabel = documentFields.find(doc => doc.key === key)?.label || "Document";
      setUploadError(`Failed to delete ${documentLabel}: ${err.message || "Unknown error occurred"}`);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadError(null);
      }, 5000);
      
      // Clear deletion state
      setDeletingDocKey(null);
    }
  };
  // Count available documents
  const getDocumentCount = () => {
    return documentFields.filter(doc => formData && formData[doc.key] && formData[doc.key].trim() !== '').length;
  };return (
    <div className="space-y-4 relative">
      {/* Global loading overlay */}
      {processingUpload && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <p className="font-medium text-blue-700">Processing document...</p>
          </div>
        </div>
      )}
        <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-900">Application Documents</h3>
        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {getDocumentCount()} document{getDocumentCount() !== 1 ? 's' : ''} uploaded
        </span>
      </div>{successMessage && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
          {successMessage}
        </div>
      )}

      {uploadError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          {uploadError}
        </div>
      )}<div className="grid grid-cols-1 gap-2">
        {/* Document replacements - show when a document is deleted but not yet replaced */}
        {documentFields.map(doc => {
          if (uploadingDocKey === doc.key) {
            return (
              <div key={`upload-${doc.key}`} className="p-3 bg-white border rounded-lg shadow-sm">
                <FileUploadAdmin
                  id={`upload-${doc.key}`}
                  label={doc.label}
                  onChange={(file) => handleFileUpload(doc.key, file)}
                  onClose={() => setUploadingDocKey(null)}
                />
                {uploadError && (
                  <div className="mt-2 text-xs text-red-600">
                    Error: {uploadError}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}        {/* All documents - always visible with status indicators */}
        {documentFields.map(doc => {
          const url = signedUrls[doc.key];
          // A document exists if it has a non-empty URL in formData
          const hasDocument = formData && formData[doc.key] && formData[doc.key].trim() !== '';
          
          // Don't show this document if it's currently being replaced
          if (uploadingDocKey === doc.key) return null;
          
          return (
            <div 
              key={doc.key} 
              className={`flex items-center justify-between p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                deletingDocKey === doc.key ? 'opacity-50' : ''
              } ${
                hasDocument ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasDocument ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {hasDocument ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <span className={`font-medium ${hasDocument ? 'text-gray-900' : 'text-gray-500'}`}>
                    {doc.label}
                  </span>
                  <span className={`text-xs block ${hasDocument ? 'text-green-600' : 'text-gray-400'}`}>
                    {hasDocument ? 
                      `Uploaded: ${new Date(
                        parseInt(formData[doc.key]?.match(/_(\d+)\./)?.[1] || Date.now())
                      ).toLocaleDateString()}` : 
                      'Not uploaded'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {hasDocument ? (
                  // Document exists - show actions based on signed URL status
                  url && url !== 'error' ? (
                    // Signed URL available - show view/download/delete
                    <>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1.5 hover:bg-blue-100 rounded transition-colors" 
                        title={`View ${doc.label}`}
                      >
                        <EyeIcon className="w-4 h-4 text-blue-600" />
                      </a>
                      <a 
                        href={url} 
                        download 
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors" 
                        title={`Download ${doc.label}`}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                        </svg>
                      </a>
                      <button 
                        onClick={() => handleDeleteDocument(doc.key)}
                        className={`p-1.5 rounded transition-colors ${
                          deletingDocKey === doc.key 
                            ? 'bg-red-200 cursor-not-allowed' 
                            : 'hover:bg-red-100'
                        }`}
                        title={`Delete ${doc.label}`}
                        type="button"
                        disabled={deletingDocKey === doc.key || processingUpload}
                      >
                        {deletingDocKey === doc.key ? (
                          <div className="w-4 h-4 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4 text-red-600" />
                        )}
                      </button>
                    </>
                  ) : url === 'error' ? (
                    // Error loading signed URL - show error and delete option
                    <>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs text-amber-700">Error loading</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteDocument(doc.key)}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        title={`Delete ${doc.label}`}
                        type="button"
                        disabled={deletingDocKey === doc.key}
                      >
                        <TrashIcon className="w-4 h-4 text-red-600" />
                      </button>
                    </>
                  ) : (
                    // Document exists but signed URL is still loading
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 rounded-full bg-blue-200 animate-pulse"></div>
                      <span className="text-xs text-gray-500">Loading...</span>
                    </div>
                  )
                ) : (
                  // No document - show upload button
                  <button
                    onClick={() => setUploadingDocKey(doc.key)}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    disabled={uploadingDocKey !== null || processingUpload}
                    type="button"
                  >
                    Upload
                  </button>
                )}
              </div>
            </div>
          );        })}</div>
      
      {/* Button to refresh URLs if documents appear but cannot be accessed */}
      <div className="mt-4 flex justify-center">
        <button 
          onClick={() => generateSignedUrls()}
          className="flex items-center text-sm gap-2 px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          type="button"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh document access
        </button>
      </div>
    </div>
  );
};

export default DocumentViewerAdmin;
