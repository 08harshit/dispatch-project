import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, ChevronRight } from "lucide-react";

interface ActivityItem {
  id: string;
  entity: string;
  entityType: "courier" | "shipper";
  action: string;
  status: "completed" | "pending" | "failed";
  date: string;
}

const mockActivities: ActivityItem[] = [
  { id: "1", entity: "Express Logistics", entityType: "courier", action: "Compliance updated", status: "completed", date: "Today" },
  { id: "2", entity: "ABC Manufacturing", entityType: "shipper", action: "New registration", status: "pending", date: "Today" },
  { id: "3", entity: "Swift Delivery Co", entityType: "courier", action: "Insurance expired", status: "failed", date: "Yesterday" },
  { id: "4", entity: "Global Freight", entityType: "shipper", action: "Documents verified", status: "completed", date: "Yesterday" },
  { id: "5", entity: "Prime Carriers", entityType: "courier", action: "License renewed", status: "completed", date: "2 days ago" },
];

const statusStyles = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusDotStyles = {
  completed: "bg-success",
  pending: "bg-warning",
  failed: "bg-destructive",
};

const entityTypeStyles = {
  courier: "bg-primary/10 text-primary border-primary/20",
  shipper: "bg-accent/10 text-accent border-accent/20",
};

export function RecentActivityTable() {
  return (
    <Card className="animate-fade-in overflow-hidden" style={{ animationDelay: "200ms" }}>
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Type</th>
                <th>Action</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {mockActivities.map((activity, index) => (
                <tr 
                  key={activity.id} 
                  className="animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <td className="font-medium">{activity.entity}</td>
                  <td>
                    <Badge variant="secondary" className={cn("capitalize border", entityTypeStyles[activity.entityType])}>
                      {activity.entityType}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">{activity.action}</td>
                  <td>
                    <Badge className={cn("border capitalize flex items-center gap-1.5 w-fit", statusStyles[activity.status])}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusDotStyles[activity.status])} />
                      {activity.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">{activity.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5">
            View All Activity
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
