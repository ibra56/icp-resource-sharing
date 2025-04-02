import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../declarations/icp-resource-sharing-backend';

const HOST = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4943';
const canisterId = process.env.ICP_RESOURCE_SHARING_BACKEND_CANISTER_ID;

// Create an anonymous agent for public queries
const agent = new HttpAgent({ host: HOST });
if (process.env.NODE_ENV !== 'production') {
  agent.fetchRootKey().catch(err => {
    console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
    console.error(err);
  });
}

// Create an anonymous actor for public methods
const anonymousActor = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});

// Create an authenticated actor with the user's identity
export const createAuthenticatedActor = (identity) => {
  const authAgent = new HttpAgent({
    host: HOST,
    identity
  });
  
  if (process.env.NODE_ENV !== 'production') {
    authAgent.fetchRootKey().catch(err => {
      console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
      console.error(err);
    });
  }
  
  return Actor.createActor(idlFactory, {
    agent: authAgent,
    canisterId,
  });
};

export const getAvailableResources = async () => {
  try {
    return await anonymousActor.getAvailableResources();
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

export const getResourceById = async (resourceId) => {
  try {
    return await anonymousActor.getResource(resourceId);
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
};

export const searchResourcesByTags = async (tags) => {
  try {
    return await anonymousActor.searchResourcesByTags(tags);
  } catch (error) {
    console.error('Error searching resources:', error);
    throw error;
  }
};

export const getResourceRecommendations = async (userNeeds, userLocation) => {
  try {
    return await anonymousActor.getResourceRecommendations(userNeeds, userLocation);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

// Authenticated methods (require login)
export const addResource = async (authenticatedActor, resource) => {
  try {
    return await authenticatedActor.addResource(resource);
  } catch (error) {
    console.error('Error adding resource:', error);
    throw error;
  }
};

export const updateResource = async (authenticatedActor, resourceId, updatedResource) => {
  try {
    return await authenticatedActor.updateResource(resourceId, updatedResource);
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

export const deleteResource = async (authenticatedActor, resourceId) => {
  try {
    return await authenticatedActor.deleteResource(resourceId);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};