'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  documentUrl,
  documentName
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [wordPreviewError, setWordPreviewError] = useState(false);

  // Reset error state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setWordPreviewError(false);
    }
  }, [isOpen]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(documentUrl, '_blank');
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isImage = (filename: string) => {
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  };

  const isPdf = (filename: string) => {
    const ext = getFileExtension(filename);
    return ext === 'pdf';
  };

  const isWordDocument = (filename: string) => {
    const ext = getFileExtension(filename);
    return ['doc', 'docx'].includes(ext);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] sm:max-w-[90vw] sm:max-h-[90vh] sm:w-[90vw] sm:h-[90vh] md:max-w-[85vw] md:max-h-[85vh] md:w-[85vw] md:h-[85vh] lg:max-w-[80vw] lg:max-h-[80vh] lg:w-[80vw] lg:h-[80vh] flex flex-col p-0 sm:p-4 md:p-6">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Preview: {documentName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-4 sm:px-6">
          {isImage(documentName) ? (
            <div className="relative w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="relative w-[80%] h-[80%]">
                <Image
                  src={documentUrl}
                  alt={documentName}
                  className="rounded-lg shadow-lg"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                  loading="lazy"
                  fill
                  sizes="(max-width: 640px) 95vw, (max-width: 768px) 90vw, (max-width: 1024px) 85vw, 80vw"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-gray-500">Loading image...</div>
                </div>
              )}
            </div>
          ) : isPdf(documentName) ? (
            <div className="relative w-full h-full bg-white rounded-lg border border-gray-200">
              <iframe
                src={documentUrl}
                className="w-full h-full rounded-lg"
                title={documentName}
                onLoad={() => setIsLoading(false)}
                style={{ minHeight: '600px' }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-gray-500">Loading PDF...</div>
                </div>
              )}
            </div>
          ) : isWordDocument(documentName) ? (
            <div className="relative w-full h-full bg-white rounded-lg border border-gray-200">
              {!wordPreviewError ? (
                <>
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`}
                    className="w-full h-full rounded-lg"
                    title={documentName}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setWordPreviewError(true);
                      setIsLoading(false);
                    }}
                    style={{ minHeight: '600px' }}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                        <div className="text-gray-600">Loading Word document...</div>
                        <div className="text-sm text-gray-500 mt-2">
                          Powered by Microsoft Office Online
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
                  <FileText className="h-16 w-16 text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Word Document Preview
                  </h3>
                  <p className="text-gray-600 text-center mb-4">
                    This Word document ({documentName}) cannot be previewed online.
                  </p>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    This may be due to document privacy settings or network restrictions.
                  </p>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                File Preview
              </h3>
              <p className="text-gray-600 text-center mb-2">
                {documentName}
              </p>
              <p className="text-gray-500 text-sm text-center mb-6">
                This file type cannot be previewed directly in the browser.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t px-4 sm:px-6">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}