// src/components/ResourceRecommendations.jsx
import { useState } from 'react';
import { icp_resource_sharing_backend as backend } from '../../../declarations/icp-resource-sharing-backend';
import ResourceCard from './ResourceCard.jsx';

const ResourceRecommendations = () => {
  const [userNeeds, setUserNeeds] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const results = await backend.getResourceRecommendations(userNeeds, userLocation);
      setRecommendations(results);
      setSearched(true);
    } catch (error) {
      console.error("Error getting recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommendations">
      <h2>Get AI-Powered Resource Recommendations</h2>
      
      <form onSubmit={handleSubmit} className="recommendations-form">
        <div className="form-group">
          <label htmlFor="userNeeds">What do you need?</label>
          <textarea
            id="userNeeds"
            value={userNeeds}
            onChange={(e) => setUserNeeds(e.target.value)}
            placeholder="Describe what you're looking for in detail..."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="userLocation">Your Location</label>
          <input
            type="text"
            id="userLocation"
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            placeholder="Enter your location"
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Finding matches...' : 'Find Resources'}
        </button>
      </form>
      
      {loading && <div className="loading">AI is analyzing your needs...</div>}
      
      {!loading && searched && (
        <div className="recommendations-results">
          <h3>Recommended Resources</h3>
          
          {recommendations.length === 0 ? (
            <p>No matching resources found. Try broadening your description or check back later.</p>
          ) : (
            <div className="resource-grid">
              {recommendations.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceRecommendations;