'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { DocumentPreviewModal } from '@/components/student/DocumentPreviewModal';

interface DocumentPreviewButtonProps {
  documentUrl: string;
  documentName: string;
}

export function DocumentPreviewButton({ documentUrl, documentName }: DocumentPreviewButtonProps) {
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    documentUrl: string;
    documentName: string;
  }>({
    isOpen: false,
    documentUrl: '',
    documentName: ''
  });

  const handlePreviewDocument = () => {
    setPreviewModal({
      isOpen: true,
      documentUrl,
      documentName
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      documentUrl: '',
      documentName: ''
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviewDocument}
      >
        <Eye className="h-3 w-3 mr-1" />
        Preview
      </Button>

      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreviewModal}
        documentUrl={previewModal.documentUrl}
        documentName={previewModal.documentName}
      />
    </>
  );
}