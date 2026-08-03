import { extractDriveIds } from "../lib/gdrive";
import * as assert from "assert";

function runTests() {
  console.log("Running GDrive extraction tests...");

  // Test Case 1: Various valid URLs
  const input = `
    https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V
    https://drive.google.com/file/d/2A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T2U/view?usp=sharing
    https://docs.google.com/document/d/3A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T3U/edit
    https://docs.google.com/spreadsheets/d/4A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T4U/edit#gid=0
    https://drive.google.com/uc?id=5A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T5U&export=download
    6A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T6U
  `;

  const results = extractDriveIds(input);
  assert.strictEqual(results.length, 6, "Should extract exactly 6 file IDs");

  assert.strictEqual(results[0].id, "1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V");
  assert.strictEqual(results[0].isFolder, false);

  assert.strictEqual(results[1].id, "2A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T2U");
  assert.strictEqual(results[1].isFolder, false);

  assert.strictEqual(results[2].id, "3A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T3U");
  assert.strictEqual(results[2].isFolder, false);

  assert.strictEqual(results[3].id, "4A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T4U");
  assert.strictEqual(results[3].isFolder, false);

  assert.strictEqual(results[4].id, "5A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T5U");
  assert.strictEqual(results[4].isFolder, false);

  assert.strictEqual(results[5].id, "6A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T6U");
  assert.strictEqual(results[5].isFolder, false);

  // Test Case 2: Folder URLs
  const folderInput = `
    https://drive.google.com/drive/folders/1F_FolderID_abc123XYZ
    https://drive.google.com/drive/u/1/folders/2F_FolderID_abc123XYZ
  `;
  const folderResults = extractDriveIds(folderInput);
  assert.strictEqual(folderResults.length, 2, "Should extract exactly 2 folders");
  assert.strictEqual(folderResults[0].id, "1F_FolderID_abc123XYZ");
  assert.strictEqual(folderResults[0].isFolder, true);
  assert.strictEqual(folderResults[1].id, "2F_FolderID_abc123XYZ");
  assert.strictEqual(folderResults[1].isFolder, true);

  // Test Case 3: Mixed input with invalid strings or empty
  const mixedInput = `
    https://google.com/invalid-link
    short_id_is_ignored
    1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T7U
  `;
  const mixedResults = extractDriveIds(mixedInput);
  assert.strictEqual(mixedResults.length, 1, "Should ignore invalid formats & short strings");
  assert.strictEqual(mixedResults[0].id, "1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T7U");

  console.log("All tests passed successfully!");
}

runTests();
