"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addOrderNote } from "@/app/admin/(shell)/orders/actions";

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    startTransition(async () => {
      const result = await addOrderNote(orderId, note);
      if (result.success) {
        setNote("");
        toast.success("Nota agregada");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Nota interna (no la ve el cliente)..."
      />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending || !note.trim()}
        className="w-fit"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
        )}
        Agregar nota
      </Button>
    </form>
  );
}
