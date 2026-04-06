import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Loader2, Shield, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useGetDocument,
  useGetDocumentReview,
  useAnalyzeDocument,
  useDeleteDocument,
  getGetDocumentQueryKey,
  getGetDocumentReviewQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface DocumentDetailProps {
  id: number;
}

const riskColorMap: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  medium: "text-yellow-600 dark:text-yellow-500",
  low: "text-green-600 dark:text-green-400",
};

const riskBgMap: Record<string, string> = {
  critical: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
  high: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900",
  medium: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900",
  low: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900",
};

const severityIcon: Record<string, React.ElementType> = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: Clock,
  low: CheckCircle,
};

export default function DocumentDetail({ id }: DocumentDetailProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doc, isLoading: docLoading } = useGetDocument(id, {
    query: { queryKey: getGetDocumentQueryKey(id), enabled: !!id },
  });

  const { data: review, isLoading: reviewLoading } = useGetDocumentReview(id, {
    query: {
      queryKey: getGetDocumentReviewQueryKey(id),
      enabled: !!id && doc?.status === "completed",
    },
  });

  const analyzeDocument = useAnalyzeDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetDocumentReviewQueryKey(id) });
        toast({ title: "Analysis complete", description: "Your document has been reviewed." });
      },
      onError: () => {
        toast({ title: "Analysis failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const deleteDocument = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        navigate("/documents");
        toast({ title: "Document deleted" });
      },
    },
  });

  if (docLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Document not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/documents")}>
          Back to Documents
        </Button>
      </div>
    );
  }

  const isProcessing = doc.status === "processing";
  const canAnalyze = doc.status === "pending" || doc.status === "failed";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/documents")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-serif font-bold leading-tight" data-testid="doc-title">{doc.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{doc.documentType}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canAnalyze && (
                <Button
                  onClick={() => analyzeDocument.mutate({ id })}
                  disabled={analyzeDocument.isPending}
                  className="gap-2"
                  data-testid="button-analyze"
                >
                  {analyzeDocument.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Run AI Review</>
                  )}
                </Button>
              )}
              {isProcessing && (
                <Button disabled className="gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteDocument.mutate({ id })}
                disabled={deleteDocument.isPending}
                className="text-muted-foreground hover:text-destructive"
                data-testid="button-delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      {doc.status === "completed" && (
        <Card className={doc.overallRisk ? `border ${riskBgMap[doc.overallRisk] ?? ""}` : ""}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`text-3xl font-serif font-bold uppercase tracking-tight ${doc.overallRisk ? riskColorMap[doc.overallRisk] : ""}`} data-testid="doc-risk">
                {doc.overallRisk ?? "—"} Risk
              </div>
              <Separator orientation="vertical" className="h-10 self-center" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">AI Summary</div>
                <p className="text-sm leading-relaxed" data-testid="doc-summary">
                  {doc.summary ?? "No summary available."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <div className="text-2xl font-serif font-bold" data-testid="doc-finding-count">{doc.findingCount}</div>
                <div className="text-xs text-muted-foreground">Total Findings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif font-bold text-red-500" data-testid="doc-critical-count">{doc.criticalCount}</div>
                <div className="text-xs text-muted-foreground">Critical Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-serif font-bold text-green-500">
                  {doc.findingCount - doc.criticalCount}
                </div>
                <div className="text-xs text-muted-foreground">Other Findings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending State */}
      {(doc.status === "pending" || doc.status === "failed") && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {doc.status === "failed" ? "Analysis Failed" : "Ready for Review"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {doc.status === "failed"
                ? "The analysis encountered an error. Please try again."
                : "Click 'Run AI Review' to analyze this document and identify risks."}
            </p>
            <Button
              onClick={() => analyzeDocument.mutate({ id })}
              disabled={analyzeDocument.isPending}
              className="gap-2"
              data-testid="button-analyze-empty"
            >
              {analyzeDocument.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Shield className="w-4 h-4" /> Run AI Review</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      {doc.status === "completed" && (
        <div className="space-y-3">
          <h2 className="text-lg font-serif font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Findings
            {reviewLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </h2>

          {reviewLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : (review?.findings?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No findings. This document looks clean.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {review?.findings?.map((finding) => {
                const SevIcon = severityIcon[finding.severity] ?? AlertTriangle;
                return (
                  <Card key={finding.id} className={`border ${riskBgMap[finding.severity] ?? ""}`} data-testid={`finding-${finding.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <SevIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${riskColorMap[finding.severity] ?? ""}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider ${riskColorMap[finding.severity] ?? ""}`}>
                              {finding.severity}
                            </span>
                            <Badge variant="outline" className="text-xs">{finding.category}</Badge>
                          </div>
                          <h3 className="font-semibold text-sm mb-1" data-testid={`finding-title-${finding.id}`}>{finding.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{finding.description}</p>
                          {finding.clause && (
                            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-xs text-muted-foreground italic mb-2">
                              "{finding.clause}"
                            </blockquote>
                          )}
                          <div className="bg-background/60 rounded p-3 text-xs">
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
      )}
    </div>
  );
}
