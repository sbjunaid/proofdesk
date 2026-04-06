import { Router } from "express";
import multer from "multer";
import { db, documentsTable, activityTable } from "@workspace/db";
import path from "path";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/csv",
      "application/rtf",
      "text/rtf",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".pdf", ".txt", ".docx", ".doc", ".csv", ".rtf", ".md"];
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported: PDF, TXT, DOCX, DOC, CSV, RTF, MD`));
    }
  },
});

async function extractTextFromFile(buffer: Buffer, mimetype: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();

  // PDF
  if (mimetype === "application/pdf" || ext === ".pdf") {
    const pdfParse = await import("pdf-parse");
    const data = await pdfParse.default(buffer);
    return data.text?.trim() ?? "";
  }

  // DOCX / DOC
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword" ||
    ext === ".docx" ||
    ext === ".doc"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() ?? "";
  }

  // Plain text, CSV, markdown, RTF — just return as text
  return buffer.toString("utf-8").trim();
}

router.post("/documents/upload-file", upload.single("file"), async (req, res) => {
  const { title, documentType } = req.body as { title?: string; documentType?: string };

  if (!title || !documentType) {
    res.status(400).json({ error: "title and documentType are required" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  let content: string;
  try {
    content = await extractTextFromFile(req.file.buffer, req.file.mimetype, req.file.originalname);
  } catch (err) {
    req.log.error({ err }, "Failed to extract text from file");
    res.status(422).json({ error: "Could not extract text from this file. Try a different format." });
    return;
  }

  if (!content || content.length < 20) {
    res.status(422).json({ error: "The file appears to be empty or contains no readable text." });
    return;
  }

  if (content.length > 200000) {
    content = content.substring(0, 200000);
  }

  const [doc] = await db
    .insert(documentsTable)
    .values({
      title: title.trim(),
      documentType: documentType.trim(),
      content,
      status: "pending",
    })
    .returning();

  await db.insert(activityTable).values({
    type: "uploaded",
    documentId: doc.id,
    description: `Document "${doc.title}" uploaded from file (${req.file.originalname})`,
  });

  res.status(201).json(doc);
});

export default router;
