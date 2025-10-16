"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { socketService } from "@/lib/socket";

export interface Notification {
  id: string;
  type: "order" | "ticket";
  title: string;
  message: string;
  timestamp: Date;
  data: any;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
}

type NotificationAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "CLEAR_NOTIFICATIONS" };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
};

function notificationReducer(
  state: NotificationState,
  action: NotificationAction
): NotificationState {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      const newNotification = { ...action.payload, read: false };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };

    case "MARK_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case "MARK_ALL_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) => ({
          ...notif,
          read: true,
        })),
        unreadCount: 0,
      };

    case "REMOVE_NOTIFICATION":
      const notificationToRemove = state.notifications.find(
        (n) => n.id === action.payload
      );
      return {
        ...state,
        notifications: state.notifications.filter(
          (notif) => notif.id !== action.payload
        ),
        unreadCount: notificationToRemove?.read
          ? state.unreadCount
          : Math.max(0, state.unreadCount - 1),
      };

    case "SET_CONNECTION_STATUS":
      return {
        ...state,
        isConnected: action.payload,
      };

    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    default:
      return state;
  }
}

interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, "id" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  reconnectIfNeeded: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useAdminNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useAdminNotifications must be used within an AdminNotificationProvider"
    );
  }
  return context;
};

interface AdminNotificationProviderProps {
  children: ReactNode;
}

export const AdminNotificationProvider: React.FC<
  AdminNotificationProviderProps
> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = (notification: Omit<Notification, "id" | "read">) => {
    const id = `notification_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    dispatch({
      type: "ADD_NOTIFICATION",
      payload: { ...notification, id, read: false },
    });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: "MARK_AS_READ", payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: "MARK_ALL_AS_READ" });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: "CLEAR_NOTIFICATIONS" });
  };

  const connectSocket = async () => {
    try {
      // Get admin token specifically
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        console.warn("No admin token found, skipping socket connection");
        return;
      }

      await socketService.connect(adminToken);
      dispatch({ type: "SET_CONNECTION_STATUS", payload: true });

      // Listen for new order notifications
      socketService.socketInstance?.on(
        "new_order_notification",
        (data: any) => {
          console.log("📦 New order notification received:", data);
          addNotification({
            type: "order",
            title: "New Order Placed",
            message: `Order #${data.orderId.slice(-6)} for ₹${
              data.totalAmount
            } with ${data.itemsCount} items`,
            timestamp: new Date(data.timestamp),
            data: data,
          });
        }
      );

      // Listen for new ticket notifications
      socketService.socketInstance?.on(
        "new_ticket_notification",
        (data: any) => {
          console.log("🎫 New ticket notification received:", data);
          addNotification({
            type: "ticket",
            title: "New Support Ticket",
            message: `${data.subject} - ${data.userEmail}`,
            timestamp: new Date(data.timestamp),
            data: data,
          });
        }
      );

      console.log("✅ Admin notification socket connected");
    } catch (error) {
      console.error("❌ Failed to connect admin notification socket:", error);
      dispatch({ type: "SET_CONNECTION_STATUS", payload: false });
    }
  };

  const disconnectSocket = () => {
    socketService.disconnect();
    dispatch({ type: "SET_CONNECTION_STATUS", payload: false });
  };

  const reconnectIfNeeded = () => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken && !state.isConnected) {
      console.log(
        "🔄 Admin token available, attempting to reconnect socket..."
      );
      connectSocket();
    }
  };

  useEffect(() => {
    // Check if admin is authenticated before connecting
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      // Connect socket when component mounts and admin is authenticated
      connectSocket();
    } else {
      console.warn("Admin not authenticated, skipping socket connection");
    }

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  const contextValue: NotificationContextType = {
    state,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    connectSocket,
    disconnectSocket,
    reconnectIfNeeded,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
