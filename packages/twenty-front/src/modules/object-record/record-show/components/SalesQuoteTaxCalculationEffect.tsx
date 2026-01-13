import { useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';

import { useQuoteCalculations } from '@/object-record/hooks/useQuoteCalculations';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { isDefined } from 'twenty-shared/utils';
import { logDebug } from '~/utils/logDebug';

type CurrencyValue = {
  amountMicros: number | null;
  currencyCode: string | null;
};

type SalesQuoteTaxCalculationEffectProps = {
  recordId: string;
};

// 報價單自動計算組件
// 當用戶修改「小計」或「稅率」時，自動計算「稅額」和「總計」
// 公式：
//   稅額 = 小計 × 稅率
//   總計 = 小計 + 稅額
export const SalesQuoteTaxCalculationEffect = ({
  recordId,
}: SalesQuoteTaxCalculationEffectProps) => {
  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: 'salesQuote',
  });

  const { calculateTaxAmount, calculateQuoteTotal } = useQuoteCalculations();

  // 監聽小計（xiaoJi）
  const subtotal = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'xiaoJi' }),
  ) as CurrencyValue | null;

  // 監聽稅率（shuiLu）
  const taxRate = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'shuiLu' }),
  ) as number | null;

  // 使用 ref 追蹤上次計算結果，避免重複更新
  const lastCalculationRef = useRef<{
    taxAmountMicros: number;
    totalMicros: number;
  } | null>(null);

  useEffect(() => {
    logDebug('[SalesQuoteTaxCalculation] Effect triggered', {
      recordId,
      subtotal,
      taxRate,
    });

    // 檢查：小計必須存在
    if (
      !isDefined(subtotal?.amountMicros) ||
      !isDefined(subtotal?.currencyCode)
    ) {
      logDebug('[SalesQuoteTaxCalculation] Skipped: missing subtotal', {
        hasSubtotal: isDefined(subtotal?.amountMicros),
        hasCurrencyCode: isDefined(subtotal?.currencyCode),
      });
      return;
    }

    // 小計為 0 時，稅額和總計都應該是 0
    const subtotalMicros = subtotal.amountMicros;

    // 稅率可以是 0 或 null，這種情況下稅額為 0
    const effectiveTaxRate = taxRate ?? 0;

    // 計算稅額（微單位）
    // 公式：稅額 = 小計 × 稅率
    const calculatedTaxAmountMicros = calculateTaxAmount(
      subtotalMicros,
      effectiveTaxRate,
    );

    // 計算總計（微單位）
    // 公式：總計 = 小計 + 稅額
    const calculatedTotalMicros = calculateQuoteTotal(
      subtotalMicros,
      calculatedTaxAmountMicros,
    );

    logDebug('[SalesQuoteTaxCalculation] Calculated values', {
      subtotalMicros,
      taxRate: effectiveTaxRate,
      calculatedTaxAmountMicros,
      calculatedTotalMicros,
    });

    // 防止重複更新：如果計算結果與上次相同，跳過
    if (
      lastCalculationRef.current?.taxAmountMicros ===
        calculatedTaxAmountMicros &&
      lastCalculationRef.current?.totalMicros === calculatedTotalMicros
    ) {
      logDebug('[SalesQuoteTaxCalculation] Skipped: same as last calculation');
      return;
    }

    // 更新 ref
    lastCalculationRef.current = {
      taxAmountMicros: calculatedTaxAmountMicros,
      totalMicros: calculatedTotalMicros,
    };

    logDebug('[SalesQuoteTaxCalculation] Updating shuiJin and zongJi fields', {
      shuiJin: calculatedTaxAmountMicros,
      zongJi: calculatedTotalMicros,
      currencyCode: subtotal.currencyCode,
    });

    // 同時更新稅額和總計
    updateOneRecord?.({
      idToUpdate: recordId,
      updateOneRecordInput: {
        shuiJin: {
          amountMicros: calculatedTaxAmountMicros,
          currencyCode: subtotal.currencyCode,
        },
        zongJi: {
          amountMicros: calculatedTotalMicros,
          currencyCode: subtotal.currencyCode,
        },
      },
    });
  }, [
    subtotal,
    taxRate,
    recordId,
    updateOneRecord,
    calculateTaxAmount,
    calculateQuoteTotal,
  ]);

  return null;
};
