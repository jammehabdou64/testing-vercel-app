import { cn } from "@/lib/utils";

const neutral = "bg-[#F2F4F7] text-[#344054]";

const tones: Record<string, string> = {
  pending: "bg-[#FEF3C7] text-[#92400E]",
  approved: "bg-[#DCFCE7] text-[#166534]",
  rejected: "bg-[#FEE2E2] text-[#991B1B]",
  current: neutral,
  "on file": neutral,
  none: neutral,
};

export function PhotographState({ onFile }: { onFile: boolean }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#F2F4F7] px-2.5 py-0.5 text-xs font-medium text-[#344054]">
      {onFile ? "Photograph on file" : "No photograph"}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        tones[key] ?? neutral,
      )}
    >
      {status}
    </span>
  );
}
