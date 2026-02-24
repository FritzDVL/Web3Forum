import React, { useState } from "react";
import { TextEditor } from "@/components/editor/text-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { MessageCircle } from "lucide-react";

interface ThreadReplyBoxProps {
  onCancel: () => void;
  onSubmit: () => void;
  value: string;
  onChange: (value: string) => void;
}

export function ThreadReplyBox({ onCancel, onSubmit, value, onChange }: ThreadReplyBoxProps) {
  const { account } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex w-full min-w-0 items-start space-x-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={account?.metadata?.picture} />
        <AvatarFallback className="bg-gray-200 text-gray-700">U</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-3">
        <div className="w-full min-w-0">
          <TextEditor onChange={onChange} />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="sm" className="h-8 px-3 text-sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            className="gradient-button h-8 text-sm"
            disabled={!value.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="loader mr-2 h-3 w-3 animate-spin rounded-full border-2 border-t-2 border-gray-300 border-t-blue-500" />
                Replying...
              </span>
            ) : (
              <>
                <MessageCircle className="mr-2 h-2 w-2" />
                Reply
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
