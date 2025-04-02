import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import _ "mo:llm";
import Nat "mo:base/Nat"; // Added missing Nat import

import Types "types";
import UserProfiles "user_profiles";
import Resources "resources";
import Reviews "reviews";
import Notifications "notifications";
import History "history";
import AIUtils "ai_utils";
import UserNeeds "user_needs";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

actor class ResourceSharingPlatform() {
    // Initialize all managers
    private let userProfileManager = UserProfiles.UserProfileManager();
    private let resourceManager = Resources.ResourceManager();
    private let reviewManager = Reviews.ReviewManager();
    private let notificationManager = Notifications.NotificationManager();
    private let historyManager = History.HistoryManager();
    private let aiManager = AIUtils.AIManager();
    private let userNeedsManager = UserNeeds.UserNeedsManager();
    
    // User Profile Functions
    public shared({ caller }) func createOrUpdateProfile(name: Text, bio: Text, contactInfo: Text) : async Bool {
        return userProfileManager.createOrUpdateProfile(caller, name, bio, contactInfo);
    };
    
    public query func getProfile(user: Principal) : async ?Types.UserProfile {
        return userProfileManager.getProfile(user);
    };
    
    // Resource Management Functions
    public shared({ caller }) func addResource(
        category: Text,
        tags: [Types.Tag],
        description: Text,
        quantity: Nat,
        location: Text,
        coordinates: ?Types.Coordinates,
        media: [Types.MediaItem],
        expirationDays: ?Nat
    ) : async Nat {
        let resourceId = resourceManager.addResource(
            caller, category, tags, description, quantity, 
            location, coordinates, media, expirationDays
        );
        
        // Record history
        let _ = historyManager.recordResourceHistory(
            resourceId,
            #Created,
            caller,
            "Resource created in category: " # category
        );
        
        return resourceId;
    };
    
    public query func getAvailableResources() : async [Types.Resource] {
        return resourceManager.getAvailableResources();
    };
    
    public query func getResource(resourceId: Nat) : async ?Types.Resource {
        return resourceManager.getResource(resourceId);
    };
    
    // Reservation System
    public shared({ caller }) func reserveResource(resourceId: Nat, reservationHours: Nat) : async Result.Result<Text, Text> {
        let result = resourceManager.reserveResource(caller, resourceId, reservationHours);
        
        switch (result) {
            case (#ok(_)) {
                // Get the resource to access owner information
                switch (resourceManager.getResource(resourceId)) {
                    case (null) { /* Should not happen */ };
                    case (?resource) {
                        // Record history
                        let _ = historyManager.recordResourceHistory(
                            resourceId,
                            #Reserved,
                            caller,
                            "Resource reserved for " # Nat.toText(reservationHours) # " hours"
                        );
                        
                        // Create notification for resource owner
                        let _ = notificationManager.createNotification(
                            resource.owner,
                            #ResourceReserved,
                            ?resourceId,
                            "Your resource '" # resource.description # "' has been reserved."
                        );
                    };
                };
            };
            case (#err(_)) { /* No action needed */ };
        };
        
        return result;
    };
    
    public shared func checkAndReleaseExpiredReservations() : async Nat {
        return resourceManager.checkAndReleaseExpiredReservations();
    };
    
    // AI-powered Resource Matching
    public shared func getResourceRecommendations(userNeeds: Text, userLocation: Text) : async [Types.Resource] {
        let availableResources = resourceManager.getAvailableResources();
        return await aiManager.rankResourcesByRelevance(availableResources, userNeeds, userLocation);
    };
    
    public shared({ caller }) func claimResourceWithAIMatching(resourceId: Nat, userNeeds: Text) : async Result.Result<Text, Text> {
        switch (resourceManager.getResource(resourceId)) {
            case (null) { return #err("Resource not found"); };
            case (?resource) {
                if (resource.status != "Available" and resource.status != "Reserved") {
                    return #err("Resource is not available for claiming");
                };
                
                // If reserved, check if caller is the one who reserved it
                if (resource.status == "Reserved") {
                    switch (resource.reservedBy) {
                        case (null) { /* Should not happen */ };
                        case (?reserver) {
                            if (reserver != Principal.toText(caller)) {
                                return #err("This resource is reserved by someone else");
                            };
                        };
                    };
                };
                
                // Use LLM to determine if this is a good match
                let isGoodMatch = await aiManager.evaluateResourceMatch(
                    resource.category,
                    resource.description,
                    userNeeds
                );
                
                if (isGoodMatch) {
                    let result = resourceManager.claimResource(caller, resourceId);
                    
                    switch (result) {
                        case (#ok(_)) {
                            // Record history
                            let _ = historyManager.recordResourceHistory(
                                resourceId,
                                #Claimed,
                                caller,
                                "Resource claimed based on AI matching"
                            );
                            
                            // Create notification for resource owner
                            let _ = notificationManager.createNotification(
                                resource.owner,
                                #ResourceClaimed,
                                ?resourceId,
                                "Your resource '" # resource.description # "' has been claimed."
                            );
                            
                            return #ok("Resource claimed successfully!");
                        };
                        case (#err(e)) {
                            return #err(e);
                        };
                    };
                } else {
                    return #err("Based on AI analysis, this resource might not be the best match for your needs.");
                };
            };
        };
    };
    
    
    public shared({ caller }) func addReview(resourceId: Nat, rating: Nat, comment: Text) : async Result.Result<Nat, Text> {
        // Get the resource first to check if it exists and if the caller has claimed it
        switch (resourceManager.getResource(resourceId)) {
            case (null) { return #err("Resource not found"); };
            case (?resource) {
                if (resource.claimedBy != ?Principal.toText(caller)) {
                    return #err("You can only review resources you have claimed");
                };
                
                // Add the review directly
                reviewIdCounter += 1;
                let newReview: Types.Review = {
                    reviewer = caller;
                    resourceId = resourceId;
                    rating = rating;
                    comment = comment;
                    timestamp = Time.now();
                };
                
                reviews.put(reviewIdCounter, newReview);
                
                // Update user reputation
                userProfileManager.updateUserReputation(resource.owner, rating);
                
                // Create notification for resource owner
                let _ = notificationManager.createNotification(
                    resource.owner,
                    #NewReview,
                    ?resourceId,
                    "Your resource received a new review with rating: " # Nat.toText(rating)
                );
                
                return #ok(reviewIdCounter);
            };
        };
    };
    
    // For tracking reviews
    private var reviewIdCounter: Nat = 0;
    private var reviewEntries: [(Nat, Types.Review)] = [];
    private func natHash(n: Nat) : Hash.Hash {
        let text = Nat.toText(n);
        Text.hash(text)
    };
    
    private let reviews = HashMap.HashMap<Nat, Types.Review>(
    10, Nat.equal, natHash
    );
    
    public query func getResourceReviews(resourceId: Nat) : async [Types.Review] {
        return reviewManager.getResourceReviews(resourceId);
    };
    
    // Categories and Tags
    public shared({ caller = _ }) func addCategory(name: Text, description: Text) : async Nat {
        return resourceManager.addCategory(name, description);
    };
    
    public query func getCategories() : async [Types.Category] {
        return resourceManager.getCategories();
    };
    
    public query func searchResourcesByTags(searchTags: [Types.Tag]) : async [Types.Resource] {
        return resourceManager.searchResourcesByTags(searchTags);
    };
    
    // Geographical Matching
    public query func findResourcesNearby(userCoordinates: Types.Coordinates, maxDistanceKm: Float) : async [Types.Resource] {
        return resourceManager.findResourcesNearby(userCoordinates, maxDistanceKm);
    };
    
    // Resource Media
    public shared({ caller }) func addMediaToResource(resourceId: Nat, newMedia: Types.MediaItem) : async Result.Result<Text, Text> {
        return resourceManager.addMediaToResource(caller, resourceId, newMedia);
    };
    
    // Notifications
    public query({ caller }) func getMyNotifications(onlyUnread: Bool) : async [Types.Notification] {
        return notificationManager.getUserNotifications(caller, onlyUnread);
    };
    
    public shared({ caller }) func markNotificationsAsRead(notificationIds: [Nat]) : async Nat {
        return notificationManager.markNotificationsAsRead(caller, notificationIds);
    };
    
    // Resource History
    public query func getResourceHistory(resourceId: Nat) : async [Types.ResourceHistoryEntry] {
        return historyManager.getResourceHistory(resourceId);
    };
    
    // AI Analysis
    public func getResourceMatchAnalysis(resourceId: Nat, userNeeds: Text) : async Text {
        switch (resourceManager.getResource(resourceId)) {
            case (null) {
                return "Resource not found";
            };
            case (?resource) {
                return await aiManager.getResourceMatchAnalysis(
                    resource.category,
                    resource.description,
                    resource.location,
                    userNeeds
                );
            };
        };
    };
    
    // User Needs and Prediction
    public shared({ caller }) func recordUserNeed(category: Text, tags: [Types.Tag], description: Text) : async Nat {
        return userNeedsManager.recordUserNeed(caller, category, tags, description);
    };
    
    public shared({ caller }) func markNeedFulfilled(needId: Nat) : async Result.Result<Text, Text> {
        return userNeedsManager.markNeedFulfilled(caller, needId);
    };
    
    public shared({ caller }) func predictUserNeeds() : async Text {
        let userPastNeeds = userNeedsManager.getUserNeeds(caller);
        return await aiManager.predictUserNeeds(userPastNeeds);
    };
    
    public shared({ caller = _ }) func getSuggestedResourcesBasedOnPrediction() : async [Types.Resource] {
        let prediction = await predictUserNeeds();
        let availableResources = resourceManager.getAvailableResources();
        // Use the prediction to find matching resources
        return await aiManager.suggestResourcesBasedOnPrediction(prediction, availableResources);
    };

    // Add these methods to your main.mo file

// Get resources owned by the caller
public shared({ caller }) func getMyResources() : async [Types.Resource] {
  let allResources = resourceManager.getAvailableResources();
  return Array.filter<Types.Resource>(allResources, func(r: Types.Resource) : Bool {
    return r.owner == caller;
  });
};

// Get resources reserved by the caller
public shared({ caller }) func getMyReservedResources() : async [Types.Resource] {
  let allResources = resourceManager.getAvailableResources();
  return Array.filter<Types.Resource>(allResources, func(r: Types.Resource) : Bool {
    switch (r.reservedBy) {
      case (null) { return false; };
      case (?reservedBy) { return reservedBy == Principal.toText(caller); };
    };
  });
};

// Get resources claimed by the caller
public shared({ caller }) func getMyClaimedResources() : async [Types.Resource] {
  let allResources = resourceManager.getAvailableResources();
  return Array.filter<Types.Resource>(allResources, func(r: Types.Resource) : Bool {
    switch (r.claimedBy) {
      case (null) { return false; };
      case (?claimedBy) { return claimedBy == Principal.toText(caller); };
    };
  });
};
    
    // System functions for canister upgrades
    system func preupgrade() {
        userProfileManager.preupgrade();
        resourceManager.preupgrade();
        reviewManager.preupgrade();
        notificationManager.preupgrade();
        historyManager.preupgrade();
        userNeedsManager.preupgrade();
        reviewEntries := Iter.toArray(reviews.entries());
    };
    
    system func postupgrade() {
        userProfileManager.postupgrade();
        resourceManager.postupgrade();
        reviewManager.postupgrade();
        notificationManager.postupgrade();
        historyManager.postupgrade();
        userNeedsManager.postupgrade();
        for ((id, review) in reviewEntries.vals()) {
            reviews.put(id, review);
        };
        reviewEntries := [];
    };
}