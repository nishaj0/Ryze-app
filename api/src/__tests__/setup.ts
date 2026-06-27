import { vi } from "vitest";
import "./prisma-mock";

process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.DIRECT_URL = "postgresql://test:test@localhost:5432/test";
process.env.ADMIN_KEY = "test-admin-key";
