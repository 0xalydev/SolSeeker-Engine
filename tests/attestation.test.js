import test from "node:test";
import assert from "node:assert";
import { DeviceAttestationEngine } from "../src/core/attestation.js";
import { SoftwareSeedVault } from "../src/core/vault.js";

test("DeviceAttestationEngine produces verifiable proof-of-presence", () => {
  const attestation = new DeviceAttestationEngine();
  const vault = new SoftwareSeedVault();
  vault.generateKeypair("attestation-test");

  const proof = attestation.generateProofOfPresence("challenge-xyz", vault);
  assert.ok(proof.deviceId);
  assert.ok(proof.signature);
  assert.strictEqual(proof.publicKey, vault.getPublicKey());

  const rep = attestation.getAttestationReport();
  assert.strictEqual(rep.teeAttested, true);
});
