import { useState, useRef } from "react";
import { Link } from "wouter";
import { Plus, FileText, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Upload, ClipboardPaste, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  useListDocuments,
  useCreateDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const pasteSchema = z.object({
  title: z.string().min(2, "Title is required"),
  documentType: z.string().min(1, "Document type is required"),
  content: z.string().min(10, "Contract text must be at least 10 characters").max(100000, "Text too long — use file upload for very large documents"),
});

const fileSchema = z.object({
  title: z.string().min(2, "Title is required"),
  documentType: z.string().min(1, "Document type is required"),
});

type PasteForm = z.infer<typeof pasteSchema>;
type FileForm = z.infer<typeof fileSchema>;

const documentTypes = [
  "Service Agreement",
  "NDA",
  "Employment Contract",
  "Freelance Agreement",
  "Partnership Agreement",
  "Licensing Agreement",
  "Vendor Contract",
  "Lease Agreement",
  "Other",
];

const ACCEPTED_EXTENSIONS = ".pdf,.txt,.docx,.doc,.csv,.rtf,.md";
const ACCEPTED_LABEL = "PDF, DOCX, TXT, CSV, RTF, MD";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-500" },
  processing: { label: "Processing", icon: Loader2, color: "text-blue-500" },
  completed: { label: "Reviewed", icon: CheckCircle, color: "text-green-500" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-500" },
};

const riskColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  low: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListDocuments();

  const createDocument = useCreateDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        setOpen(false);
        pasteForm.reset();
        toast({ title: "Document uploaded", description: "Click 'Run AI Review' on the document to analyze it." });
      },
      onError: () => {
        toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  const pasteForm = useForm<PasteForm>({
    resolver: zodResolver(pasteSchema),
    defaultValues: { title: "", documentType: "", content: "" },
  });

  const fileForm = useForm<FileForm>({
    resolver: zodResolver(fileSchema),
    defaultValues: { title: "", documentType: "" },
  });

  const onPasteSubmit = (values: PasteForm) => {
    createDocument.mutate({ data: values });
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (file && !fileForm.getValues("title")) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      fileForm.setValue("title", nameWithoutExt);
    }
  };

  const onFileSubmit = async (values: FileForm) => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("documentType", values.documentType);
      formData.append("file", selectedFile);

      const res = await fetch(`${import.meta.env.BASE_URL}api/documents/upload-file`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }

      queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      setOpen(false);
      setSelectedFile(null);
      fileForm.reset();
      toast({ title: "Document uploaded", description: "Click 'Run AI Review' on the document to analyze it." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFileUploading(false);
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedFile(null);
      pasteForm.reset();
      fileForm.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1">Documents</h1>
          <p className="text-muted-foreground text-sm">Your contract library</p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-upload-document">
              <Plus className="w-4 h-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Upload Contract</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="file" className="gap-2" data-testid="tab-file-upload">
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </TabsTrigger>
                <TabsTrigger value="paste" className="gap-2" data-testid="tab-paste-text">
                  <ClipboardPaste className="w-3.5 h-3.5" /> Paste Text
                </TabsTrigger>
              </TabsList>

              {/* FILE UPLOAD TAB */}
              <TabsContent value="file">
                <Form {...fileForm}>
                  <form onSubmit={fileForm.handleSubmit(onFileSubmit)} className="space-y-4">
                    {/* Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? "border-primary bg-primary/5"
                          : selectedFile
                          ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileChange(file);
                      }}
                      data-testid="drop-zone"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS}
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                        data-testid="input-file"
                      />
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <File className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm">{selectedFile.name}</div>
                            <div className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</div>
                          </div>
                          <button
                            type="button"
                            className="ml-2 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium mb-1">Drop your file here or click to browse</p>
                          <p className="text-xs text-muted-foreground">
                            Supports: {ACCEPTED_LABEL} — up to 20MB
                          </p>
                        </div>
                      )}
                    </div>

                    <FormField
                      control={fileForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. NDA with Acme Corp" data-testid="input-file-title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={fileForm.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-file-doc-type">
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                      <Button type="submit" disabled={fileUploading || !selectedFile} data-testid="button-submit-file">
                        {fileUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Upload File"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* PASTE TEXT TAB */}
              <TabsContent value="paste">
                <Form {...pasteForm}>
                  <form onSubmit={pasteForm.handleSubmit(onPasteSubmit)} className="space-y-4">
                    <FormField
                      control={pasteForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. NDA with Acme Corp" data-testid="input-title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pasteForm.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-document-type">
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pasteForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Contract Text
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              {field.value?.length?.toLocaleString() ?? 0} / 100,000 characters
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste the full contract text here..."
                              className="min-h-[220px] font-mono text-xs resize-y"
                              data-testid="textarea-content"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                      <Button type="submit" disabled={createDocument.isPending} data-testid="button-submit-upload">
                        {createDocument.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Upload"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (data?.documents?.length ?? 0) === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-16 text-center">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No documents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload your first contract to get started.</p>
          <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Upload Document
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-card">
          {data?.documents?.map((doc) => {
            const status = statusConfig[doc.status] ?? statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer" data-testid={`doc-row-${doc.id}`}>
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{doc.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{doc.documentType}</span>
                      <span>·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {doc.overallRisk && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskColors[doc.overallRisk] ?? ""}`}>
                        {doc.overallRisk.toUpperCase()} RISK
                      </span>
                    )}
                    {doc.status === "completed" && (
                      <Badge variant="outline" className="text-xs gap-1">
                        {doc.findingCount} finding{doc.findingCount !== 1 ? "s" : ""}
                        {doc.criticalCount > 0 && (
                          <span className="ml-1 text-red-500 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />{doc.criticalCount}
                          </span>
                        )}
                      </Badge>
                    )}
                    <div className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${doc.status === "processing" ? "animate-spin" : ""}`} />
                      {status.label}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
