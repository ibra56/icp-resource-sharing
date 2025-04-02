import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Types "types";

module {
  public class UserProfileManager() {
    private var userProfileEntries: [(Principal, Types.UserProfile)] = [];
    private let userProfiles = HashMap.HashMap<Principal, Types.UserProfile>(
      10, Principal.equal, Principal.hash
    );
    
    public func createOrUpdateProfile(
      caller: Principal,
      name: Text,
      bio: Text,
      contactInfo: Text
    ) : Bool {
      let existingProfile = userProfiles.get(caller);
      
      let updatedProfile: Types.UserProfile = switch (existingProfile) {
        case (null) {
          {
            principal = caller;
            name = name;
            bio = bio;
            contactInfo = contactInfo;
            reputationScore = 0.0;
            totalTransactions = 0;
            memberSince = Time.now();
          }
        };
        case (?profile) {
          {
            principal = caller;
            name = name;
            bio = bio;
            contactInfo = contactInfo;
            reputationScore = profile.reputationScore;
            totalTransactions = profile.totalTransactions;
            memberSince = profile.memberSince;
          }
        };
      };
      
      userProfiles.put(caller, updatedProfile);
      return true;
    };
    
    public func getProfile(user: Principal) : ?Types.UserProfile {
      userProfiles.get(user)
    };
    
    public func updateUserReputation(userPrincipal: Principal, newRating: Nat) {
      switch (userProfiles.get(userPrincipal)) {
        case (null) { /* User has no profile */ };
        case (?profile) {
          let newTotalTransactions = profile.totalTransactions + 1;
          let totalTransactionsInt : Int = profile.totalTransactions; // Direct conversion
          let newRatingInt : Int = newRating; // Direct conversion
          let newTotalTransactionsInt : Int = newTotalTransactions; // Direct conversion

          let newScore = ((profile.reputationScore * Float.fromInt(totalTransactionsInt)) 
               + Float.fromInt(newRatingInt)) 
               / Float.fromInt(newTotalTransactionsInt);
          
          let updatedProfile: Types.UserProfile = {
            principal = profile.principal;
            name = profile.name;
            bio = profile.bio;
            contactInfo = profile.contactInfo;
            reputationScore = newScore;
            totalTransactions = newTotalTransactions;
            memberSince = profile.memberSince;
          };
          
          userProfiles.put(userPrincipal, updatedProfile);
        };
      };
    };
    
    public func preupgrade() {
      userProfileEntries := Iter.toArray(userProfiles.entries());
    };
    
    public func postupgrade() {
      for ((principal, profile) in userProfileEntries.vals()) {
        userProfiles.put(principal, profile);
      };
      userProfileEntries := [];
    };
  };
}