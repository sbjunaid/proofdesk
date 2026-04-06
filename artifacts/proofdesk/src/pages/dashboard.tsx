import { Link } from "wouter";
import { FileText, AlertTriangle, CheckCircle, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetRiskBreakdown,
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const riskBadgeVariant: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "default",
  low: "secondary",
};

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 8 });
  const { data: riskBreakdown, isLoading: breakdownLoading } = useGetRiskBreakdown();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of your contract risk landscape</p>
        </div>
        <Link href="/documents">
          <Button className="gap-2" data-testid="button-upload-new">
            <FileText className="w-4 h-4" />
            New Document
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="text-3xl font-serif font-bold mb-1" data-testid="stat-total-documents">{summary?.totalDocuments ?? 0}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Total Documents
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-3xl font-serif font-bold mb-1 text-green-600 dark:text-green-400" data-testid="stat-completed-reviews">{summary?.completedReviews ?? 0}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Completed Reviews
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-3xl font-serif font-bold mb-1 text-amber-500" data-testid="stat-pending-reviews">{summary?.pendingReviews ?? 0}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending Review
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-3xl font-serif font-bold mb-1 text-red-500" data-testid="stat-critical-findings">{summary?.criticalFindings ?? 0}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Critical Findings
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Link href="/documents" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {activityLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (activity?.activities?.length ?? 0) === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No activity yet. Upload a document to get started.</div>
            ) : (
              <div className="divide-y divide-border">
                {activity?.activities?.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3" data-testid={`activity-${item.id}`}>
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                      item.type === "analyzed" ? "bg-green-500" :
                      item.type === "finding_added" ? (item.severity === "critical" ? "bg-red-500" : item.severity === "high" ? "bg-orange-500" : "bg-yellow-500") :
                      "bg-blue-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.documentTitle}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                    </div>
                    {item.severity && (
                      <Badge variant={riskBadgeVariant[item.severity] ?? "outline"} className="text-xs shrink-0">
                        {item.severity}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Findings by Severity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (riskBreakdown?.bySeverity?.length ?? 0) === 0 ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No findings yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={riskBreakdown?.bySeverity ?? []} barSize={28}>
                    <XAxis dataKey="severity" tick={{ fontSize: 11, textTransform: "capitalize" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip
                      formatter={(value) => [value, "Findings"]}
                      contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {riskBreakdown?.bySeverity?.map((entry, i) => (
                        <Cell key={i} fill={severityColors[entry.severity] ?? "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Top Finding Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : (riskBreakdown?.byCategory?.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">No findings yet</div>
              ) : (
                <div className="space-y-2">
                  {riskBreakdown?.byCategory?.slice(0, 6).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm" data-testid={`category-${cat.category.replace(/\s+/g, '-').toLowerCase()}`}>
                      <span className="text-muted-foreground">{cat.category}</span>
                      <Badge variant="outline" className="text-xs">{cat.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
