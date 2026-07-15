export function getThumbnailUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/w_80,h_80,c_fill,q_auto,f_auto/");
  }
  return url;
}
