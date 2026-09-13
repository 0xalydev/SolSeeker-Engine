import test from "node:test";
import assert from "node:assert";
import { DePINHarvester } from "../src/depin/harvester.js";
import { SoftwareSeedVault } from "../src/core/vault.js";
import { DeviceAttestationEngine } from "../src/core/attestation.js";

test("DePINHarvester produces telemetry across protocols", (t, done) => {
  const vault = new SoftwareSeedVault();
  vault.generateKeypair();
  const attestation = new DeviceAttestationEngine();

  const harvester = new DePINHarvester(vault, attestation, { sampleIntervalMs: 50 });
  let count = 0;

  harvester.onTelemetry((sample) => {
    assert.ok(sample.protocol);
    assert.ok(sample.creditsEarned > 0);
    count++;
    if (count >= 3) {
      harvester.stop();
      done();
    }
  });

  harvester.start();
});
