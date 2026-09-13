function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Protect scripts that create, update, or delete fixture data.
 *
 * Local runs require an explicit local intent and a loopback target. Staging
 * runs require explicit staging intent and an exact configured target host.
 * APP_ENV=production is always rejected before any mutation can occur.
 */
export function assertSafeMutationTarget(targetUrl, operation) {
  if (process.env.APP_ENV === "production") {
    throw new Error(`Refusing ${operation}: APP_ENV=production`);
  }

  const intent = requireEnv("BUZL_MUTATION_ENV");
  if (intent !== "local" && intent !== "staging") {
    throw new Error(`Refusing ${operation}: BUZL_MUTATION_ENV must be local or staging`);
  }

  const hostname = new URL(targetUrl).hostname.toLowerCase();

  if (intent === "local") {
    if (!isLoopback(hostname)) {
      throw new Error(`Refusing ${operation}: local mutations require a loopback target`);
    }
    return;
  }

  if (process.env.BUZL_ENV !== "staging" || process.env.ALLOW_STAGING_MUTATIONS !== "true") {
    throw new Error(`Refusing ${operation}: BUZL_ENV=staging and ALLOW_STAGING_MUTATIONS=true are required`);
  }

  const expectedHost = requireEnv("STAGING_MUTATION_TARGET_HOST").toLowerCase();
  if (hostname !== expectedHost) {
    throw new Error(`Refusing ${operation}: target host does not match STAGING_MUTATION_TARGET_HOST`);
  }
}
