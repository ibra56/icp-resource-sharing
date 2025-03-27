import { useState, useEffect } from 'react';
import { icp_resource_sharing_backend } from 'declarations/icp-resource-sharing-backend';
import './App.css';

function App() {
  // State for form inputs
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  
  // State for AI matching
  const [userNeeds, setUserNeeds] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [showMatchingForm, setShowMatchingForm] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  
  // State for resources and UI
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'success', 'error', 'info'

  // Fetch available resources on component mount
  useEffect(() => {
    fetchResources();
  }, []);

  // Function to fetch available resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const availableResources = await icp_resource_sharing_backend.getAvailableResources();
      setResources(availableResources);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching resources:", error);
      showMessage("Failed to load resources. Please try again.", "error");
      setLoading(false);
    }
  };

  // Function to show message with type
  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    // Auto-hide message after 5 seconds
    setTimeout(() => setMessage(''), 5000);
  };

  // Function to add a new resource
  const handleAddResource = async (e) => {
    e.preventDefault();
    
    if (!category || !location || quantity < 1) {
      showMessage("Please fill all fields with valid values", "error");
      return;
    }
    
    try {
      setLoading(true);
      showMessage("Adding resource...", "info");
      
      const resourceId = await icp_resource_sharing_backend.addResource(
        category,
        Number(quantity),
        location
      );
      
      showMessage(`Resource added successfully with ID: ${resourceId}`, "success");
      setCategory('');
      setQuantity(1);
      setLocation('');
      
      // Refresh the resources list
      fetchResources();
    } catch (error) {
      console.error("Error adding resource:", error);
      showMessage("Failed to add resource. Please try again.", "error");
      setLoading(false);
    }
  };

  // Function to claim a resource
  const handleClaimResource = async (resourceId) => {
    try {
      setLoading(true);
      const result = await icp_resource_sharing_backend.claimResource(resourceId);
      showMessage(result, "success");
      
      // Refresh the resources list
      fetchResources();
    } catch (error) {
      console.error("Error claiming resource:", error);
      showMessage("Failed to claim resource. Please try again.", "error");
      setLoading(false);
    }
  };

  // Function to open AI matching form
  const openAIMatchingForm = (resourceId) => {
    setSelectedResourceId(resourceId);
    setShowMatchingForm(true);
  };

  // Function to claim a resource with AI matching
  const handleAIMatchingClaim = async (e) => {
    e.preventDefault();
    
    if (!userNeeds || !userLocation) {
      showMessage("Please describe your needs and location", "error");
      return;
    }
    
    try {
      setLoading(true);
      showMessage("Processing AI matching...", "info");
      
      const result = await icp_resource_sharing_backend.claimResourceWithAIMatching(
        selectedResourceId,
        userNeeds,
        userLocation
      );
      
      showMessage(result, "success");
      setUserNeeds('');
      setUserLocation('');
      setShowMatchingForm(false);
      setSelectedResourceId(null);
      
      // Refresh the resources list
      fetchResources();
    } catch (error) {
      console.error("Error with AI matching:", error);
      showMessage("Failed to process AI matching. Please try again.", "error");
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Community Resource Sharing</h1>
        <p className="subtitle">Powered by Internet Computer</p>
      </header>
      
      {/* Message display */}
      {message && (
        <div className={`message message-${messageType}`}>
          <span className="message-icon">
            {messageType === 'success' ? '✓' : messageType === 'error' ? '✗' : 'ℹ'}
          </span>
          <span className="message-text">{message}</span>
        </div>
      )}
      
      <div className="content-container">
        {/* Add Resource Form */}
        <div className="form-container">
          <div className="form-header">
            <h2>Contribute Resources</h2>
            <p>Share resources with your community</p>
          </div>
          <form onSubmit={handleAddResource}>
            <div className="form-group">
              <label htmlFor="category">Resource Category</label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Food, Clothing, Medical Supplies"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Available Quantity</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                min="1"
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Pickup Location</label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New York, Remote"
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Add Resource'}
            </button>
          </form>
        </div>
        
        {/* AI Matching Form (Modal) */}
        {showMatchingForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>AI Resource Matching</h3>
                <button 
                  className="modal-close" 
                  onClick={() => setShowMatchingForm(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAIMatchingClaim}>
                <div className="form-group">
                  <label htmlFor="userNeeds">Describe Your Needs</label>
                  <textarea
                    id="userNeeds"
                    value={userNeeds}
                    onChange={(e) => setUserNeeds(e.target.value)}
                    placeholder="Describe what you need and how you'll use this resource"
                    rows={4}
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
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowMatchingForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Submit for AI Matching'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Available Resources List */}
        <div className="resources-container">
          <div className="resources-header">
            <h2>Available Resources</h2>
            <button onClick={fetchResources} className="btn btn-refresh" disabled={loading}>
              ↻ Refresh
            </button>
          </div>
          
          {loading && resources.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No available resources found.</p>
              <p className="empty-subtitle">Be the first to contribute!</p>
            </div>
          ) : (
            <div className="resources-grid">
              {resources.map((resource) => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-header">
                    <span className="resource-category">{resource.category}</span>
                    <span className={`resource-status status-${resource.status.toLowerCase()}`}>
                      {resource.status}
                    </span>
                  </div>
                  <div className="resource-details">
                    <div className="resource-detail">
                      <span className="detail-icon">🔢</span>
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{resource.quantity}</span>
                    </div>
                    <div className="resource-detail">
                      <span className="detail-icon">📍</span>
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{resource.location}</span>
                    </div>
                  </div>
                  <div className="resource-actions">
                    <button
                      onClick={() => handleClaimResource(resource.id)}
                      className="btn btn-secondary"
                      disabled={loading || resource.status.toLowerCase() !== 'available'}
                    >
                      Direct Claim
                    </button>
                    <button
                      onClick={() => openAIMatchingForm(resource.id)}
                      className="btn btn-primary"
                      disabled={loading || resource.status.toLowerCase() !== 'available'}
                    >
                      AI Matching
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      
      <footer className="app-footer">
        <p>Built on <a href="https://internetcomputer.org" target="_blank" rel="noopener noreferrer">Internet Computer</a> | Decentralized Resource Sharing</p>
      </footer>
    </div>
  );
}

export default App;