import { TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  value: string;
  delta: string;
};

export function KpiCard({ title, value, delta }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <TrendingUp className="h-3 w-3" />
          {delta}
        </p>
      </CardContent>
    </Card>
  );
}
