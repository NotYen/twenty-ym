/* eslint-disable no-console */
import { useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useQuoteCalculations } from '@/object-record/hooks/useQuoteCalculations';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { isDefined } from 'twenty-shared/utils';

type SalesQuoteTaxCalculationEffectProps = {
  recordId: string;
};

// 報價單稅金自動計算組件
// 當用戶修改小計或稅率時，自動計算稅金和總計
export const SalesQuoteTaxCalculationEffect = ({
  recordId,
}: SalesQuoteTaxCalculationEffectProps) => {
  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: 'salesquote',
  });

  const { calculateTaxAmount } = useQuoteCalculations();

  // 監聽總計（total）
  const total = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'total' }),
  );

  // 監聽稅率（taxrate）
  const taxRate = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'taxrate' }),
  );

  // 防止無限循環：記錄上次計算的稅金值
  const lastCalculatedTaxRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('[SalesQuoteTaxCalculation] Effect triggered', {
      recordId,
      total,
      taxRate,
    });

    // 檢查：總計和稅率必須都存在
    if (!isDefined(total?.amountMicros) || !isDefined(taxRate)) {
      console.log('[SalesQuoteTaxCalculation] Skipped: missing total or taxRate', {
        hasTotal: isDefined(total?.amountMicros),
        hasTaxRate: isDefined(taxRate),
      });
      return;
    }

    // 檢查：稅率必須大於 0
    if (taxRate <= 0) {
      console.log('[SalesQuoteTaxCalculation] Skipped: taxRate <= 0', { taxRate });
      return;
    }

    // 計算稅金（微單位）
    // 公式：稅金 = 總計 × 稅率 / 100
    const calculatedTaxAmountMicros = calculateTaxAmount(
      total.amountMicros,
      taxRate,
    );

    console.log('[SalesQuoteTaxCalculation] Calculated tax', {
      totalMicros: total.amountMicros,
      taxRate,
      calculatedTaxMicros: calculatedTaxAmountMicros,
      lastCalculatedTax: lastCalculatedTaxRef.current,
    });

    // 防止重複更新：如果計算結果與上次相同，跳過
    if (calculatedTaxAmountMicros === lastCalculatedTaxRef.current) {
      console.log('[SalesQuoteTaxCalculation] Skipped: same as last calculation');
      return;
    }

    // 記錄這次計算的值
    lastCalculatedTaxRef.current = calculatedTaxAmountMicros;

    console.log('[SalesQuoteTaxCalculation] Updating taxamount field', {
      amountMicros: calculatedTaxAmountMicros,
      currencyCode: total.currencyCode,
    });

    // 只更新稅金字段（總計已經存在，不需要重新計算）
    updateOneRecord?.({
      idToUpdate: recordId,
      updateOneRecordInput: {
        taxamount: {
          amountMicros: calculatedTaxAmountMicros,
          currencyCode: total.currencyCode,
        },
      },
    });
  }, [total, taxRate, recordId, updateOneRecord, calculateTaxAmount]);

  return null;
};

