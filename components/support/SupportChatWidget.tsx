"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  MessageCircle,
  Send,
  X,
  Clock,
  CheckCircle,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { socketService } from "@/lib/socket";

interface Ticket {
  _id: string;
  userEmail: string;
  subject: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "general" | "order" | "technical" | "billing" | "return";
  createdAt: string;
  lastMessageAt: string;
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
  messageType: "text" | "auto-reply" | "system";
  senderId?: {
    username: string;
    email: string;
  };
}

interface FeedbackData {
  rating: number;
  message: string;
}

const CATEGORIES = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Support" },
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing Question" },
  { value: "return", label: "Return/Exchange" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    message: "",
  });
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    email: "",
    subject: "",
    message: "",
    category: "general",
    priority: "medium",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      socketService.connect(token);
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socketService.isSocketConnected()) return;

    const handleNewMessage = (data: { ticketId: string; message: unknown }) => {
      if (data.ticketId === currentTicket?._id) {
        setMessages((prev) => [...prev, data.message as Message]);
        scrollToBottom();
      }
    };

    const handleAdminTyping = (data: { userType: string }) => {
      setIsTyping(data.userType === "admin");
    };

    const handleAdminStoppedTyping = (_data: unknown) => {
      setIsTyping(false);
    };

    const handleTicketStatusUpdate = (data: {
      ticketId: string;
      status: string;
    }) => {
      if (data.ticketId === currentTicket?._id) {
        setCurrentTicket((prev) =>
          prev ? { ...prev, status: data.status as Ticket["status"] } : null
        );

        if (data.status === "closed" && !currentTicket?.feedback) {
          setShowFeedback(true);
        }
      }
    };

    socketService.onNewSupportMessage(handleNewMessage);
    socketService.onSupportUserTyping(handleAdminTyping);
    socketService.onSupportUserStoppedTyping(handleAdminStoppedTyping);
    socketService.onSupportTicketStatusUpdated(handleTicketStatusUpdate);

    return () => {
      socketService.offNewSupportMessage();
      socketService.offSupportUserTyping();
      socketService.offSupportUserStoppedTyping();
      socketService.offSupportTicketStatusUpdated();
    };
  }, [currentTicket]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create new ticket
  const createTicket = async () => {
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ticketForm),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTicket(data.data.ticket);
        setMessages(data.data.messages);
        setIsCreatingTicket(false);
        setIsExpanded(true);

        // Join socket room
        socketService.joinSupportTicket(data.data.ticket._id);
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentTicket) return;

    try {
      const response = await fetch(
        `/api/support/tickets/${currentTicket._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: newMessage,
            sender: "user",
            messageType: "text",
          }),
        }
      );

      if (response.ok) {
        setNewMessage("");

        // Send via socket
        socketService.sendSupportMessage(currentTicket._id, newMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Submit feedback
  const submitFeedback = async () => {
    if (!currentTicket || feedback.rating === 0) return;

    try {
      const response = await fetch(
        `/api/support/tickets/${currentTicket._id}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(feedback),
        }
      );

      if (response.ok) {
        setShowFeedback(false);
        setFeedback({ rating: 0, message: "" });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!currentTicket) return;

    socketService.startSupportTyping(currentTicket._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopSupportTyping(currentTicket._id);
    }, 1000);
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "in-progress":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "closed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-orange-600";
      case "urgent":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isExpanded ? (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageCircle className="w-6 h-6" />
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md mx-4">
              <DialogHeader>
                <DialogTitle>Customer Support</DialogTitle>
              </DialogHeader>

              {!currentTicket && !isCreatingTicket ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Need help? Start a conversation with our support team.
                  </p>
                  <Button
                    onClick={() => setIsCreatingTicket(true)}
                    className="w-full"
                  >
                    Start New Chat
                  </Button>
                </div>
              ) : isCreatingTicket ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      placeholder="your@email.com"
                      value={ticketForm.email}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      placeholder="Brief description of your issue"
                      value={ticketForm.subject}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          subject: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category
                    </label>
                    <Select
                      value={ticketForm.category}
                      onValueChange={(value) =>
                        setTicketForm({ ...ticketForm, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Priority
                    </label>
                    <Select
                      value={ticketForm.priority}
                      onValueChange={(value) =>
                        setTicketForm({ ...ticketForm, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      placeholder="Describe your issue in detail..."
                      value={ticketForm.message}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          message: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreatingTicket(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createTicket}
                      disabled={
                        !ticketForm.email ||
                        !ticketForm.subject ||
                        !ticketForm.message
                      }
                      className="flex-1"
                    >
                      Create Ticket
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(currentTicket?.status || "open")}
                      <span className="font-medium">
                        {currentTicket?.subject}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(
                        currentTicket?.priority || "medium"
                      )}
                    >
                      {currentTicket?.priority}
                    </Badge>
                  </div>

                  <ScrollArea className="h-64 border rounded-lg p-3">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={cn(
                            "flex",
                            message.sender === "admin"
                              ? "justify-start"
                              : "justify-end"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-xs px-3 py-2 rounded-lg text-sm",
                              message.sender === "admin"
                                ? "bg-slate-100 text-slate-900"
                                : "bg-primary text-white"
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
                            <p>{message.message}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                message.sender === "admin"
                                  ? "text-slate-500"
                                  : "text-primary-foreground/70"
                              )}
                            >
                              {formatDistanceToNow(
                                new Date(message.timestamp),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 px-3 py-2 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              />
                              <div
                                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(true)}
                    className="w-full"
                  >
                    Open in Full View
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        ) : (
          <Card className="w-80 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  {getStatusIcon(currentTicket?.status || "open")}
                  <span>Support Chat</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {currentTicket && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {currentTicket.subject}
                  </span>
                  <Badge
                    variant="outline"
                    className={getPriorityColor(currentTicket.priority)}
                  >
                    {currentTicket.priority}
                  </Badge>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-80 p-4">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={cn(
                        "flex",
                        message.sender === "admin"
                          ? "justify-start"
                          : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-xs px-3 py-2 rounded-lg text-sm",
                          message.sender === "admin"
                            ? "bg-slate-100 text-slate-900"
                            : "bg-primary text-white"
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
                        <p>{message.message}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            message.sender === "admin"
                              ? "text-slate-500"
                              : "text-primary-foreground/70"
                          )}
                        >
                          {formatDistanceToNow(new Date(message.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 px-3 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeedback({ ...feedback, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={cn(
                        "w-6 h-6",
                        star <= feedback.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      )}
                    />
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comment (optional)
              </label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={feedback.message}
                onChange={(e) =>
                  setFeedback({ ...feedback, message: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFeedback(false)}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={submitFeedback}
                disabled={feedback.rating === 0}
                className="flex-1"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
