import { Badge } from "@/components/ui/badge";
import type {
  AnswerStatus,
  ControlStatus,
  DocumentStatus,
  QuestionnaireStatus,
} from "@prisma/client";

type Variant = React.ComponentProps<typeof Badge>["variant"];

const QUESTIONNAIRE: Record<QuestionnaireStatus, { label: string; variant: Variant }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "warning" },
  IN_PROGRESS: { label: "In progress", variant: "default" },
  PENDING_REVIEW: { label: "Pending review", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  EXPORTED: { label: "Exported", variant: "success" },
  ARCHIVED: { label: "Archived", variant: "outline" },
};

const DOCUMENT: Record<DocumentStatus, { label: string; variant: Variant }> = {
  UPLOADED: { label: "Uploaded", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "warning" },
  READY: { label: "Ready", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  ARCHIVED: { label: "Archived", variant: "outline" },
};

const ANSWER: Record<AnswerStatus, { label: string; variant: Variant }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  GENERATED: { label: "AI generated", variant: "default" },
  EDITED: { label: "Edited", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  NEEDS_INFO: { label: "Needs info", variant: "warning" },
};

const CONTROL: Record<ControlStatus, { label: string; variant: Variant }> = {
  NOT_STARTED: { label: "Not started", variant: "outline" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  IMPLEMENTED: { label: "Implemented", variant: "success" },
  NOT_APPLICABLE: { label: "N/A", variant: "secondary" },
};

export function QuestionnaireStatusBadge({ status }: { status: QuestionnaireStatus }) {
  const s = QUESTIONNAIRE[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const s = DOCUMENT[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function AnswerStatusBadge({ status }: { status: AnswerStatus }) {
  const s = ANSWER[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function ControlStatusBadge({ status }: { status: ControlStatus }) {
  const s = CONTROL[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
