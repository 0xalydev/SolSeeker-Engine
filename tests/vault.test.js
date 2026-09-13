import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { SoftwareSeedVault } from "../src/core/vault.js";

test("SoftwareSeedVault creates, saves, loads, and signs messages", (t) => {
  const tmpDir = path.join(process.cwd(), ".solseeker-test-vault-" + Date.now());
  const vault = new SoftwareSeedVault({ storageDir: tmpDir });

  const { publicKey } = vault.generateKeypair("unit-test-key");
  assert.ok(publicKey.length >= 32, "Public key must be valid base58");
  assert.strictEqual(vault.getPublicKey(), publicKey);

  const testMessage = Buffer.from("solseeker-attestation-test-message");
  const signature = vault.signMessage(testMessage);
  assert.ok(signature.length === 64, "Ed25519 signature must be 64 bytes");

  const verified = vault.verifyMessage(testMessage, signature);
  assert.strictEqual(verified, true, "Signature verification must succeed");

  vault.saveVault("secret123");

  const loadedVault = new SoftwareSeedVault({ storageDir: tmpDir });
  const loaded = loadedVault.loadVault("secret123");
  assert.strictEqual(loaded, true);
  assert.strictEqual(loadedVault.getPublicKey(), publicKey);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
