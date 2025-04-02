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
  public class UserNeedsManager() {
    private var userNeedIdCounter: Nat = 0;
    private var userNeedEntries: [(Nat, Types.UserNeed)] = [];
    
    private func natHash(n: Nat) : Hash.Hash {
      let text = Int.toText(n);
      Text.hash(text)
    };
    
    private let userNeeds = HashMap.HashMap<Nat, Types.UserNeed>(
      10, Nat.equal, natHash
    );
    
    public func recordUserNeed(
      caller: Principal,
      category: Text,
      tags: [Types.Tag],
      description: Text
    ) : Nat {
      userNeedIdCounter += 1;
      let newNeed: Types.UserNeed = {
        userId = caller;
        category = category;
        tags = tags;
        description = description;
        timestamp = Time.now();
        fulfilled = false;
      };
      
      userNeeds.put(userNeedIdCounter, newNeed);
      return userNeedIdCounter;
    };
    
    public func markNeedFulfilled(caller: Principal, needId: Nat) : Result.Result<Text, Text> {
      switch (userNeeds.get(needId)) {
        case (null) { return #err("Need not found"); };
        case (?need) {
          if (need.userId != caller) {
            return #err("Only the owner can mark this need as fulfilled");
          };
          
          let updatedNeed: Types.UserNeed = {
            userId = need.userId;
            category = need.category;
            tags = need.tags;
            description = need.description;
            timestamp = need.timestamp;
            fulfilled = true;
          };
          
          userNeeds.put(needId, updatedNeed);
          return #ok("Need marked as fulfilled");
        };
      };
    };
    
    public func getUserNeeds(user: Principal) : [Types.UserNeed] {
      let allNeeds = Iter.toArray(userNeeds.entries());
      return Array.map<(Nat, Types.UserNeed), Types.UserNeed>(
        Array.filter<(Nat, Types.UserNeed)>(allNeeds, func((_, n): (Nat, Types.UserNeed)) : Bool { 
          Principal.equal(n.userId, user)
        }),
        func((_, n): (Nat, Types.UserNeed)) : Types.UserNeed { n }
      );
    };
    
    public func preupgrade() {
      userNeedEntries := Iter.toArray(userNeeds.entries());
    };
    
    public func postupgrade() {
      for ((id, need) in userNeedEntries.vals()) {
        userNeeds.put(id, need);
      };
      userNeedEntries := [];
    };
  };
}