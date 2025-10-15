import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 3;

  // Public getters
  get socketInstance() {
    return this.socket;
  }

  get connectionStatus() {
    return this.isConnected;
  }

  // Simple connection method
  async connect(token?: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      // Clean up existing connection
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080";
      const authToken = token || localStorage.getItem("token");

      if (!authToken) {
        reject(new Error("No authentication token"));
        return;
      }

      // Reset connection state
      this.isConnected = false;
      this.connectionAttempts = 0;

      console.log("🔌 Connecting to socket...");
      console.log("🔌 Backend URL:", backendUrl);
      console.log("🔌 Token length:", authToken?.length);
      console.log("🔌 Token preview:", authToken?.substring(0, 20) + "...");

      this.socket = io(backendUrl, {
        auth: { token: authToken },
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });

      // Connection success
      this.socket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        this.isConnected = true;
        this.connectionAttempts = 0;
        resolve(this.socket!);
      });

      // Connection error
      this.socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        console.error("❌ Error type:", (error as any).type);
        console.error("❌ Error description:", (error as any).description);
        console.error("❌ Error context:", (error as any).context);
        this.isConnected = false;
        this.connectionAttempts++;

        // Don't reject immediately, let the timeout handle it
        if (this.connectionAttempts >= this.maxRetries) {
          reject(new Error("Maximum connection attempts reached"));
        }
      });

      // Auth error
      this.socket.on("auth_error", (error) => {
        console.error("❌ Socket authentication error:", error);
        console.error(
          "❌ This usually means your token is outdated. Please log out and log in again."
        );
        this.isConnected = false;
        reject(
          new Error(
            "Authentication failed - please log out and log in again to get a new token"
          )
        );
      });

      // Disconnect
      this.socket.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
        this.isConnected = false;
      });

      // Timeout
      setTimeout(() => {
        if (!this.isConnected) {
          console.error("⏰ Socket connection timeout after 10 seconds");
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Support system events
  joinSupportTicket(ticketId: string) {
    console.log(`📨 Attempting to join ticket room: ${ticketId}`);
    console.log(`📨 Socket exists: ${!!this.socket}`);
    console.log(`📨 Socket connected: ${this.socket?.connected}`);
    console.log(`📨 Service connected: ${this.isConnected}`);

    if (this.socket && this.isConnected) {
      this.socket.emit("join_support_ticket", ticketId);
      console.log(`✅ Joined ticket room: ${ticketId}`);
    } else {
      console.log(`❌ Cannot join room - socket not ready`);
    }
  }

  leaveSupportTicket(ticketId: string) {
    if (this.socket) {
      this.socket.emit("leave_support_ticket", ticketId);
    }
  }

  // Send support message via socket
  sendSupportMessage(ticketId: string, message: string, messageType = "text") {
    console.log(`📡 Attempting to send message via socket: ${message}`);
    console.log(`📡 Socket exists: ${!!this.socket}`);
    console.log(`📡 Socket connected: ${this.socket?.connected}`);
    console.log(`📡 Service connected: ${this.isConnected}`);

    if (this.socket && this.isConnected) {
      this.socket.emit("send_support_message", {
        ticketId,
        message,
        messageType,
      });
      console.log(`✅ Message sent via socket`);
    } else {
      console.log(`❌ Cannot send via socket - not connected`);
    }
  }

  // Typing indicators
  startSupportTyping(ticketId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("support_typing_start", ticketId);
    }
  }

  stopSupportTyping(ticketId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("support_typing_stop", ticketId);
    }
  }

  markSupportMessagesRead(ticketId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit("mark_support_messages_read", ticketId);
    }
  }

  // Event listeners
  onNewSupportMessage(
    callback: (data: { ticketId: string; message: any }) => void
  ) {
    if (this.socket) {
      this.socket.on("new_support_message", callback);
    }
  }

  onSupportUserTyping(callback: (data: { userType: string }) => void) {
    if (this.socket) {
      this.socket.on("support_user_typing", callback);
    }
  }

  onSupportUserStoppedTyping(callback: (data: { userType: string }) => void) {
    if (this.socket) {
      this.socket.on("support_user_stopped_typing", callback);
    }
  }

  onSupportTicketStatusUpdated(
    callback: (data: { ticketId: string; status: string }) => void
  ) {
    if (this.socket) {
      this.socket.on("support_ticket_status_updated", callback);
    }
  }

  onTicketAutoClosed(
    callback: (data: {
      ticketId: string;
      reason: string;
      inactiveMinutes: number;
    }) => void
  ) {
    if (this.socket) {
      this.socket.on("ticket_auto_closed", callback);
    }
  }

  // Remove event listeners
  offNewSupportMessage() {
    if (this.socket) {
      this.socket.off("new_support_message");
    }
  }

  offSupportUserTyping() {
    if (this.socket) {
      this.socket.off("support_user_typing");
    }
  }

  offSupportUserStoppedTyping() {
    if (this.socket) {
      this.socket.off("support_user_stopped_typing");
    }
  }

  offSupportTicketStatusUpdated() {
    if (this.socket) {
      this.socket.off("support_ticket_status_updated");
    }
  }

  offTicketAutoClosed() {
    if (this.socket) {
      this.socket.off("ticket_auto_closed");
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
    };
  }

  getSocket() {
    return this.socket;
  }

  // Debug method to check token validity
  debugToken() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ No token found in localStorage");
      return null;
    }

    try {
      // Decode JWT without verification (for debugging only)
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("🔍 Token payload:", payload);
      console.log("🔍 Token has required fields:", {
        id: !!payload.id,
        role: !!payload.role,
        username: !!payload.username,
        email: !!payload.email,
        exp: !!payload.exp,
      });
      return payload;
    } catch (error) {
      console.error("❌ Failed to decode token:", error);
      return null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
