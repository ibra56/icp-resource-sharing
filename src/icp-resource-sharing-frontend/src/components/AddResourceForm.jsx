// src/components/AddResourceForm.jsx
import { useState } from 'react';
import { icp_resource_sharing_backend as backend } from '../../../declarations/icp-resource-sharing-backend';

const AddResourceForm = () => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    quantity: 1,
    location: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const resourceId = await backend.addResource(
        formData.category,
        formData.description,
        formData.quantity,
        formData.location
      );
      
      setMessage(`Resource added successfully with ID: ${resourceId}`);
      setFormData({
        category: '',
        description: '',
        quantity: 1,
        location: ''
      });
    } catch (error) {
      console.error("Error adding resource:", error);
      setMessage('Failed to add resource');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-resource-form">
      <h2>Share a Resource</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" disabled={submitting} className="submit-button">
          {submitting ? 'Adding...' : 'Add Resource'}
        </button>
      </form>
      
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default AddResourceForm;