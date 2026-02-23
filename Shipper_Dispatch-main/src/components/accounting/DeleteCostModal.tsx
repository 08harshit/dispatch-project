import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccountingRecord {
  id: string;
  listingId: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  stockNumber: string;
  cost: number;
  paymentMethod: "cod" | "ach" | "wire" | "check";
  payoutStatus: "paid" | "pending" | "processing";
  hasDocs: boolean;
}

interface DeleteCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AccountingRecord | null;
  onConfirm: (id: string) => void;
}

const DeleteCostModal = ({ open, onOpenChange, record, onConfirm }: DeleteCostModalProps) => {
  const { toast } = useToast();

  if (!record) return null;

  const handleConfirm = () => {
    onConfirm(record.id);
    toast({
      title: "Record Deleted",
      description: `${record.listingId} has been removed.`,
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-red-500/20 flex items-center justify-center">
              <Trash2 size={24} className="text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete Record</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                This action cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="my-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                You are about to delete <span className="font-bold">{record.listingId}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {record.vehicleYear} {record.vehicleMake} {record.vehicleModel} • Cost: ${record.cost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-destructive hover:bg-destructive/90 rounded-xl"
          >
            Delete Record
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCostModal;
