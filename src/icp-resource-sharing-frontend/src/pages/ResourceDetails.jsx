import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getResourceById } from '../services/resourceService';
import Reviews from '../components/Reviews';

function ResourceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, backendActor } = useContext(AuthContext);
  
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationHours, setReservationHours] = useState(24);
  const [userNeeds, setUserNeeds] = useState('');
  const [matchAnalysis, setMatchAnalysis] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    try {
      setLoading(true);
      const resourceData = await getResourceById(Number(id));
      if (!resourceData) {
        setError('Resource not found');
        return;
      }
      setResource(resourceData);
    } catch (error) {
      console.error('Error loading resource:', error);
      setError('Failed to load resource details');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!isAuthenticated) {
      alert('Please log in to reserve resources');
      return;
    }

    try {
      const result = await backendActor.reserveResource(Number(id), reservationHours);
      if (result.ok) {
        alert(result.ok);
        loadResource(); // Reload to show updated status
      } else {
        alert(`Error: ${result.err}`);
      }
    } catch (error) {
      console.error('Error reserving resource:', error);
      alert('Failed to reserve resource');
    }
  };

  const handleClaim = async () => {
    if (!isAuthenticated) {
      alert('Please log in to claim resources');
      return;
    }

    if (!userNeeds.trim()) {
      alert('Please describe your needs to help our AI match you with this resource');
      return;
    }

    try {
      const result = await backendActor.claimResourceWithAIMatching(Number(id), userNeeds);
      if (result.ok) {
        alert(result.ok);
        loadResource(); // Reload to show updated status
      } else {
        alert(`Error: ${result.err}`);
      }
    } catch (error) {
      console.error('Error claiming resource:', error);
      alert('Failed to claim resource');
    }
  };

  const getMatchAnalysis = async () => {
    if (!userNeeds.trim()) {
      alert('Please describe your needs first');
      return;
    }

    try {
      const analysis = await backendActor.getResourceMatchAnalysis(Number(id), userNeeds);
      setMatchAnalysis(analysis);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error getting match analysis:', error);
      alert('Failed to get match analysis');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!resource) {
    return <div className="alert alert-warning">Resource not found</div>;
  }

  return (
    <div>
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        &larr; Back
      </button>
      
      <div className="card mb-4">
        <div className="row g-0">
          <div className="col-md-4">
            {resource.media.length > 0 ? (
              <div id="resourceCarousel" className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-inner">
                  {resource.media.map((item, index) => (
                    <div key={index} className={`carousel-item ${index === 0 ? 'active' : ''}`}>
                      <img 
                        src={item.url} 
                        className="d-block w-100" 
                        alt={item.description || resource.description}
                        style={{ height: '300px', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
                {resource.media.length > 1 && (
                  <>
                    <button className="carousel-control-prev" type="button" data-bs-target="#resourceCarousel" data-bs-slide="prev">
                      <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#resourceCarousel" data-bs-slide="next">
                      <span className="carousel-control-next-icon" aria-hidden="true"></span>
                      <span className="visually-hidden">Next</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <img 
                src="https://via.placeholder.com/300x200?text=No+Image" 
                className="img-fluid rounded-start" 
                alt="No image available"
                style={{ height: '300px', objectFit: 'cover' }}
              />
            )}
          </div>
          <div className="col-md-8">
            <div className="card-body">
              <h5 className="card-title">{resource.description}</h5>
              <p className="card-text">
                <strong>Category:</strong> {resource.category}<br />
                <strong>Location:</strong> {resource.location}<br />
                <strong>Quantity:</strong> {resource.quantity}<br />
                <strong>Status:</strong> <span className={`badge ${resource.status === 'Available' ? 'bg-success' : resource.status === 'Reserved' ? 'bg-warning' : 'bg-danger'}`}>{resource.status}</span>
              </p>
              <div className="d-flex flex-wrap mb-3">
                {resource.tags.map((tag, index) => (
                  <span key={index} className="badge bg-secondary me-1 mb-1">{tag}</span>
                ))}
              </div>
              
              {resource.status === 'Available' && (
                <div className="mb-3">
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Describe what you need this for..."
                      value={userNeeds}
                      onChange={(e) => setUserNeeds(e.target.value)}
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={getMatchAnalysis}
                    >
                      Analyze Match
                    </button>
                  </div>
                  
                  {showAnalysis && (
                    <div className="alert alert-info">
                      <h6>AI Match Analysis:</h6>
                      <p>{matchAnalysis}</p>
                    </div>
                  )}
                  
                  <div className="d-flex gap-2">
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={reservationHours}
                        onChange={(e) => setReservationHours(Number(e.target.value))}
                        min="1"
                        max="72"
                      />
                      <span className="input-group-text">hours</span>
                      <button 
                        className="btn btn-warning" 
                        onClick={handleReserve}
                        disabled={!isAuthenticated}
                      >
                        Reserve
                      </button>
                    </div>
                    
                    <button 
                      className="btn btn-success" 
                      onClick={handleClaim}
                      disabled={!isAuthenticated || !userNeeds.trim()}
                    >
                      Claim with AI Match
                    </button>
                  </div>
                </div>
              )}
              
              {resource.status === 'Reserved' && resource.reservedBy === (isAuthenticated ? backendActor.principal?.toString() : null) && (
                <div>
                  <div className="alert alert-warning">
                    You have reserved this resource until {new Date(Number(resource.reservationExpiry) / 1000000).toLocaleString()}
                  </div>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Describe what you need this for..."
                      value={userNeeds}
                      onChange={(e) => setUserNeeds(e.target.value)}
                    />
                    <button 
                      className="btn btn-success" 
                      onClick={handleClaim}
                      disabled={!userNeeds.trim()}
                    >
                      Claim Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews section would go here */}
      <Reviews resourceId={id} />
    </div>
  );
}

export default ResourceDetails;