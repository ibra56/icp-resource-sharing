import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ResourceCard from '../components/ResourceCard';

function MyResources() {
  const { isAuthenticated, backendActor } = useContext(AuthContext);
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('owned');

  useEffect(() => {
    if (isAuthenticated) {
      loadResources();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab]);

  const loadResources = async () => {
    try {
      setLoading(true);
      let data = [];
      
      if (activeTab === 'owned') {
        data = await backendActor.getMyResources();
      } else if (activeTab === 'reserved') {
        data = await backendActor.getMyReservedResources();
      } else if (activeTab === 'claimed') {
        data = await backendActor.getMyClaimedResources();
      }
      
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="alert alert-warning">
        Please log in to view your resources.
      </div>
    );
  }

  return (
    <div>
      <h2>My Resources</h2>
      
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'owned' ? 'active' : ''}`}
            onClick={() => setActiveTab('owned')}
          >
            Resources I Own
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'reserved' ? 'active' : ''}`}
            onClick={() => setActiveTab('reserved')}
          >
            Reserved Resources
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'claimed' ? 'active' : ''}`}
            onClick={() => setActiveTab('claimed')}
          >
            Claimed Resources
          </button>
        </li>
      </ul>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : resources.length === 0 ? (
        <div className="alert alert-info">
          {activeTab === 'owned' 
            ? "You don't own any resources yet." 
            : activeTab === 'reserved' 
              ? "You haven't reserved any resources yet."
              : "You haven't claimed any resources yet."}
          
          {activeTab === 'owned' && (
            <div className="mt-3">
              <Link to="/add-resource" className="btn btn-primary">
                Add a Resource
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="row">
          {resources.map((resource) => (
            <div className="col-md-4 mb-4" key={resource.id}>
              <ResourceCard resource={resource} />
            </div>
          ))}
          
          {activeTab === 'owned' && (
            <div className="col-md-4 mb-4">
              <div className="card h-100 d-flex justify-content-center align-items-center">
                <Link to="/add-resource" className="text-decoration-none p-5">
                  <div className="text-center">
                    <i className="bi bi-plus-circle" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3">Add New Resource</p>
                    </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyResources;