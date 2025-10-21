"use client";

import { MessageCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatPlaceholderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChatPlaceholderDialog({
  open,
  onOpenChange,
}: ChatPlaceholderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[var(--color-primary)]" />
            Chat
          </AlertDialogTitle>
          <AlertDialogDescription className="body-base">
            Page de chat
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Entendido</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
