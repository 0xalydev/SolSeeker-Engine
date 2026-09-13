import crypto from "node:crypto";
import { DEPIN_PROTOCOLS } from "./types.js";

export class DePINHarvester {
  constructor(vault, attestation, options = {}) {
    this.vault = vault;
    this.attestation = attestation;
    this.sampleIntervalMs = options.sampleIntervalMs || 3000;
    this.isRunning = false;
    this.intervalHandle = null;
    this.telemetryHistory = [];
    this.listeners = [];
  }

  onTelemetry(callback) {
    this.listeners.push(callback);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalHandle = setInterval(() => {
      this._sampleAllChannels();
    }, this.sampleIntervalMs);

    this._sampleAllChannels();
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    this.isRunning = false;
  }

  _sampleAllChannels() {
    const timestamp = Date.now();
    const samples = [
      this._sampleBandwidth(timestamp),
      this._sampleBle(timestamp),
      this._sampleGeolocation(timestamp),
    ];

    for (const sample of samples) {
      this.telemetryHistory.push(sample);
      if (this.telemetryHistory.length > 500) {
        this.telemetryHistory.shift();
      }
      for (const listener of this.listeners) {
        listener(sample);
      }
    }
  }

  _sampleBandwidth(timestamp) {
    const latencyMs = Math.floor(18 + Math.random() * 25);
    const throughputMbps = Number((65 + Math.random() * 85).toFixed(2));
    const packetHash = crypto.randomBytes(8).toString("hex");

    return {
      protocol: DEPIN_PROTOCOLS.BANDWIDTH,
      timestamp,
      metrics: {
        latencyMs,
        throughputMbps,
        jitterMs: Number((Math.random() * 2.5).toFixed(1)),
        packetHash,
      },
      creditsEarned: 0.25,
    };
  }

  _sampleBle(timestamp) {
    const devicesDiscovered = Math.floor(1 + Math.random() * 6);
    const rssi = -Math.floor(40 + Math.random() * 45);

    return {
      protocol: DEPIN_PROTOCOLS.BLE_BEACON,
      timestamp,
      metrics: {
        devicesDiscovered,
        avgRssi: rssi,
        meshRelayId: `mesh-${crypto.randomBytes(4).toString("hex")}`,
      },
      creditsEarned: 0.15 * devicesDiscovered,
    };
  }

  _sampleGeolocation(timestamp) {
    const cellId = `CID-${Math.floor(100000 + Math.random() * 900000)}`;
    const signalStrengthDbm = -Math.floor(65 + Math.random() * 30);

    return {
      protocol: DEPIN_PROTOCOLS.GEOLOCATION,
      timestamp,
      metrics: {
        cellTowerId: cellId,
        signalStrengthDbm,
        accuracyMeters: 4.2,
      },
      creditsEarned: 0.40,
    };
  }

  getRecentMetrics() {
    return this.telemetryHistory.slice(-10);
  }
}
