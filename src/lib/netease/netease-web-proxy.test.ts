import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/utils/cache", () => ({
  cachedFetch: (_key: string, fetcher: () => Promise<unknown>) => fetcher(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("NetEase production Web proxy", () => {
  it("routes playlist market requests through the Pages function", async () => {
    vi.stubEnv("PROD", true);
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { playlists: [{ id: 123, name: "Test", coverImgUrl: "cover" }] },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getPlaylists } = await import("./netease-api");
    const playlists = await getPlaylists("全部", "hot", 30, 0);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("/music-api/netease/playlists");
    expect(playlists).toEqual([
      { id: "123", name: "Test", coverUrl: "cover", playCount: 0, userId: "" },
    ]);
  });

  it("gets the QR key from the Pages function instead of NetEase directly", async () => {
    vi.stubEnv("PROD", true);
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { unikey: "test-key" } }), {
        status: 200,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getQrKey } = await import("./netease-api");
    expect(await getQrKey()).toBe("test-key");
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /^\/music-api\/netease\/login\/qr\/key\?timestamp=\d+$/
    );
  });
});
