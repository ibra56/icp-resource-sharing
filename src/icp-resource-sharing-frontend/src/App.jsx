// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import ResourceList from './components/ResourceList';
import AddResourceForm from './components/AddResourceForm';
import ResourceRecommendations from './components/ResourceRecommendations';
// import { icp_resource_sharing_backend as backend } from '../../../declarations/icp-resource-sharing-backend';
import { icp_resource_sharing_backend as backend } from '../../declarations/icp-resource-sharing-backend';

function App() {
  const [activeTab, setActiveTab] = useState('browse');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Check connection to the backend canister
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to call a simple query method to verify connection
        await backend.getAvailableResources();
        setIsConnected(true);
        setConnectionError('');
      } catch (error) {
        console.error("Failed to connect to backend:", error);
        setIsConnected(false);
        setConnectionError('Could not connect to the Internet Computer backend. Please check your network connection.');
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Resource Sharing Platform</h1>
        <p>AI-powered resource matching for communities</p>
        {isConnected ? (
          <span className="connection-status connected">Connected to Internet Computer</span>
        ) : (
          <span className="connection-status disconnected">
            {connectionError || 'Connecting to Internet Computer...'}
          </span>
        )}
      </header>
      
      <nav className="app-nav">
        <button 
          className={activeTab === 'browse' ? 'active' : ''} 
          onClick={() => setActiveTab('browse')}
        >
          Browse Resources
        </button>
        <button 
          className={activeTab === 'add' ? 'active' : ''} 
          onClick={() => setActiveTab('add')}
        >
          Share a Resource
        </button>
        <button 
          className={activeTab === 'recommendations' ? 'active' : ''} 
          onClick={() => setActiveTab('recommendations')}
        >
          Get Recommendations
        </button>
      </nav>
      
      <main className="app-content">
        {!isConnected && connectionError ? (
          <div className="error-message">{connectionError}</div>
        ) : (
          <>
            {activeTab === 'browse' && <ResourceList />}
            {activeTab === 'add' && <AddResourceForm />}
            {activeTab === 'recommendations' && <ResourceRecommendations />}
          </>
        )}
      </main>
      
      <footer className="app-footer">
        <p>Powered by Internet Computer</p>
      </footer>
    </div>
  );
}

export default App;