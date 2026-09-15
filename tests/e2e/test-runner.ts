/**
 * YNDA Video Production SOP - Opaque-Box E2E Master Test Runner
 * Executes Tier 1 (Feature Coverage), Tier 2 (Boundaries), Tier 3 (Pairwise), and Tier 4 (Workflows)
 *
 * Run command:
 * export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"
 * node --experimental-transform-types --no-warnings tests/e2e/test-runner.ts
 */

import { TestRegistry, type TestCase } from "./harness.ts";
import { loadTier1Tests } from "./tier1-feature.test.ts";
import { loadTier2Tests } from "./tier2-boundary.test.ts";
import { loadTier3Tests } from "./tier3-pairwise.test.ts";
import { loadTier4Tests } from "./tier4-workflows.test.ts";

interface TestResult {
  test: TestCase;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

async function runAllTests() {
  const registry = TestRegistry.getInstance();
  registry.clear();

  console.log("================================================================================");
  console.log("🎬 YNDA VIDEO PRODUCTION SOP - OPAQUE-BOX E2E TEST SUITE");
  console.log("   Authoritative Source: ORIGINAL_REQUEST.md (R1-R6) & PROJECT.md");
  console.log("================================================================================");

  // Load all test tiers
  loadTier1Tests();
  loadTier2Tests();
  loadTier3Tests();
  loadTier4Tests();

  const totalTests = registry.tests.length;
  console.log(`\n📦 Discovered ${totalTests} test cases across 4 Tiers.`);
  console.log("🚀 Starting execution...\n");

  const results: TestResult[] = [];
  const tierStats: Record<string, { total: number; passed: number; failed: number; durationMs: number }> = {
    "Tier 1": { total: 0, passed: 0, failed: 0, durationMs: 0 },
    "Tier 2": { total: 0, passed: 0, failed: 0, durationMs: 0 },
    "Tier 3": { total: 0, passed: 0, failed: 0, durationMs: 0 },
    "Tier 4": { total: 0, passed: 0, failed: 0, durationMs: 0 },
  };

  let currentTier = "";
  const overallStart = Date.now();

  for (const test of registry.tests) {
    if (test.tier !== currentTier) {
      currentTier = test.tier;
      console.log(`\n--- [${currentTier.toUpperCase()}] ----------------------------------------------------`);
    }

    const tStart = Date.now();
    let passed = false;
    let error: Error | undefined;

    try {
      await test.run();
      passed = true;
    } catch (err: any) {
      passed = false;
      error = err;
    }

    const durationMs = Date.now() - tStart;
    results.push({ test, passed, durationMs, error });

    const stats = tierStats[test.tier];
    stats.total++;
    stats.durationMs += durationMs;
    if (passed) {
      stats.passed++;
      console.log(`  ✅ [PASS] ${test.id.padEnd(16)} | ${test.name} (${durationMs}ms)`);
    } else {
      stats.failed++;
      console.error(`  ❌ [FAIL] ${test.id.padEnd(16)} | ${test.name}`);
      console.error(`     Error: ${error?.message}`);
      if (error?.stack) {
        console.error(`     Stack: ${error.stack.split("\n").slice(1, 4).join("\n     ")}`);
      }
    }
  }

  const overallDuration = Date.now() - overallStart;

  // Print Summary Table
  console.log("\n================================================================================");
  console.log("📊 E2E TEST EXECUTION SUMMARY");
  console.log("================================================================================");
  console.log("Tier     | Feature Area               | Total | Passed | Failed | Success Rate | Duration");
  console.log("---------+----------------------------+-------+--------+--------+--------------+----------");

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [tier, stats] of Object.entries(tierStats)) {
    totalPassed += stats.passed;
    totalFailed += stats.failed;
    const rate = stats.total === 0 ? "0.0%" : `${((stats.passed / stats.total) * 100).toFixed(1)}%`;
    const label =
      tier === "Tier 1"
        ? "Feature Coverage (R1-R6)   "
        : tier === "Tier 2"
        ? "Boundaries & Corners (R1-R6)"
        : tier === "Tier 3"
        ? "Cross-Feature Pairwise      "
        : "Real-World Scenarios        ";

    console.log(
      `${tier.padEnd(8)} | ${label} | ${String(stats.total).padStart(5)} | ${String(stats.passed).padStart(6)} | ${String(
        stats.failed
      ).padStart(6)} | ${rate.padStart(12)} | ${stats.durationMs}ms`
    );
  }

  console.log("---------+----------------------------+-------+--------+--------+--------------+----------");
  const overallRate = totalTests === 0 ? "0.0%" : `${((totalPassed / totalTests) * 100).toFixed(1)}%`;
  console.log(
    `TOTAL    | All Tiers Combined         | ${String(totalTests).padStart(5)} | ${String(totalPassed).padStart(
      6
    )} | ${String(totalFailed).padStart(6)} | ${overallRate.padStart(12)} | ${overallDuration}ms`
  );
  console.log("================================================================================");

  if (totalFailed > 0) {
    console.error(`\n❌ TEST SUITE FAILED: ${totalFailed} test(s) failed.`);
    process.exit(1);
  } else {
    console.log(`\n🏆 ALL ${totalPassed} TESTS PASSED CLEANLY (100% Pass Rate).`);
    console.log(`✨ Status: Ready for verification audit.\n`);
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal runner error:", err);
  process.exit(1);
});
