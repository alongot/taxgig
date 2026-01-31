/**
 * Categorization Service
 * Intelligent transaction categorization engine
 *
 * Sprint 2 Phase 2 Implementation:
 * - MCC code mapping to expense categories
 * - Income vs expense classification
 * - Platform detection (Uber, DoorDash, Upwork, etc.)
 * - Keyword-based categorization
 * - Merchant pattern matching
 * - User-defined category rules
 * - Confidence scoring for review queue
 *
 * Target: 70% automatic categorization accuracy
 */

import { query } from '../config/database';
import {
  TransactionType,
  CategorizationSource,
  ExpenseCategoryDB,
  CategoryRule,
} from '../types';

// =============================================================================
// TYPES
// =============================================================================

export interface CategorizationResult {
  transaction_type: TransactionType;
  category_id: string | null;
  category_code: string | null;
  is_business: boolean | null;
  confidence: number; // 0.0 to 1.0
  source: CategorizationSource;
  review_required: boolean;
  detected_platform: string | null;
  reasoning: string[];
}

export interface TransactionInput {
  amount: number;
  description: string | null;
  original_description: string | null;
  merchant_name: string | null;
  mcc_code: string | null;
  plaid_category?: string | null;
  payment_channel?: string;
}

// =============================================================================
// PLATFORM DETECTION PATTERNS
// Gig economy and payment platforms we want to recognize
// =============================================================================

const INCOME_PLATFORMS: {
  name: string;
  patterns: RegExp[];
  is_business_income: boolean;
}[] = [
  // Rideshare
  {
    name: 'Uber',
    patterns: [
      /uber/i,
      /\bub\s?trip/i,
      /raiser.*uber/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Lyft',
    patterns: [
      /lyft/i,
      /\blyft\s?(inc|ride|driver)/i,
    ],
    is_business_income: true,
  },
  // Food Delivery
  {
    name: 'DoorDash',
    patterns: [
      /doordash/i,
      /door\s?dash/i,
      /\bdd\s?pay/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Uber Eats',
    patterns: [
      /uber\s?eats/i,
      /ubereats/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Grubhub',
    patterns: [
      /grubhub/i,
      /grub\s?hub/i,
      /seamless/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Instacart',
    patterns: [
      /instacart/i,
      /insta\s?cart/i,
      /maplebear/i, // Instacart's corporate name
    ],
    is_business_income: true,
  },
  {
    name: 'Postmates',
    patterns: [
      /postmates/i,
      /post\s?mates/i,
    ],
    is_business_income: true,
  },
  // Freelance Platforms
  {
    name: 'Upwork',
    patterns: [
      /upwork/i,
      /up\s?work/i,
      /elance/i, // Legacy name
    ],
    is_business_income: true,
  },
  {
    name: 'Fiverr',
    patterns: [
      /fiverr/i,
      /fiver/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Freelancer',
    patterns: [
      /freelancer\.com/i,
      /freelancer\s?inc/i,
    ],
    is_business_income: true,
  },
  // E-commerce
  {
    name: 'Etsy',
    patterns: [
      /etsy/i,
      /etsy\.com/i,
      /etsy\s?(inc|payment)/i,
    ],
    is_business_income: true,
  },
  {
    name: 'eBay',
    patterns: [
      /ebay/i,
      /e-bay/i,
      /paypal.*ebay/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Amazon Seller',
    patterns: [
      /amazon\s?(seller|services|pay.*seller)/i,
      /amzn\s?mktp/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Shopify',
    patterns: [
      /shopify/i,
      /shop.*pay/i,
    ],
    is_business_income: true,
  },
  // Payment Processors (need extra context)
  {
    name: 'PayPal',
    patterns: [
      /paypal/i,
      /pay\s?pal/i,
      /\bpp\s?\*/i,
    ],
    is_business_income: false, // Could be personal or business
  },
  {
    name: 'Venmo',
    patterns: [
      /venmo/i,
      /venmo\s?(payment|transfer)/i,
    ],
    is_business_income: false, // Could be personal or business
  },
  {
    name: 'Cash App',
    patterns: [
      /cash\s?app/i,
      /square\s?cash/i,
      /\bsqc\*/i,
    ],
    is_business_income: false,
  },
  {
    name: 'Zelle',
    patterns: [
      /zelle/i,
      /zellepay/i,
    ],
    is_business_income: false,
  },
  // Creative/Content
  {
    name: 'Patreon',
    patterns: [
      /patreon/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Substack',
    patterns: [
      /substack/i,
    ],
    is_business_income: true,
  },
  // Task/Service
  {
    name: 'TaskRabbit',
    patterns: [
      /taskrabbit/i,
      /task\s?rabbit/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Thumbtack',
    patterns: [
      /thumbtack/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Rover',
    patterns: [
      /rover\.com/i,
      /rover\s?(pay|inc)/i,
    ],
    is_business_income: true,
  },
  // Rental
  {
    name: 'Airbnb',
    patterns: [
      /airbnb/i,
      /air\s?bnb/i,
    ],
    is_business_income: true,
  },
  {
    name: 'Turo',
    patterns: [
      /turo/i,
    ],
    is_business_income: true,
  },
  // Stripe (business payments)
  {
    name: 'Stripe',
    patterns: [
      /stripe/i,
      /\bstr\*/i,
    ],
    is_business_income: true,
  },
];

// =============================================================================
// CATEGORIZATION SERVICE CLASS
// =============================================================================

export class CategorizationService {
  private categories: ExpenseCategoryDB[] = [];
  private categoryByCode: Map<string, ExpenseCategoryDB> = new Map();
  private categoryById: Map<string, ExpenseCategoryDB> = new Map();
  private mccToCategory: Map<string, ExpenseCategoryDB> = new Map();
  private initialized = false;

  /**
   * Initialize category data from database
   * Called lazily on first categorization
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const result = await query(
      'SELECT * FROM expense_categories WHERE is_active = TRUE ORDER BY sort_order'
    );

    this.categories = result.rows.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      category_code: row.category_code,
      irs_line_number: row.irs_line_number,
      deduction_rate: parseFloat(row.deduction_rate),
      description: row.description,
      keywords: row.keywords || [],
      mcc_codes: row.mcc_codes || [],
      sort_order: row.sort_order,
      is_active: row.is_active,
      created_at: new Date(row.created_at),
    }));

    // Build lookup maps
    for (const category of this.categories) {
      this.categoryByCode.set(category.category_code, category);
      this.categoryById.set(category.category_id, category);

      // Map MCC codes to categories
      for (const mcc of category.mcc_codes) {
        this.mccToCategory.set(mcc, category);
      }
    }

    this.initialized = true;
  }

  /**
   * Categorize a transaction
   * Main entry point for categorization
   */
  async categorizeTransaction(
    transaction: TransactionInput,
    userId?: string
  ): Promise<CategorizationResult> {
    await this.initialize();

    const reasoning: string[] = [];
    let confidence = 0;
    let category: ExpenseCategoryDB | null = null;
    let source: CategorizationSource = 'auto';
    let detectedPlatform: string | null = null;
    let isBusiness: boolean | null = null;
    let transactionType: TransactionType = 'unknown';

    // Combine description fields for matching
    const fullDescription = [
      transaction.description,
      transaction.original_description,
      transaction.merchant_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // ==========================================================================
    // STEP 1: Determine transaction type (income vs expense)
    // ==========================================================================
    if (transaction.amount > 0) {
      // Positive amount = income (deposits)
      transactionType = 'income';
      reasoning.push('Positive amount indicates income/deposit');
    } else if (transaction.amount < 0) {
      // Negative amount = expense (withdrawals)
      transactionType = 'expense';
      reasoning.push('Negative amount indicates expense/payment');
    }

    // ==========================================================================
    // STEP 2: Platform detection for income
    // ==========================================================================
    if (transactionType === 'income') {
      const platformResult = this.detectPlatform(fullDescription);

      if (platformResult) {
        detectedPlatform = platformResult.platform;
        isBusiness = platformResult.is_business;
        confidence = Math.max(confidence, 0.85);
        reasoning.push(`Detected platform: ${platformResult.platform}`);

        if (platformResult.is_business) {
          reasoning.push('Platform typically generates business income');
        }
      } else {
        // For a Side Hustle Tax Tracker, default income to business income
        // Users can review and mark as personal if needed
        isBusiness = true;
        confidence = Math.max(confidence, 0.50);
        reasoning.push('Income defaulted to business (Side Hustle Tracker)');
      }
    }

    // ==========================================================================
    // STEP 3: User-defined rules (highest priority for expenses)
    // ==========================================================================
    if (userId && transactionType === 'expense') {
      const ruleResult = await this.applyUserRules(userId, transaction, fullDescription);

      if (ruleResult) {
        category = ruleResult.category;
        if (ruleResult.is_business !== null) isBusiness = ruleResult.is_business;
        if (ruleResult.transaction_type) transactionType = ruleResult.transaction_type;
        source = 'rule';
        confidence = Math.max(confidence, 0.90);
        reasoning.push(`Matched user rule: ${ruleResult.rule_name || ruleResult.rule_id}`);
      }
    }

    // ==========================================================================
    // STEP 4: MCC code categorization (for expenses)
    // ==========================================================================
    if (!category && transaction.mcc_code && transactionType === 'expense') {
      const mccCategory = this.mccToCategory.get(transaction.mcc_code);

      if (mccCategory) {
        category = mccCategory;
        confidence = Math.max(confidence, 0.80);
        reasoning.push(`MCC code ${transaction.mcc_code} mapped to ${mccCategory.category_name}`);
      }
    }

    // ==========================================================================
    // STEP 5: Keyword matching (for expenses without MCC match)
    // ==========================================================================
    if (!category && transactionType === 'expense') {
      const keywordResult = this.matchKeywords(fullDescription);

      if (keywordResult) {
        category = keywordResult.category;
        confidence = Math.max(confidence, keywordResult.confidence);
        reasoning.push(`Keyword match: "${keywordResult.keyword}" -> ${keywordResult.category.category_name}`);
      }
    }

    // ==========================================================================
    // STEP 6: Detect transfers (not income or expense)
    // ==========================================================================
    if (this.isTransfer(fullDescription)) {
      transactionType = 'transfer';
      isBusiness = false;
      confidence = 0.75;
      reasoning.push('Detected as internal transfer');
    }

    // ==========================================================================
    // STEP 7: Detect refunds
    // ==========================================================================
    if (this.isRefund(fullDescription)) {
      transactionType = 'refund';
      reasoning.push('Detected as refund');
    }

    // ==========================================================================
    // STEP 8: Default categorization for unmatched expenses
    // ==========================================================================
    if (transactionType === 'expense') {
      // For Side Hustle Tax Tracker, default expenses to business
      // Users can review and mark as personal if needed
      if (isBusiness === null) {
        isBusiness = true;
        reasoning.push('Expense defaulted to business (Side Hustle Tracker)');
      }

      if (!category) {
        if (isBusiness === true) {
          category = this.categoryByCode.get('other') || null;
          reasoning.push('Defaulted to Other business expenses');
        } else if (isBusiness === false) {
          category = this.categoryByCode.get('personal') || null;
          reasoning.push('Defaulted to Personal (not deductible)');
        }
        confidence = Math.min(confidence, 0.40); // Low confidence for defaults
      }
    }

    // ==========================================================================
    // STEP 9: Determine if review is required
    // ==========================================================================
    const reviewRequired = this.shouldRequireReview(
      confidence,
      transactionType,
      category,
      isBusiness,
      detectedPlatform
    );

    if (reviewRequired) {
      reasoning.push('Flagged for manual review');
    }

    return {
      transaction_type: transactionType,
      category_id: category?.category_id || null,
      category_code: category?.category_code || null,
      is_business: isBusiness,
      confidence: Math.round(confidence * 100) / 100,
      source,
      review_required: reviewRequired,
      detected_platform: detectedPlatform,
      reasoning,
    };
  }

  /**
   * Detect if transaction is from a known income platform
   */
  private detectPlatform(description: string): {
    platform: string;
    is_business: boolean;
  } | null {
    for (const platform of INCOME_PLATFORMS) {
      for (const pattern of platform.patterns) {
        if (pattern.test(description)) {
          return {
            platform: platform.name,
            is_business: platform.is_business_income,
          };
        }
      }
    }
    return null;
  }

  /**
   * Apply user-defined category rules
   */
  private async applyUserRules(
    userId: string,
    transaction: TransactionInput,
    description: string
  ): Promise<{
    category: ExpenseCategoryDB | null;
    is_business: boolean | null;
    transaction_type: TransactionType | null;
    rule_id: string;
    rule_name: string | null;
  } | null> {
    const result = await query(
      `SELECT * FROM category_rules
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY priority DESC, match_count DESC`,
      [userId]
    );

    const rules: CategoryRule[] = result.rows;

    for (const rule of rules) {
      let matches = false;

      switch (rule.rule_type) {
        case 'keyword':
          if (rule.keyword_pattern) {
            try {
              const regex = new RegExp(rule.keyword_pattern, 'i');
              matches = regex.test(description);
            } catch {
              // Invalid regex, try simple includes
              matches = description.includes(rule.keyword_pattern.toLowerCase());
            }
          }
          break;

        case 'merchant':
          if (rule.merchant_pattern && transaction.merchant_name) {
            try {
              const regex = new RegExp(rule.merchant_pattern, 'i');
              matches = regex.test(transaction.merchant_name);
            } catch {
              matches = transaction.merchant_name.toLowerCase().includes(rule.merchant_pattern.toLowerCase());
            }
          }
          break;

        case 'mcc':
          if (rule.mcc_codes && transaction.mcc_code) {
            matches = rule.mcc_codes.includes(transaction.mcc_code);
          }
          break;

        case 'amount_range':
          const amount = Math.abs(transaction.amount);
          const minOk = rule.amount_min === null || amount >= rule.amount_min;
          const maxOk = rule.amount_max === null || amount <= rule.amount_max;
          matches = minOk && maxOk;
          break;

        case 'combined':
          // Check all specified criteria
          let allMatch = true;

          if (rule.keyword_pattern) {
            try {
              const regex = new RegExp(rule.keyword_pattern, 'i');
              if (!regex.test(description)) allMatch = false;
            } catch {
              if (!description.includes(rule.keyword_pattern.toLowerCase())) allMatch = false;
            }
          }

          if (rule.merchant_pattern && transaction.merchant_name) {
            try {
              const regex = new RegExp(rule.merchant_pattern, 'i');
              if (!regex.test(transaction.merchant_name)) allMatch = false;
            } catch {
              if (!transaction.merchant_name.toLowerCase().includes(rule.merchant_pattern.toLowerCase())) {
                allMatch = false;
              }
            }
          }

          if (rule.mcc_codes && rule.mcc_codes.length > 0 && transaction.mcc_code) {
            if (!rule.mcc_codes.includes(transaction.mcc_code)) allMatch = false;
          }

          matches = allMatch;
          break;
      }

      if (matches) {
        // Increment match count (async, don't wait)
        query(
          'UPDATE category_rules SET match_count = match_count + 1 WHERE rule_id = $1',
          [rule.rule_id]
        ).catch(console.error);

        const category = rule.category_id ? this.categoryById.get(rule.category_id) || null : null;

        return {
          category,
          is_business: rule.is_business,
          transaction_type: rule.transaction_type as TransactionType | null,
          rule_id: rule.rule_id,
          rule_name: rule.rule_name,
        };
      }
    }

    return null;
  }

  /**
   * Match transaction against category keywords
   */
  private matchKeywords(description: string): {
    category: ExpenseCategoryDB;
    keyword: string;
    confidence: number;
  } | null {
    let bestMatch: {
      category: ExpenseCategoryDB;
      keyword: string;
      confidence: number;
    } | null = null;

    for (const category of this.categories) {
      for (const keyword of category.keywords) {
        const lowerKeyword = keyword.toLowerCase();

        if (description.includes(lowerKeyword)) {
          // Longer keyword matches are more specific = higher confidence
          const confidence = Math.min(0.70, 0.50 + (lowerKeyword.length * 0.02));

          if (!bestMatch || confidence > bestMatch.confidence || lowerKeyword.length > bestMatch.keyword.length) {
            bestMatch = {
              category,
              keyword,
              confidence,
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Detect if transaction is a transfer between accounts
   */
  private isTransfer(description: string): boolean {
    const transferPatterns = [
      /transfer\s+(to|from)/i,
      /\btfr\b/i,
      /\bxfer\b/i,
      /online\s+transfer/i,
      /internal\s+transfer/i,
      /ach\s+transfer/i,
      /wire\s+transfer/i,
      /\bfrom\s+(checking|savings|account)/i,
      /\bto\s+(checking|savings|account)/i,
    ];

    return transferPatterns.some(pattern => pattern.test(description));
  }

  /**
   * Detect if transaction is a refund
   */
  private isRefund(description: string): boolean {
    const refundPatterns = [
      /refund/i,
      /return/i,
      /credit\s+adj/i,
      /reversal/i,
      /chargeback/i,
    ];

    return refundPatterns.some(pattern => pattern.test(description));
  }

  /**
   * Determine if transaction should be flagged for manual review
   */
  private shouldRequireReview(
    confidence: number,
    transactionType: TransactionType,
    category: ExpenseCategoryDB | null,
    isBusiness: boolean | null,
    detectedPlatform: string | null
  ): boolean {
    // Low confidence always needs review
    if (confidence < 0.60) return true;

    // Income without platform detection needs review
    if (transactionType === 'income' && !detectedPlatform && confidence < 0.80) return true;

    // Business classification unclear
    if (isBusiness === null && transactionType === 'expense') return true;

    // Uncategorized expense
    if (transactionType === 'expense' && !category) return true;

    // P2P payments (PayPal, Venmo, etc.) need review for business classification
    if (detectedPlatform && ['PayPal', 'Venmo', 'Cash App', 'Zelle'].includes(detectedPlatform)) {
      return true;
    }

    return false;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string): Promise<ExpenseCategoryDB | null> {
    await this.initialize();
    return this.categoryById.get(categoryId) || null;
  }

  /**
   * Get category by code
   */
  async getCategoryByCode(code: string): Promise<ExpenseCategoryDB | null> {
    await this.initialize();
    return this.categoryByCode.get(code) || null;
  }

  /**
   * Get all active categories
   */
  async getAllCategories(): Promise<ExpenseCategoryDB[]> {
    await this.initialize();
    return this.categories;
  }

  /**
   * Bulk categorize transactions
   */
  async categorizeTransactions(
    transactions: TransactionInput[],
    userId?: string
  ): Promise<CategorizationResult[]> {
    const results: CategorizationResult[] = [];

    for (const transaction of transactions) {
      const result = await this.categorizeTransaction(transaction, userId);
      results.push(result);
    }

    return results;
  }
}

// Export singleton instance
export const categorizationService = new CategorizationService();
