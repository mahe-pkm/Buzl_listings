import { assertSafeMutationTarget } from "./lib/mutation-safety.mjs";

const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, originalEnv);
}

function expectRejected(name, setup) {
  resetEnv();
  setup();
  try {
    assertSafeMutationTarget(process.env.TEST_TARGET_URL, name);
  } catch {
    console.log(`PASS: ${name} rejected`);
    return;
  }
  throw new Error(`FAIL: ${name} was not rejected`);
}

function expectAllowed(name, setup) {
  resetEnv();
  setup();
  assertSafeMutationTarget(process.env.TEST_TARGET_URL, name);
  console.log(`PASS: ${name} allowed`);
}

try {
  expectRejected("production target", () => {
    process.env.APP_ENV = "production";
    process.env.BUZL_MUTATION_ENV = "staging";
    process.env.TEST_TARGET_URL = "https://api-listing.rclk.in";
  });

  expectRejected("remote target marked local", () => {
    process.env.BUZL_MUTATION_ENV = "local";
    process.env.TEST_TARGET_URL = "https://api-listing.rclk.in";
  });

  expectRejected("staging target host mismatch", () => {
    process.env.BUZL_MUTATION_ENV = "staging";
    process.env.BUZL_ENV = "staging";
    process.env.ALLOW_STAGING_MUTATIONS = "true";
    process.env.STAGING_MUTATION_TARGET_HOST = "expected.example";
    process.env.TEST_TARGET_URL = "https://other.example";
  });

  expectAllowed("loopback local target", () => {
    process.env.BUZL_MUTATION_ENV = "local";
    process.env.TEST_TARGET_URL = "http://127.0.0.1:54321";
  });

  expectAllowed("explicit matching staging target", () => {
    process.env.BUZL_MUTATION_ENV = "staging";
    process.env.BUZL_ENV = "staging";
    process.env.ALLOW_STAGING_MUTATIONS = "true";
    process.env.STAGING_MUTATION_TARGET_HOST = "api-listing.rclk.in";
    process.env.TEST_TARGET_URL = "https://api-listing.rclk.in";
  });
} finally {
  resetEnv();
}
