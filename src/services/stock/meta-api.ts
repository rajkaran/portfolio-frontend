import { loopbackApi } from "./loopback-api";

export type TickerOptionsDTO = {
  market: Record<string, string>;
  stockClass: Record<string, string>;
  bucket: Record<string, string>;
};

export async function getTickerOptions() {
  const res = await loopbackApi.get<TickerOptionsDTO>("/meta/ticker-options");
  return res.data;
}
