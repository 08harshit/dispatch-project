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

    const contractIds = [...new Set(list.filter((r) => r.contract_id).map((r) => r.contract_id!))];
    const contractEmailMap = await buildContractEmailMap(contractIds);

    for (const row of list) {
        try {
            const { to, subject, text } = buildMessage(row, contractEmailMap);
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

async function buildContractEmailMap(contractIds: string[]): Promise<Map<string, { courierEmail?: string; shipperEmail?: string }>> {
    const map = new Map<string, { courierEmail?: string; shipperEmail?: string }>();
    if (contractIds.length === 0) return map;

    const { data: contracts } = await supabaseAdmin
        .from("contracts")
        .select("id, courier_id, shipper_id")
        .in("id", contractIds);

    if (!contracts?.length) return map;

    const courierIds = [...new Set(contracts.map((c: any) => c.courier_id).filter(Boolean))];
    const shipperIds = [...new Set(contracts.map((c: any) => c.shipper_id).filter(Boolean))];

    const [couriersRes, shippersRes] = await Promise.all([
        courierIds.length ? supabaseAdmin.from("couriers").select("id, contact_email").in("id", courierIds) : { data: [] },
        shipperIds.length ? supabaseAdmin.from("shippers").select("id, contact_email").in("id", shipperIds) : { data: [] },
    ]);

    const courierMap = new Map((couriersRes.data || []).map((c: any) => [c.id, c.contact_email]));
    const shipperMap = new Map((shippersRes.data || []).map((s: any) => [s.id, s.contact_email]));

    for (const c of contracts as any[]) {
        map.set(c.id, {
            courierEmail: courierMap.get(c.courier_id),
            shipperEmail: shipperMap.get(c.shipper_id),
        });
    }
    return map;
}

function buildMessage(
    row: NotificationRow,
    contractEmailMap: Map<string, { courierEmail?: string; shipperEmail?: string }>,
): { to: string[]; subject: string; text: string } {
    const to: string[] = [];
    let subject = "Dispatch notification";
    let text = `Event: ${row.event_type} at ${row.created_at}`;

    const tripEventTypes = ["courier_assigned", "trip_started", "trip_completed", "trip_cancelled"];
    if (tripEventTypes.includes(row.event_type) && row.contract_id) {
        const emails = contractEmailMap.get(row.contract_id);
        if (emails) {
            if (emails.courierEmail) to.push(emails.courierEmail);
            if (emails.shipperEmail) to.push(emails.shipperEmail);
        }
        if (config.adminEmail) to.push(config.adminEmail);

        if (row.event_type === "courier_assigned") {
            subject = "Load Assigned to Courier";
            text = `A load has been assigned to a courier for contract ${row.contract_id}. ${text}`;
        } else if (row.event_type === "trip_started") {
            subject = "Trip Started";
            text = `Pickup scan recorded for trip (contract ${row.contract_id}). ${text}`;
        } else if (row.event_type === "trip_completed") {
            subject = "Trip Completed";
            text = `Trip (contract ${row.contract_id}) has been completed. ${text}`;
        } else if (row.event_type === "trip_cancelled") {
            subject = "Trip Cancelled";
            text = `Trip (contract ${row.contract_id}) has been cancelled. ${text}`;
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
