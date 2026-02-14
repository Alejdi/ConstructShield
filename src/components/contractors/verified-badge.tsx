import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <Badge className="gap-1 bg-trust-green/10 text-trust-green">
      <ShieldCheck className="h-3 w-3" />
      Verified
    </Badge>
  );
}
