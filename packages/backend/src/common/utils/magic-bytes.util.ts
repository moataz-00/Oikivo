import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';

export type AllowedFileType = 'jpeg' | 'png' | 'webp' | 'gif' | 'pdf';

interface MagicBytesSpec {
  offset: number;
  bytes: number[];
}

const SIGNATURES: Record<AllowedFileType, MagicBytesSpec[]> = {
  jpeg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  webp: [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
  ],
  gif: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  pdf: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // "%PDF"
};

/**
 * SEC-02: Validate a file's magic bytes against a set of allowed types.
 *
 * Reads only the minimum bytes required from disk (never loads the whole file).
 * Deletes the file and throws BadRequestException if validation fails.
 *
 * @param filePath    Absolute path to the saved file (from multer diskStorage)
 * @param allowed     Array of file types that are permitted
 */
export function validateMagicBytes(
  filePath: string,
  allowed: AllowedFileType[],
): void {
  // Determine how many bytes we need to read (max offset + max sig length)
  let maxBytes = 0;
  for (const type of allowed) {
    for (const sig of SIGNATURES[type]) {
      maxBytes = Math.max(maxBytes, sig.offset + sig.bytes.length);
    }
  }

  // Read only the bytes we need
  let fd: number | undefined;
  let buf: Buffer;
  try {
    buf = Buffer.alloc(maxBytes);
    fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buf, 0, maxBytes, 0);
  } catch {
    // Cannot read file — clean up and reject
    safeUnlink(filePath);
    throw new BadRequestException('Could not read uploaded file for validation');
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch { /* ignore */ }
    }
  }

  // Check if the file matches any of the allowed types
  const isValid = allowed.some((type) =>
    SIGNATURES[type].every((sig) =>
      sig.bytes.every((byte, i) => buf[sig.offset + i] === byte),
    ),
  );

  if (!isValid) {
    safeUnlink(filePath);
    throw new BadRequestException(
      `Invalid file type. Allowed: ${allowed.join(', ').toUpperCase()}.`,
    );
  }
}

function safeUnlink(filePath: string): void {
  try { fs.unlinkSync(filePath); } catch { /* ignore — file may not exist */ }
}
