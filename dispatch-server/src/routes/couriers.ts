import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Couriers
 *   description: Courier management
 */

/**
 * @swagger
 * /couriers:
 *   get:
 *     summary: List all couriers
 *     tags: [Couriers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, email, phone, USDOT, or MC
 *       - in: query
 *         name: compliance
 *         schema: { type: string, enum: [compliant, non-compliant] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: equipmentType
 *         schema: { type: string }
 *       - in: query
 *         name: isNew
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of couriers
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Courier'
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const { search, compliance, status, equipmentType, isNew } = req.query;

        // --- Base query ---
        let query = supabaseAdmin.from("couriers").select("*").order("created_at", { ascending: false });

        // --- Apply filters ---
        if (compliance) {
            query = query.eq("compliance", compliance as string);
        }
        if (status) {
            query = query.eq("status", status as string);
        }
        if (isNew === "true") {
            query = query.eq("is_new", true);
        }
        if (search) {
            const term = `%${search}%`;
            query = query.or(
                `name.ilike.${term},contact_email.ilike.${term},phone.ilike.${term},usdot.ilike.${term},mc.ilike.${term}`
            );
        }

        const { data: couriers, error } = await query;

        if (error) {
            console.error("Error fetching couriers:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        if (!couriers || couriers.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // --- If equipmentType filter is set, get matching courier IDs ---
        let equipmentFilteredIds: string[] | null = null;
        if (equipmentType) {
            const { data: truckRows } = await supabaseAdmin
                .from("courier_trucks")
                .select("courier_id")
                .eq("equipment_type", equipmentType as string);
            equipmentFilteredIds = truckRows?.map(r => r.courier_id) || [];
        }

        const courierIds = couriers.map(c => c.id);

        // --- Batch fetch related data ---
        const [trucksResult, insuranceResult, historyResult, docsResult] = await Promise.all([
            supabaseAdmin.from("courier_trucks").select("*").in("courier_id", courierIds),
            supabaseAdmin.from("courier_insurance").select("*").in("courier_id", courierIds).order("created_at", { ascending: false }),
            supabaseAdmin.from("courier_history").select("*").in("courier_id", courierIds).order("created_at", { ascending: false }),
            supabaseAdmin.from("courier_documents").select("*").in("courier_id", courierIds).order("created_at", { ascending: false }),
        ]);

        // --- Group related data by courier_id ---
        const trucksByCourier = new Map<string, { equipment_type: string; count: number }[]>();
        for (const t of trucksResult.data || []) {
            if (!trucksByCourier.has(t.courier_id)) trucksByCourier.set(t.courier_id, []);
            trucksByCourier.get(t.courier_id)!.push(t);
        }

        const insuranceByCourier = new Map<string, string>();
        for (const ins of insuranceResult.data || []) {
            if (!insuranceByCourier.has(ins.courier_id)) {
                insuranceByCourier.set(ins.courier_id, ins.company_name || "");
            }
        }

        const historyByCourier = new Map<string, { date: string; action: string }[]>();
        for (const h of historyResult.data || []) {
            if (!historyByCourier.has(h.courier_id)) historyByCourier.set(h.courier_id, []);
            historyByCourier.get(h.courier_id)!.push({
                date: h.created_at?.split("T")[0] || "",
                action: h.action,
            });
        }

        const docsByCourier = new Map<string, { name: string; type: string; date: string }[]>();
        for (const d of docsResult.data || []) {
            if (!docsByCourier.has(d.courier_id)) docsByCourier.set(d.courier_id, []);
            docsByCourier.get(d.courier_id)!.push({
                name: d.name,
                type: d.type || "PDF",
                date: d.date || d.created_at?.split("T")[0] || "",
            });
        }

        // --- Shape response to match frontend Courier interface ---
        let shaped = couriers.map(c => {
            const trucks = trucksByCourier.get(c.id) || [];
            const totalTrucks = trucks.reduce((sum, t) => sum + (t.count || 0), 0);
            const equipmentTypes = trucks.map(t => t.equipment_type).filter(Boolean);

            return {
                id: c.id,
                name: c.name || "",
                contact: c.contact_email || "",
                phone: c.phone || "",
                compliance: c.compliance || "non-compliant",
                address: c.address || "",
                usdot: c.usdot || "",
                mc: c.mc || "",
                status: c.status || "active",
                trucks: totalTrucks,
                insuranceCompany: insuranceByCourier.get(c.id) || "",
                equipmentType: equipmentTypes.join(", ") || "",
                isNew: c.is_new || false,
                history: historyByCourier.get(c.id) || [],
                documents: docsByCourier.get(c.id) || [],
            };
        });

        // --- Apply equipment type filter (post-query since it's in a separate table) ---
        if (equipmentFilteredIds !== null) {
            shaped = shaped.filter(c => equipmentFilteredIds!.includes(c.id));
        }

        res.json({ success: true, data: shaped });
    } catch (err: any) {
        console.error("Error in GET /couriers:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/stats:
 *   get:
 *     summary: Get courier statistics
 *     tags: [Couriers]
 *     responses:
 *       200:
 *         description: Courier stats
 */
router.get("/stats", async (_req: Request, res: Response) => {
    try {
        const { data: couriers, error } = await supabaseAdmin
            .from("couriers")
            .select("status, compliance, is_new");

        if (error) {
            console.error("Error fetching stats:", error);
            return res.status(500).json({ success: false, error: error.message });
        }

        const all = couriers || [];
        const stats = {
            total: all.length,
            active: all.filter(c => c.status === "active").length,
            compliant: all.filter(c => c.compliance === "compliant").length,
            nonCompliant: all.filter(c => c.compliance === "non-compliant").length,
            new: all.filter(c => c.is_new === true).length,
        };

        res.json({ success: true, data: stats });
    } catch (err: any) {
        console.error("Error in GET /couriers/stats:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}:
 *   get:
 *     summary: Get a single courier by ID
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Courier details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       $ref: '#/components/schemas/Courier'
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { data: courier, error } = await supabaseAdmin
            .from("couriers")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !courier) {
            return res.status(404).json({ success: false, error: "Courier not found" });
        }

        res.json({ success: true, data: courier });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers:
 *   post:
 *     summary: Create a new courier
 *     tags: [Couriers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Courier'
 *     responses:
 *       200:
 *         description: Courier created
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const body = req.body;

        // 1. Insert into couriers table
        const { data: courier, error: courierError } = await supabaseAdmin
            .from("couriers")
            .insert({
                name: body.courierName,
                address: body.address,
                city: body.city,
                state: body.state,
                zip_code: body.zipCode,
                business_type: body.businessType || null,
                business_phone: body.businessPhone,
                fax: body.fax,
                business_email: body.businessEmail,
                contact_email: body.contactEmail || body.businessEmail,
                phone: body.contactPhone || body.businessPhone,
                website: body.website,
                business_hours: body.hours,
                timezone: body.timezone || null,
                usdot: body.usdot,
                usdot_link: body.usdotLink,
                mc: body.mcNumber,
                mc_link: body.mcLink,
                operating_status: body.operatingStatus || null,
                mcs150_status: body.mcs150Status || null,
                out_of_service_date: body.outOfServiceDate || null,
                authority_status: body.authorityStatus || null,
                compliance: "non-compliant",
                status: "active",
                is_new: true,
            })
            .select()
            .single();

        if (courierError || !courier) {
            console.error("Error creating courier:", courierError);
            return res.status(500).json({ success: false, error: courierError?.message || "Failed to create courier" });
        }

        const courierId = courier.id;

        // 2. Insert contact (if name provided)
        if (body.contactName) {
            await supabaseAdmin.from("courier_contacts").insert({
                courier_id: courierId,
                name: body.contactName,
                position: body.contactPosition,
                phone: body.contactPhone,
                desk_phone: body.deskPhone,
                email: body.contactEmail,
                hours: body.contactHours,
                is_primary: true,
            });
        }

        // 3. Insert insurance (if company provided)
        if (body.insuranceCompany) {
            await supabaseAdmin.from("courier_insurance").insert({
                courier_id: courierId,
                company_name: body.insuranceCompany,
                agent_name: body.insuranceAgent,
                agent_phone: body.insurancePhone,
                agent_email: body.insuranceEmail,
                physical_damage_limit: body.physicalDamageLimit,
            });
        }

        // 4. Insert trucks (if equipment type provided)
        if (body.equipmentType) {
            await supabaseAdmin.from("courier_trucks").insert({
                courier_id: courierId,
                equipment_type: body.equipmentType,
                count: parseInt(body.numTrucks, 10) || 0,
            });
        }

        // 5. Insert routes (split comma-separated string)
        if (body.routes) {
            const routeNames = body.routes
                .split(",")
                .map((r: string) => r.trim())
                .filter((r: string) => r.length > 0);

            if (routeNames.length > 0) {
                await supabaseAdmin.from("courier_routes").insert(
                    routeNames.map((name: string) => ({
                        courier_id: courierId,
                        route_name: name,
                    }))
                );
            }
        }

        // 6. Add creation history entry
        await supabaseAdmin.from("courier_history").insert({
            courier_id: courierId,
            action: "Account created",
        });

        res.json({ success: true, data: { id: courierId }, message: "Courier created" });
    } catch (err: any) {
        console.error("Error in POST /couriers:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * @swagger
 * /couriers/{id}:
 *   put:
 *     summary: Update a courier
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Courier'
 *     responses:
 *       200:
 *         description: Courier updated
 */
router.put("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Courier ${req.params.id} updated` });
});

/**
 * @swagger
 * /couriers/{id}/status:
 *   patch:
 *     summary: Toggle courier active/inactive status
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch("/:id/status", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Courier ${req.params.id} status toggled` });
});

/**
 * @swagger
 * /couriers/{id}:
 *   delete:
 *     summary: Delete a courier
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Courier deleted
 */
router.delete("/:id", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Courier ${req.params.id} deleted` });
});

/**
 * @swagger
 * /couriers/{id}/history:
 *   get:
 *     summary: Get courier activity history
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: History entries
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HistoryEntry'
 */
router.get("/:id/history", (req: Request, res: Response) => {
    res.json({ success: true, data: [], message: `History for courier ${req.params.id}` });
});

/**
 * @swagger
 * /couriers/{id}/documents:
 *   get:
 *     summary: Get courier documents
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Document'
 *   post:
 *     summary: Upload a document for a courier
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document uploaded
 */
router.post("/:id/documents", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Document uploaded for courier ${req.params.id}` });
});

/**
 * @swagger
 * /couriers/{id}/documents/{docId}:
 *   delete:
 *     summary: Delete a courier document
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Document deleted
 */
router.delete("/:id/documents/:docId", (req: Request, res: Response) => {
    res.json({ success: true, data: null, message: `Document ${req.params.docId} deleted` });
});

/**
 * @swagger
 * /couriers/{id}/password:
 *   post:
 *     summary: Set/reset courier account password
 *     tags: [Couriers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post("/:id/password", (req: Request, res: Response) => {
    res.json({ success: true, message: `Password updated for courier ${req.params.id}` });
});

export default router;
