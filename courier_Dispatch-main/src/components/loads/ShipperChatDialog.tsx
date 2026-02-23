import { useState, useRef, useEffect } from "react";
import { Send, Phone, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "courier" | "shipper";
  timestamp: Date;
}

interface ShipperInfo {
  name: string;
  company: string;
  phone: string;
}

interface ShipperChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadId: string;
  shipper: ShipperInfo;
}

export const ShipperChatDialog = ({
  open,
  onOpenChange,
  loadId,
  shipper,
}: ShipperChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hello! This is ${shipper.name} from ${shipper.company}. How can I assist you with load ${loadId}?`,
      sender: "shipper",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "courier",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Simulate shipper response
    setTimeout(() => {
      const responses = [
        "Got it! I'll check on that for you.",
        "Thanks for the update. The pickup is confirmed.",
        "No problem. Let me know if you need anything else.",
        "I'll send you the updated details shortly.",
        "Perfect, see you at the pickup location!",
        "I've noted that. The vehicle is ready for pickup.",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: randomResponse,
          sender: "shipper",
          timestamp: new Date(),
        },
      ]);
    }, 1000 + Math.random() * 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 bg-gradient-to-r from-sky-500 to-blue-500 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-white font-semibold">
                Chat with Shipper
              </DialogTitle>
              <p className="text-sky-100 text-sm">{shipper.name} • {shipper.company}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(`tel:${shipper.phone}`, "_self")}
              className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sky-100 text-xs mt-2">Load: {loadId}</p>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender === "courier" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    message.sender === "courier"
                      ? "bg-sky-500 text-white rounded-br-md"
                      : "bg-stone-100 text-stone-800 rounded-bl-md"
                  )}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      message.sender === "courier"
                        ? "text-sky-100"
                        : "text-stone-400"
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-stone-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border-stone-200 focus:border-sky-300 focus:ring-sky-200"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim()}
              className="h-10 w-10 rounded-xl bg-sky-500 hover:bg-sky-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
