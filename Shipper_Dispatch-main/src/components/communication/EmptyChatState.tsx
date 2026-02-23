import { MessageSquare } from "lucide-react";

const EmptyChatState = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <MessageSquare className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">Select a conversation</h3>
    <p className="text-sm text-muted-foreground max-w-xs">
      Choose a courier conversation from the list to view messages and communicate about shipments.
    </p>
  </div>
);

export default EmptyChatState;
