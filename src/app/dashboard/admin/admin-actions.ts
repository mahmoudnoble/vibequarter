"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireSuperAdmin } from "@/lib/roles";
import { ensureClinicContext, updateClinicProvisioning } from "@/lib/booking/clinic";
import { replaceAgentHours } from "@/lib/booking/agent-hours";
import type { WorkingHourInput } from "@/lib/booking/types";

export type CreateClinicInput = {
  name: string;
  whatsappPhoneNumberId?: string;
  scope: "whatsapp" | "whatsapp_calls";
  vapiAssistantId?: string;
  vapiPhoneNumberId?: string;
  vapiPhoneE164?: string;
  agentHours?: WorkingHourInput[];
  // Sign-in is email + password (OAuth + self sign-up are disabled); the
  // super-admin provisions the receptionist and sends them these credentials.
  receptionistEmail?: string;
  receptionistPassword?: string;
};

export type CreateClinicResult = {
  ok: boolean;
  orgId?: string;
  clinicId?: string;
  receptionist?: { email: string } | null;
  receptionistError?: string;
  error?: string;
};

function msg(e: unknown): string {
  if (e && typeof e === "object") {
    const anyErr = e as { errors?: Array<{ message?: string; longMessage?: string }>; message?: string };
    const first = anyErr.errors?.[0];
    return first?.longMessage || first?.message || anyErr.message || "unknown error";
  }
  return String(e);
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/**
 * Create a clinic = a Clerk Organization (super-admin is its admin), seed its
 * clinic row + defaults, set its channel binding + agent answer-hours, and
 * optionally provision a receptionist (email + password → org:member). Clinic
 * creation succeeds even if receptionist provisioning fails.
 */
export async function createClinicAction(input: CreateClinicInput): Promise<CreateClinicResult> {
  await requireSuperAdmin();
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "not-authenticated" };
  if (!input.name?.trim()) return { ok: false, error: "name-required" };

  const client = await clerkClient();

  // 1) Clerk org (super-admin becomes its admin via createdBy).
  let orgId: string;
  try {
    const org = await client.organizations.createOrganization({
      name: input.name.trim(),
      createdBy: userId,
    });
    orgId = org.id;
  } catch (e) {
    return { ok: false, error: `org-create: ${msg(e)}` };
  }

  // 2) Seed the clinic row (services + hours) under the org id.
  const ctx = await ensureClinicContext(orgId);
  if (!ctx) return { ok: false, orgId, error: "clinic-seed-failed" };
  const clinicId = ctx.clinic.id;

  // 3) Channel binding + name.
  await updateClinicProvisioning(clinicId, orgId, {
    name: input.name.trim(),
    whatsapp_phone_number_id: input.whatsappPhoneNumberId?.trim() || null,
    scope: input.scope,
    vapi_assistant_id: input.vapiAssistantId?.trim() || null,
    vapi_phone_number_id: input.vapiPhoneNumberId?.trim() || null,
    vapi_phone_e164: input.vapiPhoneE164?.trim() || null,
  });

  // 4) Agent answer-hours (optional).
  if (input.agentHours?.length) {
    await replaceAgentHours(clinicId, orgId, input.agentHours);
  }

  // 5) Receptionist (optional, graceful).
  let receptionist: { email: string } | null = null;
  let receptionistError: string | undefined;
  if (input.receptionistEmail?.trim() && input.receptionistPassword) {
    const email = input.receptionistEmail.trim();
    const r = await provisionReceptionist(orgId, email, input.receptionistPassword);
    if (r.ok) receptionist = { email };
    else receptionistError = r.error;
  }

  return { ok: true, orgId, clinicId, receptionist, receptionistError };
}

/**
 * Create a receptionist Clerk user (email + password) and add them to the clinic
 * org as a member. The email is marked verified so they can sign in immediately
 * with the credentials the super-admin hands them.
 */
export async function provisionReceptionistAction(
  orgId: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireSuperAdmin();
  return provisionReceptionist(orgId, email.trim(), password);
}

async function provisionReceptionist(
  orgId: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!email || !password) return { ok: false, error: "email-and-password-required" };
  if (!isEmail(email)) return { ok: false, error: "invalid-email" };
  const client = await clerkClient();
  try {
    const user = await client.users.createUser({
      emailAddress: [email],
      password,
      skipPasswordChecks: false,
    });
    await client.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId: user.id,
      role: "org:member",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

/** Pause / resume a clinic (super-admin). */
export async function setClinicStatusAction(
  clinicId: string,
  orgId: string,
  status: "active" | "paused",
): Promise<{ ok: boolean }> {
  await requireSuperAdmin();
  const ok = await updateClinicProvisioning(clinicId, orgId, { status });
  return { ok };
}
