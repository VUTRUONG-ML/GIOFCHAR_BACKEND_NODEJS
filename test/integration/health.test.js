import { EventEmitter } from "node:events";

import { describe, expect, it } from "vitest";

import app from "../../src/app.js";

function createMockReq({ method = "GET", url = "/health", headers = {} } = {}) {
  const req = new EventEmitter();

  req.method = method;
  req.url = url;
  req.originalUrl = url;
  req.headers = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  req.socket = { remoteAddress: "127.0.0.1" };
  req.connection = req.socket;
  req.get = (name) => req.headers[name.toLowerCase()];

  return req;
}

function createMockRes() {
  const res = new EventEmitter();

  res.statusCode = 200;
  res.headers = {};
  res.body = undefined;
  res.finished = false;

  res.setHeader = (name, value) => {
    res.headers[name.toLowerCase()] = value;
  };

  res.getHeader = (name) => res.headers[name.toLowerCase()];

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (body) => {
    res.body = body;
    res.finished = true;
    res.emit("finish");
    res.emit("close");
    return res;
  };

  res.send = (body) => {
    res.body = body;
    res.finished = true;
    res.emit("finish");
    res.emit("close");
    return res;
  };

  return res;
}

function invokeApp(req, res) {
  return new Promise((resolve, reject) => {
    res.once("finish", () => resolve(res));
    res.once("error", reject);

    try {
      app(req, res);
    } catch (error) {
      reject(error);
    }
  });
}

describe("GET /health", () => {
  it("returns ok and exposes request id", async () => {
    const req = createMockReq();
    const res = createMockRes();

    await invokeApp(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
    });
    expect(res.getHeader("X-Request-ID")).toBeTruthy();
  });

  it("keeps a valid request id from client", async () => {
    const requestId = "550e8400-e29b-41d4-a716-446655440000";
    const req = createMockReq({
      headers: {
        "X-Request-ID": requestId,
      },
    });
    const res = createMockRes();

    await invokeApp(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.getHeader("X-Request-ID")).toBe(requestId);
  });
});
