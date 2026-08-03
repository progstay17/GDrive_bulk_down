export interface ExtractedItem {
  id: string;
  isFolder: boolean;
  originalInput: string;
}

/**
 * Extracts Google Drive file or folder IDs from various URL formats or raw strings.
 */
export function extractDriveIds(inputText: string): ExtractedItem[] {
  if (!inputText) return [];
  // Split input by space, tab, newline, comma, semicolon, etc.
  const tokens = inputText.split(/[\s,;]+/).map(t => t.trim()).filter(Boolean);
  const results: ExtractedItem[] = [];

  for (const token of tokens) {
    // 1. Check folder formats
    // Matches e.g., https://drive.google.com/drive/folders/1abc... or https://drive.google.com/drive/u/0/folders/1abc...
    const folderMatch = token.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) {
      results.push({
        id: folderMatch[1],
        isFolder: true,
        originalInput: token,
      });
      continue;
    }

    // 2. Check various document/file URL paths /d/{id}/
    const dMatch = token.match(/\/(?:file|document|spreadsheets|presentation|drawings)\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) {
      results.push({
        id: dMatch[1],
        isFolder: false,
        originalInput: token,
      });
      continue;
    }

    // 3. Check query parameters like ?id=... or &id=...
    const queryMatch = token.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (queryMatch) {
      results.push({
        id: queryMatch[1],
        isFolder: false,
        originalInput: token,
      });
      continue;
    }

    // 4. Check raw file ID. Google Drive file IDs are usually 25 to 55 characters, containing a-z, A-Z, 0-9, _, -
    // Ensure we don't match short random words or other protocol strings
    if (/^[a-zA-Z0-9_-]{25,55}$/.test(token)) {
      results.push({
        id: token,
        isFolder: false,
        originalInput: token,
      });
    }
  }

  return results;
}

export interface ExportConfig {
  mimeType: string;
  extension: string;
}

/**
 * Mappings for Google-native document formats to standard downloadable formats.
 */
export const GOOGLE_NATIVE_MAPPING: Record<string, ExportConfig> = {
  "application/vnd.google-apps.document": {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: ".pptx",
  },
  "application/vnd.google-apps.drawing": {
    mimeType: "image/png",
    extension: ".png",
  },
};
