import test from "node:test";
import assert from "node:assert";
import { MobileWalletAdapterServer } from "../src/mwa/server.js";
import { SoftwareSeedVault } from "../src/core/vault.js";

test("MobileWalletAdapterServer handles authorization and message signing", async () => {
  const vault = new SoftwareSeedVault();
  vault.generateKeypair("mwa-test");
  const server = new MobileWalletAdapterServer(vault, { port: 9876 });
  const port = await server.start();
  assert.strictEqual(port, 9876);

  const authRes = server.handleRpc({
    method: "authorize",
    params: {},
    id: 1,
  });
  assert.strictEqual(authRes.id, 1);
  assert.ok(authRes.result.auth_token);
  assert.strictEqual(authRes.result.accounts[0].address, vault.getPublicKey());

  const sampleMsg = Buffer.from("Hello SolSeeker").toString("base64");
  const signRes = server.handleRpc({
    method: "sign_messages",
    params: { messages: [sampleMsg] },
    id: 2,
  });
  assert.strictEqual(signRes.id, 2);
  assert.ok(signRes.result.signatures[0]);

  await server.stop();
});
