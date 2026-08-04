import * as assert from "assert";

// Basic API integration sanity check using mock or actual fetch
async function testApiEndpoints() {
  console.log("Running API integration tests...");

  try {
    // 1. Test /api/download-zip
    const { POST: downloadZipPOST } = await import("../app/api/download-zip/route");

    // Test Case 1.1: Empty request should fail with 400
    const mockReq1 = new Request("http://localhost/api/download-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: "" }),
    });

    const res1 = await downloadZipPOST(mockReq1);
    assert.strictEqual(res1.status, 400, "Should return 400 for empty list of IDs");
    const json1 = await res1.json();
    assert.ok(json1.error.includes("Input tidak mengandung ID"), "Error message should complain about missing IDs");

    // Test Case 1.2: Invalid text inputs
    const mockReq2 = new Request("http://localhost/api/download-zip", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "short_invalid_ids google.com",
    });

    const res2 = await downloadZipPOST(mockReq2);
    assert.strictEqual(res2.status, 400, "Should return 400 for invalid text input");


    // 2. Test /api/files-metadata
    const { POST: filesMetadataPOST } = await import("../app/api/files-metadata/route");

    // Test Case 2.1: Empty file IDs list should return empty array
    const mockMetaReq1 = new Request("http://localhost/api/files-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: [] }),
    });

    const resMeta1 = await filesMetadataPOST(mockMetaReq1);
    assert.strictEqual(resMeta1.status, 200, "Should return 200 for empty list of fileIds");
    const jsonMeta1 = await resMeta1.json();
    assert.deepStrictEqual(jsonMeta1.files, [], "Files list should be empty");


    // 3. Test /api/download-single
    const { GET: downloadSingleGET } = await import("../app/api/download-single/route");

    // Test Case 3.1: Missing id parameter should fail with 400
    const mockSingleReq1 = new Request("http://localhost/api/download-single", {
      method: "GET",
    });

    const resSingle1 = await downloadSingleGET(mockSingleReq1);
    assert.strictEqual(resSingle1.status, 400, "Should return 400 for missing id parameter");
    const jsonSingle1 = await resSingle1.json();
    assert.ok(jsonSingle1.error.includes("Missing file ID parameter"), "Error message should complain about missing parameter");

    console.log("API integration tests passed successfully!");
  } catch (err) {
    console.error("API integration tests failed:", err);
    process.exit(1);
  }
}

testApiEndpoints();
