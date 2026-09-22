# `core/src/tests/` — Frameworks & Drivers

Tests are outer-ring **Frameworks & Drivers**. They drive the core through its
public boundaries or exercise pure Entities directly; they are not business
rules.

## Rules

- Test Entity behavior without mocks or framework setup.
- Test Use Cases through their boundary contract where practical.
- Keep tests independent of generated `dist/` output.
- Use test doubles only at an explicit boundary.
- A test must not justify adding a dependency from an inner circle to the test
  runner.

The current suite uses Node's test runner as a driver. Its location under
`src/` keeps source and tests together, while `tsconfig.test.json` compiles
these drivers into the throwaway `.test-build/` directory.
