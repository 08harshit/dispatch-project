import { useState } from "react";
import { Send, Paperclip, Phone, MoreVertical, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/pages/Communication";

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
}

const ChatView = ({ conversation, messages }: ChatViewProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    // For now just clear — real implementation would push to DB
    setNewMessage("");
  };

  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {conversation.courierInitials}
            </div>
            {conversation.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{conversation.courierName}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{conversation.isOnline ? "Online" : "Offline"}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                <Truck className="h-2.5 w-2.5 mr-1" />
                {conversation.shipmentId}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-visible p-5 space-y-3 bg-muted/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.sender === "shipper" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                msg.sender === "shipper"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              )}
            >
              <p>{msg.text}</p>
              <span
                className={cn(
                  "text-[10px] mt-1 block",
                  msg.sender === "shipper" ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatView;
