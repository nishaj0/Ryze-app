/**
 * Cloudinary image optimization utilities for Ryze
 */

/**
 * Returns a crisp thumbnail URL suitable for avatars, list items, and compact cards (Retina-friendly 2x-3x).
 */
export function getThumbnailUrl(url: string, size: number = 240): string {
  if (!url) return "";
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/w_${size},h_${size},c_fill,g_auto,q_auto,f_auto/`);
  }
  return url;
}

/**
 * Returns a high-resolution, optimized image URL for banners, detail views, and animated exercise loops.
 */
export function getHighResUrl(url: string, maxWidth: number = 800): string {
  if (!url) return "";
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/w_${maxWidth},c_limit,q_auto:good,f_auto/`);
  }
  return url;
}

/**
 * Returns an optimized Cloudinary URL with custom dimensions.
 */
export function getOptimizedImageUrl(url: string, width: number = 800, height?: number): string {
  if (!url) return "";
  if (url.includes("/upload/")) {
    const transform = height
      ? `w_${width},h_${height},c_fill,g_auto,q_auto:good,f_auto/`
      : `w_${width},c_limit,q_auto:good,f_auto/`;
    return url.replace("/upload/", `/upload/${transform}`);
  }
  return url;
}

