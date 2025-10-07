"use client";

import React, { useState, useEffect, useRef } from "react";
import { buildApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageCircle,
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
  Filter,
  Search,
  User,
  Calendar,
  MessageSquare,
  Users,
  Activity,
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
    sender: {
      username: string;
    };
    senderType: "user" | "admin";
  };
  lastMessageAt?: string;
  messageCount: number;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  admin?: {
    _id: string;
    username: string;
  };
  order?: {
    _id: string;
    totalAmount: number;
    status: string;
  };
  createdAt: string;
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

interface ChatStats {
  totalChats: number;
  openChats: number;
  inProgressChats: number;
  resolvedChats: number;
  urgentChats: number;
}

export default function SupportManagement() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<
    Array<{ userId: string; username: string; userType: string }>
  >([]);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    search: "",
  });
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    // Import socket.io-client dynamically
    import("socket.io-client").then(({ io }) => {
      const socketConnection = io(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        {
          auth: {
            token: token,
          },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
        }
      );

      socketConnection.on("connect", () => {
        console.log("Admin connected to chat server");
        setIsConnected(true);
        setConnectionError(null);
      });

      socketConnection.on("disconnect", (reason) => {
        console.log("Admin disconnected from chat server:", reason);
        setIsConnected(false);
        setConnectionError(`Disconnected: ${reason}`);
      });

      socketConnection.on("reconnect", (attemptNumber) => {
        console.log(
          "Admin reconnected to chat server after",
          attemptNumber,
          "attempts"
        );
        setIsConnected(true);
        setConnectionError(null);
      });

      socketConnection.on("reconnect_error", (error) => {
        console.error("Reconnection error:", error);
        setIsConnected(false);
        setConnectionError(`Reconnection failed: ${error.message}`);
      });

      socketConnection.on("reconnect_failed", () => {
        console.error("Failed to reconnect to chat server");
        setIsConnected(false);
        setConnectionError("Failed to reconnect. Please refresh the page.");
      });

      socketConnection.on("auth_error", (data: { message: string }) => {
        console.error("Socket authentication error:", data.message);
        setIsConnected(false);
        setConnectionError(`Authentication failed: ${data.message}`);
      });

      // Handle chat status changes
      socketConnection.on(
        "chat_status_changed",
        (data: { chatId: string; status: string; isActive: boolean }) => {
          console.log("📊 Chat status changed:", data);
          // Refresh chat list to show updated status
          fetchChats();
        }
      );

      setSocket(socketConnection);

      return () => {
        socketConnection.disconnect();
      };
    });
  }, []);

  // Join chat room when chat is selected
  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit("join_chat", selectedChat._id);
      fetchMessages(selectedChat._id);
    } else {
      // Clear messages when no chat is selected
      setMessages([]);
    }
  }, [selectedChat, socket]);

  // Real-time message updates
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data: {
        message: ChatMessage;
        chatId: string;
      }) => {
        if (selectedChat && data.chatId === selectedChat._id) {
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some((msg) => msg._id === data.message._id);
            return exists ? prev : [...prev, data.message];
          });
        }
        // Update chat list to show new message
        fetchChats();
      };

      const handleUserMessage = (data: {
        chatId: string;
        message: ChatMessage;
        userId: string;
        username: string;
      }) => {
        if (selectedChat && data.chatId === selectedChat._id) {
          setMessages((prev) => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some((msg) => msg._id === data.message._id);
            return exists ? prev : [...prev, data.message];
          });
        }
        fetchChats();
        fetchStats();
      };

      const handleTyping = (data: {
        userId: string;
        username: string;
        userType: string;
      }) => {
        setTypingUsers((prev) => {
          const filtered = prev.filter((user) => user.userId !== data.userId);
          return [...filtered, data];
        });
      };

      const handleStopTyping = (data: {
        userId: string;
        username: string;
        userType: string;
      }) => {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== data.userId)
        );
      };

      socket.on("new_message", handleNewMessage);
      socket.on("new_user_message", handleUserMessage);
      socket.on("user_typing", handleTyping);
      socket.on("user_stopped_typing", handleStopTyping);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("new_user_message", handleUserMessage);
        socket.off("user_typing", handleTyping);
        socket.off("user_stopped_typing", handleStopTyping);
      };
    }
  }, [socket, selectedChat]);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const queryParams = new URLSearchParams();

      if (filters.status) queryParams.append("status", filters.status);
      if (filters.priority) queryParams.append("priority", filters.priority);
      if (filters.category) queryParams.append("category", filters.category);

      const response = await fetch(
        buildApiUrl(`/api/chat/admin/chats?${queryParams.toString()}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        let filteredChats = data.chats || [];

        // Apply search filter
        if (filters.search) {
          filteredChats = filteredChats.filter(
            (chat: Chat) =>
              chat.subject
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              chat.user.username
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              chat.user.email
                .toLowerCase()
                .includes(filters.search.toLowerCase())
          );
        }

        setChats(filteredChats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      setMessages([]); // Clear messages immediately

      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        buildApiUrl(`/api/chat/admin/chats/${chatId}/messages`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(buildApiUrl("/api/chat/admin/chats/stats"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Check if selected chat is ended
  const isChatEnded = () => {
    if (!selectedChat) return false;
    return selectedChat.status === "closed" || selectedChat.isActive === false;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !socket || isChatEnded()) return;

    setSendingMessage(true);
    try {
      // Send message via socket
      socket.emit("send_message", {
        chatId: selectedChat._id,
        message: newMessage.trim(),
        messageType: "text",
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const updateChatStatus = async (
    chatId: string,
    status: string,
    priority?: string
  ) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(
        buildApiUrl(`/api/chat/admin/chats/${chatId}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, priority }),
        }
      );

      if (response.ok) {
        // Update local state
        setChats((prev) =>
          prev.map((chat) =>
            chat._id === chatId
              ? { ...chat, status, ...(priority && { priority }) }
              : chat
          )
        );

        if (selectedChat?._id === chatId) {
          setSelectedChat((prev) =>
            prev ? { ...prev, status, ...(priority && { priority }) } : null
          );
        }

        // Emit socket event
        if (socket) {
          socket.emit("update_chat_status", { chatId, status, priority });
        }
      }
    } catch (error) {
      console.error("Error updating chat status:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (socket && selectedChat) {
      socket.emit("typing_start", selectedChat._id);
    }
  };

  const handleStopTyping = () => {
    if (socket && selectedChat) {
      socket.emit("typing_stop", selectedChat._id);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    // Clear messages immediately when selecting a new chat
    setMessages([]);
    setSelectedChat(chat);
  };

  const reconnectSocket = () => {
    if (socket) {
      socket.disconnect();
    }
    setConnectionError(null);
    setIsConnected(false);

    // Reinitialize connection
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    import("socket.io-client").then(({ io }) => {
      const socketConnection = io(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        {
          auth: {
            token: token,
          },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
        }
      );

      socketConnection.on("connect", () => {
        console.log("Admin reconnected to chat server");
        setIsConnected(true);
        setConnectionError(null);
      });

      socketConnection.on("disconnect", (reason) => {
        console.log("Admin disconnected from chat server:", reason);
        setIsConnected(false);
        setConnectionError(`Disconnected: ${reason}`);
      });

      socketConnection.on("auth_error", (data: { message: string }) => {
        console.error("Socket authentication error:", data.message);
        setIsConnected(false);
        setConnectionError(`Authentication failed: ${data.message}`);
      });

      setSocket(socketConnection);
    });
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
    fetchStats();
  }, [filters]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear messages when component unmounts
      setMessages([]);
      setSelectedChat(null);
    };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tickets
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChats}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.openChats}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.inProgressChats}
              </div>
              <p className="text-xs text-muted-foreground">Being handled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.resolvedChats}
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.urgentChats}
              </div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                <option value="general">General</option>
                <option value="order">Order</option>
                <option value="product">Product</option>
                <option value="payment">Payment</option>
                <option value="technical">Technical</option>
                <option value="refund">Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Search tickets..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets ({chats.length})</CardTitle>
              <CardDescription>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      isConnected ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    {isConnected ? "Connected" : "Disconnected"}
                  </div>
                  {!isConnected && (
                    <Button
                      onClick={reconnectSocket}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Reconnect
                    </Button>
                  )}
                </div>
                {connectionError && (
                  <div className="mt-2 text-xs text-red-500">
                    {connectionError}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No support tickets found</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat._id}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedChat?._id === chat._id
                          ? "border-purple-500 bg-purple-50"
                          : chat.status === "closed" || chat.isActive === false
                          ? "border-gray-300 bg-gray-100 opacity-75"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {chat.subject}
                        </h4>
                        <Badge
                          className={`text-xs ${getPriorityColor(
                            chat.priority
                          )}`}
                        >
                          {chat.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {chat.user.username}
                        </span>
                        <span className="text-gray-400">•</span>
                        {getStatusIcon(chat.status)}
                        <span className="text-xs text-gray-500 capitalize">
                          {chat.status}
                          {chat.status === "closed" || chat.isActive === false
                            ? " (Ended)"
                            : ""}
                        </span>
                      </div>

                      {chat.lastMessage && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {chat.lastMessage.senderType === "admin"
                            ? "You: "
                            : ""}
                          {chat.lastMessage.message}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{chat.messageCount} messages</span>
                        <span>
                          {new Date(chat.createdAt).toLocaleDateString()}
                        </span>
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
            </CardContent>
          </Card>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <Card>
            {selectedChat ? (
              <div className="h-[600px] flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {selectedChat.subject}
                        </CardTitle>
                        {isChatEnded() && (
                          <Badge className="bg-gray-500 text-white">
                            Chat Ended
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {selectedChat.user.username} (
                            {selectedChat.user.email})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(selectedChat.category)}
                          <span className="capitalize">
                            {selectedChat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedChat.status)}
                          <span className="capitalize">
                            {selectedChat.status}
                          </span>
                        </div>
                        <Badge
                          className={getPriorityColor(selectedChat.priority)}
                        >
                          {selectedChat.priority}
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={selectedChat.status}
                        onChange={(e) =>
                          updateChatStatus(selectedChat._id, e.target.value)
                        }
                        className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <select
                        value={selectedChat.priority}
                        onChange={(e) =>
                          updateChatStatus(
                            selectedChat._id,
                            selectedChat.status,
                            e.target.value
                          )
                        }
                        className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
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
                          message.senderType === "admin"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === "admin"
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderType === "admin"
                                ? "text-purple-100"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Chat Ended Message */}
                  {isChatEnded() && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
                        💬 This chat has ended
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Typing Indicators */}
                {typingUsers.length > 0 && !isChatEnded() && (
                  <div className="px-4 py-2 bg-gray-50 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
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
                      <span>
                        {typingUsers.map((user) => user.username).join(", ")}
                        {typingUsers.length === 1 ? " is" : " are"} typing...
                      </span>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={handleKeyPress}
                      onBlur={handleStopTyping}
                      placeholder={
                        isChatEnded()
                          ? "Chat has ended"
                          : "Type your message..."
                      }
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={sendingMessage || !isConnected || isChatEnded()}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={
                        !newMessage.trim() ||
                        sendingMessage ||
                        !isConnected ||
                        isChatEnded()
                      }
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  {!isConnected && (
                    <div className="mt-2 text-xs text-red-500">
                      <p>
                        Connection lost.{" "}
                        {connectionError || "Trying to reconnect..."}
                      </p>
                      <Button
                        onClick={reconnectSocket}
                        size="sm"
                        variant="outline"
                        className="mt-1 text-xs"
                      >
                        Manual Reconnect
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a support ticket</p>
                  <p className="text-sm">
                    Choose a ticket from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
