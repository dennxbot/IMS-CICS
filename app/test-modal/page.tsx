'use client';

import { useState } from 'react';
import { DocumentPreviewModal } from '@/components/student/DocumentPreviewModal';
import { Button } from '@/components/ui/button';

export default function TestModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');

  const testFiles = [
    {
      name: 'Sample Image.jpg',
      url: 'https://via.placeholder.com/1200x800/4F46E5/FFFFFF?text=Sample+Image',
      type: 'Image'
    },
    {
      name: 'Sample PDF.pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'PDF'
    },
    {
      name: 'Sample Word.docx',
      url: 'https://calibre-ebook.com/downloads/demos/demo.docx',
      type: 'Word'
    }
  ];

  const handleTestFile = (file: typeof testFiles[0]) => {
    setSelectedFile(file.name);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Document Preview Modal Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Different File Types
          </h2>
          <p className="text-gray-600 mb-6">
            Click the buttons below to test the preview modal with different file types. 
            The modal will open with responsive sizing optimized for 80% readability.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testFiles.map((file) => (
              <div key={file.name} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{file.type} File</h3>
                <p className="text-sm text-gray-600 mb-3">{file.name}</p>
                <Button 
                  onClick={() => handleTestFile(file)}
                  variant="outline" 
                  className="w-full"
                >
                  Preview {file.type}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Responsive Testing Instructions
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>• <strong>Mobile:</strong> The modal will take 95% of viewport width and height</p>
            <p>• <strong>Tablet:</strong> The modal will take 90% of viewport width and height</p>
            <p>• <strong>Desktop:</strong> The modal will take 80% of viewport width and height</p>
            <p>• <strong>Content Scaling:</strong> Images and documents will scale to 80% of modal size for optimal readability</p>
            <p>• <strong>Word Documents:</strong> Uses Microsoft Office Online Viewer for native rendering</p>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documentUrl={testFiles.find(f => f.name === selectedFile)?.url || ''}
        documentName={selectedFile}
      />
    </div>
  );
}