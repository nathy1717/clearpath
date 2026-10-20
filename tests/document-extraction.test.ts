import assert from "node:assert/strict";
import test from "node:test";
import { extractSupportedDocument } from "../lib/documents/extract";

test("extracts and normalizes UTF-8 text files", async () => {
  const result = await extractSupportedDocument(
    "requirements.txt",
    Buffer.from("Applicants must submit a transcript.\r\n\r\nDeadline: Friday.\n"),
  );
  assert.equal(result.contentType, "text/plain");
  assert.equal(result.text, "Applicants must submit a transcript.\n\nDeadline: Friday.");
});

test("rejects files whose detected content does not match a supported type", async () => {
  await assert.rejects(
    extractSupportedDocument("requirements.pdf", Buffer.from("not a PDF")),
    /do not match a supported/,
  );
});

test("rejects invalid UTF-8 text", async () => {
  await assert.rejects(
    extractSupportedDocument("requirements.txt", Buffer.from([0xc3, 0x28])),
    /valid UTF-8/,
  );
});

test("enforces the document byte limit before parsing", async () => {
  await assert.rejects(
    extractSupportedDocument("large.txt", Buffer.alloc(10 * 1024 * 1024 + 1, 65)),
    /no larger than 10 MB/,
  );
});
