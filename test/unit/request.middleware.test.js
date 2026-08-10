import { describe, expect, it, vi, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import logger from "../../src/config/logger.js";
import {
LOG_ACTIONS,
LOG_STATUSES,
} from "../../src/constants/logEvents.js";
import { requestLogger } from "../../src/middlewares/request.middleware.js";

function createMockReq({ method = "GET", url = "/health", headers = {} } = {}){
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;

    req.headers = Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    );

    req.socket = { remoteAddress: "127.0.0.1" };
    req.connection = req.socket;
    req.path = url;

    req.get = (name) => req.headers[name.toLowerCase()];

    return req;
}

function createMockRes(){
    const res = new EventEmitter();

    res.headers = {};
    res.setHeader = vi.fn((name, value) => {
        res.headers[name.toLowerCase()] = value;
    });
    res.statusCode = 200;
    return res;
}

describe("requestLogger", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("Create a request ID when user does not send one", () => {
        const req = createMockReq({method: "GET", url: "/api/health"})
        const res = createMockRes();
        const next = vi.fn();

        // const loggerInfoSpy = vi.spyOn(logger, "info");
        requestLogger(req, res, next);

        expect(req.requestId).toBeTruthy();
        expect(res.headers["x-request-id"]).toBeTruthy();
    });

    it("Retain the valid request ID from the user", () => {
        const requestId = "550e8400-e29b-41d4-a716-446655440000";
        const req = createMockReq({
            method: "GET",
            url: "/api/health",
            headers: {
                "X-Request-ID": requestId,
            },
        });

        const res = createMockRes();
        const next = vi.fn();

        requestLogger(req, res, next);

        expect(req.requestId).toBe(requestId);
        expect(res.setHeader).toHaveBeenCalledWith(
            "X-Request-ID",
            requestId,
        );
    });


    it("Create a new request ID when request ID from user invalid", () => {
        const requestIdInvalid = "request-123";
        const req = createMockReq({
            headers: {
                "X-Request-ID": requestIdInvalid,
            },
        });

        const res = createMockRes();
        const next = vi.fn();
        requestLogger(req, res, next);
        expect(res.headers["x-request-id"]).not.toBe(requestIdInvalid);
        expect(res.headers["x-request-id"]).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        expect(req.requestId).toBe(res.headers["x-request-id"]);
    });

    it("Implementing logging REQUEST FINISH", () => {
        const req = createMockReq({method: "GET", url: "/api/health"})
        const res = createMockRes();
        const next = vi.fn();

        const loggerInfoSpy = vi.spyOn(logger, "info");
        requestLogger(req, res, next);

        res.statusCode = 200;
        res.emit("finish");
        expect(loggerInfoSpy).toHaveBeenCalledWith(
            LOG_ACTIONS.SYSTEM.HTTP_REQUEST,
            expect.objectContaining({
                status: LOG_STATUSES.COMPLETED,
                statusCode: res.statusCode,
            }),
        );
    });

    it("Implementing logging REQUEST ABORTED", () => {
        const req = createMockReq({method: "GET", url: "/api/health"})
        const res = createMockRes();
        const next = vi.fn();

        const loggerWarnSpy = vi.spyOn(logger, "warn");
        requestLogger(req, res, next);

        res.statusCode = 200;
        req.emit("aborted");
        const reason = "REQUEST_ABORTED_BY_CLIENT";
        expect(loggerWarnSpy).toHaveBeenCalledWith(
            LOG_ACTIONS.SYSTEM.HTTP_REQUEST,
            expect.objectContaining({
                status: LOG_STATUSES.ABORTED,
                reason,
                method: req.method,
                path: req.path,
            }),
        );
    });

    it("Write ABORTED LOG when CLOSE response before FINISH", () => {
        const req = createMockReq({method: "GET", url: "/api/health"})
        const res = createMockRes();
        const next = vi.fn();

        const loggerWarnSpy = vi.spyOn(logger, "warn");
        const loggerInfoSpy = vi.spyOn(logger, "info");
        requestLogger(req, res, next);

        res.emit("close");
        res.emit("finish");
        // invocationCallOrder[0] là level log thứ mấy. Ví dụ loggerWarnSpy.mock.invocationCallOrder[0] => thứ 0 trong requestLogger của level WARN chính là ABORTED || CLOSE.
        // còn với info phải lấy thứ 1 vì thứ 0 là của STARTED rồi, số 1 là INFO của COMPLETE.
        expect(loggerWarnSpy.mock.invocationCallOrder[0])
            .toBeLessThan(loggerInfoSpy.mock.invocationCallOrder[1]);
    });

    it("Do not write ABORTED LOG if response FINISH (COMPLETE)", () => {
        const req = createMockReq({method: "GET", url: "/api/health"})
        const res = createMockRes();
        const next = vi.fn();
        res.statusCode = 200;

        const loggerWarnSpy = vi.spyOn(logger, "warn");
        const loggerInfoSpy = vi.spyOn(logger, "info");
        requestLogger(req, res, next);

        res.emit("finish");
        req.emit("aborted");

        expect(loggerInfoSpy).toHaveBeenCalledWith(
            LOG_ACTIONS.SYSTEM.HTTP_REQUEST,
            expect.objectContaining({
                status: LOG_STATUSES.COMPLETED,
                statusCode: res.statusCode,
            }),
        );
        expect(loggerWarnSpy).not.toHaveBeenCalled();
    });
})