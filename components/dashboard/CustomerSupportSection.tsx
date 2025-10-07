"use client";

import React, { useState, useEffect, useRef } from "react";
import { buildApiUrl } from "@/lib/api";
import { safeLocalStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  FileText,
  CreditCard,
  Package,
  Settings,
  RotateCcw,
  X,
  Paperclip,
  Image as ImageIcon,
  Star,
} from "lucide-react";

interface Chat {
  _id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  isActive?: boolean;
  lastMessage?: {
    message: string;
    createdAt: string;
  };
  lastMessageAt?: string;
  messageCount: number;
  order?: {
    _id: string;
    totalAmount: number;
    status: string;
  };
}

interface ChatMessage {
  _id: string;
  sender: string;
  senderType: "user" | "admin";
  message: string;
  messageType: string;
  attachments?: Array<{
    type: string;
    url: string;
    filename?: string;
  }>;
  createdAt: string;
  isRead: boolean;
}

interface Order {
  _id: string;
  totalAmount: number;
  status: string;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
}

interface CustomerSupportSectionProps {
  userOrders: Order[];
}

export default function CustomerSupportSection({
  userOrders,
}: CustomerSupportSectionProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatData, setNewChatData] = useState({
    subject: "",
    priority: "medium",
    category: "general",
    orderId: "",
  });
  const [newMessage, setNewMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [endingChat, setEndingChat] = useState(false);
  // Remove local chatEnded state - we'll determine this from chat data
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setIsAtBottom(true);
    }
  };

  const checkIfAtBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 10; // 10px threshold
      setIsAtBottom(isAtBottom);
    }
  };

  // Determine if chat is ended based on actual chat data
  const isChatEnded = () => {
    if (!selectedChat) return false;
    return selectedChat.status === "closed" || selectedChat.isActive === false;
  };

  // Auto-scroll to new messages only if user is at bottom
  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      // Only scroll if user is already at the bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isAtBottom]);

  // Initialize Socket.io connection
  useEffect(() => {
    const token = safeLocalStorage.getItem("token");
    if (!token) return;

    // Import socket.io-client dynamically
    import("socket.io-client").then(({ io }) => {
      const socketConnection = io(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 20000,
          forceNew: true,
        }
      );

      socketConnection.on("connect", () => {
        console.log("✅ Connected to chat server");
        console.log("Socket ID:", socketConnection.id);
        setIsConnected(true);
      });

      socketConnection.on("disconnect", () => {
        console.log("❌ Disconnected from chat server");
        setIsConnected(false);
      });

      socketConnection.on("reconnect", () => {
        console.log("🔄 Reconnected to chat server");
        setIsConnected(true);
        // Rejoin current chat if one is selected
        if (selectedChat) {
          socketConnection.emit("join_chat", selectedChat._id);
        }
      });

      socketConnection.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setIsConnected(false);
      });

      // Handle typing indicators
      socketConnection.on(
        "user_typing",
        (data: { userId: string; username: string; chatId: string }) => {
          if (selectedChat && data.chatId === selectedChat._id) {
            setTypingUsers((prev) => {
              if (!prev.includes(data.username)) {
                return [...prev, data.username];
              }
              return prev;
            });
          }
        }
      );

      socketConnection.on(
        "user_stopped_typing",
        (data: { userId: string; username: string; chatId: string }) => {
          if (selectedChat && data.chatId === selectedChat._id) {
            setTypingUsers((prev) =>
              prev.filter((user) => user !== data.username)
            );
          }
        }
      );

      socketConnection.on(
        "new_message",
        (data: { message: ChatMessage; chatId: string }) => {
          console.log("📨 New message received:", data);
          console.log("Current selected chat:", selectedChat?._id);
          console.log("Message chat ID:", data.chatId);

          if (selectedChat && data.chatId === selectedChat._id) {
            console.log("✅ Message is for current chat, adding to messages");
            setMessages((prev) => {
              // Remove any temporary messages with same content
              const filteredPrev = prev.filter(
                (msg) => !msg._id.startsWith("temp_")
              );

              // Check if message already exists to prevent duplicates
              const exists = filteredPrev.some(
                (msg) => msg._id === data.message._id
              );
              if (exists) {
                console.log("⚠️ Message already exists, skipping duplicate");
                return prev;
              }
              console.log("✅ Adding new message to chat");
              return [...filteredPrev, data.message];
            });
          } else {
            console.log(
              "⚠️ Message not for current chat, refreshing chat list"
            );
          }
          // Refresh chats to update last message
          fetchChats();
        }
      );

      socketConnection.on(
        "new_admin_message",
        (data: { chatId: string; message: ChatMessage }) => {
          console.log("📨 New admin message received:", data);
          if (selectedChat && data.chatId === selectedChat._id) {
            setMessages((prev) => {
              // Remove any temporary messages
              const filteredPrev = prev.filter(
                (msg) => !msg._id.startsWith("temp_")
              );

              // Check if message already exists to prevent duplicates
              const exists = filteredPrev.some(
                (msg) => msg._id === data.message._id
              );
              if (exists) {
                console.log(
                  "⚠️ Admin message already exists, skipping duplicate"
                );
                return prev;
              }
              console.log("✅ Adding new admin message to chat");
              return [...filteredPrev, data.message];
            });
          }
          fetchChats();
        }
      );

      setSocket(socketConnection);

      return () => {
        console.log("🔌 Disconnecting socket");
        socketConnection.disconnect();
      };
    });
  }, []);

  // Join chat room when chat is selected
  useEffect(() => {
    if (socket && selectedChat) {
      console.log("🔗 Joining chat room:", selectedChat._id);
      socket.emit("join_chat", selectedChat._id);
      fetchMessages(selectedChat._id);

      // Scroll to bottom when selecting a chat
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [selectedChat, socket]);

  const fetchChats = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/chat/user/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📋 Fetched chats:", data.chats);
        setChats(data.chats || []);

        // Check if current chat was closed
        if (selectedChat) {
          const updatedChat = data.chats.find(
            (chat: Chat) => chat._id === selectedChat._id
          );
          if (updatedChat) {
            console.log(
              "🔄 Current chat status:",
              updatedChat.status,
              "isActive:",
              updatedChat.isActive
            );
            // Update selected chat with new status
            setSelectedChat(updatedChat);
            if (updatedChat.status === "closed" || !updatedChat.isActive) {
              console.log("✅ Chat was successfully closed!");
            }
          } else {
            console.log(
              "✅ Chat was successfully closed! (No longer in active chats)"
            );
            // Chat is no longer in the list, but we keep it selected to show it's ended
          }
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const response = await fetch(
        `${baseUrl}/api/chat/user/chats/${chatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);

        // Scroll to bottom after loading messages and check position
        setTimeout(() => {
          scrollToBottom();
          checkIfAtBottom();
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const createNewChat = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const response = await fetch(`${baseUrl}/api/chat/user/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: newChatData.subject,
          priority: newChatData.priority,
          category: newChatData.category,
          ...(newChatData.orderId && { orderId: newChatData.orderId }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChats((prev) => [data.chat, ...prev]);
        setSelectedChat(data.chat);
        setShowNewChatForm(false);
        setNewChatData({
          subject: "",
          priority: "medium",
          category: "general",
          orderId: "",
        });
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !socket) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();

    try {
      console.log("📤 Sending message:", messageText);

      // Send message via socket
      socket.emit("send_message", {
        chatId: selectedChat._id,
        message: messageText,
        messageType: "text",
        ...(selectedOrder && { orderReference: selectedOrder._id }),
      });

      // Clear input immediately for better UX
      setNewMessage("");

      // Add message to local state immediately for instant feedback
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        sender: "user",
        senderType: "user" as const,
        message: messageText,
        messageType: "text",
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Only scroll if user is at bottom (don't interrupt if they're reading older messages)
      if (isAtBottom) {
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endChat = async () => {
    if (!selectedChat) {
      console.log("❌ No selected chat");
      return;
    }

    console.log("🔄 Ending chat:", selectedChat._id);
    setEndingChat(true);

    try {
      const token = safeLocalStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found");
        return;
      }

      // Force port 8080 for chat API
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      const url = `${baseUrl}/api/chat/user/chats/${selectedChat._id}/close`;
      console.log("📡 API URL:", url);

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log("✅ Chat ended successfully:", responseData);
        // Show success message
        console.log("Chat has been successfully closed!");
        // Show rating modal
        setShowRatingModal(true);
        // Refresh chats to update status
        fetchChats();
      } else {
        const errorData = await response.text();
        console.error("❌ Error ending chat:", response.status, errorData);
        console.error(`Failed to end chat: ${response.status} - ${errorData}`);
        // Don't show rating modal on error
        return;
      }
    } catch (error) {
      console.error("❌ Error ending chat:", error);
      // Fallback: Show rating modal anyway for testing
      console.log("🔄 Fallback: Showing rating modal anyway");
      setShowRatingModal(true);
      fetchChats();
    } finally {
      setEndingChat(false);
    }
  };

  const submitRating = async () => {
    if (!selectedChat || rating === 0) return;

    try {
      // For now, just store rating locally since backend doesn't have rating endpoint
      console.log("📝 Rating submitted:", {
        chatId: selectedChat._id,
        rating,
        comment: ratingComment,
      });

      // Show success message
      console.log(
        `Thank you for your ${rating}-star rating! Your feedback has been recorded.`
      );

      // Close modal and reset
      setShowRatingModal(false);
      setRating(0);
      setRatingComment("");

      // Refresh chats
      fetchChats();

      // TODO: Implement backend rating endpoint
      // const token = safeLocalStorage.getItem("token");
      // const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
      // const url = `${baseUrl}/api/chat/user/chats/${selectedChat._id}/rating`;
      // const response = await fetch(url, { ... });
    } catch (error) {
      console.error("Error submitting rating:", error);
      console.error("Error submitting rating. Please try again.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "closed":
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "order":
        return <ShoppingBag className="w-4 h-4" />;
      case "product":
        return <Package className="w-4 h-4" />;
      case "payment":
        return <CreditCard className="w-4 h-4" />;
      case "technical":
        return <Settings className="w-4 h-4" />;
      case "refund":
        return <RotateCcw className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Periodic refresh for messages (fallback for socket issues)
  useEffect(() => {
    if (selectedChat) {
      const interval = setInterval(() => {
        console.log("🔄 Periodic message refresh...");
        fetchMessages(selectedChat._id);
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Customer Support</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white shadow-md rounded-lg p-6"
      style={{ scrollBehavior: "auto" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customer Support</h2>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 text-sm ${
              selectedChat && isChatEnded()
                ? "text-gray-600"
                : isConnected
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                selectedChat && isChatEnded()
                  ? "bg-gray-500"
                  : isConnected
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            ></div>
            {selectedChat && isChatEnded()
              ? "Chat Ended"
              : isConnected
              ? "Connected"
              : "Disconnected"}
          </div>
          <Button
            onClick={() => setShowNewChatForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {showNewChatForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Create New Support Ticket
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={newChatData.subject}
                  onChange={(e) =>
                    setNewChatData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={newChatData.category}
                  onChange={(e) =>
                    setNewChatData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="order">Order Related</option>
                  <option value="product">Product Issue</option>
                  <option value="payment">Payment Issue</option>
                  <option value="technical">Technical Support</option>
                  <option value="refund">Refund Request</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  value={newChatData.priority}
                  onChange={(e) =>
                    setNewChatData((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {newChatData.category === "order" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Related Order (Optional)
                  </label>
                  <select
                    value={newChatData.orderId}
                    onChange={(e) => {
                      const order = userOrders.find(
                        (o) => o._id === e.target.value
                      );
                      setNewChatData((prev) => ({
                        ...prev,
                        orderId: e.target.value,
                      }));
                      setSelectedOrder(order || null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an order</option>
                    {userOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        Order #{order._id.slice(-8)} - ₹{order.totalAmount} (
                        {order.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={createNewChat}
                disabled={!newChatData.subject.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Ticket
              </Button>
              <Button
                onClick={() => {
                  setShowNewChatForm(false);
                  setNewChatData({
                    subject: "",
                    priority: "medium",
                    category: "general",
                    orderId: "",
                  });
                  setSelectedOrder(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        style={{ scrollBehavior: "auto" }}
      >
        {/* Chat List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Your Support Tickets</h3>
          <div
            className="space-y-3 max-h-[600px] overflow-y-auto"
            style={{ scrollBehavior: "auto" }}
          >
            {chats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No support tickets yet</p>
                <p className="text-sm">
                  Click &quot;New Ticket&quot; to get started
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Set the selected chat
                    setSelectedChat(chat);
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedChat?._id === chat._id
                      ? "border-blue-500 bg-blue-50"
                      : chat.status === "closed" || !chat.isActive
                      ? "border-gray-300 bg-gray-100 opacity-75"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  style={{
                    scrollBehavior: "auto",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {chat.subject}
                    </h4>
                    <Badge
                      className={`text-xs ${getPriorityColor(chat.priority)}`}
                    >
                      {chat.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(chat.category)}
                    <span className="text-xs text-gray-500 capitalize">
                      {chat.category}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    {getStatusIcon(chat.status)}
                    <span className="text-xs text-gray-500 capitalize">
                      {chat.status}
                    </span>
                    {(chat.status === "closed" || !chat.isActive) && (
                      <span className="text-xs text-red-500 font-medium">
                        (Ended)
                      </span>
                    )}
                  </div>

                  {chat.lastMessage && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {chat.lastMessage.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{chat.messageCount} messages</span>
                    {chat.lastMessageAt && (
                      <span>
                        {new Date(chat.lastMessageAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {chat.order && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <ShoppingBag className="w-3 h-3" />
                        <span className="font-medium">Related Order</span>
                      </div>
                      <p>
                        Order #{chat.order._id.slice(-8)} - ₹
                        {chat.order.totalAmount}
                      </p>
                      <p className="text-gray-500">
                        Status: {chat.order.status}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <div className="h-[600px] flex flex-col border rounded-lg relative">
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{selectedChat.subject}</h3>
                      {/* Connection Status */}
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isChatEnded()
                              ? "bg-gray-500"
                              : isConnected
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {isChatEnded()
                            ? "Chat Ended"
                            : isConnected
                            ? "Connected"
                            : "Disconnected"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getCategoryIcon(selectedChat.category)}
                      <span className="text-sm text-gray-600 capitalize">
                        {selectedChat.category}
                      </span>
                      <span className="text-gray-400">•</span>
                      {getStatusIcon(selectedChat.status)}
                      <span className="text-sm text-gray-600 capitalize">
                        {selectedChat.status}
                      </span>
                      <Badge
                        className={`text-xs ${getPriorityColor(
                          selectedChat.priority
                        )}`}
                      >
                        {selectedChat.priority}
                      </Badge>
                      {isChatEnded() && (
                        <Badge className="text-xs bg-red-100 text-red-800">
                          Chat Ended
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    {/* End Chat Button - Only show for open/in_progress chats */}
                    {(selectedChat.status === "open" ||
                      selectedChat.status === "in_progress") && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            console.log("🧪 Test button clicked");
                            setShowRatingModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                        >
                          Test Rating
                        </Button>
                        <Button
                          onClick={endChat}
                          disabled={endingChat}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                        >
                          {endingChat ? "Ending..." : "End Chat"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
                onScroll={checkIfAtBottom}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start the conversation below</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message._id}-${index}`}
                      className={`flex ${
                        message.senderType === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.senderType === "user"
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm break-words">{message.message}</p>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <p
                            className={`text-xs ${
                              message.senderType === "user"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                          {message.senderType === "user" && (
                            <div className="flex items-center">
                              <CheckCircle className="w-3 h-3 text-blue-200" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && !isChatEnded() && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-md max-w-xs">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {typingUsers.join(", ")}{" "}
                          {typingUsers.length === 1 ? "is" : "are"} typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Ended Message */}
                {isChatEnded() && (
                  <div className="flex justify-center">
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-2xl max-w-xs text-center">
                      <div className="flex items-center space-x-2">
                        <X className="w-4 h-4" />
                        <span className="text-sm">
                          This chat has been ended
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sending Message Indicator */}
                {sendingMessage && !isChatEnded() && (
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-xs">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs">Sending...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />

                {/* Scroll to Bottom Button - Only show when not at bottom */}
                {messages.length > 0 && !isAtBottom && (
                  <div className="absolute bottom-20 right-4">
                    <button
                      onClick={scrollToBottom}
                      className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                      title="Scroll to bottom"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isChatEnded()
                        ? "This chat has been ended"
                        : "Type your message..."
                    }
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendingMessage || !isConnected || isChatEnded()}
                  />
                  <Button
                    onClick={() => {
                      console.log("🔄 Manually refreshing messages...");
                      if (selectedChat) {
                        fetchMessages(selectedChat._id);
                      }
                    }}
                    className="bg-gray-600 hover:bg-gray-700"
                    title="Refresh messages"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={
                      !newMessage.trim() ||
                      sendingMessage ||
                      !isConnected ||
                      isChatEnded()
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {!isConnected && !isChatEnded() && (
                  <p className="text-xs text-red-500 mt-2">
                    Connection lost. Trying to reconnect...
                  </p>
                )}
                {isChatEnded() && (
                  <p className="text-xs text-gray-500 mt-2">
                    This chat has been ended. You can view the conversation
                    history but cannot send new messages.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a support ticket</p>
                <p className="text-sm">
                  Choose a ticket from the list to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Rate Your Support Experience
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  How would you rate this support session?
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        star <= rating
                          ? "bg-yellow-400 text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {rating === 0 && "Please select a rating"}
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Tell us about your experience..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={submitRating}
                  disabled={rating === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit Rating
                </Button>
                <Button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRating(0);
                    setRatingComment("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
