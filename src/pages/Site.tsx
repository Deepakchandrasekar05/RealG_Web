import React from 'react';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Site: React.FC = () => {
  const navigate = useNavigate();
  const externalSiteUrl = 'https://site-planner-realg.web.app/'; // Replace with your actual site planning URL

  const handleRedirect = () => {
    // Open in new tab with noopener and noreferrer for security
    window.open(externalSiteUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-6">
      <div className="max-w-md w-full bg-[#1E1E1E] rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <ExternalLink size={48} className="text-[#FF0000]" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Smart Site-Safety Planning</h1>
        <p className="mb-6 text-[#888]">
          Click the button below to open our site planning tool in a new tab.
        </p>

        <div className="flex flex-col space-y-4">
          <button
            onClick={handleRedirect}
            className="w-full bg-[#b80202] hover:bg-[#CC0000] text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center"
          >
            <ExternalLink size={18} className="mr-2" />
            Open Site Planner
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full bg-transparent hover:bg-[#2E2E2E] text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 border border-[#888] flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#2E2E2E]">
          <p className="text-sm text-[#888]">
            The site planner will open in a new browser tab.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Site;