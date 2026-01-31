/**
 * Category Rule Service
 * Manages user-defined categorization rules
 *
 * Sprint 2 Implementation:
 * - CRUD operations for category rules
 * - Rule priority management
 * - Rule validation
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { CategoryRule, RuleType, TransactionType } from '../types';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

// =============================================================================
// TYPES
// =============================================================================

export interface CategoryRuleCreateInput {
  rule_name?: string;
  rule_type: RuleType;
  keyword_pattern?: string;
  merchant_pattern?: string;
  mcc_codes?: string[];
  amount_min?: number;
  amount_max?: number;
  category_id?: string;
  is_business?: boolean;
  transaction_type?: TransactionType;
  priority?: number;
}

export interface CategoryRuleUpdateInput {
  rule_name?: string;
  keyword_pattern?: string;
  merchant_pattern?: string;
  mcc_codes?: string[];
  amount_min?: number;
  amount_max?: number;
  category_id?: string;
  is_business?: boolean;
  transaction_type?: TransactionType;
  priority?: number;
  is_active?: boolean;
}

// =============================================================================
// CATEGORY RULE SERVICE CLASS
// =============================================================================

export class CategoryRuleService {
  /**
   * Create a new category rule
   */
  async createRule(userId: string, input: CategoryRuleCreateInput): Promise<CategoryRule> {
    // Validate rule type requirements
    this.validateRuleInput(input);

    const ruleId = uuidv4();

    const result = await query(
      `INSERT INTO category_rules (
        rule_id, user_id, rule_type, rule_name,
        keyword_pattern, merchant_pattern, mcc_codes,
        amount_min, amount_max, category_id, is_business,
        transaction_type, priority, is_active, is_system_rule,
        match_count, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, FALSE, 0, NOW(), NOW()
      ) RETURNING *`,
      [
        ruleId,
        userId,
        input.rule_type,
        input.rule_name || null,
        input.keyword_pattern || null,
        input.merchant_pattern || null,
        input.mcc_codes || null,
        input.amount_min || null,
        input.amount_max || null,
        input.category_id || null,
        input.is_business ?? null,
        input.transaction_type || null,
        input.priority || 0,
      ]
    );

    return this.mapToRule(result.rows[0]);
  }

  /**
   * Get all rules for a user
   */
  async getUserRules(userId: string, includeInactive: boolean = false): Promise<CategoryRule[]> {
    let queryText = `
      SELECT cr.*, ec.category_name, ec.category_code
      FROM category_rules cr
      LEFT JOIN expense_categories ec ON cr.category_id = ec.category_id
      WHERE cr.user_id = $1
    `;

    if (!includeInactive) {
      queryText += ' AND cr.is_active = TRUE';
    }

    queryText += ' ORDER BY cr.priority DESC, cr.match_count DESC, cr.created_at DESC';

    const result = await query(queryText, [userId]);

    return result.rows.map(row => this.mapToRule(row));
  }

  /**
   * Get a specific rule by ID
   */
  async getRuleById(userId: string, ruleId: string): Promise<CategoryRule> {
    const result = await query(
      `SELECT cr.*, ec.category_name, ec.category_code
       FROM category_rules cr
       LEFT JOIN expense_categories ec ON cr.category_id = ec.category_id
       WHERE cr.rule_id = $1 AND cr.user_id = $2`,
      [ruleId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Category rule not found');
    }

    return this.mapToRule(result.rows[0]);
  }

  /**
   * Update a category rule
   */
  async updateRule(userId: string, ruleId: string, updates: CategoryRuleUpdateInput): Promise<CategoryRule> {
    // Verify rule exists and belongs to user
    await this.getRuleById(userId, ruleId);

    const setClause: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.rule_name !== undefined) {
      setClause.push(`rule_name = $${paramIndex}`);
      values.push(updates.rule_name);
      paramIndex++;
    }

    if (updates.keyword_pattern !== undefined) {
      setClause.push(`keyword_pattern = $${paramIndex}`);
      values.push(updates.keyword_pattern);
      paramIndex++;
    }

    if (updates.merchant_pattern !== undefined) {
      setClause.push(`merchant_pattern = $${paramIndex}`);
      values.push(updates.merchant_pattern);
      paramIndex++;
    }

    if (updates.mcc_codes !== undefined) {
      setClause.push(`mcc_codes = $${paramIndex}`);
      values.push(updates.mcc_codes);
      paramIndex++;
    }

    if (updates.amount_min !== undefined) {
      setClause.push(`amount_min = $${paramIndex}`);
      values.push(updates.amount_min);
      paramIndex++;
    }

    if (updates.amount_max !== undefined) {
      setClause.push(`amount_max = $${paramIndex}`);
      values.push(updates.amount_max);
      paramIndex++;
    }

    if (updates.category_id !== undefined) {
      setClause.push(`category_id = $${paramIndex}`);
      values.push(updates.category_id);
      paramIndex++;
    }

    if (updates.is_business !== undefined) {
      setClause.push(`is_business = $${paramIndex}`);
      values.push(updates.is_business);
      paramIndex++;
    }

    if (updates.transaction_type !== undefined) {
      setClause.push(`transaction_type = $${paramIndex}`);
      values.push(updates.transaction_type);
      paramIndex++;
    }

    if (updates.priority !== undefined) {
      setClause.push(`priority = $${paramIndex}`);
      values.push(updates.priority);
      paramIndex++;
    }

    if (updates.is_active !== undefined) {
      setClause.push(`is_active = $${paramIndex}`);
      values.push(updates.is_active);
      paramIndex++;
    }

    if (setClause.length === 0) {
      return this.getRuleById(userId, ruleId);
    }

    setClause.push(`updated_at = NOW()`);
    values.push(ruleId, userId);

    const result = await query(
      `UPDATE category_rules SET ${setClause.join(', ')}
       WHERE rule_id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return this.mapToRule(result.rows[0]);
  }

  /**
   * Delete a category rule
   */
  async deleteRule(userId: string, ruleId: string): Promise<void> {
    const result = await query(
      'DELETE FROM category_rules WHERE rule_id = $1 AND user_id = $2 AND is_system_rule = FALSE',
      [ruleId, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Category rule not found or cannot be deleted');
    }
  }

  /**
   * Create a rule from a user's transaction categorization
   * This is called when a user categorizes a transaction - we can learn from it
   */
  async createRuleFromTransaction(
    userId: string,
    merchantName: string | null,
    description: string | null,
    categoryId: string,
    isBusiness: boolean
  ): Promise<CategoryRule | null> {
    // Only create rule if we have a merchant name
    if (!merchantName) return null;

    // Check if a similar rule already exists
    const existingRule = await query(
      `SELECT rule_id FROM category_rules
       WHERE user_id = $1 AND merchant_pattern ILIKE $2`,
      [userId, `%${merchantName}%`]
    );

    if (existingRule.rows.length > 0) {
      // Update existing rule's match count
      await query(
        'UPDATE category_rules SET match_count = match_count + 1 WHERE rule_id = $1',
        [existingRule.rows[0].rule_id]
      );
      return null;
    }

    // Create a new merchant-based rule
    return this.createRule(userId, {
      rule_type: 'merchant',
      rule_name: `Rule for ${merchantName}`,
      merchant_pattern: merchantName,
      category_id: categoryId,
      is_business: isBusiness,
      priority: 10, // User-created rules have moderate priority
    });
  }

  /**
   * Get suggested rules based on user's categorization patterns
   */
  async getSuggestedRules(userId: string): Promise<{
    merchant: string;
    category_id: string;
    category_name: string;
    occurrence_count: number;
  }[]> {
    // Find merchants that have been categorized the same way multiple times
    const result = await query(
      `SELECT
        t.merchant_name,
        t.category_id,
        ec.category_name,
        COUNT(*) as occurrence_count
      FROM transactions t
      JOIN expense_categories ec ON t.category_id = ec.category_id
      WHERE t.user_id = $1
        AND t.merchant_name IS NOT NULL
        AND t.reviewed_by_user = TRUE
        AND t.category_id IS NOT NULL
        AND t.merchant_name NOT IN (
          SELECT merchant_pattern FROM category_rules
          WHERE user_id = $1 AND merchant_pattern IS NOT NULL
        )
      GROUP BY t.merchant_name, t.category_id, ec.category_name
      HAVING COUNT(*) >= 2
      ORDER BY occurrence_count DESC
      LIMIT 10`,
      [userId]
    );

    return result.rows.map(row => ({
      merchant: row.merchant_name,
      category_id: row.category_id,
      category_name: row.category_name,
      occurrence_count: parseInt(row.occurrence_count, 10),
    }));
  }

  /**
   * Validate rule input based on rule type
   */
  private validateRuleInput(input: CategoryRuleCreateInput): void {
    switch (input.rule_type) {
      case 'keyword':
        if (!input.keyword_pattern) {
          throw new BadRequestError('keyword_pattern is required for keyword rules');
        }
        break;

      case 'merchant':
        if (!input.merchant_pattern) {
          throw new BadRequestError('merchant_pattern is required for merchant rules');
        }
        break;

      case 'mcc':
        if (!input.mcc_codes || input.mcc_codes.length === 0) {
          throw new BadRequestError('mcc_codes is required for MCC rules');
        }
        break;

      case 'amount_range':
        if (input.amount_min === undefined && input.amount_max === undefined) {
          throw new BadRequestError('amount_min or amount_max is required for amount range rules');
        }
        if (input.amount_min !== undefined && input.amount_max !== undefined) {
          if (input.amount_min > input.amount_max) {
            throw new BadRequestError('amount_min cannot be greater than amount_max');
          }
        }
        break;

      case 'combined':
        // Combined rules need at least one criterion
        const hasCriteria = input.keyword_pattern ||
                          input.merchant_pattern ||
                          (input.mcc_codes && input.mcc_codes.length > 0) ||
                          input.amount_min !== undefined ||
                          input.amount_max !== undefined;

        if (!hasCriteria) {
          throw new BadRequestError('Combined rules must have at least one matching criterion');
        }
        break;

      default:
        throw new BadRequestError(`Invalid rule type: ${input.rule_type}`);
    }

    // Validate that the rule has an action
    if (input.category_id === undefined && input.is_business === undefined && input.transaction_type === undefined) {
      throw new BadRequestError('Rule must specify at least one action (category_id, is_business, or transaction_type)');
    }
  }

  /**
   * Map database row to CategoryRule object
   */
  private mapToRule(row: Record<string, unknown>): CategoryRule {
    return {
      rule_id: row.rule_id as string,
      user_id: row.user_id as string,
      rule_type: row.rule_type as RuleType,
      rule_name: row.rule_name as string | null,
      keyword_pattern: row.keyword_pattern as string | null,
      merchant_pattern: row.merchant_pattern as string | null,
      mcc_codes: row.mcc_codes as string[] | null,
      amount_min: row.amount_min ? parseFloat(row.amount_min as string) : null,
      amount_max: row.amount_max ? parseFloat(row.amount_max as string) : null,
      category_id: row.category_id as string | null,
      is_business: row.is_business as boolean | null,
      transaction_type: row.transaction_type as TransactionType | null,
      match_count: parseInt(row.match_count as string, 10) || 0,
      is_active: row.is_active as boolean,
      priority: row.priority as number,
      is_system_rule: row.is_system_rule as boolean,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }
}

// Export singleton instance
export const categoryRuleService = new CategoryRuleService();
