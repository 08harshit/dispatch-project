-- API Performance: Add indexes for hot query paths
-- Ensure notification_log has required columns (may be missing if prior migrations were baselined)
ALTER TABLE public.notification_log ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.notification_log ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;
ALTER TABLE public.notification_log ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- notification_log: dashboard alerts and notification worker
CREATE INDEX IF NOT EXISTS idx_notification_log_dismissed_at_null
  ON public.notification_log (created_at DESC)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at_null
  ON public.notification_log (created_at ASC)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notification_log_contract_id
  ON public.notification_log (contract_id)
  WHERE contract_id IS NOT NULL;

-- contracts: recent activity and list ordering
CREATE INDEX IF NOT EXISTS idx_contracts_created_at_desc
  ON public.contracts (created_at DESC);

-- couriers: dashboard stats (compliance counts)
CREATE INDEX IF NOT EXISTS idx_couriers_compliance_active
  ON public.couriers (compliance)
  WHERE deleted_at IS NULL;

-- shippers: dashboard stats (compliance counts)
CREATE INDEX IF NOT EXISTS idx_shippers_compliance_active
  ON public.shippers (compliance)
  WHERE deleted_at IS NULL;
