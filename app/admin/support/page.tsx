"use client";

import { useState, useEffect, useRef } from "react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Clock,
  Users,
  CheckCircle,
  Search,
  Send,
  Smile,
  Paperclip,
  Image,
  File,
  Download,
  X,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { buildApiUrl } from "@/lib/api";
import { uploadSingleImage } from "@/lib/cloudinary";
import { socketService } from "@/lib/socket";
import { useToast } from "@/context/ToastContext";

interface Ticket {
  _id: string;
  userEmail: string;
  subject: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "general" | "order" | "technical" | "billing" | "return";
  createdAt: string;
  lastMessageAt: string;
  orderId?: string;
  orderDetails?: {
    _id: string;
    orderNumber?: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: Array<{
      product: {
        name: string;
        images: string[];
      };
      quantity: number;
      price: number;
    }>;
  };
  feedback?: {
    rating: number;
    message: string;
    submittedAt: string;
  };
  userId?: {
    username: string;
    email: string;
  };
  assignedAdmin?: {
    username: string;
  };
}

interface Message {
  _id: string;
  sender: "user" | "admin";
  message: string;
  timestamp: string;
  seen: boolean;
  messageType: "text" | "auto-reply" | "system" | "file" | "image";
  senderId?: {
    username: string;
    email: string;
  };
  attachments?: {
    url: string;
    filename: string;
    fileType?: string; // Frontend sends this
    mimetype?: string; // Backend stores this
    fileSize?: number;
  }[];
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  ticketsByCategory: Array<{ _id: string; count: number }>;
  ticketsByPriority: Array<{ _id: string; count: number }>;
}

const QUICK_REPLIES = [
  "Thank you for your patience.",
  "We're checking this issue.",
  "Your order is being processed.",
  "We'll get back to you shortly.",
  "Thank you for contacting us.",
];

export default function AdminSupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);

  // Socket-related state and refs
  const socketListenersSetup = useRef<boolean>(false);
  const selectedTicketRef = useRef<Ticket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const response = await fetch(
        buildApiUrl(`/api/support/admin/tickets?${params}`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data.tickets);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  // Fetch ticket stats
  const fetchStats = async () => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      if (!adminToken) {
        console.log("No admin token found");
        return;
      }

      const response = await fetch(buildApiUrl("/api/support/stats"), {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        console.error(
          "Failed to fetch stats:",
          response.status,
          response.statusText
        );
        // Handle 401 - redirect to admin login
        if (response.status === 401) {
          console.log("Admin authentication failed, redirecting to login");
          window.location.href = "/admin/login";
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch messages for selected ticket
  const fetchMessages = async (ticketId: string) => {
    try {
      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${ticketId}`),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${selectedTicket._id}/messages`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            message: newMessage,
            sender: "admin",
            messageType: "text",
          }),
        }
      );

      if (response.ok) {
        setNewMessage("");
        // Don't fetch messages - socket will handle real-time updates
        await fetchTickets(); // Still update tickets list
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      "Admin: File selection triggered with",
      event.target.files?.length || 0,
      "files"
    );
    const files = Array.from(event.target.files || []);

    // Debug file sizes
    files.forEach((file, index) => {
      console.log(
        `Admin: File ${index + 1}: ${file.name}, Size: ${file.size} bytes (${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
    });
    const validFiles = files.filter((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }

      if (!validTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported.`);
        return false;
      }

      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message with files
  const sendMessageWithFiles = async () => {
    if (!selectedTicket || (!newMessage.trim() && selectedFiles.length === 0))
      return;

    setIsUploading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const attachments: any[] = [];

      // Upload files if any
      if (selectedFiles.length > 0) {
        console.log(
          "Admin: Starting file upload process for",
          selectedFiles.length,
          "files"
        );
        for (const file of selectedFiles) {
          console.log(
            "Admin: Uploading file:",
            file.name,
            file.type,
            file.size
          );
          const uploadResult = await uploadSingleImage(file, token);
          if (uploadResult.success && uploadResult.url) {
            const attachmentData = {
              url: uploadResult.url,
              filename: file.name,
              fileType: file.type,
              fileSize: file.size,
            };
            attachments.push(attachmentData);
          } else {
            console.error("Admin: Upload failed for file:", file.name);
            console.error("Admin: Upload error details:", uploadResult);
            // Show error to user
            const errorMsg =
              uploadResult.error || "Upload failed - check console for details";
            console.error("Admin: Error message:", errorMsg);
            showToast(`Failed to upload ${file.name}: ${errorMsg}`);
          }
        }
      }

      const messageType =
        attachments.length > 0
          ? attachments[0].fileType.startsWith("image/")
            ? "image"
            : "file"
          : "text";

      const requestBody = {
        message:
          newMessage ||
          (attachments.length > 0
            ? `Sent ${attachments.length} file(s)`
            : "Message sent"),
        sender: "admin",
        messageType,
        attachments,
      };

      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${selectedTicket._id}/messages`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        const responseData = await response.json();

        setNewMessage("");
        setSelectedFiles([]);

        // Clear file input
        const fileInput = document.getElementById(
          "admin-file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        await fetchTickets(); // Update tickets list
      }
    } catch (error) {
      console.error("Error sending message with files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${ticketId}/status`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        await fetchTickets();
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket({
            ...selectedTicket,
            status: status as "open" | "in-progress" | "closed",
          });
        }
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  // Handle ticket selection
  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    selectedTicketRef.current = ticket; // Update ref immediately

    // Join the ticket room for real-time updates
    socketService.joinSupportTicket(ticket._id);

    fetchMessages(ticket._id);
  };

  // Filter tickets based on active tab and search
  const getFilteredTickets = () => {
    let filtered = tickets;

    // Filter by tab
    switch (activeTab) {
      case "active":
        filtered = filtered.filter(
          (t) => t.status === "open" || t.status === "in-progress"
        );
        break;
      case "pending":
        filtered = filtered.filter((t) => t.status === "open");
        break;
      case "closed":
        filtered = filtered.filter((t) => t.status === "closed");
        break;
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return "default";
      case "in-progress":
        return "secondary";
      case "closed":
        return "outline";
      default:
        return "default";
    }
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return "outline";
      case "medium":
        return "default";
      case "high":
        return "secondary";
      case "urgent":
        return "destructive";
      default:
        return "default";
    }
  };

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      console.log("Admin not logged in, redirecting to login");
      window.location.href = "/admin/login";
      return;
    }

    const loadData = async () => {
      await Promise.all([fetchTickets(), fetchStats()]);
    };
    loadData();
  }, [statusFilter, priorityFilter]);

  // Socket setup and message handling
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    console.log(
      "Admin: Checking for admin token:",
      token ? "Found" : "Not found"
    );
    if (!token) {
      return;
    }

    // Connect to socket and set up listeners
    const connectSocket = async () => {
      try {
        await socketService.connect(token);
        console.log(
          "Admin: Socket connected status:",
          socketService.connectionStatus
        );

        // Set up listeners after connection is established
        setupSocketListeners();
      } catch (error) {
        console.error("Admin: Failed to connect socket:", error);
      }
    };

    // Only set up listeners once
    const setupSocketListeners = () => {
      if (socketListenersSetup.current) {
        console.log(
          "Admin: Socket listeners already setup, but setting up again to ensure they work"
        );
        // Reset the flag and set up listeners again to ensure they work
        socketListenersSetup.current = false;
      }
      socketListenersSetup.current = true;

      // Listen for new messages
      console.log(
        "Admin: Socket service socket instance:",
        socketService.socketInstance
      );

      // Remove existing listeners first to prevent duplicates
      socketService.offNewSupportMessage();

      socketService.onNewSupportMessage((data) => {
        const currentSelectedTicket = selectedTicketRef.current;

        if (
          currentSelectedTicket &&
          data.ticketId === currentSelectedTicket._id
        ) {
          // Add message if it doesn't already exist
          setMessages((prev) => {
            const socketMessage = data.message as Message;

            // Check for duplicates
            const messageExists = prev.some((msg) => {
              if (
                msg._id &&
                socketMessage._id &&
                msg._id === socketMessage._id
              ) {
                return true;
              }

              if (
                msg.message === socketMessage.message &&
                msg.sender === socketMessage.sender &&
                msg.timestamp &&
                socketMessage.timestamp &&
                Math.abs(
                  new Date(msg.timestamp).getTime() -
                    new Date(socketMessage.timestamp).getTime()
                ) < 5000
              ) {
                console.log(
                  "Admin: Duplicate found by content and time:",
                  msg.message
                );
                return true;
              }

              return false;
            });

            if (!messageExists) {
              return [...prev, socketMessage];
            } else {
              return prev;
            }
          });
        }
      });

      // Listen for user closing ticket
      if (socketService.socketInstance) {
        socketService.socketInstance.on("user_closed_ticket", (data) => {
          // If admin is currently viewing the closed ticket, close the chat
          const currentSelectedTicket = selectedTicketRef.current;
          if (
            currentSelectedTicket &&
            currentSelectedTicket._id === data.ticketId
          ) {
            setSelectedTicket(null);
            setMessages([]);
          }

          // Update the ticket status in the tickets list
          setTickets((prev) =>
            prev.map((ticket) =>
              ticket._id === data.ticketId
                ? { ...ticket, status: "closed" as const }
                : ticket
            )
          );
        });
      }
    };

    // Connect to socket
    connectSocket();

    return () => {
      // Cleanup socket listeners
      if (socketListenersSetup.current) {
        socketService.offNewSupportMessage();
        if (socketService.socketInstance) {
          socketService.socketInstance.off("user_closed_ticket");
        }
        socketListenersSetup.current = false;
      }
    };
  }, []);

  // Update selectedTicketRef when selectedTicket changes
  useEffect(() => {
    if (selectedTicket) {
      selectedTicketRef.current = selectedTicket;
    }
  }, [selectedTicket]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredTickets = getFilteredTickets();

  return (
    <PermissionGuard requiredPermission="support.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Customer Support
            </h1>
            <p className="text-slate-600">
              Manage customer tickets and provide real-time support
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Online</span>
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalTickets}</p>
                    <p className="text-sm text-slate-600">Total Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.openTickets}</p>
                    <p className="text-sm text-slate-600">Open Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.inProgressTickets}
                    </p>
                    <p className="text-sm text-slate-600">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.closedTickets}</p>
                    <p className="text-sm text-slate-600">Closed Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-400px)]">
          {/* Tickets List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tickets</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-48"
                    />
                  </div>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="closed">Closed</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      onClick={() => handleTicketSelect(ticket)}
                      className={cn(
                        "p-4 cursor-pointer border-l-4 transition-colors",
                        selectedTicket?._id === ticket._id
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-slate-50 border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {ticket.userEmail.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium truncate">
                              {ticket.userId?.username || ticket.userEmail}
                            </p>
                          </div>
                          <p className="text-sm text-slate-900 font-medium truncate mb-1">
                            {ticket.subject}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={getStatusBadge(ticket.status)}
                              className="text-xs"
                            >
                              {ticket.status}
                            </Badge>
                            <Badge
                              variant={getPriorityBadge(ticket.priority)}
                              className="text-xs"
                            >
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(
                              new Date(ticket.lastMessageAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                          {!ticket.feedback && ticket.status === "closed" && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2 flex flex-col h-[600px]">
            {selectedTicket ? (
              <>
                <CardHeader className="border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {selectedTicket.subject}
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {selectedTicket.userId?.username ||
                          selectedTicket.userEmail}
                      </p>

                      {/* Order ID Display */}
                      {selectedTicket.orderId && (
                        <div className="p-2">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Order ID: {selectedTicket.orderId}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Order Information Display */}
                      {selectedTicket.category === "order" &&
                        selectedTicket.orderDetails && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <ShoppingCart className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Order Details
                              </span>
                            </div>
                            <div className="text-xs text-green-700">
                              <div className="grid grid-cols-2 gap-1">
                                <span>
                                  Order #
                                  {selectedTicket.orderDetails.orderNumber ||
                                    selectedTicket.orderDetails._id.slice(-6)}
                                </span>
                                <span>
                                  ₹
                                  {selectedTicket.orderDetails.totalAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-green-600 mt-1">
                                Status: {selectedTicket.orderDetails.status} •{" "}
                                {selectedTicket.orderDetails.items.length}{" "}
                                item(s)
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadge(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                      <Badge
                        variant={getPriorityBadge(selectedTicket.priority)}
                      >
                        {selectedTicket.priority}
                      </Badge>
                      <div className="flex space-x-1">
                        {selectedTicket.status !== "closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateTicketStatus(selectedTicket._id, "closed")
                            }
                          >
                            Close
                          </Button>
                        )}
                        {selectedTicket.status === "open" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateTicketStatus(
                                selectedTicket._id,
                                "in-progress"
                              )
                            }
                          >
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0 min-h-0 admin-chat-container">
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full p-4 admin-chat-scroll">
                      <div className="space-y-4">
                        {messages.map((message, index) => {
                          // Only log if message has attachments
                          return (
                            <div
                              key={`${message._id}-${message.timestamp}-${index}`}
                              className={cn(
                                "flex",
                                message.sender === "admin"
                                  ? "justify-end"
                                  : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                                  message.sender === "admin"
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-900"
                                )}
                              >
                                {message.messageType === "auto-reply" && (
                                  <div className="flex items-center space-x-1 mb-1">
                                    <Smile className="w-3 h-3" />
                                    <span className="text-xs opacity-75">
                                      Auto-reply
                                    </span>
                                  </div>
                                )}
                                <p className="text-sm">{message.message}</p>

                                {/* File Attachments */}
                                {(() => {
                                  console.log(
                                    "Admin: Checking message attachments:",
                                    {
                                      hasAttachments: !!(
                                        message.attachments &&
                                        message.attachments.length > 0
                                      ),
                                      attachments: message.attachments,
                                      messageId: message._id,
                                    }
                                  );
                                  return null;
                                })()}
                                {message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {message.attachments.map(
                                        (attachment, index) => (
                                          <div
                                            key={index}
                                            className="border rounded-lg p-2 bg-white/10"
                                          >
                                            {(
                                              attachment.fileType ||
                                              attachment.mimetype
                                            )?.startsWith("image/") ? (
                                              <div className="space-y-2">
                                                <img
                                                  src={attachment.url}
                                                  alt={attachment.filename}
                                                  className="max-w-full h-auto max-h-48 rounded object-cover cursor-pointer"
                                                  onClick={() =>
                                                    window.open(
                                                      attachment.url,
                                                      "_blank"
                                                    )
                                                  }
                                                />
                                                <div className="flex items-center justify-between text-xs">
                                                  <span className="truncate">
                                                    {attachment.filename}
                                                  </span>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      window.open(
                                                        attachment.url,
                                                        "_blank"
                                                      )
                                                    }
                                                    className="p-1 h-auto"
                                                  >
                                                    <Download className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                  <File className="w-4 h-4" />
                                                  <div>
                                                    <p className="text-sm font-medium truncate">
                                                      {attachment.filename}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                      {attachment.fileSize
                                                        ? (
                                                            attachment.fileSize /
                                                            1024 /
                                                            1024
                                                          ).toFixed(1) + " MB"
                                                        : ""}
                                                    </p>
                                                  </div>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    window.open(
                                                      attachment.url,
                                                      "_blank"
                                                    )
                                                  }
                                                  className="p-1 h-auto"
                                                >
                                                  <Download className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                <p
                                  className={cn(
                                    "text-xs mt-1",
                                    message.sender === "admin"
                                      ? "text-primary-foreground/70"
                                      : "text-slate-500"
                                  )}
                                >
                                  {formatDistanceToNow(
                                    new Date(message.timestamp),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="border-t p-4 flex-shrink-0">
                    {/* Quick Replies Drawer */}
                    <div className="mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setIsQuickRepliesOpen(!isQuickRepliesOpen)
                        }
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Quick Replies
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            isQuickRepliesOpen ? "rotate-180" : ""
                          )}
                        />
                      </Button>

                      {isQuickRepliesOpen && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg border">
                          <p className="text-xs font-medium text-slate-700 mb-2">
                            Select a quick reply:
                          </p>
                          <div className="space-y-1">
                            {QUICK_REPLIES.map((reply) => (
                              <button
                                key={reply}
                                onClick={() => {
                                  setNewMessage(reply);
                                  setIsQuickRepliesOpen(false);
                                }}
                                className="w-full text-left p-2 text-sm hover:bg-white hover:shadow-sm rounded border transition-colors"
                              >
                                {reply}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                      <div className="mb-3 p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">
                            Selected Files ({selectedFiles.length})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFiles([])}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center space-x-2">
                                {file.type.startsWith("image/") ? (
                                  <Image className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <File className="w-4 h-4 text-slate-500" />
                                )}
                                <span className="truncate">{file.name}</span>
                                <span className="text-slate-500">
                                  (
                                  {file.size >= 1024 * 1024
                                    ? `${(file.size / (1024 * 1024)).toFixed(
                                        1
                                      )}MB`
                                    : file.size >= 1024
                                    ? `${(file.size / 1024).toFixed(1)}KB`
                                    : `${file.size}B`}
                                  )
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (selectedFiles.length > 0
                            ? sendMessageWithFiles()
                            : sendMessage())
                        }
                        className="flex-1"
                      />

                      {/* File Upload Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => {
                          const fileInput = document.getElementById(
                            "admin-file-input"
                          ) as HTMLInputElement;
                          if (fileInput) {
                            fileInput.click();
                          } else {
                            console.error("Admin: File input not found");
                          }
                        }}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <input
                        id="admin-file-input"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        style={{ display: "none" }}
                      />

                      <Button
                        onClick={
                          selectedFiles.length > 0
                            ? sendMessageWithFiles
                            : sendMessage
                        }
                        disabled={
                          (!newMessage.trim() && selectedFiles.length === 0) ||
                          isUploading
                        }
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No ticket selected
                  </h3>
                  <p className="text-slate-600">
                    Select a ticket from the list to start chatting
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
}
