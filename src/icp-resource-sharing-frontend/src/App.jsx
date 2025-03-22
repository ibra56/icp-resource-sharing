import { useState, useEffect } from 'react';
import { icp_resource_sharing_backend } from 'declarations/icp-resource-sharing-backend';

function App() {
  // State for form inputs
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  
  // State for resources and UI
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
      setMessage("Failed to load resources. Please try again.");
      setLoading(false);
    }
  };

  // Function to add a new resource
  const handleAddResource = async (e) => {
    e.preventDefault();
    
    if (!category || !location || quantity < 1) {
      setMessage("Please fill all fields with valid values");
      return;
    }
    
    try {
      setLoading(true);
      setMessage("Adding resource...");
      
      const resourceId = await icp_resource_sharing_backend.addResource(
        category,
        Number(quantity),
        location
      );
      
      setMessage(`Resource added successfully with ID: ${resourceId}`);
      setCategory('');
      setQuantity(1);
      setLocation('');
      
      // Refresh the resources list
      fetchResources();
    } catch (error) {
      console.error("Error adding resource:", error);
      setMessage("Failed to add resource. Please try again.");
      setLoading(false);
    }
  };

  // Function to claim a resource
  const handleClaimResource = async (resourceId) => {
    try {
      setLoading(true);
      const result = await icp_resource_sharing_backend.claimResource(resourceId);
      setMessage(result);
      
      // Refresh the resources list
      fetchResources();
    } catch (error) {
      console.error("Error claiming resource:", error);
      setMessage("Failed to claim resource. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Resource Sharing Platform</h1>
      
      {/* Message display */}
      {message && (
        <div className="message" style={{ 
          padding: '10px', 
          marginBottom: '20px',
          backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
          borderRadius: '5px'
        }}>
          {message}
        </div>
      )}
      
      {/* Add Resource Form */}
      <div className="form-container" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Add New Resource</h2>
        <form onSubmit={handleAddResource}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="category" style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              placeholder="e.g., Food, Clothing, Medical Supplies"
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="quantity" style={{ display: 'block', marginBottom: '5px' }}>Quantity:</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              min="1"
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="location" style={{ display: 'block', marginBottom: '5px' }}>Location:</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              placeholder="e.g., New York, Remote"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : 'Add Resource'}
          </button>
        </form>
      </div>
      
      {/* Available Resources List */}
      <div className="resources-container">
        <h2>Available Resources</h2>
        {loading ? (
          <p>Loading resources...</p>
        ) : resources.length === 0 ? (
          <p>No available resources found.</p>
        ) : (
          <div className="resources-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {resources.map((resource) => (
              <div 
                key={resource.id} 
                className="resource-card"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  padding: '15px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <h3>{resource.category}</h3>
                <p><strong>Quantity:</strong> {resource.quantity}</p>
                <p><strong>Location:</strong> {resource.location}</p>
                <p><strong>Status:</strong> {resource.status}</p>
                <button
                  onClick={() => handleClaimResource(resource.id)}
                  disabled={loading}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    marginTop: '10px'
                  }}
                >
                  Claim Resource
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;