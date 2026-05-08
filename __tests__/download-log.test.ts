import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/auth/supabase-server", () => ({
  supabaseService: vi.fn(),
}));

import { logDownload, type DownloadLogEntry } from "@/lib/logging/downloads";
import { supabaseService } from "@/lib/auth/supabase-server";

describe("logDownload", () => {
  let insertSpy: ReturnType<typeof vi.fn>;
  let thenSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    thenSpy = vi.fn();
    insertSpy = vi.fn().mockReturnValue({ then: thenSpy });
    (supabaseService as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({ insert: insertSpy }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("inserts into downloads table with all fields", () => {
    const entry: DownloadLogEntry = {
      userId: "user-123",
      ip: "1.2.3.4",
      url: "https://youtube.com/watch?v=abc",
      platform: "youtube",
      format: "cobalt:auto:1080",
      status: "success",
    };
    logDownload(entry);

    expect(insertSpy).toHaveBeenCalledWith({
      user_id: "user-123",
      ip: "1.2.3.4",
      url: "https://youtube.com/watch?v=abc",
      platform: "youtube",
      format: "cobalt:auto:1080",
      status: "success",
    });
  });

  it("handles null userId and format for extract-phase logging", () => {
    const entry: DownloadLogEntry = {
      userId: null,
      ip: "5.6.7.8",
      url: "https://instagram.com/p/abc",
      platform: "instagram",
      format: null,
      status: "success",
    };
    logDownload(entry);

    expect(insertSpy).toHaveBeenCalledWith({
      user_id: null,
      ip: "5.6.7.8",
      url: "https://instagram.com/p/abc",
      platform: "instagram",
      format: null,
      status: "success",
    });
  });

  it("calls supabaseService().from('downloads')", () => {
    logDownload({
      userId: null,
      ip: "0.0.0.0",
      url: "https://x.com/u/s/1",
      platform: "twitter",
      format: null,
      status: "success",
    });

    const sb = (supabaseService as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(sb.from).toHaveBeenCalledWith("downloads");
  });
});
