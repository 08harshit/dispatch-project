import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ConversationList from "@/components/communication/ConversationList";
import ChatView from "@/components/communication/ChatView";
import EmptyChatState from "@/components/communication/EmptyChatState";
import EmailsTab from "@/components/communication/EmailsTab";
import CallsTab from "@/components/communication/CallsTab";
import { MessageSquare, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Conversation {
  id: string;
  courierName: string;
  courierInitials: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  shipmentId: string;
  status: "active" | "archived";
  isOnline: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: "shipper" | "courier";
  text: string;
  timestamp: string;
  read: boolean;
}

const mockConversations: Conversation[] = [
  { id: "1", courierName: "Mike's Transport", courierInitials: "MT", lastMessage: "I'll be at pickup in 20 minutes", lastMessageTime: "2 min ago", unreadCount: 2, shipmentId: "LD-024", status: "active", isOnline: true },
  { id: "2", courierName: "FastHaul LLC", courierInitials: "FH", lastMessage: "BOL has been uploaded", lastMessageTime: "15 min ago", unreadCount: 0, shipmentId: "LD-019", status: "active", isOnline: true },
  { id: "3", courierName: "Express Auto Carriers", courierInitials: "EA", lastMessage: "Vehicle delivered successfully", lastMessageTime: "1 hr ago", unreadCount: 0, shipmentId: "LD-022", status: "active", isOnline: false },
  { id: "4", courierName: "Summit Logistics", courierInitials: "SL", lastMessage: "Need updated delivery address", lastMessageTime: "3 hr ago", unreadCount: 1, shipmentId: "LD-018", status: "active", isOnline: false },
  { id: "5", courierName: "Pinnacle Haulers", courierInitials: "PH", lastMessage: "Invoice sent. Thanks!", lastMessageTime: "Yesterday", unreadCount: 0, shipmentId: "LD-015", status: "archived", isOnline: false },
];

const mockMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", conversationId: "1", sender: "shipper", text: "Hi Mike, what's your ETA for the pickup at 1420 Industrial Blvd?", timestamp: "10:30 AM", read: true },
    { id: "m2", conversationId: "1", sender: "courier", text: "Hey! I'm about 30 minutes out. Traffic is light today.", timestamp: "10:32 AM", read: true },
    { id: "m3", conversationId: "1", sender: "shipper", text: "Great, the vehicle is a 2024 BMW X5 — keys are with the lot manager.", timestamp: "10:33 AM", read: true },
    { id: "m4", conversationId: "1", sender: "courier", text: "Got it. I'll reach out to them on arrival.", timestamp: "10:35 AM", read: true },
    { id: "m5", conversationId: "1", sender: "courier", text: "I'll be at pickup in 20 minutes", timestamp: "10:45 AM", read: false },
  ],
  "2": [
    { id: "m6", conversationId: "2", sender: "courier", text: "Vehicle picked up. Starting transit to delivery address.", timestamp: "9:00 AM", read: true },
    { id: "m7", conversationId: "2", sender: "shipper", text: "Thanks! Please upload the BOL when possible.", timestamp: "9:05 AM", read: true },
    { id: "m8", conversationId: "2", sender: "courier", text: "BOL has been uploaded", timestamp: "9:30 AM", read: true },
  ],
  "3": [
    { id: "m9", conversationId: "3", sender: "courier", text: "Vehicle delivered successfully", timestamp: "8:00 AM", read: true },
    { id: "m10", conversationId: "3", sender: "shipper", text: "Confirmed. Thank you for the smooth delivery!", timestamp: "8:15 AM", read: true },
  ],
  "4": [
    { id: "m11", conversationId: "4", sender: "courier", text: "Need updated delivery address", timestamp: "7:00 AM", read: false },
  ],
};

type TabType = "messages" | "emails" | "calls";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "emails", label: "Emails", icon: <Mail className="h-4 w-4" /> },
  { id: "calls", label: "Calls", icon: <Phone className="h-4 w-4" /> },
];

const Communication = () => {
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedConversation = mockConversations.find((c) => c.id === selectedConversationId) || null;
  const messages = selectedConversationId ? mockMessages[selectedConversationId] || [] : [];

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] gap-0 overflow-hidden rounded-2xl border border-border bg-card">
        {/* Top Tab Bar */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-border bg-card">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex min-h-0">
          {activeTab === "messages" && (
            <>
              <ConversationList
                conversations={mockConversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
              <div className="flex-1 flex flex-col min-w-0">
                {selectedConversation ? (
                  <ChatView conversation={selectedConversation} messages={messages} />
                ) : (
                  <EmptyChatState />
                )}
              </div>
            </>
          )}
          {activeTab === "emails" && <EmailsTab />}
          {activeTab === "calls" && <CallsTab />}
        </div>
      </div>
    </MainLayout>
  );
};

export default Communication;
