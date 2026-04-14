/**
 * Tests for src/lib/api.ts
 *
 * Covers:
 *  - Auth header injection when a session token exists
 *  - Auth header omitted when no session
 *  - Error thrown with response body when res.ok is false
 *  - Error thrown with fallback message when body is empty
 *  - Correct URL construction for a representative endpoint
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const BASE = "https://stable-gig-374485351183.europe-west1.run.app";

// ─── Mock Supabase client ────────────────────────────────────────────────────

const mockGetSession = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
  },
}));

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import AFTER mocks are declared so module picks up the stubs
const { api } = await import("@/lib/api");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockSession(token: string | null) {
  mockGetSession.mockResolvedValue({
    data: { session: token ? { access_token: token } : null },
  });
}

function mockResponse(
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {},
) {
  mockFetch.mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () =>
      Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("api — auth headers", () => {
  it("includes Authorization header when a session token exists", async () => {
    mockSession("test-token-abc");
    mockResponse([]);

    await api.jobs.list();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-token-abc");
  });

  it("omits Authorization header when there is no session", async () => {
    mockSession(null);
    mockResponse([]);

    await api.jobs.list();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("always sets Content-Type to application/json", async () => {
    mockSession(null);
    mockResponse([]);

    await api.jobs.list();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("api — URL construction", () => {
  it("calls the correct base URL and path for jobs.list", async () => {
    mockSession(null);
    mockResponse([]);

    await api.jobs.list();

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe(`${BASE}/jobs`);
  });

  it("interpolates the job ID for jobs.get", async () => {
    mockSession(null);
    mockResponse({ id: "job-1" });

    await api.jobs.get("job-1");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe(`${BASE}/jobs/job-1`);
  });

  it("constructs nested bid path correctly", async () => {
    mockSession(null);
    mockResponse({ id: "bid-1" });

    await api.bids.respond("job-1", "bid-1", "accept");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe(`${BASE}/jobs/job-1/bids/bid-1`);
  });
});

describe("api — error handling", () => {
  it("throws with the response body text when res.ok is false", async () => {
    mockSession("tok");
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve("bid amount must be positive"),
      json: () => Promise.resolve({}),
    });

    await expect(api.bids.submit("job-1", -100, "too cheap")).rejects.toThrow(
      "bid amount must be positive",
    );
  });

  it("throws a fallback message when the error body is empty", async () => {
    mockSession("tok");
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(""),
      json: () => Promise.resolve({}),
    });

    await expect(api.jobs.list()).rejects.toThrow("Request failed (503)");
  });

  it("returns parsed JSON on success", async () => {
    mockSession("tok");
    const job = { id: "job-42", status: "open" };
    mockResponse(job);

    const result = await api.jobs.get("job-42");

    expect(result).toEqual(job);
  });
});

describe("api — HTTP methods", () => {
  it("uses POST for jobs.create", async () => {
    mockSession("tok");
    mockResponse({ id: "new-job" });

    await api.jobs.create({ summary: "fix roof" });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
  });

  it("uses PATCH for jobs.updateStatus", async () => {
    mockSession("tok");
    mockResponse({ id: "job-1", status: "open" });

    await api.jobs.updateStatus("job-1", "open");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PATCH");
  });

  it("serialises the bid payload to JSON", async () => {
    mockSession("tok");
    mockResponse({ id: "bid-new" });

    await api.bids.submit("job-1", 5000, "my note");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      amount_pence: 5000,
      note: "my note",
    });
  });
});
