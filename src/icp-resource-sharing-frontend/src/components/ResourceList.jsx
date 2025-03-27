// src/components/ResourceList.jsx
import { useState, useEffect } from 'react';
import { icp_resource_sharing_backend as backend } from '../../../declarations/icp-resource-sharing-backend';
import ResourceCard from './ResourceCard.jsx';

const ResourceList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const availableResources = await backend.getAvailableResources();
        setResources(availableResources);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) return <div className="loading">Loading resources...</div>;

  return (
    <div className="resource-list">
      <h2>Available Resources</h2>
      {resources.length === 0 ? (
        <p>No resources available at the moment.</p>
      ) : (
        <div className="resource-grid">
          {resources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceList;