import axios from "axios";

export interface DiscountRule {
  id?: string;
  Rule_Name: string;
  Target_Account_Type: string; // 'Student' | 'Advocate' | 'General' | 'Senior Citizen' | 'All'
  Discount_Percentage: number;
  Start_Date: string; // YYYY-MM-DD
  End_Date: string;   // YYYY-MM-DD
  Is_Active: boolean;
}

export interface AppliedDiscount {
  applicable: boolean;
  ruleName: string;
  targetAccountType: string;
  percentage: number;
  discountBadgeText: string;
  discountAmount: number;
  finalPrice: number;
}

/**
 * Cross-references a user's accountType with active discount rules
 * and returns the best matching active rule within valid date ranges.
 */
export function getMatchingDiscountRule(
  rules: DiscountRule[],
  userAccountType: string = 'General'
): DiscountRule | null {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const accountType = String(userAccountType || 'General').trim().toLowerCase();

  let bestRule: DiscountRule | null = null;
  let maxPercentage = 0;

  for (const rule of rules) {
    // Check if rule is active
    if (rule.Is_Active === false || String(rule.Is_Active).toUpperCase() === 'FALSE' || (rule.Is_Active as any) === 0) {
      continue;
    }

    const targetType = String(rule.Target_Account_Type || 'All').trim().toLowerCase();
    const isTargetMatch =
      targetType === 'all' ||
      targetType === accountType ||
      (accountType === 'student' && targetType.includes('student')) ||
      (accountType === 'advocate' && (targetType.includes('advocate') || targetType.includes('lawyer'))) ||
      (accountType === 'senior citizen' && targetType.includes('senior'));

    if (!isTargetMatch) continue;

    const startDate = rule.Start_Date ? String(rule.Start_Date).slice(0, 10) : '';
    const endDate = rule.End_Date ? String(rule.End_Date).slice(0, 10) : '';

    if (startDate && todayStr < startDate) continue;
    if (endDate && todayStr > endDate) continue;

    const pct = Number(rule.Discount_Percentage) || 0;
    if (pct > maxPercentage) {
      maxPercentage = pct;
      bestRule = rule;
    }
  }

  return bestRule;
}

/**
 * Evaluates active discount rules against logged-in user's accountType and current date.
 */
export function evaluateDiscount(
  rules: DiscountRule[],
  userAccountType: string = 'General',
  rawTotal: number = 0
): AppliedDiscount {
  if (!rules || !Array.isArray(rules) || rules.length === 0 || rawTotal <= 0) {
    return {
      applicable: false,
      ruleName: '',
      targetAccountType: '',
      percentage: 0,
      discountBadgeText: '',
      discountAmount: 0,
      finalPrice: Math.max(0, rawTotal)
    };
  }

  const matchingRule = getMatchingDiscountRule(rules, userAccountType);

  if (matchingRule && matchingRule.Discount_Percentage > 0) {
    const pct = Number(matchingRule.Discount_Percentage);
    const discountAmount = Math.round((rawTotal * pct) / 100);
    const finalPrice = Math.max(0, rawTotal - discountAmount);

    const targetAccType = String(matchingRule.Target_Account_Type || '').trim();
    const roleLabel =
      targetAccType && targetAccType.toLowerCase() !== 'all'
        ? targetAccType
        : (userAccountType && userAccountType !== 'General')
        ? userAccountType
        : 'Special Offer';

    return {
      applicable: true,
      ruleName: matchingRule.Rule_Name,
      targetAccountType: matchingRule.Target_Account_Type,
      percentage: pct,
      discountBadgeText: `${roleLabel} Discount Applied (-${pct}%)`,
      discountAmount,
      finalPrice
    };
  }

  return {
    applicable: false,
    ruleName: '',
    targetAccountType: '',
    percentage: 0,
    discountBadgeText: '',
    discountAmount: 0,
    finalPrice: Math.max(0, rawTotal)
  };
}

/**
 * Fetches active discount rules from backend API / GAS Business_Config.
 */
export async function fetchActiveDiscountRules(): Promise<DiscountRule[]> {
  try {
    const res = await axios.get('/api/discounts');
    if (res.data && res.data.success && Array.isArray(res.data.discountRules)) {
      localStorage.setItem('business_discount_rules', JSON.stringify(res.data.discountRules));
      return res.data.discountRules;
    }
  } catch (err) {
    console.warn('[discountUtils] Failed to fetch discount rules from Express API:', err);
  }

  // Fallback to cached local storage
  const local = localStorage.getItem('business_discount_rules');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }

  // Default fallback rules
  const defaults: DiscountRule[] = [
    {
      id: 'rule_default_student',
      Rule_Name: 'Student Discount Offer',
      Target_Account_Type: 'Student',
      Discount_Percentage: 10,
      Start_Date: '2026-01-01',
      End_Date: '2026-12-31',
      Is_Active: true
    },
    {
      id: 'rule_default_advocate',
      Rule_Name: 'Advocate Professional Offer',
      Target_Account_Type: 'Advocate',
      Discount_Percentage: 15,
      Start_Date: '2026-01-01',
      End_Date: '2026-12-31',
      Is_Active: true
    }
  ];
  return defaults;
}

