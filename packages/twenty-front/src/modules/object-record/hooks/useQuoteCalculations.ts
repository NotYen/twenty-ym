import { useCallback } from 'react';

/**
 * 报价单计算工具 Hook
 *
 * 提供报价单相关的计算函数：
 * - 计算单个项目金额
 * - 计算报价单小计
 * - 计算税金
 * - 计算总计
 */
export const useQuoteCalculations = () => {
  /**
   * 计算 QuoteLineItem 的金额
   * 公式：amount = quantity × unitPrice × (1 - discount/100)
   *
   * @param quantity - 数量
   * @param unitPriceMicros - 单价（微单位）
   * @param discount - 折扣百分比（0-100）
   * @returns 金额（微单位）
   */
  const calculateLineItemAmount = useCallback(
    (
      quantity: number,
      unitPriceMicros: number,
      discount: number = 0,
    ): number => {
      if (!quantity || !unitPriceMicros) {
        return 0;
      }

      // 确保 discount 在 0-100 范围内
      const validDiscount = Math.max(0, Math.min(100, discount));

      // 计算折扣后的金额
      const discountMultiplier = 1 - validDiscount / 100;
      const amountMicros = Math.round(
        quantity * unitPriceMicros * discountMultiplier,
      );

      return amountMicros;
    },
    [],
  );

  /**
   * 计算报价单小计
   * 公式：subtotal = SUM(lineItems.amount)
   *
   * @param lineItems - 报价项目列表
   * @returns 小计（微单位）
   */
  const calculateQuoteSubtotal = useCallback(
    (
      lineItems: Array<{
        amount: { amountMicros: number };
      }>,
    ): number => {
      if (!lineItems || lineItems.length === 0) {
        return 0;
      }

      return lineItems.reduce(
        (sum, item) => sum + (item.amount?.amountMicros || 0),
        0,
      );
    },
    [],
  );

  /**
   * 计算税金
   * 公式：taxAmount = subtotal × (taxRate/100)
   *
   * @param subtotalMicros - 小计（微单位）
   * @param taxRate - 税率百分比（例如：5 表示 5%）
   * @returns 税金（微单位）
   */
  const calculateTaxAmount = useCallback(
    (subtotalMicros: number, taxRate: number = 0): number => {
      if (!subtotalMicros || !taxRate) {
        return 0;
      }

      // 确保 taxRate 在合理范围内（0-100）
      const validTaxRate = Math.max(0, Math.min(100, taxRate));

      const taxAmountMicros = Math.round((subtotalMicros * validTaxRate) / 100);

      return taxAmountMicros;
    },
    [],
  );

  /**
   * 计算总计
   * 公式：total = subtotal + taxAmount
   *
   * @param subtotalMicros - 小计（微单位）
   * @param taxAmountMicros - 税金（微单位）
   * @returns 总计（微单位）
   */
  const calculateQuoteTotal = useCallback(
    (subtotalMicros: number, taxAmountMicros: number = 0): number => {
      return subtotalMicros + taxAmountMicros;
    },
    [],
  );

  /**
   * 一次性计算报价单的所有金额
   *
   * @param lineItems - 报价项目列表
   * @param taxRate - 税率百分比
   * @returns 包含 subtotal、taxAmount、total 的对象
   */
  const calculateQuoteAmounts = useCallback(
    (
      lineItems: Array<{
        amount: { amountMicros: number };
      }>,
      taxRate: number = 0,
    ): {
      subtotalMicros: number;
      taxAmountMicros: number;
      totalMicros: number;
    } => {
      const subtotalMicros = calculateQuoteSubtotal(lineItems);
      const taxAmountMicros = calculateTaxAmount(subtotalMicros, taxRate);
      const totalMicros = calculateQuoteTotal(subtotalMicros, taxAmountMicros);

      return {
        subtotalMicros,
        taxAmountMicros,
        totalMicros,
      };
    },
    [calculateQuoteSubtotal, calculateTaxAmount, calculateQuoteTotal],
  );

  /**
   * 将微单位转换为标准货币单位（用于显示）
   *
   * @param amountMicros - 金额（微单位）
   * @returns 金额（标准单位）
   */
  const microsToAmount = useCallback((amountMicros: number): number => {
    return amountMicros / 1000000;
  }, []);

  /**
   * 将标准货币单位转换为微单位（用于存储）
   *
   * @param amount - 金额（标准单位）
   * @returns 金额（微单位）
   */
  const amountToMicros = useCallback((amount: number): number => {
    return Math.round(amount * 1000000);
  }, []);

  return {
    calculateLineItemAmount,
    calculateQuoteSubtotal,
    calculateTaxAmount,
    calculateQuoteTotal,
    calculateQuoteAmounts,
    microsToAmount,
    amountToMicros,
  };
};
