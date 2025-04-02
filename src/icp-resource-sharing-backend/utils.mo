import Text "mo:base/Text";
import Char "mo:base/Char";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import Nat32 "mo:base/Nat32";
import Array "mo:base/Array";
import Types "types";

module {
  // Extract a score from LLM response
  public func extractScore(response: Text) : Float {
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

  // Add this helper function to convert degrees to radians
private func toRadians(degrees: Float) : Float {
  return degrees * 3.14159265358979323846 / 180.0;
};
  
  // Calculate distance between two points using Haversine formula
  public func calculateDistance(coord1: Types.Coordinates, coord2: Types.Coordinates) : Float {
    let earthRadiusKm = 6371.0;
    let dLat = toRadians(coord2.latitude - coord1.latitude);
    let dLon = toRadians(coord2.longitude - coord1.longitude);
  
    let lat1 = toRadians(coord1.latitude);
    let lat2 = toRadians(coord2.latitude);
    
    let a = Float.sin(dLat/2) * Float.sin(dLat/2) +
        Float.sin(dLon/2) * Float.sin(dLon/2) * Float.cos(lat1) * Float.cos(lat2);
    let c = 2 * Float.arctan2(Float.sqrt(a), Float.sqrt(1-a));  // Changed from atan2 to arctan2
    return earthRadiusKm * c;
  };
}