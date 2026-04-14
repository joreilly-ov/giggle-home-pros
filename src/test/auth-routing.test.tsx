/**
 * Tests for the post-login redirect logic in src/pages/Auth.tsx
 *
 * The key rule (from CLAUDE.md + Auth.tsx):
 *   1. If ?next= is present and starts with "/", go there directly.
 *   2. Otherwise check contractors table — if a row exists → /contractor/profile
 *   3. No contractor row → check profiles table
 *      a. postcode + interests present → /dashboard
 *      b. Incomplete profile         → /profile
 *
 * We test by rendering <Auth /> with a logged-in user already in AuthContext,
 * mocking Supabase table responses and react-router-dom's navigate.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ─── Mock navigate ────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Shared Supabase mock factory ─────────────────────────────────────────────

type ContractorRow = { id: string } | null;
type ProfileRow = { postcode: string | null; interests: string[] | null } | null;

function mockSupabase(contractor: ContractorRow, profile: ProfileRow) {
  return {
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "contractors") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: contractor,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: profile,
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn() }) };
    }),
  };
}

// ─── Mock AuthContext ─────────────────────────────────────────────────────────

const mockUser = { id: "user-uuid-999", email: "test@example.com" };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, session: null, loading: false, signOut: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Supabase module mock (reset per-test via mockSupabase helper) ────────────

let supabaseMock = mockSupabase(null, null);

vi.mock("@/integrations/supabase/client", () => ({
  get supabase() {
    return supabaseMock;
  },
}));

// ─── Import page AFTER mocks ──────────────────────────────────────────────────

const { default: Auth } = await import("@/pages/Auth");

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderAuth(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/auth${search}`]}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Auth — post-login redirect", () => {
  it("redirects to /contractor/profile when user has a contractors row", async () => {
    supabaseMock = mockSupabase({ id: "contractor-row-1" }, null);

    renderAuth();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/contractor/profile", { replace: true });
    });
  });

  it("redirects to /dashboard when profile is complete (postcode + interests)", async () => {
    supabaseMock = mockSupabase(null, {
      postcode: "SW1A 1AA",
      interests: ["Plumbing", "Electrical"],
    });

    renderAuth();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("redirects to /profile when postcode is missing", async () => {
    supabaseMock = mockSupabase(null, {
      postcode: null,
      interests: ["Plumbing"],
    });

    renderAuth();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true });
    });
  });

  it("redirects to /profile when interests array is empty", async () => {
    supabaseMock = mockSupabase(null, {
      postcode: "SW1A 1AA",
      interests: [],
    });

    renderAuth();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true });
    });
  });

  it("redirects to /profile when profile row is null", async () => {
    supabaseMock = mockSupabase(null, null);

    renderAuth();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile", { replace: true });
    });
  });

  it("honours the ?next= param and skips the contractor/profile lookup", async () => {
    // Even if they have a contractor row, ?next= takes priority
    supabaseMock = mockSupabase({ id: "contractor-row-1" }, null);

    renderAuth("?next=/post-project");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/post-project", { replace: true });
    });
  });

  it("does NOT follow ?next= when it is an external URL (no leading /)", async () => {
    supabaseMock = mockSupabase({ id: "contractor-row-1" }, null);

    renderAuth("?next=https://evil.com");

    await waitFor(() => {
      // Should fall through to normal routing, not the external URL
      expect(mockNavigate).not.toHaveBeenCalledWith(
        "https://evil.com",
        expect.anything(),
      );
    });
  });
});
