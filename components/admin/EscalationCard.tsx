"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { AlertTriangle, Clock, User, ChevronRight } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface EscalationCardProps {
  id: Id<"escalations">;
  originalQuestion: string;
  reason: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  createdAt: number;
  assignedTo?: string;
  onAssign?: () => void;
  onView?: () => void;
}

const priorityStyles = {
  low: { variant: "default" as const, label: "Laag" },
  medium: { variant: "info" as const, label: "Medium" },
  high: { variant: "warning" as const, label: "Hoog" },
  urgent: { variant: "danger" as const, label: "Urgent" },
};

const reasonLabels: Record<string, string> = {
  low_confidence: "Lage zekerheid",
  no_match: "Geen match",
  user_request: "Klantverzoek",
  complex_issue: "Complex probleem",
  complaint: "Klacht",
};

export function EscalationCard({
  id,
  originalQuestion,
  reason,
  priority,
  status,
  createdAt,
  assignedTo,
  onAssign,
  onView,
}: EscalationCardProps) {
  const priorityConfig = priorityStyles[priority];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={priorityConfig.variant} size="sm">
              {priorityConfig.label}
            </Badge>
            <Badge variant="secondary" size="sm">
              {reasonLabels[reason] || reason}
            </Badge>
          </div>

          <p className="text-sm text-gray-900 font-medium line-clamp-2 mb-2">
            {originalQuestion}
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatRelativeTime(createdAt)}
            </span>
            {assignedTo && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {assignedTo}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "pending" && onAssign && (
            <Button variant="secondary" size="sm" onClick={onAssign}>
              Toewijzen
            </Button>
          )}
          {onView && (
            <Button variant="ghost" size="sm" onClick={onView}>
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
