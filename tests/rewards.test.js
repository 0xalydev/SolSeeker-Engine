import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { RewardLedger } from "../src/depin/rewards.js";
import { DEPIN_PROTOCOLS } from "../src/depin/types.js";

test("RewardLedger records samples and allows claiming", () => {
  const tmpFile = path.join(process.cwd(), ".solseeker-test-rewards-" + Date.now() + ".json");
  const ledger = new RewardLedger({ filePath: tmpFile });

  ledger.recordTelemetrySample({
    protocol: DEPIN_PROTOCOLS.BANDWIDTH,
    creditsEarned: 1.5,
  });

  const overview = ledger.getOverview();
  assert.strictEqual(overview.totalCredits, 1.5);

  const claim = ledger.claimEpochRewards("SimulatedWallet11111111111111111111111111111");
  assert.strictEqual(claim.success, true);
  assert.strictEqual(claim.claimRecord.creditsClaimed, 1.5);

  const overviewAfter = ledger.getOverview();
  assert.strictEqual(overviewAfter.totalCredits, 0);
  assert.strictEqual(overviewAfter.epochsClaimed, 1);

  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});
