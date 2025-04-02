import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AddResource() {
  const navigate = useNavigate();
  const { isAuthenticated, backendActor } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    category: '',
    tags: '',
    description: '',
    quantity: 1,
    location: '',
    coordinates: null,
    expirationDays: 30
  });
  
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="alert alert-warning">
        Please log in to add resources.
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: Number(value)
    });
  };

  const handleAddMedia = () => {
    setMedia([
      ...media,
      { contentType: 'image/jpeg', url: '', description: '' }
    ]);
  };

  const handleMediaChange = (index, field, value) => {
    const updatedMedia = [...media];
    updatedMedia[index] = {
      ...updatedMedia[index],
      [field]: value
    };
    setMedia(updatedMedia);
  };

  const handleRemoveMedia = (index) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
          setUseCurrentLocation(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Failed to get your location. Please enter it manually.');
          setUseCurrentLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Create resource
      const resourceId = await backendActor.addResource(
        formData.category,
        tagsArray,
        formData.description,
        formData.quantity,
        formData.location,
        formData.coordinates,
        [], // Empty media array initially
        formData.expirationDays
      );
      
      // Add media items one by one
      for (const item of media) {
        if (item.url.trim()) {
          await backendActor.addMediaToResource(resourceId, {
            contentType: item.contentType,
            url: item.url,
            description: item.description ? [item.description] : []
          });
        }
      }
      
      alert('Resource added successfully!');
      navigate(`/resource/${resourceId}`);
    } catch (error) {
      console.error('Error adding resource:', error);
      setError('Failed to add resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Add New Resource</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="category" className="form-label">Category</label>
          <input
            type="text"
            className="form-control"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="tags" className="form-label">Tags (comma separated)</label>
          <input
            type="text"
            className="form-control"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="e.g. electronics, laptop, used"
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            required
          ></textarea>
        </div>
        
        <div className="mb-3">
          <label htmlFor="quantity" className="form-label">Quantity</label>
          <input
            type="number"
            className="form-control"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleNumberChange}
            min="1"
            required
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="location" className="form-label">Location</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
            />
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={handleGetLocation}
            >
              Use My Location
            </button>
          </div>
          {useCurrentLocation && formData.coordinates && (
            <small className="text-muted">
              Using coordinates: {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
            </small>
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="expirationDays" className="form-label">Expires After (days)</label>
          <input
            type="number"
            className="form-control"
            id="expirationDays"
            name="expirationDays"
            value={formData.expirationDays}
            onChange={handleNumberChange}
            min="1"
            max="365"
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Media</label>
          {media.map((item, index) => (
            <div key={index} className="card mb-2">
              <div className="card-body">
                <div className="mb-2">
                  <label className="form-label">URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={item.url}
                    onChange={(e) => handleMediaChange(index, 'url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={item.description}
                    onChange={(e) => handleMediaChange(index, 'description', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleRemoveMedia(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleAddMedia}
          >
            Add Media
          </button>
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span className="ms-2">Adding...</span>
            </>
          ) : 'Add Resource'}
        </button>
      </form>
    </div>
  );
}

export default AddResource;