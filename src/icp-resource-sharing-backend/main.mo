import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Array "mo:base/Array";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Char "mo:base/Char";
import LLM "mo:llm";

actor class ResourceSharingPlatform() {
    
    type Resource = {
        id: Nat;
        owner: Principal;
        category: Text;
        description: Text;  // Added description field for better AI matching
        quantity: Nat;
        location: Text;
        status: Text;
        claimedBy: ?Text;
    };

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

    public shared ({ caller }) func addResource(category: Text, description: Text, quantity: Nat, location: Text) : async Nat {
        let newId = resourceIdCounter + 1;
        let newResource: Resource = {
            id = newId;
            owner = caller;
            category = category;
            description = description;
            quantity = quantity;
            location = location;
            status = "Available";
            claimedBy = null;
        };
        
        resources.put(newId, newResource);
        resourceIdCounter := newId;
        return newId;
    };

    public query func getAvailableResources() : async [Resource] {
        let resourcesArray = Iter.toArray(resources.entries());
        return Array.map<(Nat, Resource), Resource>(
            Array.filter<(Nat, Resource)>(resourcesArray, func((_, r): (Nat, Resource)) : Bool { 
                r.status == "Available" 
            }),
            func((_, r): (Nat, Resource)) : Resource { r }
        );
    };

    // Function to get resource recommendations based on user needs
    public shared func getResourceRecommendations(userNeeds: Text, userLocation: Text) : async [Resource] {
        let availableResources = await getAvailableResources();
        
        // Use LLM to rank resources based on user needs
        let rankedResources = await rankResourcesByRelevance(availableResources, userNeeds, userLocation);
        return rankedResources;
    };

    // Helper function to rank resources using LLM
    private func rankResourcesByRelevance(resources: [Resource], userNeeds: Text, userLocation: Text) : async [Resource] {
        if (resources.size() == 0) {
            return [];
        };

        var rankedResources : [Resource] = [];
        
        for (resource in resources.vals()) {
            // Create a prompt for the LLM to evaluate the match
            let prompt = "I need: " # userNeeds # ". I am located at: " # userLocation # 
                         ". There is a resource in category: " # resource.category # 
                         " with description: " # resource.description # 
                         " located at: " # resource.location # 
                         ". On a scale of 0 to 10, how well does this resource match my needs? Just respond with a number.";
            
            // Call the LLM
            let response = await LLM.prompt(#Llama3_1_8B, prompt);
            
            // Try to extract a number from the response
            let score = extractScore(response);
            
            if (score > 7) {  // Only include good matches
                rankedResources := Array.append(rankedResources, [resource]);
            };
        };
        
        return rankedResources;
    };

    // Helper function to extract a score from LLM response
    private func extractScore(response: Text) : Float {
        // Simple extraction - in a real app, you'd want more robust parsing
        let digits = Iter.toArray(
            Iter.filter<Char>(Text.toIter(response), func (c: Char) : Bool {
                c >= '0' and c <= '9'
            })
        );
        
        switch (digits.size()) {
            case 0 { return 0; };
            case _ { 
                let scoreText = Text.fromIter(digits.vals());
                
                // Try to convert to a number
                var score : Float = 0;
                var i : Nat = 0;
                var decimalFound = false;
                var decimalPlace : Float = 10;
                
                for (c in Text.toIter(scoreText)) {
                    if (c >= '0' and c <= '9') {
                        let digit = Float.fromInt(Nat32.toNat(Char.toNat32(c) - 48));
                        if (decimalFound) {
                            score := score + digit / decimalPlace;
                            decimalPlace := decimalPlace * 10;
                        } else {
                            score := score * 10 + digit;
                        };
                    } else if (c == '.') {
                        decimalFound := true;
                    };
                    i += 1;
                };
                
                if (score > 10) { return 10; } 
                else { return score; }
            };
        };
    };

    public shared ({ caller }) func claimResourceWithAIMatching(resourceId: Nat, userNeeds: Text) : async Text {
        switch (resources.get(resourceId)) {
            case (null) { return "Resource not found"; };
            case (?resource) {
                if (resource.status != "Available") {
                    return "Resource is not available for claiming";
                };

                // Use LLM to determine if this is a good match
                let prompt = "I need: " # userNeeds # 
                             ". There is a resource in category: " # resource.category # 
                             " with description: " # resource.description # 
                             ". Should I claim this resource? Answer only yes or no.";
                
                let response = await LLM.prompt(#Llama3_1_8B, prompt);
                
                // Check if the response contains "yes"
                if (Text.contains(Text.toLowercase(response), #text "yes")) {
                    let updatedResource: Resource = {
                        id = resource.id;
                        owner = resource.owner;
                        category = resource.category;
                        description = resource.description;
                        quantity = resource.quantity;
                        location = resource.location;
                        status = "Claimed";
                        claimedBy = ?Principal.toText(caller);
                    };
                    
                    resources.put(resourceId, updatedResource);
                    return "Resource claimed successfully!";
                } else {
                    return "Based on AI analysis, this resource might not be the best match for your needs.";
                };
            };
        };
    };

    // Get detailed AI analysis of a resource match
    public func getResourceMatchAnalysis(resourceId: Nat, userNeeds: Text) : async Text {
        switch (resources.get(resourceId)) {
            case (null) { return "Resource not found"; };
            case (?resource) {
                let prompt = "I need: " # userNeeds # 
                             ". There is a resource in category: " # resource.category # 
                             " with description: " # resource.description # 
                             " located at: " # resource.location # 
                             ". Analyze in 3-5 sentences how well this resource matches my needs.";
                
                let response = await LLM.prompt(#Llama3_1_8B, prompt);
                return response;
            };
        };
    };

    system func preupgrade() {
        resourceEntries := Iter.toArray(resources.entries());
    };
    
    system func postupgrade() {
        resourceEntries := [];
    };
};