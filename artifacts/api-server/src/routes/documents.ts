import { Router } from "express";
import { db, documentsTable, findingsTable, activityTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateDocumentBody,
  ListDocumentsQueryParams,
  GetDocumentParams,
  DeleteDocumentParams,
  AnalyzeDocumentParams,
  GetDocumentReviewParams,
  ListFindingsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/documents", async (req, res) => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { status, limit = 20, offset = 0 } = parsed.data;
  const conditions = status ? [eq(documentsTable.status, status as "pending" | "processing" | "completed" | "failed")] : [];
  const docs = await db
    .select()
    .from(documentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(documentsTable.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(documentsTable)
    .where(conditions.length ? and(...conditions) : undefined);
  res.json({ documents: docs, total: Number(count) });
});

router.post("/documents", async (req, res) => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [doc] = await db
    .insert(documentsTable)
    .values({ ...parsed.data, status: "pending" })
    .returning();
  await db.insert(activityTable).values({
    type: "uploaded",
    documentId: doc.id,
    description: `Document "${doc.title}" uploaded`,
  });
  res.status(201).json(doc);
});

router.get("/documents/:id", async (req, res) => {
  const parsed = GetDocumentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, parsed.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
});

router.delete("/documents/:id", async (req, res) => {
  const parsed = DeleteDocumentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(documentsTable).where(eq(documentsTable.id, parsed.data.id));
  res.json({ success: true });
});

router.post("/documents/:id/analyze", async (req, res) => {
  const parsed = AnalyzeDocumentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, parsed.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  if (!doc.content) {
    res.status(400).json({ error: "Document has no content to analyze" });
    return;
  }

  await db
    .update(documentsTable)
    .set({ status: "processing" })
    .where(eq(documentsTable.id, doc.id));

  try {
    const analysisPrompt = `You are an expert contract lawyer and risk analyst. Analyze the following contract/document and:
1. Identify all risks, problematic clauses, missing protections, and issues.
2. Return a JSON object with this exact structure:
{
  "summary": "A plain-English summary of the document in 2-4 sentences",
  "overallRisk": "low|medium|high|critical",
  "findings": [
    {
      "category": "one of: Liability, Payment Terms, IP Rights, Termination, Confidentiality, Dispute Resolution, Indemnification, Compliance, Missing Clause, Unfair Term",
      "severity": "low|medium|high|critical",
      "title": "short finding title",
      "description": "clear explanation of the issue",
      "recommendation": "specific actionable recommendation",
      "clause": "exact or paraphrased problematic clause text, or null if it's a missing clause"
    }
  ]
}
Only return valid JSON, nothing else.

Document to analyze:
${doc.content.substring(0, 8000)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: analysisPrompt }],
      max_completion_tokens: 8192,
    });

    const rawContent = response.choices[0]?.message?.content ?? "{}";
    let analysis: {
      summary: string;
      overallRisk: "low" | "medium" | "high" | "critical";
      findings: Array<{
        category: string;
        severity: "low" | "medium" | "high" | "critical";
        title: string;
        description: string;
        recommendation: string;
        clause?: string | null;
      }>;
    };

    try {
      analysis = JSON.parse(rawContent);
    } catch {
      analysis = { summary: "Analysis completed.", overallRisk: "medium", findings: [] };
    }

    const validRisks = ["low", "medium", "high", "critical"] as const;
    const overallRisk = validRisks.includes(analysis.overallRisk as typeof validRisks[number])
      ? analysis.overallRisk
      : "medium";

    const findings = (analysis.findings || []).filter(
      (f) =>
        f.title &&
        f.description &&
        f.recommendation &&
        validRisks.includes(f.severity as typeof validRisks[number])
    );

    if (findings.length > 0) {
      await db.delete(findingsTable).where(eq(findingsTable.documentId, doc.id));
      const inserted = await db
        .insert(findingsTable)
        .values(
          findings.map((f) => ({
            documentId: doc.id,
            category: f.category || "General",
            severity: f.severity as "low" | "medium" | "high" | "critical",
            title: f.title,
            description: f.description,
            recommendation: f.recommendation,
            clause: f.clause ?? null,
          }))
        )
        .returning();

      for (const finding of inserted.filter((f) => f.severity === "critical" || f.severity === "high")) {
        await db.insert(activityTable).values({
          type: "finding_added",
          documentId: doc.id,
          description: `${finding.severity.toUpperCase()} finding: ${finding.title}`,
          severity: finding.severity,
        });
      }
    }

    const criticalCount = findings.filter((f) => f.severity === "critical").length;

    const [updatedDoc] = await db
      .update(documentsTable)
      .set({
        status: "completed",
        summary: analysis.summary || null,
        overallRisk,
        findingCount: findings.length,
        criticalCount,
        updatedAt: new Date(),
      })
      .where(eq(documentsTable.id, doc.id))
      .returning();

    await db.insert(activityTable).values({
      type: "analyzed",
      documentId: doc.id,
      description: `Document "${doc.title}" analyzed — ${findings.length} findings, overall risk: ${overallRisk}`,
    });

    res.json(updatedDoc);
  } catch (err) {
    req.log.error({ err }, "Analysis failed");
    await db
      .update(documentsTable)
      .set({ status: "failed" })
      .where(eq(documentsTable.id, doc.id));
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.get("/documents/:id/review", async (req, res) => {
  const parsed = GetDocumentReviewParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, parsed.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  const findings = await db
    .select()
    .from(findingsTable)
    .where(eq(findingsTable.documentId, parsed.data.id))
    .orderBy(
      sql`CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`
    );
  res.json({
    document: doc,
    findings,
    summary: doc.summary,
    overallRisk: doc.overallRisk,
  });
});

router.get("/findings", async (req, res) => {
  const parsed = ListFindingsQueryParams.safeParse({
    ...req.query,
    documentId: req.query.documentId ? Number(req.query.documentId) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { severity, documentId, limit = 50 } = parsed.data;
  const conditions = [];
  if (severity) conditions.push(eq(findingsTable.severity, severity as "low" | "medium" | "high" | "critical"));
  if (documentId) conditions.push(eq(findingsTable.documentId, documentId));

  const findings = await db
    .select({
      id: findingsTable.id,
      documentId: findingsTable.documentId,
      documentTitle: documentsTable.title,
      category: findingsTable.category,
      severity: findingsTable.severity,
      title: findingsTable.title,
      description: findingsTable.description,
      recommendation: findingsTable.recommendation,
      clause: findingsTable.clause,
      createdAt: findingsTable.createdAt,
    })
    .from(findingsTable)
    .leftJoin(documentsTable, eq(findingsTable.documentId, documentsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      sql`CASE ${findingsTable.severity} WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
      desc(findingsTable.createdAt)
    )
    .limit(limit);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(findingsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  res.json({ findings, total: Number(count) });
});

export default router;
