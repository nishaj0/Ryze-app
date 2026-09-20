import { describe, it, expect } from "vitest";
import { getThumbnailUrl, getHighResUrl, getOptimizedImageUrl } from "./cloudinary";

describe("cloudinary utilities", () => {
  const sampleUrl =
    "https://res.cloudinary.com/ryze-cloud/image/upload/v1710000000/ryze/exercises/ab_roller_0.jpg";

  it("should return empty string for empty input", () => {
    expect(getThumbnailUrl("")).toBe("");
    expect(getHighResUrl("")).toBe("");
    expect(getOptimizedImageUrl("")).toBe("");
  });

  it("should return un-transformed url if not a cloudinary upload url", () => {
    const rawUrl = "https://example.com/image.jpg";
    expect(getThumbnailUrl(rawUrl)).toBe(rawUrl);
    expect(getHighResUrl(rawUrl)).toBe(rawUrl);
    expect(getOptimizedImageUrl(rawUrl)).toBe(rawUrl);
  });

  it("should generate crisp retina thumbnail with custom or default dimensions", () => {
    const defaultThumb = getThumbnailUrl(sampleUrl);
    expect(defaultThumb).toContain("/upload/w_240,h_240,c_fill,g_auto,q_auto,f_auto/");

    const customThumb = getThumbnailUrl(sampleUrl, 320);
    expect(customThumb).toContain("/upload/w_320,h_320,c_fill,g_auto,q_auto,f_auto/");
  });

  it("should generate high-res optimized url for banners and animation", () => {
    const highRes = getHighResUrl(sampleUrl);
    expect(highRes).toContain("/upload/w_800,c_limit,q_auto:good,f_auto/");
    expect(highRes).not.toContain("w_80,h_80");
  });

  it("should generate custom dimension optimized url", () => {
    const custom = getOptimizedImageUrl(sampleUrl, 600, 400);
    expect(custom).toContain("/upload/w_600,h_400,c_fill,g_auto,q_auto:good,f_auto/");
  });
});
