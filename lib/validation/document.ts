import * as z from "zod";

/**
 * Rules for the vendor TIN certificate, shared by the client (instant inline
 * errors) and the Server Action. As with images, the type checked here is the
 * browser's claim; the server sniffs the actual bytes before storing the file
 * (lib/uploads/documents.ts).
 */

export const DOCUMENT_MAX_BYTES = 1 * 1024 * 1024; // 1 MB, as in the design

const DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
] as const;

const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg"] as const;

export const DOCUMENT_ACCEPT = [...DOCUMENT_TYPES, ...DOCUMENT_EXTENSIONS].join(",");

/** Some systems report no MIME type for Word files, so the extension also counts. */
function looksLikeDocument(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    (DOCUMENT_TYPES as readonly string[]).includes(file.type) ||
    DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}

/** Optional document; an empty file input (zero-byte File) means "none". */
export const optionalDocumentSchema = z.preprocess(
  (value) =>
    value == null || value === "" || (value instanceof File && value.size === 0)
      ? undefined
      : value,
  z
    .instanceof(File, { error: "Upload a file." })
    .refine((file) => file.size <= DOCUMENT_MAX_BYTES, {
      error: "File must be 1 MB or smaller.",
    })
    .refine(looksLikeDocument, { error: "Use a PDF, DOC, DOCX or JPG file." })
    .optional(),
);
