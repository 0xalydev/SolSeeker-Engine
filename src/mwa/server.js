import http from "node:http";

export class MobileWalletAdapterServer {
  constructor(vault, options = {}) {
    this.vault = vault;
    this.port = options.port || 8974;
    this.server = null;
    this.sessions = new Map();
  }

  start() {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if (req.method === "OPTIONS") {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.url === "/mwa/status" && req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            status: "ready",
            wallet: "SolSeeker-Engine-MWA",
            publicKey: this.vault.getPublicKey(),
            version: "2.0.0",
          }));
          return;
        }

        if (req.url === "/mwa/rpc" && req.method === "POST") {
          let body = "";
          req.on("data", chunk => body += chunk);
          req.on("end", () => {
            try {
              const rpc = JSON.parse(body);
              const response = this.handleRpc(rpc);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(response));
            } catch (err) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32600, message: err.message }, id: null }));
            }
          });
          return;
        }

        res.writeHead(404);
        res.end();
      });

      this.server.listen(this.port, () => {
        resolve(this.port);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  handleRpc(rpc) {
    const { method, params, id } = rpc;

    if (method === "authorize") {
      const authToken = `auth_${Math.random().toString(36).slice(2, 16)}`;
      const pubkey = this.vault.getPublicKey();
      this.sessions.set(authToken, { pubkey, createdAt: Date.now() });

      return {
        jsonrpc: "2.0",
        result: {
          auth_token: authToken,
          accounts: [{
            address: pubkey,
            label: "SolSeeker Primary Account",
          }],
          wallet_uri_base: `http://127.0.0.1:${this.port}/mwa`,
        },
        id,
      };
    }

    if (method === "deauthorize") {
      const { auth_token } = params || {};
      this.sessions.delete(auth_token);
      return { jsonrpc: "2.0", result: {}, id };
    }

    if (method === "sign_messages") {
      const { messages } = params || {};
      if (!Array.isArray(messages)) {
        return { jsonrpc: "2.0", error: { code: -32602, message: "Invalid messages array" }, id };
      }
      const signed = messages.map(msgBase64 => {
        const buffer = Buffer.from(msgBase64, "base64");
        const sig = this.vault.signMessage(buffer);
        return sig.toString("base64");
      });
      return { jsonrpc: "2.0", result: { signatures: signed }, id };
    }

    return {
      jsonrpc: "2.0",
      error: { code: -32601, message: `Method not implemented: ${method}` },
      id,
    };
  }
}
