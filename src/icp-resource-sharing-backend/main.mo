import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Int "mo:base/Int";

actor ResourceSharingPlatform {
    // Define a structure for a resource listing
    type Resource = {
        id: Nat;
        owner: Principal;
        category: Text;
        quantity: Nat;
        location: Text;
        status: Text; // Available, Claimed, Delivered
    };

    // Store listings in a hash map
    stable var resourceIdCounter: Nat = 0;
    stable var resourceEntries: [(Nat, Resource)] = [];
    
    func natHash(n: Nat) : Hash.Hash {
        let text = Int.toText(n);
        Text.hash(text)
    };
    
    let resources = HashMap.fromIter<Nat, Resource>(
        resourceEntries.vals(), 
        10, 
        Nat.equal, 
        natHash
    );

    // Function to add a new resource listing
    public shared ({ caller }) func addResource(category: Text, quantity: Nat, location: Text) : async Nat {
        let newId = resourceIdCounter + 1;
        let newResource: Resource = {
            id = newId;
            owner = caller;
            category = category;
            quantity = quantity;
            location = location;
            status = "Available";
        };
        
        resources.put(newId, newResource);
        resourceIdCounter := newId;
        return newId;
    };

    // Function to get all available resources
    public query func getAvailableResources() : async [Resource] {
        // Convert HashMap to array using Iter
        let resourcesArray = Iter.toArray(resources.entries());
        return Array.map<(Nat, Resource), Resource>(
            Array.filter<(Nat, Resource)>(resourcesArray, func((_, r): (Nat, Resource)) : Bool { 
                r.status == "Available" 
            }),
            func((_, r): (Nat, Resource)) : Resource { r }
        );
    };

    // Function to claim a resource (to be extended with AI matching)
    public shared func claimResource(resourceId: Nat) : async Text {
        switch (resources.get(resourceId)) {
            case (null) { return "Resource not found"; };
            case (?resource) {
                if (resource.status == "Available") {
                    let updatedResource: Resource = { 
                        id = resource.id;
                        owner = resource.owner;
                        category = resource.category;
                        quantity = resource.quantity;
                        location = resource.location;
                        status = "Claimed";
                    };
                    resources.put(resourceId, updatedResource);
                    return "Resource claimed successfully";
                } else {
                    return "Resource already claimed";
                };
            };
        }
    };
    
    // System functions for upgrades
    system func preupgrade() {
        resourceEntries := Iter.toArray(resources.entries());
    };
    
    system func postupgrade() {
        resourceEntries := [];
    };
}