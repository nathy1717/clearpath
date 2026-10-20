import { fileTypeFromBuffer } from "file-type";
import { DOMParser } from "@xmldom/xmldom";
import { extractText, getDocumentProxy } from "unpdf";
import yauzl from "yauzl";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_EXTRACTED_CHARACTERS = 300_000;
const MAX_PDF_PAGES = 100;
const MAX_DOCX_UNCOMPRESSED_BYTES = 30 * 1024 * 1024;
const MAX_DOCX_DOCUMENT_XML_BYTES = 5 * 1024 * 1024;

export type SupportedDocument = {
  contentType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "text/plain";
  text: string;
};

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readDocxDocumentXml(buffer: Buffer) {
  return new Promise<string>((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, strictFileNames: true }, (error, zipfile) => {
      if (error || !zipfile) {
        reject(new Error("The DOCX file is not a valid ZIP archive."));
        return;
      }
      let uncompressedBytes = 0;
      let entries = 0;
      let hasDocumentXml = false;
      let hasContentTypes = false;
      let documentXml = "";
      let failed = false;
      const fail = (reason: Error) => {
        if (failed) return;
        failed = true;
        zipfile.close();
        reject(reason);
      };

      zipfile.on("error", (zipError) => fail(zipError));
      zipfile.on("entry", (entry) => {
        entries += 1;
        uncompressedBytes += entry.uncompressedSize;
        if (
          entries > 1000
          || uncompressedBytes > MAX_DOCX_UNCOMPRESSED_BYTES
          || entry.fileName.startsWith("/")
          || entry.fileName.split("/").includes("..")
          || entry.fileName.toLowerCase().endsWith("vbaproject.bin")
          || (entry.generalPurposeBitFlag & 1) === 1
          || ![0, 8].includes(entry.compressionMethod)
        ) {
          fail(new Error("The DOCX archive exceeds safe processing limits or contains unsupported content."));
          return;
        }
        if (entry.fileName === "word/document.xml") {
          if (hasDocumentXml || entry.uncompressedSize > MAX_DOCX_DOCUMENT_XML_BYTES) {
            fail(new Error("The DOCX document XML is duplicated or too large."));
            return;
          }
          hasDocumentXml = true;
          zipfile.openReadStream(entry, (streamError, stream) => {
            if (streamError || !stream) {
              fail(new Error("The DOCX document content could not be read."));
              return;
            }
            const chunks: Buffer[] = [];
            let bytesRead = 0;
            stream.on("data", (chunk: Buffer) => {
              bytesRead += chunk.length;
              if (bytesRead > MAX_DOCX_DOCUMENT_XML_BYTES) {
                stream.destroy(new Error("The DOCX document XML exceeds the safe processing limit."));
                return;
              }
              chunks.push(chunk);
            });
            stream.on("error", (streamReadError) => fail(streamReadError));
            stream.on("end", () => {
              documentXml = Buffer.concat(chunks).toString("utf8");
              zipfile.readEntry();
            });
          });
          return;
        }
        if (entry.fileName === "[Content_Types].xml") hasContentTypes = true;
        zipfile.readEntry();
      });
      zipfile.on("end", () => {
        if (failed) return;
        if (!hasDocumentXml || !hasContentTypes) {
          reject(new Error("The file is not a valid Word document."));
          return;
        }
        resolve(documentXml);
      });
      zipfile.readEntry();
    });
  });
}

function extractDocxText(xml: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new Error("DOCX documents containing a custom entity declaration are not supported.");
  }
  const parserErrors: string[] = [];
  const document = new DOMParser({
    onError: (level, message) => {
      if (level === "error" || level === "fatalError") parserErrors.push(message);
    },
  }).parseFromString(xml, "application/xml");
  if (parserErrors.length > 0 || !document.documentElement) {
    throw new Error("The Word document contains invalid XML.");
  }
  const body = Array.from(document.getElementsByTagName("*"))
    .find((element) => element.localName === "body");
  if (!body) {
    throw new Error("The Word document does not contain a readable document body.");
  }

  type XmlNode = {
    localName?: string;
    nodeType: number;
    textContent: string | null;
    childNodes: ArrayLike<XmlNode>;
  };
  let text = "";
  function visit(node: XmlNode) {
    if (node.nodeType !== 1) return;
    const element = node;
    const name = element.localName;
    if (name === "t") {
      text += element.textContent ?? "";
      return;
    }
    if (name === "tab") text += "\t";
    if (name === "br" || name === "cr") text += "\n";
    for (const child of Array.from(element.childNodes)) visit(child);
    if (name === "p" || name === "tr") text += "\n";
    if (name === "tc") text += "\t";
  }
  visit(body as unknown as XmlNode);
  return normalizeText(text);
}

function decodeText(buffer: Buffer) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) {
      throw new Error("The text file contains unsupported control characters.");
    }
    return normalizeText(text);
  } catch (error) {
    if (error instanceof Error && error.message.includes("control characters")) throw error;
    throw new Error("Text documents must use valid UTF-8 encoding.");
  }
}

export async function extractSupportedDocument(
  filename: string,
  buffer: Buffer,
): Promise<SupportedDocument> {
  if (buffer.length === 0 || buffer.length > MAX_DOCUMENT_BYTES) {
    throw new Error("Choose a non-empty file no larger than 10 MB.");
  }
  const extension = filename.toLowerCase().split(".").pop();
  const detected = await fileTypeFromBuffer(buffer);
  let contentType: SupportedDocument["contentType"];
  let text: string;

  if (extension === "pdf" && detected?.mime === "application/pdf") {
    const document = await getDocumentProxy(new Uint8Array(buffer));
    if (document.numPages > MAX_PDF_PAGES) {
      throw new Error(`PDF documents are limited to ${MAX_PDF_PAGES} pages.`);
    }
    const extracted = await extractText(document, { mergePages: true });
    text = normalizeText(extracted.text);
    contentType = "application/pdf";
  } else if (
    extension === "docx"
    && detected?.mime === "application/zip"
  ) {
    const documentXml = await readDocxDocumentXml(buffer);
    text = extractDocxText(documentXml);
    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (extension === "txt" && (!detected || detected.mime.startsWith("text/"))) {
    text = decodeText(buffer);
    contentType = "text/plain";
  } else {
    throw new Error("File contents do not match a supported PDF, DOCX, or UTF-8 TXT file.");
  }

  if (text.length === 0) {
    throw new Error("No readable text was found. Scanned or image-only PDFs are not supported yet.");
  }
  if (text.length > MAX_EXTRACTED_CHARACTERS) {
    throw new Error("Extracted text exceeds the 300,000 character processing limit.");
  }

  return { contentType, text };
}
