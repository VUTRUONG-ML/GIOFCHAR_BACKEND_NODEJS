import { describe, expect, it, vi, afterEach } from "vitest";
import { redactSensitiveData } from "../../src/config/logger.js";

describe("logger.redaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Redact sensitive fields at the root level to [REDACTED]", () => {
    const info = {
      level: "info",
      message: "User authentication attempt",
      password: "SuperSecretPassword123",
      authorization: "Bearer my-jwt-token-string",
      cookie: "session_id=xyz789",
      token: "any-oauth-token",
      jwt: "jwt-payload-signature",
      secret: "application-secret-key",
      // Non-sensitive data that should remain untouched
      normalField: "keep-this-data",
      requestId: "req-12345",
      service: "backend-service",
    };

    const formatter = redactSensitiveData();
    const result = formatter.transform(info);

    // Verify sensitive fields are redacted
    expect(result.password).toBe("[REDACTED]");
    expect(result.authorization).toBe("[REDACTED]");
    expect(result.cookie).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
    expect(result.jwt).toBe("[REDACTED]");
    expect(result.secret).toBe("[REDACTED]");

    // Verify non-sensitive fields are unchanged
    expect(result.normalField).toBe("keep-this-data");
    expect(result.requestId).toBe("req-12345");
    expect(result.service).toBe("backend-service");
  });

  it("Redact sensitive fields inside nested objects recursively", () => {
    const info = {
      level: "error",
      message: "External API error",
      metadata: {
        headers: {
          authorization: "Bearer secret-token",
          cookie: "cookie-identifier",
          "content-type": "application/json",
        },
        payload: {
          user: {
            username: "lebar",
            password: "mypassword",
          },
          apiKey: "my-api-key",
          secret: "nested-secret",
        },
      },
    };

    const formatter = redactSensitiveData();
    const result = formatter.transform(info);

    // Verify nested sensitive fields are redacted
    expect(result.metadata.headers.authorization).toBe("[REDACTED]");
    expect(result.metadata.headers.cookie).toBe("[REDACTED]");
    expect(result.metadata.payload.user.password).toBe("[REDACTED]");
    expect(result.metadata.payload.secret).toBe("[REDACTED]");

    // Verify nested non-sensitive fields are untouched
    expect(result.metadata.headers["content-type"]).toBe("application/json");
    expect(result.metadata.payload.user.username).toBe("lebar");
  });

  it("Handle circular references gracefully without throwing errors", () => {
    const info = {
      level: "debug",
      message: "Testing circular references",
      password: "plain-text-password",
      normal: "do-not-redact",
    };
    info.self = info; // Circular reference

    const formatter = redactSensitiveData();
    let result;

    expect(() => {
      result = formatter.transform(info);
    }).not.toThrow();

    expect(result.password).toBe("[REDACTED]");
    expect(result.normal).toBe("do-not-redact");
  });
});
