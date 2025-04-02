import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableResources, getResourceRecommendations } from '../services/resourceService';
import ResourceCard from '../components/ResourceCard';

function Home() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userNeeds, setUserNeeds] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await getAvailableResources();
      setResources(data);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!userNeeds.trim()) return;
    
    try {
      setLoading(true);
      const data = await getResourceRecommendations(userNeeds, '');
      setRecommendations(data);
      setShowRecommendations(true);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Resource Sharing Platform</h1>
      
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Find Resources with AI</h5>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Describe what you need..."
              value={userNeeds}
              onChange={(e) => setUserNeeds(e.target.value)}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleGetRecommendations}
              disabled={!userNeeds.trim()}
            >
              Get Recommendations
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : showRecommendations ? (
        <div>
          <h2>Recommended Resources</h2>
          {recommendations.length === 0 ? (
            <p>No recommendations found for your needs. Try a different description.</p>
          ) : (
            <div className="row">
              {recommendations.map((resource) => (
                <div className="col-md-4 mb-4" key={resource.id}>
                  <ResourceCard resource={resource} />
                </div>
              ))}
            </div>
          )}
          <button 
            className="btn btn-secondary mb-4" 
            onClick={() => setShowRecommendations(false)}
          >
            Show All Resources
          </button>
        </div>
      ) : (
        <div>
          <h2>Available Resources</h2>
          {resources.length === 0 ? (
            <p>No resources available at the moment.</p>
          ) : (
            <div className="row">
              {resources.map((resource) => (
                <div className="col-md-4 mb-4" key={resource.id}>
                  <ResourceCard resource={resource} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;