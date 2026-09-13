import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { encodeBase58 } from "./base58.js";

const DEFAULT_STORAGE_DIR = path.join(process.cwd(), ".solseeker-state", "vault");

export class SoftwareSeedVault {
  constructor(options = {}) {
    this.storageDir = options.storageDir || DEFAULT_STORAGE_DIR;
    this.keypair = null;
    this.publicKeyBase58 = null;
    this.unlocked = false;
    this._ensureStorage();
  }

  _ensureStorage() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  generateKeypair(label = "primary-seeker-identity") {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const rawPublic = publicKey.export({ type: "spki", format: "der" }).subarray(-32);
    const rawPrivate = privateKey.export({ type: "pkcs8", format: "der" }).subarray(-32);

    this.keypair = {
      publicKey,
      privateKey,
      rawPublic,
      rawPrivate,
      label,
      createdAt: new Date().toISOString(),
    };
    this.publicKeyBase58 = encodeBase58(rawPublic);
    this.unlocked = true;
    return {
      publicKey: this.publicKeyBase58,
      label,
    };
  }

  saveVault(passphrase = "solseeker-default-passphrase") {
    if (!this.keypair) {
      throw new Error("Cannot save uninitialized vault. Generate keypair first.");
    }
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const payload = JSON.stringify({
      rawPrivate: this.keypair.rawPrivate.toString("hex"),
      rawPublic: this.keypair.rawPublic.toString("hex"),
      label: this.keypair.label,
      createdAt: this.keypair.createdAt,
    });

    const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    const fileContent = JSON.stringify({
      version: 1,
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      ciphertext: encrypted.toString("hex"),
      publicKey: this.publicKeyBase58,
    }, null, 2);

    const filePath = path.join(this.storageDir, "vault.json");
    fs.writeFileSync(filePath, fileContent, "utf8");
    return filePath;
  }

  loadVault(passphrase = "solseeker-default-passphrase") {
    const filePath = path.join(this.storageDir, "vault.json");
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const salt = Buffer.from(data.salt, "hex");
    const iv = Buffer.from(data.iv, "hex");
    const tag = Buffer.from(data.tag, "hex");
    const ciphertext = Buffer.from(data.ciphertext, "hex");

    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(decrypted);

    const rawPrivate = Buffer.from(parsed.rawPrivate, "hex");
    const rawPublic = Buffer.from(parsed.rawPublic, "hex");

    const privateKey = crypto.createPrivateKey({
      key: Buffer.concat([
        Buffer.from("302e020100300506032b657004220420", "hex"),
        rawPrivate
      ]),
      format: "der",
      type: "pkcs8"
    });
    const publicKey = crypto.createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        rawPublic
      ]),
      format: "der",
      type: "spki"
    });

    this.keypair = {
      publicKey,
      privateKey,
      rawPublic,
      rawPrivate,
      label: parsed.label,
      createdAt: parsed.createdAt,
    };
    this.publicKeyBase58 = encodeBase58(rawPublic);
    this.unlocked = true;
    return true;
  }

  signMessage(messageBuffer) {
    if (!this.unlocked || !this.keypair) {
      throw new Error("Vault is locked or uninitialized.");
    }
    const signature = crypto.sign(null, Buffer.from(messageBuffer), this.keypair.privateKey);
    return signature;
  }

  verifyMessage(messageBuffer, signatureBuffer) {
    if (!this.keypair) {
      throw new Error("Vault uninitialized.");
    }
    return crypto.verify(null, Buffer.from(messageBuffer), this.keypair.publicKey, Buffer.from(signatureBuffer));
  }

  getPublicKey() {
    return this.publicKeyBase58;
  }

  isInitialized() {
    return fs.existsSync(path.join(this.storageDir, "vault.json")) || this.keypair !== null;
  }
}
