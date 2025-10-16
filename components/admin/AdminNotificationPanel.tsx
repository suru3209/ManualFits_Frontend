"use client";

import React, { useState } from "react";
import {
  Bell,
  ShoppingCart,
  MessageSquare,
  Check,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAdminNotifications } from "@/context/AdminNotificationContext";
import { formatDistanceToNow } from "date-fns";

interface AdminNotificationPanelProps {
  className?: string;
}

export const AdminNotificationPanel: React.FC<AdminNotificationPanelProps> = ({
  className = "",
}) => {
  const {
    state,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useAdminNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: "order" | "ticket") => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case "ticket":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "order") {
      window.location.href = "/admin/orders";
    } else if (notification.type === "ticket") {
      window.location.href = "/admin/support";
    }

    setIsOpen(false);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    window.location.href = "/admin/notifications";
  };

  return (
    <div className={`relative ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
            <Bell className="h-4 w-4" />
            {state.unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {state.unreadCount > 99 ? "99+" : state.unreadCount}
              </Badge>
            )}
            {/* Connection Status Indicator */}
            {!state.isConnected && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {state.unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {state.unreadCount} new
                </Badge>
              )}
            </div>
            {state.notifications.length > 0 && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={markAllAsRead}
                  disabled={state.unreadCount === 0}
                  title="Mark all as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={clearAllNotifications}
                  title="Clear all"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-96">
            {state.notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="p-2">
                {state.notifications.slice(0, 10).map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                        !notification.read ? "bg-accent/50" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  !notification.read
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(notification.timestamp, {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < Math.min(state.notifications.length, 10) - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {state.notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-2 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  onClick={handleViewAll}
                >
                  <Eye className="w-3 h-3 mr-2" />
                  View All Notifications
                </Button>
                {state.notifications.length > 10 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm text-red-600 hover:text-red-700"
                    onClick={clearAllNotifications}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Clear All ({state.notifications.length})
                  </Button>
                )}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AdminNotificationPanel;
