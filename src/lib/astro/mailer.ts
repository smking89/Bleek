/**
 * Outbound mail for ASTRO.
 *
 * Verification links go out through Resend when RESEND_API_KEY is set. Without
 * a key nothing is sent and the caller is told so, which keeps local and preview
 * environments working: the link is logged in development and surfaced in the
 * UI there, never mailed from a deployment that has no sender.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type DeliveryResult = { delivered: boolean; detail?: string };

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  return process.env.ASTRO_EMAIL_FROM ?? "ASTRO <onboarding@resend.dev>";
}

function body(input: { url: string; handle?: string }): { text: string; html: string } {
  const greeting = input.handle ? `@${input.handle}` : "there";
  const text = [
    `Hi ${greeting},`,
    "",
    "Confirm this address to finish setting up your ASTRO account. The link works once and expires in 24 hours.",
    "",
    input.url,
    "",
    "If you did not create an ASTRO account, ignore this email: nothing changes until the link is opened.",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;background:#000000;color:#F8FAFC;font-family:Inter,Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px">
    <p style="margin:0 0 24px;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#F8FAFC">ASTRO</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#CBD5E1">Hi ${greeting},</p>
    <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#94A3B8">
      Confirm this address to finish setting up your ASTRO account. The link works once and expires in 24 hours.
    </p>
    <p style="margin:0 0 24px">
      <a href="${input.url}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#F8FAFC;color:#000000;font-size:13px;font-weight:600;text-decoration:none">Verify this email</a>
    </p>
    <p style="margin:0;font-size:11px;line-height:18px;color:#64748B">
      If you did not create an ASTRO account, ignore this email: nothing changes until the link is opened.
    </p>
  </div>
</body></html>`;

  return { text, html };
}

/** Sends one verification email. Never throws: the caller decides what to show. */
export async function sendVerificationEmail(input: {
  to: string;
  url: string;
  handle?: string;
}): Promise<DeliveryResult> {
  if (!mailConfigured()) {
    // Dev only: a production deployment with no sender must not write tokens to its logs.
    if (process.env.NODE_ENV !== "production") {
      console.info(`[astro] verification link for ${input.to}: ${input.url}`);
    }
    return { delivered: false, detail: "mail_unconfigured" };
  }

  const { text, html } = body(input);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [input.to],
        subject: "Verify your ASTRO email",
        text,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[astro] verification email rejected (${response.status}): ${detail.slice(0, 240)}`);
      return { delivered: false, detail: `provider_${response.status}` };
    }

    return { delivered: true };
  } catch (error) {
    console.error(`[astro] verification email failed: ${error instanceof Error ? error.message : String(error)}`);
    return { delivered: false, detail: "provider_unreachable" };
  }
}
