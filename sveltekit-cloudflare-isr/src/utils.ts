import type { duration } from "./types";

export const durationToMilliseconds = (duration: duration) => {
  if (typeof duration === "number") return duration;

  let [number, unit] = duration.split(" ") as [any, string];
  number = Number(number);
  unit = unit.endsWith("s") ? unit.slice(0, -1) : unit;
  switch (unit) {
    case "second":
      return number * 1000;
    case "minute":
      return number * 1000 * 60;
    case "hour":
      return number * 1000 * 60 * 60;
    case "day":
      return number * 1000 * 60 * 60 * 24;
    case "week":
      return number * 1000 * 60 * 60 * 24 * 7;
    case "month":
      return number * 1000 * 60 * 60 * 24 * 30;
    case "year":
      return number * 1000 * 60 * 60 * 24 * 365;
    default:
      throw new Error(`Invalid duration: ${duration}`);
  }
};

export const makeCacheableResponse = (
  response: Response,
  {
    longTermCacheDuration,
    duration
  }: { longTermCacheDuration: duration; longTermKVDuration: duration; duration: duration }
) => {
  const clone = new Response(response.clone().body, response);
  clone.headers.append("Cache-Control", `s-maxage=${durationToMilliseconds(longTermCacheDuration)}`);
  const expires = new Date();
  expires.setMilliseconds(expires.getMilliseconds() + durationToMilliseconds(duration));
  clone.headers.append("Expires", expires.toUTCString());
  return clone;
};

const sha256 = async (message: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message)))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const generateHash = async (request: Request): Promise<{ hash: string; cacheKey: Request }> => {
  const body = await request.clone().text();
  const hash = await sha256(body + request.url.toString());
  const cacheUrl = new URL(request.url);
  cacheUrl.pathname = "/posts" + cacheUrl.pathname + hash;
  const cacheKey = new Request(cacheUrl.toString(), {
    headers: request.headers,
    method: "GET"
  });
  return { hash, cacheKey };
};
