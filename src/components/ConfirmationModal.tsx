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
import { useAppContext } from "@/contexts/AppContext";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: "Block" | "Unblock";
  itemCount: number;
  onConfirm: () => void;
}

export function ConfirmationModal({ open, onOpenChange, actionType, itemCount, onConfirm }: ConfirmationModalProps) {
  const { currentContext } = useAppContext();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm {actionType}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                You are about to <strong>{actionType.toLowerCase()}</strong>{" "}
                <strong>{itemCount}</strong> operation{itemCount !== 1 ? "s" : ""}.
              </p>
              <p className="text-xs">
                Context: <span className="font-medium">{currentContext.displayName}</span>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {actionType}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
