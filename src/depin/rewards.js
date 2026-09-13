import fs from "node:fs";
import path from "node:path";

const DEFAULT_LEDGER_PATH = path.join(process.cwd(), ".solseeker-state", "rewards.json");

export class RewardLedger {
  constructor(options = {}) {
    this.filePath = options.filePath || DEFAULT_LEDGER_PATH;
    this.state = {
      totalCredits: 0,
      protocolCredits: {
        bandwidth_latency_mesh: 0,
        ble_mesh_beacon: 0,
        transit_cellular_mapping: 0,
      },
      epochsClaimed: 0,
      lastClaimedAt: null,
      history: [],
    };
    this._load();
  }

  _ensureStorage() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, "utf8");
        this.state = JSON.parse(content);
      }
    } catch (e) {
      // Use defaults if corrupted
    }
  }

  save() {
    this._ensureStorage();
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  recordTelemetrySample(sample) {
    const credits = sample.creditsEarned || 0;
    this.state.totalCredits += credits;
    if (this.state.protocolCredits[sample.protocol] !== undefined) {
      this.state.protocolCredits[sample.protocol] += credits;
    } else {
      this.state.protocolCredits[sample.protocol] = credits;
    }
    this.save();
  }

  claimEpochRewards(walletAddress) {
    const claimable = this.state.totalCredits;
    if (claimable <= 0) {
      return { success: false, message: "No accumulated credits to claim." };
    }

    const claimRecord = {
      claimId: `claim-${Date.now()}`,
      wallet: walletAddress,
      creditsClaimed: claimable,
      claimedAt: new Date().toISOString(),
      simulatedTxHash: `tx_${Math.random().toString(36).slice(2, 18)}`,
    };

    this.state.epochsClaimed += 1;
    this.state.lastClaimedAt = claimRecord.claimedAt;
    this.state.totalCredits = 0;
    for (const key of Object.keys(this.state.protocolCredits)) {
      this.state.protocolCredits[key] = 0;
    }
    this.state.history.unshift(claimRecord);
    if (this.state.history.length > 50) {
      this.state.history.pop();
    }
    this.save();
    return { success: true, claimRecord };
  }

  getOverview() {
    return {
      totalCredits: Number(this.state.totalCredits.toFixed(4)),
      protocolBreakdown: Object.fromEntries(
        Object.entries(this.state.protocolCredits).map(([k, v]) => [k, Number(v.toFixed(4))])
      ),
      epochsClaimed: this.state.epochsClaimed,
      lastClaimedAt: this.state.lastClaimedAt,
      recentClaims: this.state.history.slice(0, 5),
    };
  }
}
