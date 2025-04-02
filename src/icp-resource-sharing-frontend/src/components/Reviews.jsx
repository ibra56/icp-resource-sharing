import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Reviews({ resourceId }) {
  const { isAuthenticated, backendActor } = useContext(AuthContext);
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    loadReviews();
    if (isAuthenticated) {
      checkCanReview();
    }
  }, [resourceId, isAuthenticated]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await backendActor.getResourceReviews(Number(resourceId));
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      // Check if the user has claimed this resource
      const resource = await backendActor.getResource(Number(resourceId));
      if (resource) {
        const principal = backendActor.principal?.toString();
        setCanReview(resource.claimedBy === principal);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rating' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to leave a review');
      return;
    }
    
    try {
      setSubmitting(true);
      const result = await backendActor.addReview(
        Number(resourceId),
        formData.rating,
        formData.comment
      );
      
      if (result.ok !== undefined) {
        setFormData({
          rating: 5,
          comment: ''
        });
        await loadReviews();
      } else {
        setError(result.err);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5">
      <h3>Reviews</h3>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading ? (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {canReview && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Leave a Review</h5>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="rating" className="form-label">Rating</label>
                    <select
                      className="form-select"
                      id="rating"
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                    >
                      <option value="5">5 - Excellent</option>
                      <option value="4">4 - Good</option>
                      <option value="3">3 - Average</option>
                      <option value="2">2 - Poor</option>
                      <option value="1">1 - Terrible</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="comment" className="form-label">Comment</label>
                    <textarea
                      className="form-control"
                      id="comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      rows="3"
                      required
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>
          )}
          
          {reviews.length === 0 ? (
            <div className="alert alert-info">
              No reviews yet. Be the first to leave a review!
            </div>
          ) : (
            <div className="list-group">
              {reviews.map((review, index) => (
                <div key={index} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i 
                          key={i} 
                          className={`bi ${i < review.rating ? 'bi-star-fill' : 'bi-star'} text-warning`}
                        ></i>
                      ))}
                    </h5>
                    <small>
                      {new Date(Number(review.timestamp) / 1000000).toLocaleString()}
                    </small>
                  </div>
                  <p className="mb-1">{review.comment}</p>
                  <small>Reviewer: {review.reviewer.toString().substring(0, 10)}...</small>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reviews;