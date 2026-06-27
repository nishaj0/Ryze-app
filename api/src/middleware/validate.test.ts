import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";

describe("validate middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    next = vi.fn();
  });

  it("should call next for valid body", () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    req.body = { email: "test@example.com", password: "password123" };
    const middleware = validate(schema);

    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid body", () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    req.body = { email: "invalid-email", password: "short" };
    const middleware = validate(schema);

    middleware(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        details: expect.any(Array),
      })
    );
  });

  it("should return field-level errors", () => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });

    req.body = { email: "invalid", name: "" };
    const middleware = validate(schema);

    middleware(req as Request, res as Response, next);

    const call = (res.json as any).mock.calls[0][0];
    expect(call.details.length).toBeGreaterThan(0);
    expect(call.details[0]).toHaveProperty("field");
    expect(call.details[0]).toHaveProperty("message");
  });

  it("should coerce body to parsed data", () => {
    const schema = z.object({
      age: z.coerce.number(),
    });

    req.body = { age: "25" };
    const middleware = validate(schema);

    middleware(req as Request, res as Response, next);

    expect(req.body.age).toBe(25);
    expect(next).toHaveBeenCalled();
  });
});
