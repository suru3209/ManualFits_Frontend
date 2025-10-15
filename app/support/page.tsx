"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Plus,
  Send,
  Star,
  Smile,
  X,
  Paperclip,
  Image,
  File,
  Download,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { socketService } from "@/lib/socket";
import { uploadSingleImage } from "@/lib/cloudinary";
import { buildApiUrl } from "@/lib/api";

interface Ticket {
  _id: string;
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
  assignedAdmin?: {
    _id: string;
    username: string;
  };
  feedback?: {
    rating: number;
    message: string;
    submittedAt: string;
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
  _tempId?: number; // Temporary ID for duplicate detection
  _fromApi?: boolean; // Flag to indicate message came from API
  _tempSocket?: boolean; // Flag to indicate message came from socket temporarily
}

interface NewTicketData {
  subject: string;
  message: string;
  category: string;
  priority: string;
  orderId?: string;
}

interface UserOrder {
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
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketData, setNewTicketData] = useState<NewTicketData>({
    subject: "",
    message: "",
    category: "general",
    priority: "medium",
  });
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ rating: 0, message: "" });
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectedAdmin, setConnectedAdmin] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [isUserActive, setIsUserActive] = useState(true);
  const [timeUntilAutoClose, setTimeUntilAutoClose] = useState<number | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debug: Log when userOrders changes
  useEffect(() => {}, [userOrders]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketListenersSetup = useRef<boolean>(false);

  // Ref to store current selected ticket for socket handlers
  const selectedTicketRef = useRef<Ticket | null>(null);

  // Fetch user's tickets
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(buildApiUrl("/api/support/tickets"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data.tickets || []);

        // Calculate unread count
        const unread =
          data.data.tickets?.filter(
            (ticket: Ticket) =>
              ticket.status === "open" || ticket.status === "in-progress"
          ).length || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl("/api/user/orders"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserOrders(data.orders || []);
      } else {
        console.error(
          "Failed to fetch orders:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  // Fetch messages for selected ticket
  const fetchMessages = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${ticketId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages || []);

        // Mark messages as seen
        await markMessagesAsSeen(ticketId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Create new ticket
  const createTicket = async () => {
    try {
      setIsCreatingTicket(true);

      const response = await fetch(buildApiUrl("/api/support/tickets"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: JSON.parse(localStorage.getItem("user") || "{}").email,
          subject: newTicketData.subject,
          message: newTicketData.message,
          category: newTicketData.category,
          priority: newTicketData.priority,
          orderId: newTicketData.orderId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTicket = data.data.ticket;

        // Add to tickets list
        setTickets((prev) => [newTicket, ...prev]);

        // Select the new ticket
        setSelectedTicket(newTicket);
        setMessages(data.data.messages || []);

        // Socket room joining is handled in useEffect

        // Reset form
        setNewTicketData({
          subject: "",
          message: "",
          category: "general",
          priority: "medium",
          orderId: undefined,
        });
        setIsNewTicketOpen(false);

        // Show success message
        alert("Ticket created successfully!");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket. Please try again.");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    console.log(
      "📤 Sending message:",
      newMessage,
      "to ticket:",
      selectedTicket._id
    );

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found for sending message");
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${selectedTicket._id}/messages`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: newMessage,
            sender: "user",
            senderId: JSON.parse(localStorage.getItem("user") || "{}")._id,
            messageType: "text",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Message sent successfully via API:", data.data);

        // Add message to UI immediately for better UX
        const messageData = {
          ...data.data,
          _id: data.data._id,
          sender: "user",
          message: newMessage,
          timestamp: new Date().toISOString(),
          seen: false,
          messageType: "text",
        };

        setMessages((prev) => [...prev, messageData]);

        // Clear the input immediately for better UX
        setNewMessage("");

        // Update ticket's last message time
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === selectedTicket._id
              ? { ...ticket, lastMessageAt: new Date().toISOString() }
              : ticket
          )
        );

        console.log("📨 Message added to UI immediately");

        // Also send via socket for real-time sync (optional)
        console.log("📡 Checking socket connection...");
        console.log("📡 Socket connected:", socketService.isSocketConnected());
        console.log("📡 Socket status:", socketService.getConnectionStatus());

        if (socketService.isSocketConnected()) {
          console.log("📡 Sending message via socket for real-time sync");
          socketService.sendSupportMessage(
            selectedTicket._id,
            newMessage,
            "text"
          );
        } else {
          console.log("❌ Socket not connected, skipping socket send");
        }
      } else {
        console.error("❌ Failed to send message:", response.status);
        alert("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      "File selection triggered with",
      event.target.files?.length || 0,
      "files"
    );
    const files = Array.from(event.target.files || []);

    // Debug file sizes
    files.forEach((file, index) => {
      console.log(
        `📁 File ${index + 1}: ${file.name}, Size: ${file.size} bytes (${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB), Type: ${file.type}`
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

    if (validFiles.length > 0) {
      console.log(
        "📎 Adding files to selectedFiles:",
        validFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      );
    }
    setSelectedFiles((prev) => {
      const newFiles = [...prev, ...validFiles];
      return newFiles;
    });
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message with files
  const sendMessageWithFiles = async () => {
    if (!selectedTicket || (!newMessage.trim() && selectedFiles.length === 0))
      return;

    console.log(
      "🚀 Starting file upload process with",
      selectedFiles.length,
      "files"
    );
    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const attachments: any[] = [];

      // Upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          console.log(
            "📤 Uploading file:",
            file.name,
            "Type:",
            file.type,
            "Size:",
            file.size
          );
          const uploadResult = await uploadSingleImage(file, token);
          console.log({
            success: uploadResult.success,
            url: uploadResult.url,
            data: uploadResult.data,
            hasUrl: !!uploadResult.url,
            hasDataUrl: !!uploadResult.data?.url,
          });

          // Check both possible URL locations
          const fileUrl = uploadResult.url || uploadResult.data?.url;
          if (uploadResult.success && fileUrl) {
            const attachment = {
              url: fileUrl,
              filename: file.name,
              fileType: file.type,
              fileSize: file.size,
            };
            attachments.push(attachment);
          } else {
            console.error("❌ Upload failed or no URL found:", uploadResult);
          }
        }
      }

      const messageType =
        attachments.length > 0
          ? attachments[0].fileType.startsWith("image/")
            ? "image"
            : "file"
          : "text";

      const messageData = {
        message:
          newMessage ||
          (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
        sender: "user",
        senderId: JSON.parse(localStorage.getItem("user") || "{}")._id,
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
          body: JSON.stringify(messageData),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Clear selected files after successful upload
        setSelectedFiles([]);
        setNewMessage("");

        // Add message to local state
        const newMsg = {
          ...data.data,
          _tempId: Date.now(),
          _fromApi: true,
        };

        setMessages((prev) => [...prev, newMsg]);

        // Clear file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("Error sending message with files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Mark messages as seen
  const markMessagesAsSeen = async (ticketId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(buildApiUrl(`/api/support/tickets/${ticketId}/seen`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sender: "user" }),
      });

      socketService.markSupportMessagesRead(ticketId);
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  };

  // Submit feedback
  const submitFeedback = async () => {
    if (!selectedTicket || feedbackData.rating === 0) return;

    try {
      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${selectedTicket._id}/feedback`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: feedbackData.rating,
            message: feedbackData.message,
          }),
        }
      );

      if (response.ok) {
        setShowFeedback(false);
        setFeedbackData({ rating: 0, message: "" });

        // Update ticket with feedback
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                feedback: {
                  rating: feedbackData.rating,
                  message: feedbackData.message,
                  submittedAt: new Date().toISOString(),
                },
              }
            : null
        );

        alert("Thank you for your feedback!");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    }
  };

  // Handle ticket selection
  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setConnectedAdmin(ticket.assignedAdmin?.username || null);
    fetchMessages(ticket._id);
    // Socket room joining is handled in useEffect
  };

  // Handle ticket close
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    const confirmed = confirm(
      "Are you sure you want to close this ticket? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${selectedTicket._id}/close`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Update ticket status locally
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === selectedTicket._id
              ? { ...ticket, status: "closed" as const }
              : ticket
          )
        );

        // Update selected ticket
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: "closed" } : null
        );

        // Notify admin that user closed the ticket
        if (socketService.socketInstance) {
          const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
          socketService.socketInstance.emit("user_closed_ticket", {
            ticketId: selectedTicket._id,
            userId: userInfo._id,
            userEmail: userInfo.email,
            message: "User closed the ticket",
          });
        }

        alert("Ticket closed successfully!");
      } else {
        alert("Failed to close ticket. Please try again.");
      }
    } catch (error) {
      console.error("Error closing ticket:", error);
      alert("Failed to close ticket. Please try again.");
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!selectedTicket) return;

    socketService.startSupportTyping(selectedTicket._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopSupportTyping(selectedTicket._id);
    }, 1000);
  };

  // User activity tracking functions
  const updateUserActivity = () => {
    setLastActivityTime(new Date());
    setIsUserActive(true);
    setTimeUntilAutoClose(null);

    // Clear existing timeouts and intervals
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Set warning timeout (8 minutes) - show warning 2 minutes before auto-close
    warningTimeoutRef.current = setTimeout(() => {
      if (selectedTicket && selectedTicket.status !== "closed") {
        setTimeUntilAutoClose(120); // 2 minutes in seconds

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setTimeUntilAutoClose((prev) => {
            if (prev && prev > 1) {
              return prev - 1;
            } else {
              clearInterval(countdownIntervalRef.current!);
              return null;
            }
          });
        }, 1000);

        alert(
          "⚠️ You have been inactive for 8 minutes. Your ticket will be automatically closed in 2 minutes if you don't respond."
        );
      }
    }, 8 * 60 * 1000); // 8 minutes

    // Set new inactivity timeout (10 minutes)
    inactivityTimeoutRef.current = setTimeout(() => {
      setIsUserActive(false);
      handleUserInactivity();
    }, 10 * 60 * 1000); // 10 minutes
  };

  const handleUserInactivity = async () => {
    if (!selectedTicket || selectedTicket.status === "closed") return;

    console.log(
      "🕒 User inactive for 10 minutes, auto-closing ticket:",
      selectedTicket._id
    );

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        buildApiUrl(`/api/support/tickets/${selectedTicket._id}/auto-close`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: "user_inactive",
            inactiveMinutes: 10,
          }),
        }
      );

      if (response.ok) {
        // Update ticket status locally
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === selectedTicket._id
              ? { ...ticket, status: "closed" as const }
              : ticket
          )
        );

        setSelectedTicket((prev) =>
          prev ? { ...prev, status: "closed" } : null
        );

        // Show notification
        alert(
          "Ticket has been automatically closed due to inactivity (10 minutes)."
        );
      }
    } catch (error) {
      console.error("Error auto-closing ticket:", error);
    }
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

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time chat setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ No token found");
      return;
    }

    const setupRealtimeChat = async () => {
      try {
        console.log("🔌 Setting up real-time chat...");

        // Connect to socket
        console.log("🔌 Attempting socket connection...");
        console.log(
          "🔌 Backend URL:",
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
        );
        console.log("🔌 Token present:", !!token);

        try {
          await socketService.connect(token);
          setSocketConnected(true);
          console.log("✅ Socket connected successfully");
        } catch (connectError) {
          console.error("❌ Socket connection failed:", connectError);
          setSocketConnected(false);
          setConnectionError("Socket connection failed. Trying fallback...");

          // Fallback: Try without authentication
          try {
            console.log("🔄 Trying fallback connection...");
            await socketService.connect();
            setSocketConnected(true);
            setConnectionError(null);
            console.log("✅ Fallback connection successful");
          } catch (fallbackError) {
            console.error("❌ Fallback connection also failed:", fallbackError);
            setSocketConnected(false);
            setConnectionError(
              "Real-time chat unavailable. Messages will still work."
            );
          }
        }

        // Debug socket status
        const status = socketService.getConnectionStatus();
        console.log("🔍 Socket status:", status);
        console.log("🔍 Socket instance:", socketService.socketInstance);
        console.log(
          "🔍 Socket connected:",
          socketService.socketInstance?.connected
        );

        // Test socket connection
        if (socketService.socketInstance) {
          socketService.socketInstance.emit("test_connection", { test: true });
          console.log("🧪 Test connection sent");

          // Listen for test response
          socketService.socketInstance.on(
            "test_connection_response",
            (data) => {
              console.log("✅ Test connection response received:", data);
            }
          );
        }

        // Set up message listeners
        socketService.onNewSupportMessage((data) => {
          console.log("📨 New message received:", data);
          console.log(
            "📨 Current selected ticket:",
            selectedTicketRef.current?._id
          );
          console.log("📨 Message ticket ID:", data.ticketId);

          const currentTicket = selectedTicketRef.current;
          if (currentTicket && data.ticketId === currentTicket._id) {
            const newMessage = data.message as Message;
            console.log("📨 Adding message to chat:", newMessage.message);

            // Add message to chat
            setMessages((prev) => {
              const exists = prev.some((msg) => msg._id === newMessage._id);
              if (!exists) {
                console.log("✅ Message added to chat successfully");
                return [...prev, newMessage];
              } else {
                console.log("⚠️ Message already exists, skipping");
                return prev;
              }
            });
          } else {
            console.log(
              "⚠️ Message not for current ticket or no ticket selected"
            );
          }
        });

        // Set up typing indicators
        socketService.onSupportUserTyping((data) => {
          if (data.userType === "admin") {
            setIsTyping(true);
            setTypingUser("Admin");
          }
        });

        socketService.onSupportUserStoppedTyping((data) => {
          if (data.userType === "admin") {
            setIsTyping(false);
            setTypingUser(null);
          }
        });

        // Set up status updates
        socketService.onSupportTicketStatusUpdated((data) => {
          if (selectedTicket && data.ticketId === selectedTicket._id) {
            setSelectedTicket((prev) =>
              prev ? { ...prev, status: data.status as Ticket["status"] } : null
            );
            setTickets((prev) =>
              prev.map((ticket) =>
                ticket._id === data.ticketId
                  ? { ...ticket, status: data.status as Ticket["status"] }
                  : ticket
              )
            );
          }
        });

        // Set up auto-close notifications
        socketService.onTicketAutoClosed((data) => {
          if (selectedTicket && data.ticketId === selectedTicket._id) {
            console.log("🕒 Ticket auto-closed due to inactivity:", data);

            // Update ticket status
            setSelectedTicket((prev) =>
              prev ? { ...prev, status: "closed" } : null
            );
            setTickets((prev) =>
              prev.map((ticket) =>
                ticket._id === data.ticketId
                  ? { ...ticket, status: "closed" as const }
                  : ticket
              )
            );

            // Show notification
            alert(
              `Ticket has been automatically closed due to inactivity (${data.inactiveMinutes} minutes). If you need further assistance, please create a new ticket.`
            );
          }
        });
      } catch (error) {
        console.error("❌ Failed to setup real-time chat:", error);
        setSocketConnected(false);
        setConnectionError(
          "Real-time chat unavailable. Messages will still work."
        );

        // Try to connect again after 3 seconds
        setTimeout(async () => {
          try {
            console.log("🔄 Retrying socket connection...");
            await socketService.connect(token);
            setSocketConnected(true);
            setConnectionError(null);
            console.log("✅ Socket reconnected successfully");
          } catch (retryError) {
            console.error("❌ Socket reconnection failed:", retryError);
          }
        }, 3000);
      }
    };

    setupRealtimeChat();
    fetchTickets();
    fetchUserOrders();

    return () => {
      socketService.offNewSupportMessage();
      socketService.offSupportUserTyping();
      socketService.offSupportUserStoppedTyping();
      socketService.offSupportTicketStatusUpdated();
      socketService.offTicketAutoClosed();
    };
  }, []);

  // Debug selectedFiles state changes
  useEffect(() => {}, [selectedFiles]);

  // Handle ticket selection and socket room joining
  useEffect(() => {
    if (selectedTicket) {
      selectedTicketRef.current = selectedTicket;
      // Join socket room for real-time updates
      console.log("📨 Attempting to join ticket room:", selectedTicket._id);
      console.log("📨 Socket connected:", socketService.isSocketConnected());

      if (socketService.isSocketConnected()) {
        socketService.joinSupportTicket(selectedTicket._id);
        console.log("✅ Joined ticket room:", selectedTicket._id);
      } else {
        console.log("❌ Socket not connected, cannot join room");
      }
    }
  }, [selectedTicket]);

  useEffect(() => {
    setIsLoading(false);
  }, [tickets]);

  // User activity tracking effect
  useEffect(() => {
    if (!selectedTicket || selectedTicket.status === "closed") return;

    const handleActivity = () => {
      updateUserActivity();
    };

    // Add event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize activity tracking
    updateUserActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });

      // Clear timeouts and intervals on cleanup
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [selectedTicket]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading support tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Customer Support
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Get help with your orders and account
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`w-2 h-2 rounded-full ${
                socketConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-xs text-slate-500">
              {socketConnected ? "Connected (Real-time)" : "Disconnected"}
            </span>
            {selectedTicket && selectedTicket.status !== "closed" && (
              <>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isUserActive ? "bg-blue-500" : "bg-orange-500"
                  }`}
                ></div>
                <span className="text-xs text-slate-500">
                  {isUserActive ? "Active" : "Inactive"}
                </span>
                {timeUntilAutoClose && timeUntilAutoClose > 0 && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs text-red-500 font-medium">
                      Auto-close in {Math.floor(timeUntilAutoClose / 60)}:
                      {(timeUntilAutoClose % 60).toString().padStart(2, "0")}
                    </span>
                  </>
                )}
              </>
            )}
            {connectionError && (
              <span className="text-xs text-red-500 ml-2">
                {connectionError}
              </span>
            )}
            {!socketConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    setConnectionError(null);
                    const token = localStorage.getItem("token");
                    if (token) {
                      await socketService.connect(token);
                      setSocketConnected(true);
                    }
                  } catch (error) {
                    console.error("Failed to reconnect:", error);
                    setSocketConnected(false);
                    setConnectionError(
                      "Reconnection failed. Please try again."
                    );
                  }
                }}
                className="text-xs h-6 px-2"
              >
                Reconnect
              </Button>
            )}
          </div>
        </div>
        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we&apos;ll help you resolve it quickly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Brief description of your issue"
                  value={newTicketData.subject}
                  onChange={(e) =>
                    setNewTicketData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newTicketData.category}
                  onValueChange={(value) =>
                    setNewTicketData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="order">Order Issue</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="return">Return/Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newTicketData.category === "order" && (
                <div>
                  <label className="text-sm font-medium">Select Order</label>
                  <Select
                    value={newTicketData.orderId || ""}
                    onValueChange={(value) =>
                      setNewTicketData((prev) => ({ ...prev, orderId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {userOrders.length === 0 ? (
                        <div className="p-2 text-sm text-slate-500">
                          No orders found (Debug: {userOrders.length} orders)
                        </div>
                      ) : (
                        userOrders.map((order) => {
                          return (
                            <SelectItem key={order._id} value={order._id}>
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">
                                  Order #
                                  {order.orderNumber || order._id.slice(-8)}
                                </span>
                                <span className="text-xs text-slate-500 truncate">
                                  ₹{order.totalAmount} • {order.status} •{" "}
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newTicketData.priority}
                  onValueChange={(value) =>
                    setNewTicketData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Please provide detailed information about your issue..."
                  value={newTicketData.message}
                  onChange={(e) =>
                    setNewTicketData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewTicketOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createTicket}
                disabled={
                  isCreatingTicket ||
                  !newTicketData.subject ||
                  !newTicketData.message
                }
              >
                {isCreatingTicket ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-2 lg:gap-6 h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] lg:h-[calc(100vh-200px)]">
        {/* Tickets List - Mobile: Small at top */}
        <Card className="lg:col-span-1 h-auto lg:h-full flex flex-col">
          <CardHeader className="pb-1 lg:pb-3">
            <CardTitle className="flex items-center justify-between text-xs lg:text-base">
              <span>Your Tickets</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 lg:flex-1 lg:overflow-hidden">
            <ScrollArea className="h-[100px] sm:h-[120px] lg:h-[500px]">
              <div className="space-y-1">
                {tickets.length === 0 ? (
                  <div className="p-2 lg:p-4 text-center text-slate-500">
                    <MessageCircle className="w-4 h-4 lg:w-8 lg:h-8 mx-auto mb-1 lg:mb-2 text-slate-400" />
                    <p className="text-xs lg:text-sm">No tickets yet</p>
                    <p className="text-xs">Create your first ticket</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      onClick={() => handleTicketSelect(ticket)}
                      className={cn(
                        "p-2 lg:p-4 cursor-pointer border-l-4 transition-colors",
                        selectedTicket?._id === ticket._id
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-slate-50 border-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs lg:text-sm font-medium truncate mb-1">
                            {ticket.subject}
                          </p>
                          <div className="flex items-center gap-1 mb-1">
                            <Badge
                              variant={getStatusBadge(ticket.status)}
                              className="text-xs px-1 py-0.5"
                            >
                              {ticket.status}
                            </Badge>
                            <Badge
                              variant={getPriorityBadge(ticket.priority)}
                              className="text-xs px-1 py-0.5"
                            >
                              {ticket.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(
                              new Date(ticket.lastMessageAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {ticket.feedback ? (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs">
                                {ticket.feedback.rating}
                              </span>
                            </div>
                          ) : (
                            ticket.status === "closed" && (
                              <div
                                className="w-2 h-2 bg-orange-500 rounded-full"
                                title="Feedback pending"
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col chat-window flex-1 lg:h-full overflow-hidden">
          {selectedTicket ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">
                      {selectedTicket.subject}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                      <Badge
                        variant={getStatusBadge(selectedTicket.status)}
                        className="text-xs"
                      >
                        {selectedTicket.status}
                      </Badge>
                      <Badge
                        variant={getPriorityBadge(selectedTicket.priority)}
                        className="text-xs"
                      >
                        {selectedTicket.priority}
                      </Badge>
                      {connectedAdmin && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                        >
                          Admin: {connectedAdmin}
                        </Badge>
                      )}
                      <span className="text-xs sm:text-sm text-slate-500">
                        #{selectedTicket._id.slice(-6)}
                      </span>
                    </div>

                    {/* Order ID Display - Arrow 1 */}
                    {selectedTicket.orderId && (
                      <div className=" p-2">
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
                              {selectedTicket.orderDetails.items.length} item(s)
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="flex-shrink-0">
                    {selectedTicket.status === "closed" ? (
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-slate-500">
                          Ticket Closed
                        </p>
                        {!selectedTicket.feedback && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowFeedback(true)}
                            className="mt-1"
                          >
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">
                              Rate Experience
                            </span>
                            <span className="sm:hidden">Rate</span>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCloseTicket}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden sm:inline">Close Ticket</span>
                        <span className="sm:hidden">Close</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-2 sm:p-4 overflow-auto">
                  <div className="space-y-4 w-full chat-container">
                    {messages.map((message, index) => {
                      // Only log if message has attachments
                      if (
                        message.attachments &&
                        message.attachments.length > 0
                      ) {
                      }
                      return (
                        <div
                          key={`${message._id}-${message.timestamp}-${index}`}
                          className={cn(
                            "flex w-full chat-message-container",
                            message.sender === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "chat-bubble px-4 py-3 rounded-lg break-words",
                              message.sender === "user"
                                ? "bg-primary text-white ml-auto"
                                : "bg-slate-100 text-slate-900 mr-auto"
                            )}
                            style={{
                              maxWidth: "80%",
                              minWidth: "60px",
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              hyphens: "auto",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {message.messageType === "auto-reply" && (
                              <div className="flex items-center space-x-1 mb-1">
                                <Smile className="w-3 h-3" />
                                <span className="text-xs opacity-75">
                                  Auto-reply
                                </span>
                              </div>
                            )}
                            <p
                              className="text-sm chat-message"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                hyphens: "auto",
                                whiteSpace: "pre-wrap",
                                overflow: "hidden",
                                maxWidth: "100%",
                              }}
                            >
                              {message.message}
                            </p>

                            {/* File Attachments */}
                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <>
                                  {console.log(
                                    "Rendering message with attachments:",
                                    message.attachments
                                  )}
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
                                </>
                              )}
                            <p
                              className={cn(
                                "text-xs mt-1",
                                message.sender === "user"
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

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-1">
                              <div
                                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-500 ml-2">
                              {typingUser} is typing...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {selectedTicket.status !== "closed" && (
                  <div className="border-t p-3 sm:p-4 flex-shrink-0">
                    {/* Selected Files Preview */}
                    {(() => {
                      console.log(
                        "🔍 Rendering file preview section - selectedFiles.length:",
                        selectedFiles.length
                      );
                      return selectedFiles.length > 0;
                    })() && (
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
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (selectedFiles.length > 0
                            ? sendMessageWithFiles()
                            : sendMessage())
                        }
                        className="flex-1 text-sm sm:text-base"
                      />

                      {/* File Upload Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        disabled={isUploading}
                        onClick={() => {
                          console.log(
                            "📎 File upload button clicked - opening file dialog"
                          );
                          const fileInput = document.getElementById(
                            "file-input"
                          ) as HTMLInputElement;
                          if (fileInput) {
                            console.log(
                              "✅ File input found, triggering click"
                            );
                            fileInput.click();
                          } else {
                            console.error("❌ File input not found");
                          }
                        }}
                      >
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        style={{ display: "none" }}
                      />

                      <Button
                        onClick={() => {
                          console.log(
                            "🚀 Send button clicked - selectedFiles:",
                            selectedFiles.length,
                            "selectedFiles array:",
                            selectedFiles,
                            "newMessage:",
                            newMessage.trim()
                          );
                          if (selectedFiles.length > 0) {
                            sendMessageWithFiles();
                          } else {
                            sendMessage();
                          }
                        }}
                        disabled={
                          (!newMessage.trim() && selectedFiles.length === 0) ||
                          isUploading
                        }
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
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
                  Select a ticket from the list or create a new one
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
          <DialogContent className="max-w-md mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
              <DialogDescription>
                Help us improve by rating your support experience.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="flex items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-6 h-6 cursor-pointer transition-colors",
                        star <= feedbackData.rating
                          ? "text-yellow-500 fill-current"
                          : "text-slate-300"
                      )}
                      onClick={() =>
                        setFeedbackData((prev) => ({ ...prev, rating: star }))
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Comment (Optional)
                </label>
                <Textarea
                  placeholder="Tell us about your experience..."
                  value={feedbackData.message}
                  onChange={(e) =>
                    setFeedbackData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFeedback(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitFeedback}
                disabled={feedbackData.rating === 0}
              >
                Submit Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
