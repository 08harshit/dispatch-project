/**
 * FMCSA SAFER verification service.
 * Fetches carrier data from FMCSA server-side to avoid 403 when opening directly from browser.
 */

import { logger } from "../utils/logger";

export interface FMCSACarrierInfo {
    dotNumber: string;
    mcNumber?: string;
    legalName: string;
    operatingStatus: string;
    phone?: string;
    isValid: boolean;
}

export async function fetchFMCSAData(dotNumber: string): Promise<FMCSACarrierInfo | null> {
    try {
        const url = `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${encodeURIComponent(dotNumber)}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            logger.warn({ status: response.status, usdot: dotNumber }, "FMCSA request failed");
            return null;
        }

        const html = await response.text();

        if (
            html.includes("No records matching your search criteria were found") ||
            html.includes("INVALID FORMAT")
        ) {
            logger.info({ usdot: dotNumber }, "No carrier found for DOT");
            return null;
        }

        const legalNameMatch =
            html.match(/Legal Name[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
            html.match(/<td[^>]*>Legal Name[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
        const legalName = legalNameMatch ? legalNameMatch[1].trim() : "";

        const statusMatch =
            html.match(/Operating Status[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
            html.match(/<td[^>]*>Operating Status[^<]*<\/td>\s*<td[^>]*>([^<]+)/i) ||
            html.match(/Operation Classification[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
        const operatingStatus = statusMatch ? statusMatch[1].trim() : "UNKNOWN";

        const mcMatch =
            html.match(/MC\/MX\/FF Number[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
            html.match(/<td[^>]*>MC\/MX\/FF[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
        const mcNumber = mcMatch ? mcMatch[1].trim().replace(/[^\dMC-]/g, "") : undefined;

        const phoneMatch =
            html.match(/Phone[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
            html.match(/<td[^>]*>Phone[^<]*<\/td>\s*<td[^>]*>([^<]+)/i);
        const phone = phoneMatch ? phoneMatch[1].trim() : undefined;

        const isValid =
            operatingStatus.toLowerCase().includes("authorized") ||
            operatingStatus.toLowerCase().includes("active") ||
            (!operatingStatus.toLowerCase().includes("not authorized") &&
                !operatingStatus.toLowerCase().includes("inactive") &&
                !operatingStatus.toLowerCase().includes("out of service"));

        if (!legalName) {
            return null;
        }

        return {
            dotNumber,
            mcNumber: mcNumber || undefined,
            legalName,
            operatingStatus,
            phone,
            isValid,
        };
    } catch (error) {
        logger.error({ err: error, usdot: dotNumber }, "Error fetching FMCSA data");
        return null;
    }
}
