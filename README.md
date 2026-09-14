# SolSeeker-Engine

Open-source Solana Seeker runtime and DePIN reward telemetry engine for regular mobile devices and emulators.

---

## Overview

SolSeeker-Engine bridges the gap between dedicated Web3 hardware (such as the Solana Saga and Solana Seeker) and standard mobile devices. It provides an extensible, modular daemon that implements:

- **Software Seed Vault:** Hardware-isolated Ed25519 key management and signing compliant with the Solana Mobile Stack (SMS).
- **Mobile Wallet Adapter (MWA) Bridge:** A local RPC server that allows mobile dApps to discover, authorize, and sign transactions on non-Saga/Seeker hardware.
- **DePIN Telemetry Harvester:** Multi-protocol background data sampling across bandwidth latency mesh, BLE mesh beaconing, and transit coverage mapping.
- **Proof-of-Presence Attestation:** Cryptographic verification ensuring legitimate device presence without leaking underlying secrets.
- **Reward & Epoch Settlement Ledger:** Real-time credit calculation, protocol breakdown, and simulated on-chain settlement.

---

## Architecture

```text
+-------------------------------------------------------------+
|                      SolSeeker-Engine                       |
+-------------------------------------------------------------+
           |                                     |
           v                                     v
+-----------------------+             +-----------------------+
|  Software Seed Vault  |             |  DePIN Harvester Hub  |
|  - Ed25519 keypair    |             |  - Bandwidth/Latency  |
|  - AES-GCM Encrypted  |             |  - BLE Mesh Beacons   |
|  - SMS-compliant      |             |  - Cellular Transit   |
+-----------------------+             +-----------------------+
           |                                     |
           v                                     v
+-----------------------+             +-----------------------+
|  MWA RPC Bridge Server|             |  Reward & Epoch Ledger|
|  - /mwa/status        |             |  - Micro-credit tally |
|  - /mwa/rpc           |             |  - Settlement proof   |
+-----------------------+             +-----------------------+
```

---

## Feature Matrix

| Capability | Solana Saga / Seeker | Standard Mobile | Standard Mobile + SolSeeker-Engine |
|---|---|---|---|
| Hardware Seed Vault | Dedicated Secure Silicon | Unavailable | Software-Isolated Emulated Vault |
| Mobile Wallet Adapter | Native OS Binding | Unavailable | Local HTTP/WS Bridge |
| DePIN Data Harvesting | Pre-configured | Manual apps | Unified Background Telemetry Hub |
| Proof-of-Presence Attestation | OEM-Signed Token | None | Device Fingerprint Attestation |
| Open-Source Extensibility | Closed Firmware | N/A | 100% Open-Source (MIT) |

---

## Installation & Quick Start

### Prerequisites
- Node.js >= 20.0.0 (Node 24 LTS recommended)
- Git

### Clone and Run

```bash
git clone https://github.com/0xalydev/SolSeeker-Engine.git
cd SolSeeker-Engine
npm test
```

### Start the Engine

```bash
# Start the DePIN harvester and MWA bridge
node bin/solseeker.js start
```

### Inspect Node Status

```bash
# Inspect device attestation and node health
node bin/solseeker.js status
```

### Inspect & Claim Rewards

```bash
# View protocol credit breakdown
node bin/solseeker.js rewards

# Claim accumulated epoch rewards
node bin/solseeker.js rewards claim
```

---

## Testing

The project has zero external runtime dependencies and uses Node's native test runner:

```bash
npm test
```

For a persistent Android installation, see the [Termux setup guide](docs/ANDROID_TERMUX_GUIDE.md).

---

## Contributing

We welcome community contributions. Please review [CONTRIBUTING.md](CONTRIBUTING.md) for details on submitting pull requests, coding standards, and opening issues.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
