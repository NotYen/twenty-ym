/* eslint-disable no-console */
import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { useQuoteCalculations } from '@/object-record/hooks/useQuoteCalculations';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { isDefined } from 'twenty-shared/utils';

type CurrencyValue = {
  amountMicros: number | null;
  currencyCode: string | null;
};

type SalesQuoteTaxCalculationEffectProps = {
  recordId: string;
};

type CurrencyAmount = {
  amountMicros: number;
  currencyCode: string;
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

  // 監聽總計（zongJi）
  const total = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'zongJi' }),
  ) as CurrencyValue | null; //Ori commit
  //) as CurrencyAmount | undefined; //KantCommit,but conflict

  // 監聽稅率（shuiLu）
  const taxRate = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'shuiLu' }),
  ) as number | null; //Ori commit
  //) as number | undefined; //KantCommit,but conflict

  const [lastCalculatedTax, setLastCalculatedTax] = useState<number | null>(
    null,
  );

  useEffect(() => {
    console.log('[SalesQuoteTaxCalculation] Effect triggered', {
      recordId,
      total,
      taxRate,
    });

    // 檢查：總計和稅率必須都存在
    if (
      !isDefined(total?.amountMicros) ||
      !isDefined(total?.currencyCode) ||
      !isDefined(taxRate)
    ) {
      console.log(
        '[SalesQuoteTaxCalculation] Skipped: missing total or taxRate',
        {
          hasTotal: isDefined(total?.amountMicros),
          hasTaxRate: isDefined(taxRate),
          hasCurrencyCode: isDefined(total?.currencyCode),
        },
      );
      return;
    }

    // 檢查：稅率必須大於 0
    if (taxRate <= 0) {
      console.log('[SalesQuoteTaxCalculation] Skipped: taxRate <= 0', {
        taxRate,
      });
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
      lastCalculatedTax,
    });

    // 防止重複更新：如果計算結果與上次相同，跳過
    if (calculatedTaxAmountMicros === lastCalculatedTax) {
      console.log(
        '[SalesQuoteTaxCalculation] Skipped: same as last calculation',
      );
      return;
    }

    setLastCalculatedTax(calculatedTaxAmountMicros);

    console.log('[SalesQuoteTaxCalculation] Updating shuiJin field', {
      amountMicros: calculatedTaxAmountMicros,
      currencyCode: total.currencyCode,
    });

    // 只更新稅金字段（總計已經存在，不需要重新計算）
    updateOneRecord?.({
      idToUpdate: recordId,
      updateOneRecordInput: {
        shuiJin: {
          amountMicros: calculatedTaxAmountMicros,
          currencyCode: total.currencyCode,
        },
      },
    });
  }, [
    total,
    taxRate,
    recordId,
    updateOneRecord,
    calculateTaxAmount,
    lastCalculatedTax,
  ]);

  return null;
};
