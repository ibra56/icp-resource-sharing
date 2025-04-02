import React from 'react';
import { Link } from 'react-router-dom';

function ResourceCard({ resource }) {
  // Get the first media item if available
  const featuredImage = resource.media.length > 0 
    ? resource.media[0].url 
    : 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <div className="card h-100">
      <img 
        src={featuredImage} 
        className="card-img-top" 
        alt={resource.description}
        style={{ height: '200px', objectFit: 'cover' }}
      />
      <div className="card-body">
        <h5 className="card-title">{resource.description}</h5>
        <p className="card-text">
          <strong>Category:</strong> {resource.category}<br />
          <strong>Location:</strong> {resource.location}<br />
          <strong>Quantity:</strong> {resource.quantity}
        </p>
        <div className="d-flex flex-wrap mb-2">
          {resource.tags.map((tag, index) => (
            <span key={index} className="badge bg-secondary me-1 mb-1">{tag}</span>
          ))}
        </div>
        <Link to={`/resource/${resource.id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default ResourceCard;