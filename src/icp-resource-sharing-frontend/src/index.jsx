import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../declarations/icp-resource-sharing-backend';

const HOST = process.env.DFX_NETWORK === "ic" ? "https://identity.ic0.app"  : 'http://localhost:4943?canisterId=be2us-64aaa-aaaaa-qaabq-cai';
const canisterId = 'be2us-64aaa-aaaaa-qaabq-cai';


// Create an anonymous agent for public queries
const agent = new HttpAgent({ host: HOST });
if (process.env.NODE_ENV !== 'production') {
  agent.fetchRootKey();
}

// Create an anonymous actor for public methods
const anonymousActor = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});

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

