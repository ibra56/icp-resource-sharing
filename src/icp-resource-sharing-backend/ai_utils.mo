import LLM "mo:llm";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Types "types";
import Utils "utils";


module {
  public class AIManager() {
    public func rankResourcesByRelevance(
      resources: [Types.Resource], 
      userNeeds: Text, 
      userLocation: Text
    ) : async [Types.Resource] {
      if (resources.size() == 0) {
        return [];
      };

      var rankedResources : [Types.Resource] = [];
      
      for (resource in resources.vals()) {
        // Create a prompt for the LLM to evaluate the match
        let prompt = "I need: " # userNeeds # ". I am located at: " # userLocation # 
                     ". There is a resource in category: " # resource.category # 
                     " with description: " # resource.description # 
                     " located at: " # resource.location # 
                     ". On a scale of 0 to 10, how well does this resource match my needs? Just respond with a number.";
        
        // Call the LLM
        let response = await LLM.prompt(#Llama3_1_8B, prompt);
        
        
        let score = Utils.extractScore(response);
        
        if (score > 7) {  
          rankedResources := Array.append(rankedResources, [resource]);
        };
      };
      
      return rankedResources;
    };
    
    public func evaluateResourceMatch(
      resourceCategory: Text,
      resourceDescription: Text,
      userNeeds: Text
    ) : async Bool {
      let prompt = "I need: " # userNeeds # 
                   ". There is a resource in category: " # resourceCategory # 
                   " with description: " # resourceDescription # 
                   ". Should I claim this resource? Answer only yes or no.";
      
      let response = await LLM.prompt(#Llama3_1_8B, prompt);
      
      // Check if the response contains "yes"
      return Text.contains(Text.toLowercase(response), #text "yes");
    };
    
    public func getResourceMatchAnalysis(
      resourceCategory: Text,
      resourceDescription: Text,
      resourceLocation: Text,
      userNeeds: Text
    ) : async Text {
      let prompt = "I need: " # userNeeds # 
                   ". There is a resource in category: " # resourceCategory # 
                   " with description: " # resourceDescription # 
                   " located at: " # resourceLocation # 
                   ". Analyze in 3-5 sentences how well this resource matches my needs.";
      
      let response = await LLM.prompt(#Llama3_1_8B, prompt);
      return response;
    };
    
    public func predictUserNeeds(userPastNeeds: [Types.UserNeed]) : async Text {
      if (userPastNeeds.size() < 2) {
        return "Not enough data to predict your needs. Please use the platform more.";
      };
      
      // Create a prompt for the LLM with the user's past needs
      var prompt = "Based on the following past needs of a user, predict what they might need next:\n\n";
      
      for (need in userPastNeeds.vals()) {
        prompt := prompt # "- Category: " # need.category # ", Tags: " # 
                 Text.join(", ", Array.map<Types.Tag, Text>(need.tags, func(t: Types.Tag) : Text { t }).vals()) # 
                 ", Description: " # need.description # "\n";
      };
      
      prompt := prompt # "\nPredict the user's next need in the following format:\nCategory: [predicted category]\nTags: [predicted tags]\nDescription: [brief description of the predicted need]";
      
      // Call the LLM
      let response = await LLM.prompt(#Llama3_1_8B, prompt);
      return response;
    };
    
    public func suggestResourcesBasedOnPrediction(
      prediction: Text,
      availableResources: [Types.Resource]
    ) : async [Types.Resource] {
      if (availableResources.size() == 0) {
        return [];
      };
      
      var rankedResources : [Types.Resource] = [];
      
      for (resource in availableResources.vals()) {
        let prompt = "I have the following predicted need:\n" # prediction # 
                     "\n\nRate how well this resource matches the predicted need on a scale of 0-10:\n" #
                     "Resource Category: " # resource.category # 
                     ", Tags: " # Text.join(", ", Array.map<Types.Tag, Text>(resource.tags, func(t: Types.Tag) : Text { t }).vals()) # 
                     ", Description: " # resource.description;
        
        let response = await LLM.prompt(#Llama3_1_8B, prompt);
        let score = Utils.extractScore(response);
        
        if (score > 6) {  // Include good matches
          rankedResources := Array.append(rankedResources, [resource]);
        };
      };
      
      return rankedResources;
    };
  };
}