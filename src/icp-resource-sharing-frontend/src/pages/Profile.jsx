import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Profile() {
  const { isAuthenticated, backendActor, principal } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    contactInfo: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && principal) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, principal]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await backendActor.getProfile(principal);
      if (result.ok) {
        setProfile(result.ok);
        setFormData({
          name: result.ok.name,
          bio: result.ok.bio,
          contactInfo: result.ok.contactInfo
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const result = await backendActor.createOrUpdateProfile(formData);
      if (result.ok !== undefined) {
        await loadProfile();
        setIsEditing(false);
      } else {
        setError(result.err);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Are you sure you want to delete your profile? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await backendActor.deleteMyProfile();
      if (result.ok !== undefined) {
        setProfile(null);
        setFormData({
          name: '',
          bio: '',
          contactInfo: ''
        });
      } else {
        setError(result.err);
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="alert alert-warning">
        Please log in to view and manage your profile.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>My Profile</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {!profile && !isEditing ? (
        <div>
          <p>You don't have a profile yet. Create one to start sharing resources!</p>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsEditing(true)}
          >
            Create Profile
          </button>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="bio" className="form-label">Bio</label>
            <textarea
              className="form-control"
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className="mb-3">
            <label htmlFor="contactInfo" className="form-label">Contact Information</label>
            <input
              type="text"
              className="form-control"
              id="contactInfo"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              Save Profile
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                if (profile) {
                  setFormData({
                    name: profile.name,
                    bio: profile.bio,
                    contactInfo: profile.contactInfo
                  });
                }
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">{profile.name}</h5>
            <h6 className="card-subtitle mb-2 text-muted">Principal ID: {principal.toString()}</h6>
            
            <p className="card-text">
              <strong>Bio:</strong><br />
              {profile.bio || 'No bio provided'}
            </p>
            
            <p className="card-text">
              <strong>Contact:</strong><br />
              {profile.contactInfo || 'No contact information provided'}
            </p>
            
            <p className="card-text">
              <strong>Reputation Score:</strong> {profile.reputationScore.toFixed(1)}<br />
              <strong>Transactions:</strong> {profile.totalTransactions}<br />
              <strong>Member Since:</strong> {new Date(Number(profile.memberSince) / 1000000).toLocaleDateString()}
            </p>
            
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteProfile}
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;