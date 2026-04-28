import { getIssues, createIssue } from './src/services/issues.ts';

async function test() {
  console.log("Fetching issues...");
  try {
    const issues = await getIssues();
    console.log("Returned issues:", JSON.stringify(issues, null, 2));
    
    // Test if we need to create one dummy issue
    if (issues.length === 0) {
      console.log("No issues found. Creating a test issue...");
      await createIssue({
        title: "Test Issue for Phase 3",
        description: "Testing markers on Community Map",
        category: "infrastructure",
        latitude: 19.10,
        longitude: 72.88,
      });
      const issues2 = await getIssues();
      console.log("Issues after creation:", JSON.stringify(issues2, null, 2));
    }
  } catch (error) {
    console.error("Error fetching/creating:", error);
  }
}
test();
