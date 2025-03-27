// src/components/ResourceAnalysis.jsx
import { useState } from 'react';
import { icp_resource_sharing_backend as backend } from '../../../declarations/icp-resource-sharing-backend';

const ResourceAnalysis = ({ resourceId }) => {
  const [userNeeds, setUserNeeds] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!userNeeds.trim()) return;
    
    setLoading(true);
    try {
      const result = await backend.getResourceMatchAnalysis(resourceId, userNeeds);
      setAnalysis(result);
    } catch (error) {
      console.error("Error getting analysis:", error);
      setAnalysis("Failed to get AI analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resource-analysis">
      <h3>Get AI Analysis</h3>
      <div className="analysis-form">
        <textarea
          placeholder="Describe your specific needs in detail..."
          value={userNeeds}
          onChange={(e) => setUserNeeds(e.target.value)}
        />
        <button 
          onClick={handleAnalyze} 
          disabled={loading || !userNeeds.trim()}
          className="analyze-button"
        >
          {loading ? 'Analyzing...' : 'Get AI Analysis'}
        </button>
      </div>
      
      {analysis && (
        <div className="analysis-result">
          <h4>AI Analysis:</h4>
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
};

export default ResourceAnalysis;