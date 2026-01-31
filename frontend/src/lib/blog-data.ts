// Blog post data and types

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  keywords: string[];
  featured?: boolean;
  content: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  description: string;
  color: string;
}

export const categories: BlogCategory[] = [
  {
    name: 'Tax Fundamentals',
    slug: 'tax-fundamentals',
    description: 'Essential tax knowledge for gig workers and freelancers',
    color: 'blue',
  },
  {
    name: 'Platform Guides',
    slug: 'platform-guides',
    description: 'Tax tips for specific gig platforms like Uber, DoorDash, and Etsy',
    color: 'green',
  },
  {
    name: 'Tax Deductions',
    slug: 'tax-deductions',
    description: 'Maximize your deductions and keep more of what you earn',
    color: 'purple',
  },
  {
    name: 'Income Tracking',
    slug: 'income-tracking',
    description: 'Tools and strategies for tracking multi-platform income',
    color: 'amber',
  },
  {
    name: 'Quarterly Taxes',
    slug: 'quarterly-taxes',
    description: 'Everything about estimated quarterly tax payments',
    color: 'rose',
  },
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'quarterly-tax-calculator-gig-workers-2026',
    title: 'Quarterly Tax Calculator for Gig Workers: 2026 Complete Guide',
    description: 'Calculate your quarterly self-employment taxes in seconds. Free guide with calculator, deadlines, and examples for Uber, DoorDash, Upwork & more.',
    category: 'Quarterly Taxes',
    author: 'TaxGig',
    publishedAt: '2026-01-30',
    readTime: '8 min read',
    keywords: ['quarterly tax calculator', 'self employment tax', 'gig worker taxes', 'estimated tax payments', '1099 taxes'],
    featured: true,
    content: `
## How Quarterly Taxes Work for Self-Employed Workers

If you earn money from gig work, freelancing, or any side hustle, you're considered self-employed by the IRS. Unlike W-2 employees who have taxes withheld from each paycheck, self-employed workers must pay their taxes throughout the year in quarterly installments.

### Why Quarterly Payments?

The U.S. tax system operates on a "pay-as-you-go" basis. When you're self-employed, no one is withholding taxes for you, so you need to send estimated payments directly to the IRS four times per year.

**Failing to pay quarterly taxes can result in:**
- Underpayment penalties (currently 8% annually)
- A large, unexpected tax bill in April
- Cash flow problems when tax season arrives

### Who Needs to Pay Quarterly Taxes?

You generally need to make quarterly estimated tax payments if:

1. **You expect to owe $1,000 or more** in taxes for the year after subtracting withholding and credits
2. **Your withholding and credits** will be less than the smaller of:
   - 90% of the tax shown on your current year's return, or
   - 100% of the tax shown on your prior year's return (110% if your AGI was over $150,000)

For most gig workers earning $10,000+ annually from side hustles, quarterly payments are required.

---

## 2026 Quarterly Tax Deadlines

Mark these dates on your calendar:

| Quarter | Income Period | Payment Due |
|---------|--------------|-------------|
| Q1 | January 1 - March 31 | April 15, 2026 |
| Q2 | April 1 - May 31 | June 16, 2026 |
| Q3 | June 1 - August 31 | September 15, 2026 |
| Q4 | September 1 - December 31 | January 15, 2027 |

**Pro Tip:** Set up reminders 2 weeks before each deadline to ensure you have time to calculate and submit your payment.

---

## How to Calculate Your Quarterly Tax Payment

Your quarterly tax payment consists of two main components:

### 1. Self-Employment Tax (15.3%)

This covers Social Security (12.4%) and Medicare (2.9%). As a self-employed worker, you pay both the employee and employer portions.

**Calculation:**
- Net self-employment income × 92.35% × 15.3%
- You can deduct half of this on your income tax return

### 2. Income Tax

Your federal income tax rate depends on your total taxable income and filing status. For 2026, the brackets are:

| Tax Rate | Single Filers | Married Filing Jointly |
|----------|---------------|----------------------|
| 10% | $0 - $11,600 | $0 - $23,200 |
| 12% | $11,601 - $47,150 | $23,201 - $94,300 |
| 22% | $47,151 - $100,525 | $94,301 - $201,050 |
| 24% | $100,526 - $191,950 | $201,051 - $383,900 |

### Quick Estimation Formula

For a rough estimate, most gig workers can use this simplified formula:

**Quarterly Payment = (Net Quarterly Income × 25-30%)**

This accounts for both self-employment tax and income tax for those in the 12-22% brackets.

---

## Example Calculations

### Example 1: Uber Driver

**Sarah's Q1 Numbers:**
- Gross Uber income: $6,000
- Deductible expenses (gas, phone, car wash): $1,800
- Net income: $4,200

**Her quarterly tax estimate:**
- Self-employment tax: $4,200 × 92.35% × 15.3% = $593
- Income tax (22% bracket): $4,200 × 22% = $924
- **Total Q1 payment: ~$1,517**

### Example 2: Etsy Seller

**Mike's Q1 Numbers:**
- Gross Etsy sales: $3,500
- Deductible expenses (supplies, shipping, fees): $1,200
- Net income: $2,300

**His quarterly tax estimate:**
- Self-employment tax: $2,300 × 92.35% × 15.3% = $325
- Income tax (12% bracket): $2,300 × 12% = $276
- **Total Q1 payment: ~$601**

---

## Common Deductions to Reduce Your Tax Bill

Before calculating your quarterly payment, make sure you're tracking all eligible deductions:

### For Rideshare & Delivery Drivers:
- **Mileage** (67 cents per mile in 2026)
- Gas and car maintenance
- Phone and phone mount
- Insulated bags (DoorDash, Instacart)
- Tolls and parking

### For Freelancers & Online Sellers:
- Home office expenses
- Software subscriptions
- Professional development
- Supplies and equipment
- Platform fees (Etsy, Upwork, Fiverr)

### For Everyone:
- Health insurance premiums (self-employed deduction)
- Retirement contributions (SEP IRA, Solo 401k)
- Half of self-employment tax

---

## How to Make Quarterly Tax Payments

### Option 1: IRS Direct Pay (Free)
Visit [irs.gov/payments](https://www.irs.gov/payments) and select "Make a Payment." Choose "Estimated Tax" and follow the prompts.

### Option 2: EFTPS (Free)
The Electronic Federal Tax Payment System allows you to schedule payments in advance. Enroll at [eftps.gov](https://www.eftps.gov).

### Option 3: IRS2Go App
The official IRS mobile app lets you make payments directly from your phone.

### Option 4: Credit/Debit Card
Third-party processors accept cards but charge fees (1.87-1.98% for credit cards).

---

## What If You Can't Pay the Full Amount?

**Pay what you can.** The IRS penalty is based on how much you underpaid and for how long. Paying something is always better than paying nothing.

If you're significantly short:
1. Pay at least 90% of your current year's liability, or
2. Pay 100% of your prior year's tax liability (whichever is smaller)

This "safe harbor" rule can protect you from penalties even if you ultimately owe more.

---

## Avoid These Common Mistakes

### Mistake #1: Not Tracking Expenses
Every untracked expense is money lost. Use a dedicated app to categorize business expenses automatically.

### Mistake #2: Forgetting State Taxes
Many states require quarterly estimated payments too. Check your state's requirements.

### Mistake #3: Using Gross Income
Always calculate taxes on **net income** (after deductions). Using gross income means overpaying.

### Mistake #4: Waiting Until Year-End
Estimating all at once in Q4 often leads to penalties for Q1-Q3 underpayments.

---

## Track Your Taxes Automatically

Manually tracking income and expenses across multiple gig platforms is time-consuming and error-prone. TaxGig automatically:

- **Imports income** from Uber, DoorDash, Upwork, Etsy, and more
- **Categorizes expenses** using smart AI
- **Calculates quarterly estimates** in real-time
- **Sends deadline reminders** so you never miss a payment

Stop guessing what you owe. Start tracking automatically.
    `,
  },
  {
    slug: 'gig-worker-tax-deductions-complete-guide',
    title: 'Ultimate Guide to Gig Worker Tax Deductions [2026]',
    description: 'Complete list of tax deductions for Uber drivers, DoorDash dashers, Etsy sellers, and freelancers. Never miss a write-off again.',
    category: 'Tax Deductions',
    author: 'TaxGig',
    publishedAt: '2026-01-28',
    readTime: '12 min read',
    keywords: ['gig worker tax deductions', 'side hustle write offs', 'freelance deductions', 'schedule c deductions'],
    featured: true,
    content: `
## What Are Tax Deductions?

Tax deductions reduce your taxable income, which directly lowers how much you owe the IRS. For gig workers and freelancers, deductions are especially important because you're responsible for paying both income tax AND self-employment tax (15.3%).

**Every $100 in deductions saves you approximately $25-40 in taxes** (depending on your tax bracket).

---

## Complete List of Gig Worker Deductions

### Vehicle & Transportation

**Mileage Deduction (Standard Method)**
- 2026 IRS rate: **67 cents per mile**
- Track every business mile driven
- Includes driving to pick up passengers, deliveries, and between gigs

**Actual Expense Method (Alternative)**
- Gas and oil
- Car repairs and maintenance
- Insurance (business portion)
- Depreciation
- Registration and license fees

*Choose whichever method gives you the larger deduction.*

**Other Transportation Costs**
- Parking fees for business
- Tolls
- Public transit for business travel

---

### Phone & Technology

- **Cell phone bill** (business use percentage)
- Phone accessories (mounts, chargers)
- Mobile hotspot/data plan
- Second phone line for business
- Apps and subscriptions used for work

---

### Home Office

If you use part of your home exclusively for business:
- **Simplified method:** $5 per square foot (max 300 sq ft = $1,500)
- **Regular method:** Percentage of rent/mortgage, utilities, insurance

---

### Supplies & Equipment

**For Delivery Drivers:**
- Insulated bags and carriers
- Car cleaning supplies
- Phone mounts and holders

**For Rideshare Drivers:**
- Phone chargers for passengers
- Cleaning supplies
- Water bottles and mints (passenger amenities)

**For Online Sellers:**
- Packaging materials
- Shipping supplies
- Product materials/inventory
- Photography equipment

**For Freelancers:**
- Computer and peripherals
- Software subscriptions (Adobe, Office, etc.)
- Professional tools specific to your trade

---

### Platform & Service Fees

- Etsy seller fees
- Upwork/Fiverr service fees
- Payment processing fees (Stripe, PayPal)
- Marketplace listing fees

---

### Professional Services

- Accounting and tax preparation
- Legal fees for business matters
- Business consulting
- Virtual assistant services

---

### Marketing & Advertising

- Business cards
- Website hosting and domain
- Social media advertising
- Promotional materials

---

### Education & Professional Development

- Online courses related to your gig
- Books and publications
- Industry conferences
- Certification programs

---

### Insurance

- **Health insurance** (self-employed health insurance deduction)
- Business liability insurance
- Professional insurance

---

### Banking & Financial

- Business bank account fees
- Business credit card annual fees
- Accounting software subscriptions

---

## Deductions by Platform

### Uber & Lyft Drivers
1. Mileage (this is usually your biggest deduction)
2. Phone and phone plan
3. Phone mount
4. Car washes and cleaning
5. Passenger amenities
6. Roadside assistance memberships

### DoorDash & Instacart Dashers
1. Mileage
2. Insulated delivery bags
3. Phone and data plan
4. Parking fees
5. Tolls

### Etsy Sellers
1. Materials and supplies
2. Packaging
3. Shipping costs
4. Etsy fees (listing, transaction, payment processing)
5. Photography equipment
6. Home office

### Upwork & Fiverr Freelancers
1. Software and tools
2. Home office
3. Computer equipment
4. Professional development
5. Platform fees
6. Internet (business portion)

---

## How to Track Deductions

### Documentation Is Generally Required

To claim a deduction, you need proof:
- **Receipts** for purchases over $75
- **Mileage log** with date, destination, purpose, and miles
- **Bank/credit card statements** showing business expenses

### Best Practices

1. **Use a dedicated business account** - Separates personal and business expenses
2. **Photograph receipts immediately** - Paper fades, digital lasts
3. **Categorize as you go** - Don't wait until tax time
4. **Use tracking software** - Automates the tedious work

---

## Common Mistakes to Avoid

### Mistake #1: Missing the Mileage Deduction
At 67 cents per mile, driving 10,000 business miles = $6,700 deduction. Many gig workers only track a fraction of their actual miles.

### Mistake #2: Forgetting Small Expenses
Phone chargers, car washes, and supplies add up. A $15 expense saves you $4-6 in taxes.

### Mistake #3: Not Separating Business/Personal
If you can't prove an expense was for business, you can't deduct it. Keep records clear.

### Mistake #4: Over-Deducting
Only deduct the business portion of mixed-use expenses. If you use your phone 60% for gig work, deduct 60% of the bill.

---

## Maximize Your Deductions Automatically

Tracking every expense manually is exhausting. TaxGig:

- **Auto-categorizes expenses** from connected accounts
- **Tracks mileage** with GPS
- **Captures receipts** with your phone camera
- **Calculates deductions** in real-time

See exactly how much you're saving on taxes, updated daily.
    `,
  },
  {
    slug: 'irs-5000-threshold-side-hustle-quarterly-taxes',
    title: 'IRS $5,000 Threshold: When Side Hustlers Must File Quarterly Taxes',
    description: 'Understand the IRS income threshold for quarterly tax payments. Learn when you need to start paying estimated taxes on your side hustle income.',
    category: 'Tax Fundamentals',
    author: 'TaxGig',
    publishedAt: '2026-01-25',
    readTime: '6 min read',
    keywords: ['irs threshold', 'quarterly taxes', 'when to pay estimated taxes', 'side hustle tax requirements'],
    featured: false,
    content: `
## Understanding the Quarterly Tax Threshold

One of the most common questions from side hustlers is: "When do I actually need to start paying quarterly taxes?"

The answer depends on how much you expect to owe, not just how much you earn.

---

## The Official IRS Rule

According to IRS guidelines, you must make quarterly estimated tax payments if:

1. **You expect to owe $1,000 or more** in taxes for the year (after subtracting withholding and credits), AND
2. **Your withholding and credits** will be less than the smaller of:
   - 90% of the current year's tax liability, or
   - 100% of the prior year's tax liability

---

## What Does $1,000 in Tax Liability Mean?

For self-employed income, your tax liability includes:
- **Self-employment tax** (15.3% of net earnings)
- **Income tax** (10-37% depending on your bracket)

### Quick Math:
At a combined rate of roughly 25-30%, you'd need approximately **$3,500-$4,000 in net profit** to trigger the $1,000 threshold.

However, if you have a W-2 job with adequate withholding, that withholding might cover your side hustle taxes.

---

## Scenarios: Do You Need to Pay Quarterly?

### Scenario 1: Side Hustle Only
**Maria earns $15,000/year from Etsy**
- Net profit after expenses: $10,000
- Estimated tax liability: ~$2,800
- **Quarterly payments required: YES**

### Scenario 2: W-2 Job + Side Hustle (Low Income)
**James has a W-2 job and earns $3,000/year from DoorDash**
- Net profit: $2,000
- Tax liability: ~$560
- His W-2 withholding covers the extra
- **Quarterly payments required: Probably NO**

### Scenario 3: W-2 Job + Side Hustle (Higher Income)
**Lisa has a W-2 job and earns $25,000/year from Uber**
- Net profit: $18,000
- Tax liability: ~$5,000
- Her W-2 withholding doesn't cover this
- **Quarterly payments required: YES**

---

## The $5,000 Income Milestone

While $5,000 isn't an official IRS threshold, it's a practical milestone:

**At $5,000 in gross side hustle income:**
- After typical expenses, you might have $3,000-$4,000 net profit
- Tax liability approaches the $1,000 threshold
- It's time to start tracking and planning for quarterly payments

**Our recommendation:** Once you cross $5,000 in annual side hustle income, start taking quarterly taxes seriously.

---

## What Happens If You Don't Pay?

### Underpayment Penalty
The IRS charges interest on underpaid estimated taxes. The current rate is approximately **8% annually**, calculated daily.

### Example:
If you owe $4,000 in estimated taxes and pay nothing until April:
- Underpayment penalty: ~$160-$240
- Plus potential interest on any remaining balance

### The Good News
The penalty is relatively small compared to the tax owed. If you simply forgot or couldn't pay, the IRS won't come after you aggressively—they'll just add the penalty to your tax bill.

---

## Safe Harbor: Avoiding Penalties

You can avoid underpayment penalties entirely by meeting one of these "safe harbor" requirements:

1. **Pay 90%** of your current year's tax liability, OR
2. **Pay 100%** of your prior year's tax liability (110% if AGI > $150,000)

If your income is unpredictable, the prior-year method is often safer.

---

## When to Start Tracking

Don't wait until you hit $5,000. Start tracking from day one because:

1. **Expenses add up** - Those small deductions matter
2. **Records are easier to keep** when you start immediately
3. **You'll know exactly** when you cross the threshold
4. **No scrambling** at tax time to reconstruct your income

---

## Get Threshold Alerts Automatically

TaxGig monitors your income across all platforms and alerts you when:

- You're approaching the $5,000 income milestone
- Your estimated tax liability hits $1,000
- Quarterly payment deadlines are coming up

Never be surprised by a tax bill again.
    `,
  },
  {
    slug: 'track-income-multiple-gig-apps',
    title: 'How to Track Income from Multiple Gig Apps (Uber, DoorDash, Upwork)',
    description: 'Stop juggling spreadsheets. Learn how to automatically track and organize income from all your gig platforms in one place.',
    category: 'Income Tracking',
    author: 'TaxGig',
    publishedAt: '2026-01-22',
    readTime: '7 min read',
    keywords: ['track gig income', 'multiple income sources', 'gig app income tracking', 'freelance income management'],
    featured: false,
    content: `
## The Multi-Platform Problem

If you're like most gig workers, you don't rely on just one platform. You might drive for Uber on weekends, deliver for DoorDash on weekday evenings, and pick up freelance projects on Upwork.

**The average gig worker uses 2-3 platforms**, which means:
- Income is scattered across multiple apps
- Each platform has different payment schedules
- Tax documents arrive at different times
- Tracking everything manually is a nightmare

---

## Why Accurate Income Tracking Matters

### For Taxes
The IRS expects you to report ALL self-employment income, regardless of whether you receive a 1099. Even if a platform doesn't send you a tax form, you're still required to report the income.

### For Financial Planning
Knowing your actual earnings helps you:
- Set aside the right amount for quarterly taxes
- Understand which platforms are most profitable
- Make informed decisions about where to spend your time

### For Expense Allocation
Some expenses apply to specific platforms (insulated bags for DoorDash), while others apply to all (phone bill). Accurate income tracking helps you allocate deductions properly.

---

## Method 1: Manual Spreadsheet Tracking

**The Old-School Approach:**
1. Download earnings reports from each platform
2. Enter data into a spreadsheet
3. Categorize and total manually
4. Repeat weekly or monthly

**Pros:**
- Free
- Complete control over data

**Cons:**
- Time-consuming (1-2 hours per week)
- Easy to miss transactions
- No automatic categorization
- Prone to errors
- Difficult to maintain consistently

---

## Method 2: Bank Statement Review

**The Monthly Reconciliation:**
1. Review bank statements at month-end
2. Identify deposits from each platform
3. Record totals in a tracking system

**Pros:**
- Catches all deposited income
- Relatively straightforward

**Cons:**
- Deposits may combine multiple days/weeks
- Doesn't capture platform fees deducted before deposit
- Still requires manual data entry
- No expense tracking integration

---

## Method 3: Automatic Income Aggregation

**The Modern Solution:**
Connect your bank accounts and/or platform accounts to automatically import and categorize all income.

**How It Works:**
1. Securely link accounts via Plaid (bank-level encryption)
2. Transactions are automatically imported
3. AI categorizes income by source
4. Dashboard shows real-time totals across all platforms

**Pros:**
- Saves 5+ hours per month
- Never miss a transaction
- Real-time visibility
- Automatic categorization
- Integrated with expense tracking
- Tax estimates calculated automatically

**Cons:**
- Requires trusting a third-party service
- May have subscription cost

---

## What to Track for Each Platform

### Rideshare (Uber, Lyft)
- Gross fares
- Tips
- Bonuses and incentives
- Mileage (for deductions)

### Delivery (DoorDash, Instacart, Grubhub)
- Delivery pay
- Tips
- Peak pay and bonuses
- Mileage

### Freelance (Upwork, Fiverr, Toptal)
- Project payments
- Platform fees (deductible!)
- Milestone payments

### E-commerce (Etsy, Poshmark, eBay)
- Sales revenue
- Shipping fees collected
- Platform fees
- Refunds (subtract from income)

### Direct Payments (Venmo, PayPal, Zelle)
- Client payments
- Invoice payments
- Distinguish from personal transfers

---

## Setting Up Your Tracking System

### Step 1: List All Income Sources
Write down every platform and payment method you use for gig work.

### Step 2: Gather Login Credentials
You'll need access to each account to download reports or connect via API.

### Step 3: Choose Your Method
- **Under $5K/year:** Spreadsheet may suffice
- **$5K-$20K/year:** Consider automated tracking
- **Over $20K/year:** Automated tracking strongly recommended

### Step 4: Set a Weekly Review
Even with automation, review your income weekly to catch any issues.

---

## Income Tracking Best Practices

1. **Track gross income, not net deposits** - Platform fees and deductions happen before deposit
2. **Keep platform and personal finances separate** - Use a dedicated bank account if possible
3. **Note the source of every deposit** - "Uber" tells you more than "$847.32"
4. **Reconcile monthly** - Compare your records to platform reports
5. **Save tax documents immediately** - Download 1099s as soon as they're available

---

## Automate Your Income Tracking

TaxGig connects to your bank accounts and automatically:

- **Identifies income** from Uber, DoorDash, Upwork, Etsy, and 10+ other platforms
- **Categorizes transactions** without manual entry
- **Calculates quarterly taxes** based on actual income
- **Generates reports** showing income by platform, time period, and more

See all your gig income in one dashboard. Finally.
    `,
  },
  {
    slug: 'uber-lyft-driver-tax-deductions-2026',
    title: 'Uber & Lyft Driver Tax Deductions: Complete 2026 Guide',
    description: 'Maximize your rideshare tax deductions. Complete list of write-offs for Uber and Lyft drivers including mileage, phone, and car expenses.',
    category: 'Platform Guides',
    author: 'TaxGig',
    publishedAt: '2026-01-20',
    readTime: '10 min read',
    keywords: ['uber driver tax deductions', 'lyft driver taxes', 'rideshare tax write offs', 'uber mileage deduction'],
    featured: false,
    content: `
## Rideshare Tax Basics

As an Uber or Lyft driver, you're an independent contractor, not an employee. This means you're responsible for:

- Tracking your own income and expenses
- Paying self-employment tax (15.3%)
- Making quarterly estimated tax payments
- Filing Schedule C with your tax return

The good news? You can deduct many expenses to reduce your tax bill significantly.

---

## The #1 Deduction: Mileage

For most rideshare drivers, mileage is the largest tax deduction. In 2026, the IRS standard mileage rate is **67 cents per mile**.

### What Miles Count?

**Deductible miles include:**
- Driving to pick up a passenger (after accepting a ride)
- Miles driven with a passenger
- Driving between rides while the app is on
- Driving to required vehicle inspections
- Driving to the bank to deposit earnings

**Non-deductible miles:**
- Commuting from home to your "first" ride (debatable - consult a tax pro)
- Personal errands
- Miles driven with the app off

### Example Savings

If you drive 15,000 business miles per year:
- Deduction: 15,000 × $0.67 = **$10,050**
- At a 25% tax rate, that saves you **$2,512 in taxes**

### Tracking Your Miles

You have two options:

1. **Manual log:** Record date, starting/ending location, purpose, and miles for each trip
2. **Automatic tracking:** Use an app that records miles via GPS

**Important:** Based on current IRS guidance, contemporaneous records are generally required. You can't reconstruct your mileage log at tax time.

---

## Vehicle Expenses (Alternative to Mileage)

Instead of the standard mileage rate, you can deduct actual vehicle expenses:

- Gas
- Oil changes and maintenance
- Repairs
- Tires
- Insurance (business portion)
- Car washes
- Registration fees
- Depreciation

### Which Method is Better?

**Standard mileage** is usually better if:
- You drive a fuel-efficient car
- You have low maintenance costs
- You want simpler record-keeping

**Actual expenses** may be better if:
- You have high maintenance or repair costs
- You drive an expensive vehicle with high depreciation
- You're willing to keep detailed records

**Note:** You may need to choose your method in the first year you use your car for business. You can switch from standard to actual later, but not from actual to standard.

---

## Phone & Technology Deductions

### Cell Phone
You can deduct the business-use percentage of your phone bill. If you use your phone 70% for rideshare and 30% personal, deduct 70% of your monthly bill.

### Phone Accessories
- Phone mounts: 100% deductible
- Car chargers: 100% deductible
- Backup batteries: 100% deductible

### Data Plan
If you pay for a separate data plan or hotspot for driving, it's 100% deductible if used only for business.

---

## Car Accessories & Supplies

### Deductible Items
- Phone mount
- Dash cam (business use)
- AUX cable or Bluetooth adapter
- Car cleaning supplies
- Air fresheners
- Phone chargers for passengers
- Barf bags (yes, really)
- First aid kit
- Jumper cables

### Passenger Amenities
- Bottled water
- Mints and gum
- Phone charging cables for passengers
- Tissues

These small expenses add up. A few dollars here and there can mean hundreds in deductions over a year.

---

## Tolls & Parking

### Tolls
Business-related tolls are 100% deductible. Keep receipts or use a toll transponder that provides records.

### Parking
Deductible parking includes:
- Airport parking while waiting for rides
- Parking at events you're serving
- Parking for vehicle inspections

**Not deductible:** Parking tickets (sorry!)

---

## Vehicle Inspection & Regulatory Costs

- Annual vehicle inspection fees
- Background check fees
- City/state permit fees
- Vehicle registration (business portion)

---

## Health & Safety

- Hand sanitizer
- Disinfecting wipes
- Face masks (if required)
- Partition installation (if applicable)

---

## Professional Services

- Tax preparation fees
- Accounting software subscriptions
- Business expense tracking apps

---

## Deductions Uber/Lyft Drivers Often Miss

1. **Miles between rides** - When the app is on and you're waiting for the next ride
2. **Car washes** - Keeping your car clean for passengers
3. **Roadside assistance** - AAA membership (business portion)
4. **Snacks and water for passengers** - Small but adds up
5. **Parking at airports** - While waiting in the queue
6. **Phone mount** - Small purchase, still deductible

---

## Record-Keeping Requirements

Based on current IRS guidance, you are generally required to keep:

1. **Mileage log** with date, destination, business purpose, and miles
2. **Receipts** for expenses over $75
3. **Bank/credit card statements** for all business expenses
4. **Platform earnings summaries** or 1099 forms

Keep records for at least 3 years (7 years is safer).

---

## Track Your Rideshare Deductions Automatically

TaxGig helps Uber and Lyft drivers:

- **Track mileage** automatically with GPS
- **Import earnings** directly from rideshare platforms
- **Categorize expenses** as you spend
- **Calculate quarterly taxes** based on actual income and deductions

Stop leaving money on the table. Start tracking today.
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter(post => post.featured);
}

export function getRecentPosts(limit: number = 5): BlogPost[] {
  return [...blogPosts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
