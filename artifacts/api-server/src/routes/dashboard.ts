import { Router } from "express";
import { db, documentsTable, findingsTable, activityTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const [totals] = await db
    .select({
      totalDocuments: sql<number>`count(*)`,
      completedReviews: sql<number>`count(*) filter (where status = 'completed')`,
      pendingReviews: sql<number>`count(*) filter (where status = 'pending' or status = 'processing')`,
      totalFindings: sql<number>`coalesce(sum(finding_count), 0)`,
      criticalFindings: sql<number>`coalesce(sum(critical_count), 0)`,
      highRiskDocuments: sql<number>`count(*) filter (where overall_risk in ('high', 'critical'))`,
    })
    .from(documentsTable);

  const [findingStats] = await db
    .select({ avgFindings: sql<number>`coalesce(avg(finding_count), 0)` })
    .from(documentsTable)
    .where(eq(documentsTable.status, "completed"));

  res.json({
    totalDocuments: Number(totals.totalDocuments),
    completedReviews: Number(totals.completedReviews),
    pendingReviews: Number(totals.pendingReviews),
    totalFindings: Number(totals.totalFindings),
    criticalFindings: Number(totals.criticalFindings),
    highRiskDocuments: Number(totals.highRiskDocuments),
    avgFindingsPerDoc: parseFloat(Number(findingStats.avgFindings).toFixed(1)),
  });
});

router.get("/dashboard/recent-activity", async (req, res) => {
  const parsed = GetRecentActivityQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const activities = await db
    .select({
      id: activityTable.id,
      type: activityTable.type,
      documentId: activityTable.documentId,
      documentTitle: documentsTable.title,
      description: activityTable.description,
      severity: activityTable.severity,
      createdAt: activityTable.createdAt,
    })
    .from(activityTable)
    .leftJoin(documentsTable, eq(activityTable.documentId, documentsTable.id))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  res.json({ activities });
});

router.get("/dashboard/risk-breakdown", async (_req, res) => {
  const bySeverity = await db
    .select({
      severity: findingsTable.severity,
      count: sql<number>`count(*)`,
    })
    .from(findingsTable)
    .groupBy(findingsTable.severity)
    .orderBy(sql`CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`);

  const byCategory = await db
    .select({
      category: findingsTable.category,
      count: sql<number>`count(*)`,
    })
    .from(findingsTable)
    .groupBy(findingsTable.category)
    .orderBy(sql`count(*) desc`)
    .limit(8);

  const byDocumentType = await db
    .select({
      documentType: documentsTable.documentType,
      count: sql<number>`count(*)`,
    })
    .from(findingsTable)
    .leftJoin(documentsTable, eq(findingsTable.documentId, documentsTable.id))
    .groupBy(documentsTable.documentType)
    .orderBy(sql`count(*) desc`);

  res.json({
    bySeverity: bySeverity.map((r) => ({ severity: r.severity, count: Number(r.count) })),
    byCategory: byCategory.map((r) => ({ category: r.category, count: Number(r.count) })),
    byDocumentType: byDocumentType.map((r) => ({
      documentType: r.documentType ?? "Unknown",
      count: Number(r.count),
    })),
  });
});

export default router;
