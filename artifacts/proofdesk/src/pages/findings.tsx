import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListFindings,
  getListFindingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type Severity = "low" | "medium" | "high" | "critical" | undefined;

const severityFilters: { label: string; value: Severity; color: string }[] = [
  { label: "All", value: undefined, color: "" },
  { label: "Critical", value: "critical", color: "text-red-600 dark:text-red-400" },
  { label: "High", value: "high", color: "text-orange-600 dark:text-orange-400" },
  { label: "Medium", value: "medium", color: "text-yellow-600 dark:text-yellow-500" },
  { label: "Low", value: "low", color: "text-green-600 dark:text-green-400" },
];

const riskColorMap: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  medium: "text-yellow-600 dark:text-yellow-500",
  low: "text-green-600 dark:text-green-400",
};

const riskBgMap: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
};

const severityIcon: Record<string, React.ElementType> = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: Clock,
  low: CheckCircle,
};

export default function Findings() {
  const [severity, setSeverity] = useState<Severity>(undefined);
  const queryClient = useQueryClient();

  const params = severity ? { severity, limit: 100 } : { limit: 100 };
  const { data, isLoading } = useListFindings(params, {
    query: {
      queryKey: getListFindingsQueryKey(params),
    },
  });

  const findings = data?.findings ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold mb-1">All Findings</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading ? "Loading..." : `${data?.total ?? 0} total findings across all documents`}
        </p>
      </div>

      {/* Severity filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {severityFilters.map((filter) => (
          <Button
            key={filter.label}
            variant={severity === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSeverity(filter.value);
            }}
            className="text-xs"
            data-testid={`filter-${filter.label.toLowerCase()}`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : findings.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No findings</h3>
            <p className="text-sm text-muted-foreground">
              {severity
                ? `No ${severity} severity findings.`
                : "Upload and analyze some contracts to see findings here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {findings.map((finding) => {
            const SevIcon = severityIcon[finding.severity] ?? AlertTriangle;
            return (
              <Card key={finding.id} className={`border-l-4 ${riskBgMap[finding.severity] ?? ""}`} data-testid={`finding-card-${finding.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <SevIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${riskColorMap[finding.severity] ?? ""}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${riskColorMap[finding.severity] ?? ""}`}>
                          {finding.severity}
                        </span>
                        <Badge variant="outline" className="text-xs">{finding.category}</Badge>
                        {finding.documentTitle && (
                          <Link href={`/documents/${finding.documentId}`}>
                            <Badge variant="secondary" className="text-xs hover:bg-secondary/80 cursor-pointer">
                              {finding.documentTitle}
                            </Badge>
                          </Link>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{finding.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{finding.description}</p>
                      {finding.clause && (
                        <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-xs text-muted-foreground italic mb-2">
                          "{finding.clause}"
                        </blockquote>
                      )}
                      <div className="bg-muted/40 rounded p-2.5 text-xs">
                        <span className="font-semibold text-foreground">Recommendation: </span>
                        <span className="text-muted-foreground">{finding.recommendation}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
