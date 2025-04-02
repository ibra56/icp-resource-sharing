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
  public class NotificationManager() {
    private var notificationIdCounter: Nat = 0;
    private var notificationEntries: [(Nat, Types.Notification)] = [];
    
    private func natHash(n: Nat) : Hash.Hash {
      let text = Int.toText(n);
      Text.hash(text)
    };
    
    private let notifications = HashMap.HashMap<Nat, Types.Notification>(
      10, Nat.equal, natHash
    );
    
    public func createNotification(
      recipient: Principal,
      notificationType: Types.NotificationType,
      resourceId: ?Nat,
      message: Text
    ) : Nat {
      notificationIdCounter += 1;
      let newNotification: Types.Notification = {
        id = notificationIdCounter;
        recipient = recipient;
        notificationType = notificationType;
        resourceId = resourceId;
        message = message;
        isRead = false;
        timestamp = Time.now();
      };
      
      notifications.put(notificationIdCounter, newNotification);
      return notificationIdCounter;
    };
    
    public func getUserNotifications(user: Principal, onlyUnread: Bool) : [Types.Notification] {
      let allNotifications = Iter.toArray(notifications.entries());
      return Array.map<(Nat, Types.Notification), Types.Notification>(
        Array.filter<(Nat, Types.Notification)>(allNotifications, func((_, n): (Nat, Types.Notification)) : Bool { 
          let isRecipient = Principal.equal(n.recipient, user);
          if (onlyUnread) {
            return isRecipient and not n.isRead;
          } else {
            return isRecipient;
          };
        }),
        func((_, n): (Nat, Types.Notification)) : Types.Notification { n }
      );
    };
    
    public func markNotificationsAsRead(user: Principal, notificationIds: [Nat]) : Nat {
      var markedCount = 0;
      
      for (id in notificationIds.vals()) {
        switch (notifications.get(id)) {
          case (null) { /* Notification not found */ };
          case (?notification) {
            if (Principal.equal(notification.recipient, user) and not notification.isRead) {
              let updatedNotification: Types.Notification = {
                id = notification.id;
                recipient = notification.recipient;
                notificationType = notification.notificationType;
                resourceId = notification.resourceId;
                message = notification.message;
                isRead = true;
                timestamp = notification.timestamp;
              };
              
              notifications.put(id, updatedNotification);
              markedCount += 1;
            };
          };
        };
      };
      
      return markedCount;
    };
    
    public func preupgrade() {
      notificationEntries := Iter.toArray(notifications.entries());
    };
    
    public func postupgrade() {
      for ((id, notification) in notificationEntries.vals()) {
        notifications.put(id, notification);
      };
      notificationEntries := [];
    };
  };
}