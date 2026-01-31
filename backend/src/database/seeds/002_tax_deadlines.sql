-- Side Hustle Tax & Income Tracker - Tax Deadlines Seed Data
-- Quarterly Estimated Tax Payment Deadlines
-- Reference: IRS Form 1040-ES

-- Clear existing deadlines (for re-seeding)
TRUNCATE TABLE tax_deadlines CASCADE;

-- Insert 2025 quarterly tax deadlines
INSERT INTO tax_deadlines (
    deadline_id,
    tax_year,
    quarter,
    period_start_date,
    period_end_date,
    due_date,
    original_due_date,
    holiday_adjusted
) VALUES
-- 2025 Deadlines
(
    'b1000000-0000-0000-0000-000000000001',
    2025, 1,
    '2025-01-01', '2025-03-31',
    '2025-04-15', '2025-04-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000002',
    2025, 2,
    '2025-04-01', '2025-05-31',
    '2025-06-16', '2025-06-15', TRUE  -- June 15 falls on Sunday
),
(
    'b1000000-0000-0000-0000-000000000003',
    2025, 3,
    '2025-06-01', '2025-08-31',
    '2025-09-15', '2025-09-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000004',
    2025, 4,
    '2025-09-01', '2025-12-31',
    '2026-01-15', '2026-01-15', FALSE
),

-- 2026 Deadlines
(
    'b1000000-0000-0000-0000-000000000005',
    2026, 1,
    '2026-01-01', '2026-03-31',
    '2026-04-15', '2026-04-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000006',
    2026, 2,
    '2026-04-01', '2026-05-31',
    '2026-06-15', '2026-06-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000007',
    2026, 3,
    '2026-06-01', '2026-08-31',
    '2026-09-15', '2026-09-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000008',
    2026, 4,
    '2026-09-01', '2026-12-31',
    '2027-01-15', '2027-01-15', FALSE
),

-- 2027 Deadlines (for forward planning)
(
    'b1000000-0000-0000-0000-000000000009',
    2027, 1,
    '2027-01-01', '2027-03-31',
    '2027-04-15', '2027-04-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000010',
    2027, 2,
    '2027-04-01', '2027-05-31',
    '2027-06-15', '2027-06-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000011',
    2027, 3,
    '2027-06-01', '2027-08-31',
    '2027-09-15', '2027-09-15', FALSE
),
(
    'b1000000-0000-0000-0000-000000000012',
    2027, 4,
    '2027-09-01', '2027-12-31',
    '2028-01-17', '2028-01-15', TRUE  -- January 15 falls on Saturday
);

-- Verify insertion
SELECT tax_year, quarter, period_start_date, period_end_date, due_date, holiday_adjusted
FROM tax_deadlines
ORDER BY tax_year, quarter;
