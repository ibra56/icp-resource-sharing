import { useState } from 'react';
import { icp_resource_sharing_backend as backend } from '../../../declarations/icp-resource-sharing-backend';

const ResourceCard = ({ resource }) => {
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');
  const [userNeeds, setUserNeeds] = useState('');

  const handleClaim = async () => {
    if (!userNeeds.trim()) {
      setMessage('Please describe your needs first');
      return;
    }

    setClaiming(true);
    try {
      const result = await backend.claimResourceWithAIMatching(resource.id, userNeeds);
      setMessage(result);
    } catch (error) {
      console.error("Error claiming resource:", error);
      setMessage('Failed to claim resource');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="resource-card">
      <h3>{resource.category}</h3>
      <p className="description">{resource.description}</p>
      <div className="resource-details">
        <p><strong>Quantity:</strong> {resource.quantity}</p>
        <p><strong>Location:</strong> {resource.location}</p>
      </div>
      <div className="claim-section">
        <textarea
          placeholder="Describe what you need this resource for..."
          value={userNeeds}
          onChange={(e) => setUserNeeds(e.target.value)}
        />
        <button 
          onClick={handleClaim} 
          disabled={claiming}
          className="claim-button"
        >
          {claiming ? 'Processing...' : 'Claim with AI Match'}
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default ResourceCard;