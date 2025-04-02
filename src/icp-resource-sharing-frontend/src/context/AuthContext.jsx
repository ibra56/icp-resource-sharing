import React, { createContext, useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { createAuthenticatedActor } from '../services/resourceService';

export const AuthContext = createContext();

const defaultOptions = {
  createOptions: {
    idleOptions: {
      disableIdle: true,
    },
  },
  loginOptions: {
    identityProvider: process.env.NODE_ENV === 'production'
      ? 'https://identity.ic0.app/#authorize'
      : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}#authorize`,
    maxTimeToLive: BigInt(24) * BigInt(3600000000000), // 24 hours in nanoseconds
  },
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [authenticatedActor, setAuthenticatedActor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      setIsLoading(true);
      const client = await AuthClient.create(defaultOptions.createOptions);
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        const userIdentity = client.getIdentity();
        const userPrincipal = userIdentity.getPrincipal().toString();
        const actor = createAuthenticatedActor(userIdentity);

        setIsAuthenticated(true);
        setIdentity(userIdentity);
        setPrincipal(userPrincipal);
        setAuthenticatedActor(actor);
      }
    } catch (error) {
      console.error('Error initializing authentication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    if (!authClient) return;

    return new Promise((resolve) => {
      authClient.login({
        ...defaultOptions.loginOptions,
        onSuccess: async () => {
          const userIdentity = authClient.getIdentity();
          const userPrincipal = userIdentity.getPrincipal().toString();
          const actor = createAuthenticatedActor(userIdentity);

          setIsAuthenticated(true);
          setIdentity(userIdentity);
          setPrincipal(userPrincipal);
          setAuthenticatedActor(actor);
          resolve(true);
        },
        onError: (error) => {
          console.error('Login failed:', error);
          resolve(false);
        }
      });
    });
  };

  const logout = async () => {
    if (!authClient) return;

    await authClient.logout();
    setIsAuthenticated(false);
    setIdentity(null);
    setPrincipal(null);
    setAuthenticatedActor(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        identity,
        principal,
        authenticatedActor,
        login,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};