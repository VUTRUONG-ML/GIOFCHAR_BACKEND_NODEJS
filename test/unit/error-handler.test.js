import { describe, expect, it, vi, afterEach } from "vitest";

import logger from "../../src/config/logger.js";
import { errorHandler } from "../../src/errors/errorHandler.js";
import {
LOG_ACTIONS,
LOG_STATUSES,
} from "../../src/constants/logEvents.js";

function createMockResponse(){
    return {
        statusCode: undefined,
        body: undefined,
        status(code){
            this.statusCode = code;
            return this;
        },
        json(body){
            this.body = body;
            return this;
        }
    }
}

describe("errorHandler", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("Return a safe 500 response and logs internal error details", () => {
        const error = new Error("Database password leaked internally");
        error.stack = "Error: Database password leaked internally\n at checkout";
        error.code = "ER_DEAD_LOCK";

        const req = {
            originalUrl: "/api/orders/checkout", 
            requestId: "request-123"
        }

        const res = createMockResponse();
        const next = vi.fn();
        const loggerErrorSpy = vi.spyOn(logger, "error");

        errorHandler(error, req, res, next);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({
            message: "Server error",
            requestId: "request-123",
        });

        const serializedResponse = JSON.stringify(res.body);

        expect(serializedResponse).not.toContain(error.message);
        expect(serializedResponse).not.toContain(error.stack);
        expect(serializedResponse).not.toContain(error.code);

        expect(loggerErrorSpy).toHaveBeenCalledWith(
            LOG_ACTIONS.SYSTEM.UNHANDLED_ERROR,
            expect.objectContaining({
            status: LOG_STATUSES.FAILED,
            requestId: "request-123",
            message: error.message,
            stack: error.stack,
            context: {},
            }),
        );

        expect(next).not.toHaveBeenCalled();
    })
})