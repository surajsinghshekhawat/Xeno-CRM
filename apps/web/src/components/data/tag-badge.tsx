import type { CustomerTag } from "@xeno/shared";
import { cn } from "@/lib/utils";

const TAG_STYLES: Record<CustomerTag, string> = {
  NEW: "bg-sky-100 text-sky-800 border-sky-200",
  REGULAR: "bg-neutral-100 text-neutral-700 border-neutral-200",
  VIP: "bg-amber-100 text-amber-900 border-amber-200",
  LAPSED: "bg-rose-100 text-rose-800 border-rose-200",
  AT_RISK: "bg-orange-100 text-orange-800 border-orange-200",
};

export function TagBadge({ tag }: { tag: CustomerTag }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        TAG_STYLES[tag],
      )}
    >
      {tag.replace("_", " ")}
    </span>
  );
}
