-- Side Hustle Tax & Income Tracker - Expense Categories Seed Data
-- IRS Schedule C Categories for Self-Employment
-- Reference: IRS Publication 535 (Business Expenses)

-- Clear existing categories (for re-seeding)
TRUNCATE TABLE expense_categories CASCADE;

-- Insert IRS Schedule C expense categories
INSERT INTO expense_categories (
    category_id,
    category_name,
    category_code,
    irs_line_number,
    deduction_rate,
    description,
    keywords,
    mcc_codes,
    sort_order,
    is_active
) VALUES
-- Line 9: Car and truck expenses
(
    'a1000000-0000-0000-0000-000000000001',
    'Car and truck expenses',
    'car_truck',
    '9',
    1.00,
    'Business use of your vehicle including gas, maintenance, insurance, registration, and depreciation. Can use standard mileage rate ($0.67/mile for 2024) or actual expenses.',
    ARRAY['gas', 'gasoline', 'fuel', 'petrol', 'shell', 'chevron', 'exxon', 'mobil', 'bp', 'texaco', 'arco', 'car wash', 'auto repair', 'oil change', 'tire', 'jiffy lube', 'valvoline', 'midas', 'pep boys', 'autozone', 'advance auto', 'oreilly', 'parking', 'toll'],
    ARRAY['5541', '5542', '5983', '7523', '7538', '7531', '4784'],
    1,
    TRUE
),

-- Line 10: Commissions and fees
(
    'a1000000-0000-0000-0000-000000000002',
    'Commissions and fees',
    'commissions_fees',
    '10',
    1.00,
    'Commissions paid to non-employees for sales and fees paid for services.',
    ARRAY['commission', 'referral fee', 'finder fee', 'agent fee', 'broker fee'],
    ARRAY[]::VARCHAR(10)[],
    2,
    TRUE
),

-- Line 11: Contract labor
(
    'a1000000-0000-0000-0000-000000000003',
    'Contract labor',
    'contract_labor',
    '11',
    1.00,
    'Payments to contractors and freelancers who performed services for your business.',
    ARRAY['contractor', 'freelancer', 'subcontractor', 'consultant', 'fiverr', 'upwork', '1099 payment'],
    ARRAY[]::VARCHAR(10)[],
    3,
    TRUE
),

-- Line 12: Depletion (not typically used for gig workers)
(
    'a1000000-0000-0000-0000-000000000004',
    'Depletion',
    'depletion',
    '12',
    1.00,
    'Depletion of natural resources. Rarely applicable for gig workers.',
    ARRAY[]::TEXT[],
    ARRAY[]::VARCHAR(10)[],
    4,
    FALSE
),

-- Line 13: Depreciation and section 179 expense
(
    'a1000000-0000-0000-0000-000000000005',
    'Depreciation and section 179',
    'depreciation',
    '13',
    1.00,
    'Depreciation on business assets and Section 179 deduction for business equipment.',
    ARRAY['depreciation', 'equipment purchase', 'asset'],
    ARRAY[]::VARCHAR(10)[],
    5,
    TRUE
),

-- Line 14: Employee benefit programs (not typically used for sole proprietors)
(
    'a1000000-0000-0000-0000-000000000006',
    'Employee benefit programs',
    'employee_benefits',
    '14',
    1.00,
    'Cost of employee benefit programs. For sole proprietors with employees.',
    ARRAY[]::TEXT[],
    ARRAY[]::VARCHAR(10)[],
    6,
    FALSE
),

-- Line 15: Insurance (other than health)
(
    'a1000000-0000-0000-0000-000000000007',
    'Insurance',
    'insurance',
    '15',
    1.00,
    'Business insurance premiums including liability, professional, and property insurance.',
    ARRAY['insurance', 'liability', 'professional insurance', 'business insurance', 'e&o', 'errors and omissions'],
    ARRAY['6300'],
    7,
    TRUE
),

-- Line 16a: Interest (mortgage)
(
    'a1000000-0000-0000-0000-000000000008',
    'Interest - Mortgage',
    'interest_mortgage',
    '16a',
    1.00,
    'Mortgage interest on business property.',
    ARRAY['mortgage interest', 'home office mortgage'],
    ARRAY[]::VARCHAR(10)[],
    8,
    TRUE
),

-- Line 16b: Interest (other)
(
    'a1000000-0000-0000-0000-000000000009',
    'Interest - Other',
    'interest_other',
    '16b',
    1.00,
    'Interest on business loans, credit cards used for business, and other business debt.',
    ARRAY['business loan interest', 'credit card interest', 'line of credit'],
    ARRAY[]::VARCHAR(10)[],
    9,
    TRUE
),

-- Line 17: Legal and professional services
(
    'a1000000-0000-0000-0000-000000000010',
    'Legal and professional services',
    'legal_professional',
    '17',
    1.00,
    'Fees for lawyers, accountants, tax preparers, and other professional services.',
    ARRAY['attorney', 'lawyer', 'legal', 'accountant', 'cpa', 'tax prep', 'turbotax', 'h&r block', 'bookkeeper', 'notary'],
    ARRAY['8111', '8931'],
    10,
    TRUE
),

-- Line 18: Office expense
(
    'a1000000-0000-0000-0000-000000000011',
    'Office expense',
    'office_expense',
    '18',
    1.00,
    'General office expenses including stationery, postage, and small office items.',
    ARRAY['office depot', 'staples', 'office max', 'postage', 'stamps', 'usps', 'fedex office', 'ups store', 'printing', 'copies', 'paper', 'ink', 'toner', 'pens', 'folders', 'envelopes'],
    ARRAY['5111', '5943', '5942'],
    11,
    TRUE
),

-- Line 19: Pension and profit-sharing plans
(
    'a1000000-0000-0000-0000-000000000012',
    'Pension and profit-sharing',
    'pension',
    '19',
    1.00,
    'Contributions to employee pension and profit-sharing plans.',
    ARRAY['401k', 'sep ira', 'simple ira', 'pension', 'retirement'],
    ARRAY[]::VARCHAR(10)[],
    12,
    FALSE
),

-- Line 20a: Rent - Vehicles, machinery, equipment
(
    'a1000000-0000-0000-0000-000000000013',
    'Rent - Equipment',
    'rent_equipment',
    '20a',
    1.00,
    'Rental costs for vehicles, machinery, and equipment used in business.',
    ARRAY['equipment rental', 'tool rental', 'vehicle rental', 'machinery rental', 'home depot rental'],
    ARRAY['7394', '7513', '7519'],
    13,
    TRUE
),

-- Line 20b: Rent - Other business property
(
    'a1000000-0000-0000-0000-000000000014',
    'Rent - Business property',
    'rent_property',
    '20b',
    1.00,
    'Rent for office space, warehouse, or other business property.',
    ARRAY['office rent', 'coworking', 'wework', 'regus', 'studio rent', 'warehouse'],
    ARRAY['6513'],
    14,
    TRUE
),

-- Line 21: Repairs and maintenance
(
    'a1000000-0000-0000-0000-000000000015',
    'Repairs and maintenance',
    'repairs',
    '21',
    1.00,
    'Costs to repair and maintain business property and equipment.',
    ARRAY['repair', 'maintenance', 'fix', 'service', 'cleaning', 'janitorial'],
    ARRAY['7629', '7699'],
    15,
    TRUE
),

-- Line 22: Supplies
(
    'a1000000-0000-0000-0000-000000000016',
    'Supplies',
    'supplies',
    '22',
    1.00,
    'Materials and supplies used in your business that are not inventory.',
    ARRAY['supplies', 'materials', 'amazon', 'walmart', 'target', 'costco', 'packaging', 'shipping supplies', 'boxes', 'tape', 'bubble wrap', 'cleaning supplies'],
    ARRAY['5311', '5331', '5411', '5412'],
    16,
    TRUE
),

-- Line 23: Taxes and licenses
(
    'a1000000-0000-0000-0000-000000000017',
    'Taxes and licenses',
    'taxes_licenses',
    '23',
    1.00,
    'Business taxes, licenses, permits, and regulatory fees.',
    ARRAY['business license', 'permit', 'registration', 'state tax', 'city tax', 'business tax'],
    ARRAY['9311', '9399'],
    17,
    TRUE
),

-- Line 24a: Travel
(
    'a1000000-0000-0000-0000-000000000018',
    'Travel',
    'travel',
    '24a',
    1.00,
    'Business travel expenses including airfare, lodging, and transportation (not meals).',
    ARRAY['airline', 'flight', 'hotel', 'motel', 'airbnb', 'vrbo', 'marriott', 'hilton', 'hyatt', 'uber', 'lyft', 'taxi', 'rental car', 'hertz', 'avis', 'enterprise', 'train', 'amtrak', 'bus', 'greyhound'],
    ARRAY['3000', '3001', '3501', '4011', '4111', '4112', '4121', '4131', '4411', '4511', '4722', '7011', '7012'],
    18,
    TRUE
),

-- Line 24b: Deductible meals (50%)
(
    'a1000000-0000-0000-0000-000000000019',
    'Meals (50% deductible)',
    'meals',
    '24b',
    0.50,
    'Business meals with clients or while traveling. Only 50% deductible.',
    ARRAY['restaurant', 'dining', 'lunch', 'dinner', 'breakfast', 'coffee', 'starbucks', 'mcdonalds', 'subway', 'chipotle', 'panera', 'grubhub', 'doordash', 'ubereats', 'seamless', 'cafe', 'food', 'meal'],
    ARRAY['5812', '5813', '5814'],
    19,
    TRUE
),

-- Line 25: Utilities
(
    'a1000000-0000-0000-0000-000000000020',
    'Utilities',
    'utilities',
    '25',
    1.00,
    'Utilities for business including phone, internet, electricity for business property.',
    ARRAY['phone', 'cell phone', 'mobile', 'internet', 'wifi', 'broadband', 'verizon', 'at&t', 'att', 't-mobile', 'tmobile', 'sprint', 'comcast', 'xfinity', 'spectrum', 'electric', 'electricity', 'gas bill', 'water'],
    ARRAY['4812', '4813', '4814', '4816', '4899'],
    20,
    TRUE
),

-- Line 26: Wages
(
    'a1000000-0000-0000-0000-000000000021',
    'Wages',
    'wages',
    '26',
    1.00,
    'Wages paid to employees. Does not include payments to contractors.',
    ARRAY['payroll', 'wages', 'salary', 'employee pay'],
    ARRAY[]::VARCHAR(10)[],
    21,
    FALSE
),

-- Line 27a: Other expenses - Advertising
(
    'a1000000-0000-0000-0000-000000000022',
    'Advertising',
    'advertising',
    '27a',
    1.00,
    'Advertising and marketing expenses including online ads, print ads, and promotional materials.',
    ARRAY['advertising', 'marketing', 'google ads', 'facebook ads', 'instagram ads', 'linkedin ads', 'yelp ads', 'promotion', 'flyers', 'business cards', 'vistaprint', 'social media', 'seo'],
    ARRAY['7311', '7312'],
    22,
    TRUE
),

-- Line 27a: Other expenses - Bank fees
(
    'a1000000-0000-0000-0000-000000000023',
    'Bank and payment processing fees',
    'bank_fees',
    '27a',
    1.00,
    'Bank fees, merchant fees, and payment processing costs.',
    ARRAY['bank fee', 'monthly fee', 'stripe fee', 'paypal fee', 'square fee', 'merchant fee', 'processing fee', 'transaction fee', 'wire fee', 'atm fee'],
    ARRAY[]::VARCHAR(10)[],
    23,
    TRUE
),

-- Line 27a: Other expenses - Education
(
    'a1000000-0000-0000-0000-000000000024',
    'Education and training',
    'education',
    '27a',
    1.00,
    'Business-related education, courses, certifications, and training.',
    ARRAY['course', 'training', 'certification', 'udemy', 'coursera', 'skillshare', 'linkedin learning', 'masterclass', 'seminar', 'workshop', 'conference', 'webinar'],
    ARRAY['8220', '8241', '8244', '8249', '8299'],
    24,
    TRUE
),

-- Line 27a: Other expenses - Software subscriptions
(
    'a1000000-0000-0000-0000-000000000025',
    'Software and subscriptions',
    'software',
    '27a',
    1.00,
    'Business software, apps, and subscription services.',
    ARRAY['software', 'subscription', 'saas', 'adobe', 'microsoft', 'office 365', 'google workspace', 'dropbox', 'zoom', 'slack', 'asana', 'trello', 'canva', 'quickbooks', 'freshbooks', 'mailchimp', 'spotify', 'apple music', 'domain', 'hosting', 'godaddy', 'squarespace', 'shopify', 'wix'],
    ARRAY['5734', '5735', '5815', '5816', '5817', '5818'],
    25,
    TRUE
),

-- Line 27a: Other expenses - Professional development
(
    'a1000000-0000-0000-0000-000000000026',
    'Professional memberships',
    'memberships',
    '27a',
    1.00,
    'Professional association memberships, union dues, and industry subscriptions.',
    ARRAY['membership', 'association', 'union', 'dues', 'professional org'],
    ARRAY['8641', '8651', '8661', '8699'],
    26,
    TRUE
),

-- Line 27a: Other expenses - Miscellaneous
(
    'a1000000-0000-0000-0000-000000000027',
    'Other business expenses',
    'other',
    '27a',
    1.00,
    'Other ordinary and necessary business expenses not listed elsewhere.',
    ARRAY[]::TEXT[],
    ARRAY[]::VARCHAR(10)[],
    99,
    TRUE
),

-- Personal (not deductible) - for classification
(
    'a1000000-0000-0000-0000-000000000099',
    'Personal (not deductible)',
    'personal',
    NULL,
    0.00,
    'Personal expenses that are not deductible as business expenses.',
    ARRAY['grocery', 'groceries', 'supermarket', 'personal', 'clothing', 'clothes', 'entertainment', 'movie', 'netflix', 'hulu', 'gym', 'fitness', 'medical', 'pharmacy', 'doctor', 'dentist'],
    ARRAY['5411', '5912', '5921', '5941', '5944', '5945', '5947', '5948', '5949', '7832', '7841', '7911', '7922', '7929', '7932', '7933', '7941', '7991', '7992', '7993', '7994', '7995', '7996', '7997', '7998', '7999'],
    100,
    TRUE
);

-- Insert 2026 IRS mileage rate reference
INSERT INTO expense_categories (
    category_id,
    category_name,
    category_code,
    irs_line_number,
    deduction_rate,
    description,
    keywords,
    mcc_codes,
    sort_order,
    is_active
) VALUES (
    'a1000000-0000-0000-0000-000000000100',
    'Mileage (standard rate)',
    'mileage',
    '9',
    1.00,
    'Business mileage using IRS standard mileage rate ($0.67/mile for 2024, rate TBD for 2026). Alternative to tracking actual car expenses.',
    ARRAY['mileage', 'miles', 'driving', 'delivery', 'rideshare'],
    ARRAY[]::VARCHAR(10)[],
    0,
    TRUE
);

-- Verify insertion
SELECT category_code, category_name, deduction_rate, sort_order
FROM expense_categories
WHERE is_active = TRUE
ORDER BY sort_order;
