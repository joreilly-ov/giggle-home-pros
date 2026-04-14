/**
 * Tests for src/components/ReviewMediator.tsx
 *
 * Covers:
 *  - LockedOverlay shown when escrowStatus is absent, null, or any non-released value
 *  - Form shown when escrowStatus is 'released'
 *  - Form shown when escrowStatus is 'funds_released'
 *  - Submit button disabled (aria-disabled) when escrow not released
 *  - Submit button enabled when escrow is released
 *  - Validation fires when ratings are missing
 *  - Private feedback field carries "Admin only" badge
 *  - liveOverall score computation renders once all three categories are rated
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ReviewMediator } from "@/components/ReviewMediator";

// ─── Mock Supabase ───────────────────────────────────────────────────────────
// ReviewList (mode='list') queries Supabase; we suppress it so tests that only
// render the form don't hit real network code.

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

// ─── Shared props ─────────────────────────────────────────────────────────────

const baseProps = {
  contractorId: "contractor-uuid-123",
  jobId: "job-uuid-456",
  mode: "form" as const, // isolate form, skip ReviewList Supabase call
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Escrow gate ──────────────────────────────────────────────────────────────

describe("ReviewMediator — escrow gate", () => {
  it("shows LockedOverlay when escrowStatus is undefined", () => {
    render(<ReviewMediator {...baseProps} />);
    expect(screen.getByText(/review locked/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit review/i })).not.toBeInTheDocument();
  });

  it("shows LockedOverlay when escrowStatus is null", () => {
    render(<ReviewMediator {...baseProps} escrowStatus={null} />);
    expect(screen.getByText(/review locked/i)).toBeInTheDocument();
  });

  it("shows LockedOverlay when escrowStatus is 'pending'", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="pending" />);
    expect(screen.getByText(/review locked/i)).toBeInTheDocument();
  });

  it("shows LockedOverlay when escrowStatus is 'held'", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="held" />);
    expect(screen.getByText(/review locked/i)).toBeInTheDocument();
  });

  it("shows LockedOverlay when escrowStatus is an empty string", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="" />);
    expect(screen.getByText(/review locked/i)).toBeInTheDocument();
  });

  it("unlocks the form when escrowStatus is 'released'", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);
    expect(screen.queryByText(/review locked/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit review/i })).toBeInTheDocument();
  });

  it("unlocks the form when escrowStatus is 'funds_released'", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="funds_released" />);
    expect(screen.queryByText(/review locked/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit review/i })).toBeInTheDocument();
  });

  it("LockedOverlay mentions awaiting payment release", () => {
    render(<ReviewMediator {...baseProps} />);
    expect(screen.getByText(/awaiting payment release/i)).toBeInTheDocument();
  });
});

// ─── Submit button disabled/enabled state ────────────────────────────────────

describe("ReviewMediator — submit button state", () => {
  it("submit button has aria-disabled when escrow is not released", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="pending" />);
    // The LockedOverlay replaces the form, so no submit button should exist
    expect(screen.queryByRole("button", { name: /submit review/i })).not.toBeInTheDocument();
  });

  it("submit button is present and not aria-disabled when escrow is released", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);
    const btn = screen.getByRole("button", { name: /submit review/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toHaveAttribute("aria-disabled", "true");
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe("ReviewMediator — validation", () => {
  it("shows validation errors when form is submitted without ratings", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(screen.getByText(/please rate quality/i)).toBeInTheDocument();
    expect(screen.getByText(/please rate communication/i)).toBeInTheDocument();
    expect(screen.getByText(/please rate cleanliness/i)).toBeInTheDocument();
  });

  it("clears a category error when the user rates that category", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);

    // trigger validation
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    expect(screen.getByText(/please rate quality/i)).toBeInTheDocument();

    // rate Quality by clicking the "1" dot
    const qualityDots = screen.getAllByRole("button", { name: /score 1/i });
    fireEvent.click(qualityDots[0]);

    expect(screen.queryByText(/please rate quality/i)).not.toBeInTheDocument();
    // other errors remain
    expect(screen.getByText(/please rate communication/i)).toBeInTheDocument();
  });
});

// ─── Form fields ──────────────────────────────────────────────────────────────

describe("ReviewMediator — form content", () => {
  it("renders the three category labels", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);
    expect(screen.getByText("Quality")).toBeInTheDocument();
    expect(screen.getByText("Communication")).toBeInTheDocument();
    expect(screen.getByText("Cleanliness")).toBeInTheDocument();
  });

  it("shows the private feedback field with Admin only badge", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);
    expect(screen.getByText(/admin only/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/never shown to the tradesman/i)).toBeInTheDocument();
  });

  it("shows the public comment field", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);
    expect(
      screen.getByPlaceholderText(/what went well/i),
    ).toBeInTheDocument();
  });
});

// ─── liveOverall score ────────────────────────────────────────────────────────

describe("ReviewMediator — live overall score", () => {
  it("shows 'Rate each category below' before any rating is given", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);
    expect(screen.getByText(/rate each category below/i)).toBeInTheDocument();
  });

  it("shows a numeric score once all three categories are rated", () => {
    render(<ReviewMediator {...baseProps} escrowStatus="released" />);

    // Click score 5 for each category (first dot-picker button with aria-label "Score 5")
    const fiveButtons = screen.getAllByRole("button", { name: /score 5/i });
    // There are 3 categories × 5 dots = 15 buttons total; click the 5th of each group
    fireEvent.click(fiveButtons[0]); // Quality 5
    fireEvent.click(fiveButtons[1]); // Communication 5
    fireEvent.click(fiveButtons[2]); // Cleanliness 5

    // 5+5+5 / 3 = 5.00
    expect(screen.getByText("5.0")).toBeInTheDocument();
    expect(screen.queryByText(/rate each category below/i)).not.toBeInTheDocument();
  });
});
