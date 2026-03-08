
-- Material categories
CREATE TABLE public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage material categories" ON public.material_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone authenticated can view material categories" ON public.material_categories FOR SELECT TO authenticated USING (true);

-- Material distributions (per student)
CREATE TABLE public.material_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.material_categories(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  term text DEFAULT '',
  year text DEFAULT '',
  distributed_by uuid,
  distributed_at timestamptz NOT NULL DEFAULT now(),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.material_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage material distributions" ON public.material_distributions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view own student materials" ON public.material_distributions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = material_distributions.application_id AND a.user_id = auth.uid()));

-- Accounting transactions (income & expenses ledger)
CREATE TABLE public.accounting_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'expense',
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  reference_number text DEFAULT '',
  application_id uuid REFERENCES public.applications(id),
  recorded_by uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage accounting transactions" ON public.accounting_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Budget allocations
CREATE TABLE public.budget_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT '',
  allocated_amount numeric NOT NULL DEFAULT 0,
  spent_amount numeric NOT NULL DEFAULT 0,
  term text DEFAULT '',
  year text DEFAULT '',
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage budget allocations" ON public.budget_allocations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Petty cash
CREATE TABLE public.petty_cash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'withdrawal',
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  authorized_by text DEFAULT '',
  recorded_by uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.petty_cash ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage petty cash" ON public.petty_cash FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
