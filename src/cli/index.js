import { SoftwareSeedVault } from "../core/vault.js";
import { DeviceAttestationEngine } from "../core/attestation.js";
import { DePINHarvester } from "../depin/harvester.js";
import { RewardLedger } from "../depin/rewards.js";
import { MobileWalletAdapterServer } from "../mwa/server.js";
import { SolanaRpcClient } from "../solana/client.js";

function printBanner() {
  console.log("------------------------------------------------------------");
  console.log(" SolSeeker-Engine :: Open-Source Mobile DePIN & Web3 Runtime");
  console.log("------------------------------------------------------------");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  const vault = new SoftwareSeedVault();
  const attestation = new DeviceAttestationEngine();
  const ledger = new RewardLedger();
  const rpc = new SolanaRpcClient();

  if (!vault.isInitialized()) {
    vault.generateKeypair("primary-seeker-identity");
    vault.saveVault();
  } else {
    vault.loadVault();
  }

  if (command === "start") {
    printBanner();
    console.log("[Attestation] Device ID: " + attestation.deviceId);
    console.log("[Seed Vault] Public Key: " + vault.getPublicKey());
    console.log("[Engine] Starting DePIN Harvesters (Bandwidth, BLE, Cellular Mapping)...");

    const harvester = new DePINHarvester(vault, attestation, { sampleIntervalMs: 2500 });
    harvester.onTelemetry((sample) => {
      ledger.recordTelemetrySample(sample);
      console.log(`[Telemetry] [${sample.protocol}] + ${sample.creditsEarned.toFixed(2)} credits | Metrics: ${JSON.stringify(sample.metrics)}`);
    });
    harvester.start();

    const mwa = new MobileWalletAdapterServer(vault, { port: 8974 });
    const port = await mwa.start();
    console.log(`[MWA Server] Mobile Wallet Adapter bridge running on http://127.0.0.1:${port}/mwa`);
    console.log("[Engine] Press Ctrl+C to terminate runtime.");

    process.on("SIGINT", async () => {
      console.log("\n[Engine] Gracefully stopping DePIN harvesters and MWA server...");
      harvester.stop();
      await mwa.stop();
      ledger.save();
      console.log("[Engine] Done. Accrued rewards saved.");
      process.exit(0);
    });

  } else if (command === "status") {
    printBanner();
    const rep = attestation.getAttestationReport();
    const overview = ledger.getOverview();
    console.log("Device Identification:");
    console.log("  Device ID       : " + rep.deviceId);
    console.log("  Hardware Model  : " + rep.model);
    console.log("  Secure Enclave  : " + rep.secureElement);
    console.log("  Attested Status : " + (rep.teeAttested ? "Active (Verified)" : "Unverified"));
    console.log("\nSolana Identity:");
    console.log("  Public Key      : " + vault.getPublicKey());
    console.log("\nDePIN Telemetry & Rewards:");
    console.log("  Accrued Credits : " + overview.totalCredits + " SOLSEEK");
    console.log("  Epochs Settled  : " + overview.epochsClaimed);
    console.log("  Last Claimed    : " + (overview.lastClaimedAt || "Never"));

  } else if (command === "rewards") {
    printBanner();
    const overview = ledger.getOverview();
    console.log("Accrued DePIN Credits by Protocol Channel:");
    for (const [proto, creds] of Object.entries(overview.protocolBreakdown)) {
      console.log(`  - ${proto.padEnd(28)}: ${creds.toFixed(4)} credits`);
    }
    console.log(`\nTotal Available to Claim: ${overview.totalCredits.toFixed(4)} SOLSEEK`);

    if (args[1] === "claim") {
      console.log("\n[Settlement] Requesting on-chain epoch settlement for " + vault.getPublicKey() + "...");
      const result = ledger.claimEpochRewards(vault.getPublicKey());
      if (result.success) {
        console.log("[Settlement] Success! Claimed: " + result.claimRecord.creditsClaimed + " SOLSEEK");
        console.log("[Settlement] Transaction Hash: " + result.claimRecord.simulatedTxHash);
      } else {
        console.log("[Settlement] Failed: " + result.message);
      }
    } else {
      console.log("\nTo claim accumulated credits, run: solseeker rewards claim");
    }

  } else if (command === "mwa") {
    printBanner();
    const mwa = new MobileWalletAdapterServer(vault, { port: 8974 });
    const port = await mwa.start();
    console.log(`[MWA Server] Mobile Wallet Adapter bridge running on http://127.0.0.1:${port}/mwa`);
    console.log("Waiting for mobile dApp connection (Press Ctrl+C to stop)...");
    process.on("SIGINT", async () => {
      await mwa.stop();
      process.exit(0);
    });

  } else {
    printBanner();
    console.log("Usage: solseeker <command>\n");
    console.log("Commands:");
    console.log("  start            Start background DePIN harvesters & MWA bridge");
    console.log("  status           Display node health, attestation & reward state");
    console.log("  rewards [claim]  View protocol credits breakdown or claim epoch");
    console.log("  mwa              Run standalone Mobile Wallet Adapter server");
    console.log("  help             Show this guidance manual");
  }
}

main().catch((err) => {
  console.error("Fatal Error in SolSeeker-Engine:", err.message);
  process.exit(1);
});
