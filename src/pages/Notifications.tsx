import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Bell, CheckCheck, MessageSquare, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string | null;
  other_user_name?: string;
  other_user_email?: string;
  other_user_avatar?: string;
  last_message?: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notifications");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showUsersList, setShowUsersList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await Promise.all([
        fetchNotifications(session.user.id),
        fetchConversations(session.user.id),
        fetchAllUsers(session.user.id)
      ]);
      setLoading(false);
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const channel = supabase
      .channel('conversation-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${selectedConversation}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
      return;
    }

    setNotifications(data || []);
  };

  const fetchAllUsers = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .neq("id", currentUserId);

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setAllUsers(data || []);
  };

  const fetchConversations = async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    // Fetch profile info for other participants
    const conversationsWithUsers = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.participant_1_id === userId 
          ? conv.participant_2_id 
          : conv.participant_1_id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", otherUserId)
          .single();

        return {
          ...conv,
          other_user_name: profile?.full_name || "Unknown User",
          other_user_email: profile?.email || "",
          other_user_avatar: profile?.avatar_url || null,
        };
      })
    );

    setConversations(conversationsWithUsers);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      return;
    }

    setMessages(data || []);
  };

  const startConversationWithUser = async (otherUserId: string) => {
    if (!user) return;

    // Check if conversation already exists
    const existingConv = conversations.find(
      (c) =>
        (c.participant_1_id === user.id && c.participant_2_id === otherUserId) ||
        (c.participant_1_id === otherUserId && c.participant_2_id === user.id)
    );

    if (existingConv) {
      setShowUsersList(false);
      await handleSelectConversation(existingConv.id);
      return;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participant_1_id: user.id,
        participant_2_id: otherUserId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to start conversation");
      return;
    }

    // Refresh conversations and select the new one
    await fetchConversations(user.id);
    setShowUsersList(false);
    setSelectedConversation(data.id);
    toast.success("Conversation started!");
  };

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowUsersList(false);
    await fetchMessages(conversationId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const { error } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return;
    }

    setNewMessage("");
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking as read:", error);
      return;
    }

    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
      return;
    }

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      scholarship: "🎓",
      deadline: "⏰",
      match: "🎯",
      info: "ℹ️",
    };
    return icons[type] || "📌";
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-12 px-4 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Your Notifications</h1>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllAsRead}>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No notifications yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !notification.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold truncate">{notification.title}</h3>
                              {!notification.is_read && (
                                <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
                                  New
                                </span>
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
                {/* Conversations List / Users List */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {showUsersList ? "Tous les utilisateurs" : "Conversations"}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUsersList(!showUsersList)}
                      >
                        {showUsersList ? "Conversations" : "Nouveau message"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      {showUsersList ? (
                        // All Users List
                        allUsers.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            Aucun utilisateur disponible
                          </div>
                        ) : (
                          allUsers.map((userProfile) => (
                            <div
                              key={userProfile.id}
                              className="p-4 border-b cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => startConversationWithUser(userProfile.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {userProfile.full_name?.[0]?.toUpperCase() || 
                                     userProfile.email[0]?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {userProfile.full_name || "Utilisateur sans nom"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {userProfile.email}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        // Conversations List
                        conversations.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            Aucune conversation
                            <br />
                            <Button 
                              variant="link" 
                              className="mt-2"
                              onClick={() => setShowUsersList(true)}
                            >
                              Démarrer une conversation
                            </Button>
                          </div>
                        ) : (
                          conversations.map((conv) => (
                            <div
                              key={conv.id}
                              className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                                selectedConversation === conv.id ? "bg-accent" : ""
                              }`}
                              onClick={() => handleSelectConversation(conv.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {conv.other_user_name?.[0]?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{conv.other_user_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {conv.other_user_email}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Messages Area */}
                <Card className="md:col-span-2 flex flex-col">
                  <CardHeader>
                    <CardTitle>
                      {selectedConversation 
                        ? conversations.find(c => c.id === selectedConversation)?.other_user_name 
                        : "Select a conversation"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    {selectedConversation ? (
                      <>
                        <ScrollArea className="flex-1 p-4">
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.sender_id === user?.id ? "justify-end" : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[70%] rounded-lg p-3 ${
                                    message.sender_id === user?.id
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className="text-xs opacity-70 mt-1">
                                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        </ScrollArea>
                        <form onSubmit={handleSendMessage} className="p-4 border-t">
                          <div className="flex gap-2">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type a message..."
                              className="flex-1"
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a conversation to start messaging</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}
