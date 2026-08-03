import * as assert from "assert";

// Basic API integration sanity check using mock or actual fetch
async function testApiEndpoints() {
  console.log("Running API integration tests...");

  try {
    const { POST } = await import("../app/api/download-zip/route");

    // Test Case 1: Empty request should fail with 400 or 500 depending on body format
    const mockReq1 = new Request("http://localhost/api/download-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: "" }),
    });

    const res1 = await POST(mockReq1);
    assert.strictEqual(res1.status, 400, "Should return 400 for empty list of IDs");
    const json1 = await res1.json();
    assert.ok(json1.error.includes("Input tidak mengandung ID"), "Error message should complain about missing IDs");

    // Test Case 2: Invalid text inputs
    const mockReq2 = new Request("http://localhost/api/download-zip", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "short_invalid_ids google.com",
    });

    const res2 = await POST(mockReq2);
    assert.strictEqual(res2.status, 400, "Should return 400 for invalid text input");

    console.log("API integration tests passed successfully!");
  } catch (err) {
    console.error("API integration tests failed:", err);
    process.exit(1);
  }
}

testApiEndpoints();
