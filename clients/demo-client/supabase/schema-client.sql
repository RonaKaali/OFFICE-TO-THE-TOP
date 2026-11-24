-- Client UMKM Dedicated Schema & Isolation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_products_policy" ON public.products
  FOR ALL
  USING (client_id = current_setting('app.current_client_id', true));

CREATE POLICY "client_orders_policy" ON public.orders
  FOR ALL
  USING (client_id = current_setting('app.current_client_id', true));

CREATE POLICY "client_attendance_policy" ON public.attendance
  FOR ALL
  USING (client_id = current_setting('app.current_client_id', true));
