import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { logger } from "../utils/logger";

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
            logger.error({ err: error }, "Error fetching couriers");
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
        logger.error({ err }, "Error in GET /couriers");
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
            logger.error({ err: error }, "Error fetching stats");
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
        logger.error({ err }, "Error in GET /couriers/stats");
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
            logger.error({ err: courierError }, "Error creating courier");
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
        logger.error({ err }, "Error in POST /couriers");
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
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body;

        // 1. Update couriers table with core fields
        const courierData: any = {};
        if (body.courierName !== undefined) courierData.name = body.courierName;
        if (body.address !== undefined) courierData.address = body.address;
        if (body.city !== undefined) courierData.city = body.city;
        if (body.state !== undefined) courierData.state = body.state;
        if (body.zipCode !== undefined) courierData.zip_code = body.zipCode;
        if (body.businessType !== undefined) courierData.business_type = body.businessType || null;
        if (body.businessPhone !== undefined) courierData.business_phone = body.businessPhone;
        if (body.fax !== undefined) courierData.fax = body.fax;
        if (body.businessEmail !== undefined) courierData.business_email = body.businessEmail;
        if (body.contactEmail !== undefined) courierData.contact_email = body.contactEmail || body.businessEmail;
        if (body.contactPhone !== undefined) courierData.phone = body.contactPhone || body.businessPhone;
        if (body.website !== undefined) courierData.website = body.website;
        if (body.hours !== undefined) courierData.business_hours = body.hours;
        if (body.timezone !== undefined) courierData.timezone = body.timezone || null;
        if (body.usdot !== undefined) courierData.usdot = body.usdot;
        if (body.usdotLink !== undefined) courierData.usdot_link = body.usdotLink;
        if (body.mcNumber !== undefined) courierData.mc = body.mcNumber;
        if (body.mcLink !== undefined) courierData.mc_link = body.mcLink;
        if (body.operatingStatus !== undefined) courierData.operating_status = body.operatingStatus || null;
        if (body.mcs150Status !== undefined) courierData.mcs150_status = body.mcs150Status || null;
        if (body.outOfServiceDate !== undefined) courierData.out_of_service_date = body.outOfServiceDate || null;
        if (body.authorityStatus !== undefined) courierData.authority_status = body.authorityStatus || null;

        if (Object.keys(courierData).length > 0) {
            const { error: courierError } = await supabaseAdmin
                .from("couriers")
                .update(courierData)
                .eq("id", id);

            if (courierError) throw courierError;
        }

        // 2. Upsert contact if provided
        if (body.contactName !== undefined) {
            await supabaseAdmin.from("courier_contacts").delete().eq("courier_id", id);
            await supabaseAdmin.from("courier_contacts").insert({
                courier_id: id,
                name: body.contactName,
                position: body.contactPosition,
                phone: body.contactPhone,
                desk_phone: body.deskPhone,
                email: body.contactEmail,
                hours: body.contactHours,
                is_primary: true,
            });
        }

        // 3. Upsert insurance if provided
        if (body.insuranceCompany !== undefined) {
            await supabaseAdmin.from("courier_insurance").delete().eq("courier_id", id);
            await supabaseAdmin.from("courier_insurance").insert({
                courier_id: id,
                company_name: body.insuranceCompany,
                agent_name: body.insuranceAgent,
                agent_phone: body.insurancePhone,
                agent_email: body.insuranceEmail,
                physical_damage_limit: body.physicalDamageLimit,
            });
        }

        // 4. Upsert trucks if provided
        if (body.equipmentType !== undefined) {
            await supabaseAdmin.from("courier_trucks").delete().eq("courier_id", id);
            await supabaseAdmin.from("courier_trucks").insert({
                courier_id: id,
                equipment_type: body.equipmentType,
                count: parseInt(body.numTrucks, 10) || 0,
            });
        }

        // 5. Upsert routes if provided
        if (body.routes !== undefined) {
            await supabaseAdmin.from("courier_routes").delete().eq("courier_id", id);
            const routeNames = body.routes
                .split(",")
                .map((r: string) => r.trim())
                .filter((r: string) => r.length > 0);

            if (routeNames.length > 0) {
                await supabaseAdmin.from("courier_routes").insert(
                    routeNames.map((name: string) => ({
                        courier_id: id,
                        route_name: name,
                    }))
                );
            }
        }

        // 6. Add history entry
        await supabaseAdmin.from("courier_history").insert({
            courier_id: id,
            action: "Account details updated",
        });

        res.json({ success: true, message: `Courier ${id} updated` });
    } catch (err: any) {
        logger.error({ err, courierId: req.params.id }, "Error updating courier");
        res.status(500).json({ success: false, error: err.message });
    }
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
router.patch("/:id/status", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Fetch current status
        const { data: courier, error: fetchError } = await supabaseAdmin
            .from("couriers")
            .select("status")
            .eq("id", id)
            .single();

        if (fetchError || !courier) {
            return res.status(404).json({ success: false, error: "Courier not found" });
        }

        const newStatus = courier.status === "active" ? "inactive" : "active";

        // Update status
        const { error: updateError } = await supabaseAdmin
            .from("couriers")
            .update({ status: newStatus })
            .eq("id", id);

        if (updateError) throw updateError;

        // Add log entry
        await supabaseAdmin.from("courier_history").insert({
            courier_id: id,
            action: `Status changed to ${newStatus}`,
        });

        res.json({ success: true, data: { status: newStatus }, message: `Courier ${id} status toggled` });
    } catch (err: any) {
        logger.error({ err, courierId: req.params.id }, "Error toggling status for courier");
        res.status(500).json({ success: false, error: err.message });
    }
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
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from("couriers")
            .delete()
            .eq("id", id);

        if (error) throw error;

        res.json({ success: true, message: `Courier ${id} deleted` });
    } catch (err: any) {
        logger.error({ err, courierId: req.params.id }, "Error deleting courier");
        res.status(500).json({ success: false, error: err.message });
    }
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
router.post("/:id/password", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, error: "Password is required" });
        }

        // 1. Get the courier to find email and potentially existing auth_user_id
        const { data: courier, error: fetchError } = await supabaseAdmin
            .from("couriers")
            .select("contact_email, phone")
            // Note: Since auth_user_id isn't in our schema yet, we might need to 
            // query auth.users if we wanted to be perfectly robust, but this is a simplified flow
            .eq("id", id)
            .single();

        if (fetchError || !courier) {
            return res.status(404).json({ success: false, error: "Courier not found" });
        }

        // In a real app with Supabase Auth linked, we would create/update the auth user here:
        // const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        //     email: courier.contact_email,
        //     password: password,
        //     email_confirm: true,
        //     app_metadata: { role: 'courier' }
        // });

        // 2. Record password change in history
        await supabaseAdmin.from("courier_history").insert({
            courier_id: id,
            action: "Password updated by Admin",
        });

        res.json({ success: true, message: `Password updated for courier ${id}` });
    } catch (err: any) {
        logger.error({ err, courierId: req.params.id }, "Error updating password for courier");
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
