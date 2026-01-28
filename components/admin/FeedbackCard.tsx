"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { Star, MessageSquare, Check, X } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface FeedbackCardProps {
  id: Id<"userFeedback">;
  feedbackType: "bug" | "suggestion" | "compliment" | "complaint" | "feature_request";
  comment: string;
  rating?: number;
  status: string;
  createdAt: number;
  userEmail?: string;
  onReview?: () => void;
  onDecline?: () => void;
}

const typeStyles: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary"; label: string }> = {
  bug: { variant: "danger", label: "Bug" },
  suggestion: { variant: "info", label: "Suggestie" },
  compliment: { variant: "success", label: "Compliment" },
  complaint: { variant: "warning", label: "Klacht" },
  feature_request: { variant: "primary", label: "Feature Request" },
};

export function FeedbackCard({
  id,
  feedbackType,
  comment,
  rating,
  status,
  createdAt,
  userEmail,
  onReview,
  onDecline,
}: FeedbackCardProps) {
  const typeConfig = typeStyles[feedbackType] || typeStyles.suggestion;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={typeConfig.variant} size="sm">
              {typeConfig.label}
            </Badge>
            {rating !== undefined && (
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-gray-900 line-clamp-3 mb-2">{comment}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{formatRelativeTime(createdAt)}</span>
            {userEmail && <span>{userEmail}</span>}
          </div>
        </div>

        {status === "new" && (
          <div className="flex items-center gap-2">
            {onReview && (
              <Button variant="secondary" size="sm" onClick={onReview}>
                <Check size={14} className="mr-1" />
                Bekeken
              </Button>
            )}
            {onDecline && (
              <Button variant="ghost" size="sm" onClick={onDecline}>
                <X size={14} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
