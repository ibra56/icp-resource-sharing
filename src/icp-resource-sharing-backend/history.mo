import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Types "types";

module {
  public class HistoryManager() {
    private var historyEntryIdCounter: Nat = 0;
    private var resourceHistoryEntries: [(Nat, Types.ResourceHistoryEntry)] = [];
    
    private func natHash(n: Nat) : Hash.Hash {
      let text = Int.toText(n);
      Text.hash(text)
    };
    
    private let resourceHistory = HashMap.HashMap<Nat, Types.ResourceHistoryEntry>(
      10, Nat.equal, natHash
    );
    
    public func recordResourceHistory(
      resourceId: Nat,
      action: Types.ResourceAction,
      actorPrincipal: Principal,
      details: Text
    ) : Nat {
      historyEntryIdCounter += 1;
      let historyEntry: Types.ResourceHistoryEntry = {
        resourceId = resourceId;
        action = action;
        actorPrincipal = actorPrincipal;
        timestamp = Time.now();
        details = details;
      };
      
      resourceHistory.put(historyEntryIdCounter, historyEntry);
      return historyEntryIdCounter;
    };
    
    public func getResourceHistory(resourceId: Nat) : [Types.ResourceHistoryEntry] {
      let allHistory = Iter.toArray(resourceHistory.entries());
      return Array.map<(Nat, Types.ResourceHistoryEntry), Types.ResourceHistoryEntry>(
        Array.filter<(Nat, Types.ResourceHistoryEntry)>(allHistory, func((_, h): (Nat, Types.ResourceHistoryEntry)) : Bool { 
          h.resourceId == resourceId
        }),
        func((_, h): (Nat, Types.ResourceHistoryEntry)) : Types.ResourceHistoryEntry { h }
      );
    };
    
    public func preupgrade() {
      resourceHistoryEntries := Iter.toArray(resourceHistory.entries());
    };
    
    public func postupgrade() {
      for ((id, entry) in resourceHistoryEntries.vals()) {
        resourceHistory.put(id, entry);
      };
      resourceHistoryEntries := [];
    };
  };
}