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
import Utils "utils";


module {
  public class ResourceManager() {
    private var resourceIdCounter: Nat = 0;
    private var resourceEntries: [(Nat, Types.Resource)] = [];
    private var categoryIdCounter: Nat = 0;
    private var categoryEntries: [(Nat, Types.Category)] = [];
    
    private func natHash(n: Nat) : Hash.Hash {
      let text = Int.toText(n);
      Text.hash(text)
    };
    
    private let resources = HashMap.HashMap<Nat, Types.Resource>(
      10, Nat.equal, natHash
    );
    
    private let categories = HashMap.HashMap<Nat, Types.Category>(
      10, Nat.equal, natHash
    );
    
    
    public func addResource(
      caller: Principal,
      category: Text,
      tags: [Types.Tag],
      description: Text,
      quantity: Nat,
      location: Text,
      coordinates: ?Types.Coordinates,
      media: [Types.MediaItem],
      expirationDays: ?Nat
    ) : Nat {
      let now = Time.now();
      let expiresAt = switch (expirationDays) {
      case (null) { null };
      case (?days) { 
      // Direct conversion from Nat to Int
      let daysInt : Int = days; // Implicit conversion
      ?(now + (daysInt * 24 * 60 * 60 * 1_000_000_000))
      };
    };
      
      resourceIdCounter += 1;
      let newResource: Types.Resource = {
        id = resourceIdCounter;
        owner = caller;
        category = category;
        tags = tags;
        description = description;
        quantity = quantity;
        location = location;
        coordinates = coordinates;
        media = media;
        status = "Available";
        claimedBy = null;
        reservedBy = null;
        reservationExpiry = null;
        createdAt = now;
        expiresAt = expiresAt;
      };
      
      resources.put(resourceIdCounter, newResource);
      return resourceIdCounter;
    };
    
    public func getResource(resourceId: Nat) : ?Types.Resource {
      resources.get(resourceId)
    };
    
    public func getAvailableResources() : [Types.Resource] {
      let now = Time.now();
      let resourcesArray = Iter.toArray(resources.entries());
      return Array.map<(Nat, Types.Resource), Types.Resource>(
        Array.filter<(Nat, Types.Resource)>(resourcesArray, func((_, r): (Nat, Types.Resource)) : Bool { 
          // Check if resource is available and not expired
          let notExpired = switch (r.expiresAt) {
            case (null) { true };
            case (?expiry) { expiry > now };
          };
          return r.status == "Available" and notExpired;
        }),
        func((_, r): (Nat, Types.Resource)) : Types.Resource { r }
      );
    };
    
    public func reserveResource(
      caller: Principal,
      resourceId: Nat,
      reservationHours: Nat
    ) : Result.Result<Text, Text> {
      switch (resources.get(resourceId)) {
        case (null) { return #err("Resource not found"); };
        case (?resource) {
          if (resource.status != "Available") {
            return #err("Resource is not available for reservation");
          };
          
          let now = Time.now();
          let reservationHoursInt : Int = reservationHours;
          let reservationExpiry = now + (reservationHoursInt * 60 * 60 * 1_000_000_000);
          
          let updatedResource: Types.Resource = {
            id = resource.id;
            owner = resource.owner;
            category = resource.category;
            tags = resource.tags;
            description = resource.description;
            quantity = resource.quantity;
            location = resource.location;
            coordinates = resource.coordinates;
            media = resource.media;
            status = "Reserved";
            claimedBy = null;
            reservedBy = ?Principal.toText(caller);
            reservationExpiry = ?reservationExpiry;
            createdAt = resource.createdAt;
            expiresAt = resource.expiresAt;
          };
          
          resources.put(resourceId, updatedResource);
          return #ok("Resource reserved successfully until " # Int.toText(reservationExpiry));
        };
      };
    };
    
    public func claimResource(
      caller: Principal,
      resourceId: Nat
    ) : Result.Result<Text, Text> {
      switch (resources.get(resourceId)) {
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
          
          let updatedResource: Types.Resource = {
            id = resource.id;
            owner = resource.owner;
            category = resource.category;
            tags = resource.tags;
            description = resource.description;
            quantity = resource.quantity;
            location = resource.location;
            coordinates = resource.coordinates;
            media = resource.media;
            status = "Claimed";
            claimedBy = ?Principal.toText(caller);
            reservedBy = null;
            reservationExpiry = null;
            createdAt = resource.createdAt;
            expiresAt = resource.expiresAt;
          };
          
          resources.put(resourceId, updatedResource);
          return #ok("Resource claimed successfully");
        };
      };
    };
    
    public func addCategory(name: Text, description: Text) : Nat {
      categoryIdCounter += 1;
      let newCategory: Types.Category = {
        id = categoryIdCounter;
        name = name;
        description = description;
      };
      
      categories.put(categoryIdCounter, newCategory);
      return categoryIdCounter;
    };
    
    public func getCategories() : [Types.Category] {
      Iter.toArray(categories.vals())
    };
    
    public func searchResourcesByTags(searchTags: [Types.Tag]) : [Types.Resource] {
      let resourcesArray = Iter.toArray(resources.entries());
      return Array.map<(Nat, Types.Resource), Types.Resource>(
        Array.filter<(Nat, Types.Resource)>(resourcesArray, func((_, r): (Nat, Types.Resource)) : Bool { 
          // Check if any of the resource tags match any of the search tags
          for (searchTag in searchTags.vals()) {
            for (resourceTag in r.tags.vals()) {
              if (Text.equal(searchTag, resourceTag)) {
                return true;
              };
            };
          };
          return false;
        }),
        func((_, r): (Nat, Types.Resource)) : Types.Resource { r }
      );
    };
    
    public func findResourcesNearby(userCoordinates: Types.Coordinates, maxDistanceKm: Float) : [Types.Resource] {
      let resourcesArray = Iter.toArray(resources.entries());
      return Array.map<(Nat, Types.Resource), Types.Resource>(
        Array.filter<(Nat, Types.Resource)>(resourcesArray, func((_, r): (Nat, Types.Resource)) : Bool { 
          switch (r.coordinates) {
            case (null) { false };
            case (?coords) {
              let distance = Utils.calculateDistance(userCoordinates, coords);
              return distance <= maxDistanceKm and r.status == "Available";
            };
          };
        }),
        func((_, r): (Nat, Types.Resource)) : Types.Resource { r }
      );
    };
    
    public func checkAndReleaseExpiredReservations() : Nat {
      let now = Time.now();
      let resourcesArray = Iter.toArray(resources.entries());
      var releasedCount = 0;
      
      for ((id, resource) in resourcesArray.vals()) {
        if (resource.status == "Reserved") {
          switch (resource.reservationExpiry) {
            case (null) { /* Should not happen */ };
            case (?expiry) {
              if (now > expiry) {
                // Reservation has expired, release it
                let updatedResource: Types.Resource = {
                  id = resource.id;
                  owner = resource.owner;
                  category = resource.category;
                  tags = resource.tags;
                  description = resource.description;
                  quantity = resource.quantity;
                  location = resource.location;
                  coordinates = resource.coordinates;
                  media = resource.media;
                  status = "Available";
                  claimedBy = null;
                  reservedBy = null;
                  reservationExpiry = null;
                  createdAt = resource.createdAt;
                  expiresAt = resource.expiresAt;
                };
                
                resources.put(id, updatedResource);
                releasedCount += 1;
              };
            };
          };
        };
      };
      
      return releasedCount;
    };
    
    public func addMediaToResource(
      caller: Principal,
      resourceId: Nat,
      newMedia: Types.MediaItem
    ) : Result.Result<Text, Text> {
      switch (resources.get(resourceId)) {
        case (null) { return #err("Resource not found"); };
        case (?resource) {
          if (resource.owner != caller) {
            return #err("Only the owner can add media to this resource");
          };
          
          let updatedMedia = Array.append<Types.MediaItem>(resource.media, [newMedia]);
          
          let updatedResource: Types.Resource = {
            id = resource.id;
            owner = resource.owner;
            category = resource.category;
            tags = resource.tags;
            description = resource.description;
            quantity = resource.quantity;
            location = resource.location;
            coordinates = resource.coordinates;
            media = updatedMedia;
            status = resource.status;
            claimedBy = resource.claimedBy;
            reservedBy = resource.reservedBy;
            reservationExpiry = resource.reservationExpiry;
            createdAt = resource.createdAt;
            expiresAt = resource.expiresAt;
          };
          
          resources.put(resourceId, updatedResource);
          return #ok("Media added successfully");
        };
      };
    };
    
    public func preupgrade() {
      resourceEntries := Iter.toArray(resources.entries());
      categoryEntries := Iter.toArray(categories.entries());
    };
    
    public func postupgrade() {
      for ((id, resource) in resourceEntries.vals()) {
        resources.put(id, resource);
      };
      for ((id, category) in categoryEntries.vals()) {
        categories.put(id, category);
      };
      resourceEntries := [];
      categoryEntries := [];
    };
  };
}