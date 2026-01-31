/**
 * Category Rule Controller
 * Handles HTTP requests for user-defined categorization rules
 *
 * Sprint 2 Implementation:
 * - CRUD operations for category rules
 * - Rule suggestions based on user patterns
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, RuleType } from '../types';
import { categoryRuleService, CategoryRuleCreateInput } from '../services/categoryRuleService';
import { categorizationService } from '../services/categorizationService';
import { BadRequestError } from '../utils/errors';

/**
 * Get all category rules for the user
 * GET /api/v1/rules
 */
export const getRules = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const includeInactive = req.query.include_inactive === 'true';

    const rules = await categoryRuleService.getUserRules(userId, includeInactive);

    res.status(200).json({
      success: true,
      data: {
        rules,
        count: rules.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single rule by ID
 * GET /api/v1/rules/:ruleId
 */
export const getRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { ruleId } = req.params;

    const rule = await categoryRuleService.getRuleById(userId, ruleId);

    res.status(200).json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category rule
 * POST /api/v1/rules
 */
export const createRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const input = req.body as CategoryRuleCreateInput;

    // Validate category_id if provided
    if (input.category_id) {
      const category = await categorizationService.getCategoryById(input.category_id);
      if (!category) {
        throw new BadRequestError('Invalid category ID');
      }
    }

    const rule = await categoryRuleService.createRule(userId, input);

    res.status(201).json({
      success: true,
      message: 'Category rule created successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category rule
 * PATCH /api/v1/rules/:ruleId
 */
export const updateRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { ruleId } = req.params;
    const updates = req.body;

    // Validate category_id if provided
    if (updates.category_id) {
      const category = await categorizationService.getCategoryById(updates.category_id);
      if (!category) {
        throw new BadRequestError('Invalid category ID');
      }
    }

    const rule = await categoryRuleService.updateRule(userId, ruleId, updates);

    res.status(200).json({
      success: true,
      message: 'Category rule updated successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category rule
 * DELETE /api/v1/rules/:ruleId
 */
export const deleteRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { ruleId } = req.params;

    await categoryRuleService.deleteRule(userId, ruleId);

    res.status(200).json({
      success: true,
      message: 'Category rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get suggested rules based on user's categorization patterns
 * GET /api/v1/rules/suggestions
 */
export const getSuggestedRules = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    const suggestions = await categoryRuleService.getSuggestedRules(userId);

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a rule from a suggested rule
 * POST /api/v1/rules/from-suggestion
 */
export const createRuleFromSuggestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { merchant, category_id, is_business } = req.body;

    if (!merchant) {
      throw new BadRequestError('merchant is required');
    }

    if (!category_id) {
      throw new BadRequestError('category_id is required');
    }

    // Validate category
    const category = await categorizationService.getCategoryById(category_id);
    if (!category) {
      throw new BadRequestError('Invalid category ID');
    }

    const rule = await categoryRuleService.createRule(userId, {
      rule_type: 'merchant',
      rule_name: `Rule for ${merchant}`,
      merchant_pattern: merchant,
      category_id,
      is_business: is_business ?? true,
      priority: 10,
    });

    res.status(201).json({
      success: true,
      message: 'Rule created from suggestion',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};
