import { useEffect, useMemo, useState } from "react";

type GeocodeCoords = { lat: number; lng: number; displayName?: string };

const cache = new Map<string, GeocodeCoords>();

function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, " ");
}

export function useGeocodeLocation(query: string | null, enabled: boolean) {
  const normalized = useMemo(() => (query ? normalizeQuery(query) : null), [query]);
  const [coords, setCoords] = useState<GeocodeCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !normalized || normalized.length < 3) {
      setLoading(false);
      setError(null);
      return;
    }

    const cached = cache.get(normalized);
    if (cached) {
      setCoords(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "1");
        url.searchParams.set("q", normalized);
        url.searchParams.set("addressdetails", "0");

        const res = await fetch(url.toString(), {
          signal: ac.signal,
          headers: { "Accept-Language": "en" },
        });
        if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
        const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;

        if (!data?.[0]) {
          setCoords(null);
          setError("No results");
          return;
        }

        const next = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
        cache.set(normalized, next);
        setCoords(next);
      } catch (e: unknown) {
        if (ac.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
        setCoords(null);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [enabled, normalized]);

  return { coords, loading, error };
}
