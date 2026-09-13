export class SolanaRpcClient {
  constructor(rpcUrl = "https://api.devnet.solana.com") {
    this.rpcUrl = rpcUrl;
  }

  async getHealth() {
    try {
      const res = await this._call("getHealth");
      return res === "ok";
    } catch {
      return false;
    }
  }

  async getBalance(base58Address) {
    const res = await this._call("getBalance", [base58Address]);
    return {
      lamports: res?.value || 0,
      sol: (res?.value || 0) / 1e9,
    };
  }

  async getLatestBlockhash() {
    const res = await this._call("getLatestBlockhash", [{ commitment: "confirmed" }]);
    return res?.value;
  }

  async _call(method, params = []) {
    const payload = {
      jsonrpc: "2.0",
      id: "solseeker-client",
      method,
      params,
    };
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(json.error.message || "Solana RPC error");
    }
    return json.result;
  }
}
