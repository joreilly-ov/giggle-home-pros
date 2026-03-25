import { supabase } from "@/integrations/supabase/client";

const BASE = "https://stable-gig-374485351183.europe-west1.run.app";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobStatus =
  | "draft"
  | "open"
  | "awarded"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BidStatus = "pending" | "accepted" | "rejected";

export interface Job {
  id: string;
  user_id: string;
  status: JobStatus;
  analysis_result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorSummary {
  id: string;
  business_name: string;
  postcode?: string;
  expertise?: string[];
}

export interface RfpDocument {
  executive_summary: string;
  scope_of_work: string;
  cost_estimate: { low: number; high: number };
  permit_required: boolean;
  permit_notes?: string;
}

export interface RfpResponse {
  job_id: string;
  rfp_document: RfpDocument;
}

export interface ContractorMatch {
  contractor_id: string;
  business_name: string;
  trade_activities: string[];
  years_experience?: number;
  insurance_verified: boolean;
  match_score?: number;
}

export interface MatchResponse {
  job_id: string;
  strategy: "embedding" | "activity_fallback";
  contractors: ContractorMatch[];
}

export type EscrowStatusValue = "pending" | "held" | "funds_released" | "refunded";

export interface EscrowStatus {
  job_escrow_status: EscrowStatusValue;
}

export interface Bid {
  id: string;
  job_id: string;
  contractor_id: string;
  amount_pence: number;
  note: string;
  status: BidStatus;
  created_at: string;
  contractor?: ContractorSummary;
  job?: Job;
}

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  jobs: {
    create: (analysisResult: Record<string, unknown>) =>
      request<Job>("/jobs", {
        method: "POST",
        body: JSON.stringify({ analysis_result: analysisResult }),
      }),

    list: () => request<Job[]>("/jobs"),

    get: (id: string) => request<Job>(`/jobs/${id}`),

    updateStatus: (id: string, status: JobStatus) =>
      request<Job>(`/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  bids: {
    submit: (jobId: string, amountPence: number, note: string) =>
      request<Bid>(`/jobs/${jobId}/bids`, {
        method: "POST",
        body: JSON.stringify({ amount_pence: amountPence, note }),
      }),

    listForJob: (jobId: string) => request<Bid[]>(`/jobs/${jobId}/bids`),

    respond: (jobId: string, bidId: string, action: "accept" | "reject") =>
      request<Bid>(`/jobs/${jobId}/bids/${bidId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }),

    mine: () => request<Bid[]>("/me/bids"),
  },

  rfp: {
    generate: (jobId: string, clarificationAnswers: Record<string, string>) =>
      request<RfpResponse>(`/jobs/${jobId}/rfp`, {
        method: "POST",
        body: JSON.stringify({ clarification_answers: clarificationAnswers }),
      }),
  },

  matching: {
    get: (jobId: string) => request<MatchResponse>(`/jobs/${jobId}/contractors/matches`),
  },

  contractor: {
    embedProfile: () =>
      request<{ ok: boolean }>("/me/contractor/embed-profile", { method: "POST" }),
  },

  escrow: {
    config: () => request<{ stripe_publishable_key: string }>("/escrow/config"),

    get: (jobId: string) =>
      request<EscrowStatus>(`/jobs/${jobId}/escrow`),

    initiate: (jobId: string) =>
      request<{ client_secret: string; amount_pence: number }>(`/jobs/${jobId}/escrow/initiate`, {
        method: "POST",
      }),

    release: (jobId: string, note?: string) =>
      request<{ ok: boolean; payout_pending?: boolean }>(`/jobs/${jobId}/escrow/release`, {
        method: "POST",
        body: JSON.stringify({ note: note ?? "" }),
      }),

    refund: (jobId: string, reason?: string) =>
      request<{ ok: boolean }>(`/jobs/${jobId}/escrow/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: reason ?? "" }),
      }),
  },
};
