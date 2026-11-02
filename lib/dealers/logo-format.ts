export type LogoFormat = { extension: string; contentType: string };

// SVGs are served from the public bucket, so anything that could run script or load other content is refused.
const unsafeSvg = /<script|<foreignObject|<iframe|<embed|<object|\son[a-z]+\s*=|javascript:|<!ENTITY/i;

// Identifies the format from the file's bytes rather than the browser-supplied type or name.
export function detectLogoFormat(bytes: Uint8Array): LogoFormat | "unsafe-svg" | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { extension: "png", contentType: "image/png" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", contentType: "image/jpeg" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { extension: "webp", contentType: "image/webp" };
  const text = new TextDecoder().decode(bytes);
  if (/^\s*(\ufeff)?\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(text)) {
    return unsafeSvg.test(text) ? "unsafe-svg" : { extension: "svg", contentType: "image/svg+xml" };
  }
  return null;
}
