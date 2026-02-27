import { config } from "../config";
import { logger } from "../utils/logger";
import { supabaseAdmin } from "../config/supabase";

const RESEND_URL = "https://api.resend.com/emails";

interface NotificationRow {
    id: string;
    event_type: string;
    trip_id: string | null;
    contract_id: string | null;
    created_at: string;
}

/**
 * Process unsent notification_log rows: resolve recipient emails, send via Resend, set sent_at.
 * Returns { processed, sent, errors }.
 */
export async function processNotificationLog(): Promise<{
    processed: number;
    sent: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let sent = 0;

    const { data: rows, error: fetchError } = await supabaseAdmin
        .from("notification_log")
        .select("id, event_type, trip_id, contract_id, created_at")
        .is("sent_at", null)
        .order("created_at", { ascending: true })
        .limit(50);

    if (fetchError) {
        return { processed: 0, sent: 0, errors: [fetchError.message] };
    }

    const list = (rows || []) as NotificationRow[];
    if (list.length === 0) {
        return { processed: 0, sent: 0, errors: [] };
    }

    const apiKey = config.resend.apiKey;
    if (!apiKey) {
        return { processed: list.length, sent: 0, errors: ["RESEND_API_KEY not set; skipping send"] };
    }

    for (const row of list) {
        try {
            const { to, subject, text } = await buildMessage(row);
            if (!to.length) {
                await markSent(row.id);
                sent += 1;
                continue;
            }
            const ok = await sendResend(to, subject, text);
            if (ok) {
                await markSent(row.id);
                sent += 1;
            } else {
                errors.push(`Failed to send for notification ${row.id}`);
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(`Notification ${row.id}: ${msg}`);
        }
    }

    return { processed: list.length, sent, errors };
}

async function buildMessage(
    row: NotificationRow
): Promise<{ to: string[]; subject: string; text: string }> {
    const to: string[] = [];
    let subject = "Dispatch notification";
    let text = `Event: ${row.event_type} at ${row.created_at}`;

    if (row.event_type === "trip_completed" && row.contract_id) {
        const { data: contract } = await supabaseAdmin
            .from("contracts")
            .select("courier_id, shipper_id")
            .eq("id", row.contract_id)
            .single();
        if (contract) {
            const [courierRes, shipperRes] = await Promise.all([
                supabaseAdmin.from("couriers").select("contact_email").eq("id", (contract as any).courier_id).single(),
                supabaseAdmin.from("shippers").select("contact_email").eq("id", (contract as any).shipper_id).single(),
            ]);
            const courierEmail = (courierRes.data as any)?.contact_email;
            const shipperEmail = (shipperRes.data as any)?.contact_email;
            if (courierEmail) to.push(courierEmail);
            if (shipperEmail) to.push(shipperEmail);
            subject = "Trip completed";
            text = `Trip (contract ${row.contract_id}) has been completed. ${text}`;
        }
    }

    return { to, subject, text };
}

async function sendResend(to: string[], subject: string, text: string): Promise<boolean> {
    if (!to.length) return true;
    const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.resend.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: config.resend.fromEmail,
            to,
            subject,
            text,
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        logger.error({ status: res.status, body }, "[notificationService] Resend error");
        return false;
    }
    return true;
}

async function markSent(id: string): Promise<void> {
    await supabaseAdmin
        .from("notification_log")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", id);
}
