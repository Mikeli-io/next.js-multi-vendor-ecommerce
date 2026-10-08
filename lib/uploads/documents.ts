import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { DOCUMENT_MAX_BYTES } from "@/lib/validation/document";

/**
 * PRIVATE, DEVELOPMENT-STAGE DOCUMENT STORAGE.
 *
 * Unlike catalog images (lib/uploads/images.ts), documents such as vendor TIN
 * certificates hold tax data, so they are written *outside* `public/` — to
 * `storage/<folder>/` — and are only ever read back through an
 * authorization-checked route. The database stores a key like
 * `vendor-documents/<uuid>.pdf`, never a URL.
 *
 * TODO(storage): move to private object storage (S3 / R2 with signed URLs)
 * before production, keeping `saveDocument` / `readDocument` / `removeDocument`.
 */

export type DocumentFolder = "vendor-documents";

const ROOT = path.join(process.cwd(), "storage");

export type DocumentKind = { ext: "pdf" | "doc" | "docx" | "jpg"; contentType: string };

const KINDS: Record<DocumentKind["ext"], string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
};

/** Identify the file by its bytes, never by the client's name or MIME type. */
function sniffDocument(bytes: Uint8Array): DocumentKind["ext"] | null {
  const starts = (sig: number[]) => sig.every((b, i) => bytes[i] === b);

  if (starts([0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"; // %PDF-
  if (starts([0xff, 0xd8, 0xff])) return "jpg";
  // OLE2 compound file — the legacy .doc container.
  if (starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "doc";
  // A ZIP is only accepted as .docx if it carries a Word document part.
  if (starts([0x50, 0x4b, 0x03, 0x04])) {
    const text = Buffer.from(bytes).toString("latin1");
    if (text.includes("[Content_Types].xml") && text.includes("word/")) return "docx";
  }
  return null;
}

export class InvalidDocumentError extends Error {}

function resolveKey(key: string | null | undefined, folder: DocumentFolder): string | null {
  const prefix = `${folder}/`;
  if (!key?.startsWith(prefix)) return null;
  const dir = path.join(ROOT, folder);
  const target = path.resolve(dir, key.slice(prefix.length));
  // Only files directly inside the folder — a crafted key can't escape it.
  return path.dirname(target) === dir ? target : null;
}

/** Validate and store a document. Returns its private storage key. */
export async function saveDocument(folder: DocumentFolder, file: File): Promise<string> {
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new InvalidDocumentError("File must be 1 MB or smaller.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffDocument(bytes);
  if (!ext) {
    throw new InvalidDocumentError("That file isn't a valid PDF, DOC, DOCX or JPG.");
  }

  const fileName = `${randomUUID()}.${ext}`;
  await mkdir(path.join(ROOT, folder), { recursive: true });
  await writeFile(path.join(ROOT, folder, fileName), bytes);
  return `${folder}/${fileName}`;
}

/** The stored bytes and their type, or `null` if the key is invalid or missing. */
export async function readDocument(
  folder: DocumentFolder,
  key: string | null | undefined,
): Promise<{ bytes: Buffer; kind: DocumentKind } | null> {
  const target = resolveKey(key, folder);
  if (!target) return null;
  const ext = path.extname(target).slice(1) as DocumentKind["ext"];
  if (!(ext in KINDS)) return null;
  try {
    return { bytes: await readFile(target), kind: { ext, contentType: KINDS[ext] } };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Delete a stored document. Invalid keys and missing files are ignored. */
export async function removeDocument(folder: DocumentFolder, key: string | null | undefined): Promise<void> {
  const target = resolveKey(key, folder);
  if (!target) return;
  try {
    await unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("removeDocument: could not delete", key, error);
    }
  }
}

/**
 * The HTTP response for a stored document, for the authorization-checked
 * routes that serve them. Never cached; PDFs and images open in the browser,
 * Word files download.
 */
export function documentResponse(file: { bytes: Buffer; kind: DocumentKind }, baseName: string): Response {
  const inline = file.kind.ext === "pdf" || file.kind.ext === "jpg";
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.kind.contentType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${baseName}.${file.kind.ext}"`,
      "Content-Length": String(file.bytes.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** The file type of a stored key (e.g. "pdf"), for display only. */
export function documentExt(key: string | null | undefined): DocumentKind["ext"] | null {
  const ext = key?.split(".").pop()?.toLowerCase();
  return ext && ext in KINDS ? (ext as DocumentKind["ext"]) : null;
}
