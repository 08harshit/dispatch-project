import { Vehicle } from "@/components/dashboard/VehicleTable";
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
import { useToast } from "@/hooks/use-toast";

interface DeleteVehicleModalProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (vehicle: Vehicle) => void;
}

const DeleteVehicleModal = ({ vehicle, open, onOpenChange, onConfirm }: DeleteVehicleModalProps) => {
  const { toast } = useToast();

  if (!vehicle) return null;

  const handleDelete = () => {
    onConfirm(vehicle);
    toast({
      title: "Vehicle Deleted",
      description: `${vehicle.listingId} has been removed.`,
      variant: "destructive",
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Shipment?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{vehicle.listingId}</strong> ({vehicle.year} {vehicle.make} {vehicle.model})? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteVehicleModal;
