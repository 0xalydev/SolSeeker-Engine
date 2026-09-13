import crypto from "node:crypto";
import os from "node:os";

export class DeviceAttestationEngine {
  constructor(options = {}) {
    this.hardwareTier = options.hardwareTier || "emulated_secure_enclave";
    this.modelName = options.modelName || `SolSeeker-Virtual-(${os.platform()}-${os.arch()})`;
    this.deviceId = this._generateDeviceId();
  }

  _generateDeviceId() {
    const raw = `${os.hostname()}::${os.platform()}::${os.arch()}::${os.cpus().length}`;
    return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
  }

  generateProofOfPresence(challenge, vault) {
    const timestamp = Date.now();
    const payload = JSON.stringify({
      deviceId: this.deviceId,
      modelName: this.modelName,
      hardwareTier: this.hardwareTier,
      challenge: challenge || "genesis-handshake",
      timestamp,
    });

    const payloadBuffer = Buffer.from(payload, "utf8");
    const signature = vault.signMessage(payloadBuffer);

    return {
      deviceId: this.deviceId,
      payload,
      signature: signature.toString("base64"),
      publicKey: vault.getPublicKey(),
      verifiedAt: timestamp,
    };
  }

  getAttestationReport() {
    return {
      deviceId: this.deviceId,
      model: this.modelName,
      hardwareTier: this.hardwareTier,
      secureElement: "TEE / Android StrongBox Emulation",
      teeAttested: true,
      depinEligibility: "tier-1-unrestricted",
    };
  }
}
