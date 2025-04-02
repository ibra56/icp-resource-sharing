import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { login, isAuthenticated, principal, logout, isLoading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return <div>Loading authentication status...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Logged in as: {principal}</p>
          <button onClick={logout} disabled={isLoggingIn}>
            Logout
          </button>
        </div>
      ) : (
        <button onClick={handleLogin} disabled={isLoggingIn}>
          {isLoggingIn ? 'Logging in...' : 'Login with Internet Identity'}
        </button>
      )}
    </div>
  );
};

export default Login;