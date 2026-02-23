import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Dispatch Server API",
            version: "1.0.0",
            description:
                "Shared backend API for Admin, Shipper, and Courier portals. Handles business logic, validation, file uploads, and role-based access with Supabase as the database.",
            contact: {
                name: "Dispatch Team",
            },
        },
        servers: [
            {
                url: "http://localhost:4000/api",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Supabase access token",
                },
            },
            schemas: {
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        data: { type: "object", nullable: true },
                        message: { type: "string" },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        error: { type: "string" },
                    },
                },
                Courier: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string", example: "Express Logistics LLC" },
                        contact_email: { type: "string", format: "email" },
                        phone: { type: "string", example: "(555) 123-4567" },
                        address: { type: "string" },
                        usdot: { type: "string", example: "1234567" },
                        mc: { type: "string", example: "MC-123456" },
                        compliance: { type: "string", enum: ["compliant", "non-compliant"] },
                        status: { type: "string", enum: ["active", "inactive"] },
                        trucks: { type: "integer" },
                        insurance_company: { type: "string" },
                        equipment_type: { type: "string" },
                        is_new: { type: "boolean" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Shipper: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string", example: "ABC Manufacturing" },
                        contact_email: { type: "string", format: "email" },
                        phone: { type: "string" },
                        address: { type: "string" },
                        business_type: { type: "string", example: "Dealer" },
                        city: { type: "string" },
                        state: { type: "string" },
                        tax_exempt: { type: "boolean" },
                        ein: { type: "string", example: "12-3456789" },
                        hours_pickup: { type: "string" },
                        hours_dropoff: { type: "string" },
                        principal_name: { type: "string" },
                        compliance: { type: "string", enum: ["compliant", "non-compliant"] },
                        status: { type: "string", enum: ["active", "inactive"] },
                        is_new: { type: "boolean" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Load: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        vehicle_year: { type: "string", example: "2024" },
                        vehicle_make: { type: "string", example: "Toyota" },
                        vehicle_model: { type: "string", example: "Camry" },
                        vin: { type: "string", example: "1HGBH41JXMN109186" },
                        stock_number: { type: "string" },
                        shipper_id: { type: "string", format: "uuid" },
                        courier_id: { type: "string", format: "uuid" },
                        pickup_date: { type: "string", format: "date" },
                        dropoff_date: { type: "string", format: "date" },
                        status: { type: "string", enum: ["pending", "in-transit", "delivered", "cancelled"] },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                Ticket: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                        status: { type: "string", enum: ["open", "in-progress", "resolved", "closed"] },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Comment: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        author: { type: "string" },
                        text: { type: "string" },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                Document: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        type: { type: "string" },
                        url: { type: "string", format: "uri" },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                HistoryEntry: {
                    type: "object",
                    properties: {
                        date: { type: "string", format: "date" },
                        action: { type: "string" },
                    },
                },
            },
        },
        security: [{ BearerAuth: [] }],
    },
    apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
