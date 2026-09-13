# Contributing to SolSeeker-Engine

Thank you for contributing to SolSeeker-Engine. We welcome bug reports, protocol connectors, test additions, and documentation improvements.

---

## Development Workflow

1. Fork the repository and create a branch from `main`.
2. Keep dependencies minimal; adhere to Node.js native standard libraries where feasible.
3. Ensure all tests pass prior to submitting a pull request:

```bash
npm test
```

4. Write targeted unit tests for any new protocol connectors, cryptographic adapters, or CLI commands.
5. Provide a clear PR description detailing problem, solution, and verification proof.

---

## Code of Conduct

- Be respectful and constructive in review discussions and issue threads.
- Do not commit secrets, private keys, or API tokens.
- Maintain high code quality and zero regressions.
