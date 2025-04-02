module {
  public type Tag = Text;
  
  public type Coordinates = {
    latitude: Float;
    longitude: Float;
  };
  
  public type MediaItem = {
    contentType: Text;
    url: Text;
    description: ?Text;
  };
  
  public type Resource = {
    id: Nat;
    owner: Principal;
    category: Text;
    tags: [Tag];
    description: Text;
    quantity: Nat;
    location: Text;
    coordinates: ?Coordinates;
    media: [MediaItem];
    status: Text;
    claimedBy: ?Text;
    reservedBy: ?Text;
    reservationExpiry: ?Int;
    createdAt: Int;
    expiresAt: ?Int;
  };
  
  public type UserProfile = {
    principal: Principal;
    name: Text;
    bio: Text;
    contactInfo: Text;
    reputationScore: Float;
    totalTransactions: Nat;
    memberSince: Int;
  };
  
  public type Review = {
    reviewer: Principal;
    resourceId: Nat;
    rating: Nat;
    comment: Text;
    timestamp: Int;
  };
  
  public type Category = {
    id: Nat;
    name: Text;
    description: Text;
  };
  
  public type NotificationType = {
    #ResourceClaimed;
    #ResourceReserved;
    #ReservationExpired;
    #NewReview;
    #ResourceExpiringSoon;
    #Custom: Text;
  };
  
  public type Notification = {
    id: Nat;
    recipient: Principal;
    notificationType: NotificationType;
    resourceId: ?Nat;
    message: Text;
    isRead: Bool;
    timestamp: Int;
  };
  
  public type ResourceAction = {
    #Created;
    #Updated;
    #Reserved;
    #ReservationExpired;
    #Claimed;
    #Released;
    #Expired;
    #Custom: Text;
  };
  
  public type ResourceHistoryEntry = {
    resourceId: Nat;
    action: ResourceAction;
    actorPrincipal: Principal;
    timestamp: Int;
    details: Text;
  };
  
  public type UserNeed = {
    userId: Principal;
    category: Text;
    tags: [Tag];
    description: Text;
    timestamp: Int;
    fulfilled: Bool;
  };
}