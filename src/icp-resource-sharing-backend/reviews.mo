import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Types "types";

module {
  public class ReviewManager() {
    private var reviewIdCounter: Nat = 0;
    private var reviewEntries: [(Nat, Types.Review)] = [];
    
    private func natHash(n: Nat) : Hash.Hash {
      let text = Int.toText(n);
      Text.hash(text)
    };
    
    private let reviews = HashMap.HashMap<Nat, Types.Review>(
      10, Nat.equal, natHash
    );
    
    public func addReview(
      caller: Principal,
      resourceId: Nat,
      rating: Nat,
      comment: Text,
      resourceManager: actor { getResource: (Nat) -> async ?Types.Resource },
      userProfileManager: actor { updateUserReputation: (Principal, Nat) -> () }
    ) : async Result.Result<Nat, Text> {
      // Validate rating is between 1-5
      if (rating < 1 or rating > 5) {
        return #err("Rating must be between 1 and 5");
      };
      
      // Check if resource exists
      let resourceOpt = await resourceManager.getResource(resourceId);
      
      switch (resourceOpt) {
        case (null) { return #err("Resource not found"); };
        case (?resource) {
          // Check if caller has claimed this resource
          if (resource.claimedBy != ?Principal.toText(caller)) {
            return #err("You can only review resources you have claimed");
          };
          
          // Add review
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
          
          return #ok(reviewIdCounter);
        };
      };
    };
    
    public func getResourceReviews(resourceId: Nat) : [Types.Review] {
      let allReviews = Iter.toArray(reviews.entries());
      return Array.map<(Nat, Types.Review), Types.Review>(
        Array.filter<(Nat, Types.Review)>(allReviews, func((_, r): (Nat, Types.Review)) : Bool { 
          r.resourceId == resourceId 
        }),
        func((_, r): (Nat, Types.Review)) : Types.Review { r }
      );
    };
    
    public func preupgrade() {
      reviewEntries := Iter.toArray(reviews.entries());
    };
    
    public func postupgrade() {
      for ((id, review) in reviewEntries.vals()) {
        reviews.put(id, review);
      };
      reviewEntries := [];
    };
  };
}