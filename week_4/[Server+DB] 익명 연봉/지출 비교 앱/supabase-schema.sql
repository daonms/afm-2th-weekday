CREATE TABLE IF NOT EXISTS salary_expense_entries (
  id SERIAL PRIMARY KEY,
  monthly_salary INTEGER NOT NULL CHECK (monthly_salary >= 0),
  monthly_expense INTEGER NOT NULL CHECK (monthly_expense >= 0),
  job_group TEXT NOT NULL,
  years_experience INTEGER NOT NULL CHECK (years_experience >= 0),
  food_expense INTEGER NOT NULL DEFAULT 0 CHECK (food_expense >= 0),
  housing_expense INTEGER NOT NULL DEFAULT 0 CHECK (housing_expense >= 0),
  transport_expense INTEGER NOT NULL DEFAULT 0 CHECK (transport_expense >= 0),
  subscription_expense INTEGER NOT NULL DEFAULT 0 CHECK (subscription_expense >= 0),
  etc_expense INTEGER NOT NULL DEFAULT 0 CHECK (etc_expense >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
