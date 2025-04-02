import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, login, logout, backendActor } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
    }
  }, [isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const notifications = await backendActor.getMyNotifications(true); // Only unread
      setUnreadCount(notifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">Resource Sharing Platform</Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Home</NavLink>
            </li>
            
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/add-resource">Add Resource</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/my-resources">My Resources</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link position-relative" to="/notifications">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          
          <div className="d-flex">
            {isAuthenticated ? (
              <div className="d-flex align-items-center">
                <NavLink className="btn btn-outline-light me-2" to="/profile">
                  My Profile
                </NavLink>
                <button 
                  className="btn btn-outline-light" 
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-outline-light" 
                onClick={login}
              >
                Login with Internet Identity
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;