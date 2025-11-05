import { useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { isDefined } from 'twenty-shared/utils';

type CurrencyValue = {
  amountMicros: number;
  currencyCode: string;
};

type SalesQuoteTaxCalculationRowEffectProps = {
  recordId: string;
};

// 為單個報價單記錄自動計算稅金（用於列表頁面的每一行）
// 設計理念：類似 ListenRecordUpdatesEffect，在 RecordTableRow 層級監聽變化
export const SalesQuoteTaxCalculationRowEffect = ({
  recordId,
}: SalesQuoteTaxCalculationRowEffectProps) => {
  console.log(
    `[SalesQuoteTaxCalculationRowEffect] Component mounted for recordId: ${recordId}`,
  );

  const { updateOneRecord } = useUpdateOneRecord({
    objectNameSingular: 'salesquote',
  });

  // 監聽總計（zongJi）
  const total = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'zongJi' }),
  ) as CurrencyValue | null;

  // 監聽稅率（shuiLu）
  const taxRate = useRecoilValue(
    recordStoreFamilySelector({ recordId, fieldName: 'shuiLu' }),
  ) as number | null;

  // 記錄最後計算的稅金，避免無限循環
  const lastCalculatedTaxRef = useRef<number | null>(null);

  useEffect(() => {
    console.log(
      `[SalesQuoteTaxCalculationRowEffect] recordId: ${recordId}`,
      { total, taxRate },
    );

    // 確保 total 和 taxRate 都有值（使用可選鏈避免錯誤）
    if (
      !isDefined(total?.amountMicros) ||
      !isDefined(total?.currencyCode) ||
      !isDefined(taxRate)
    ) {
      console.log(
        `[SalesQuoteTaxCalculationRowEffect] Skipped: missing data`,
        {
          hasTotal: isDefined(total),
          hasTaxRate: isDefined(taxRate),
          hasAmountMicros: isDefined(total?.amountMicros),
          hasCurrencyCode: isDefined(total?.currencyCode),
        },
      );
      return;
    }

    // 計算稅金金額（micros）
    // 注意：taxRate 在 Twenty CRM 中儲存為小數（5% = 0.05），不需要再除以 100
    const calculatedTaxAmountMicros = Math.round(
      total.amountMicros * taxRate,
    );

    console.log(`[SalesQuoteTaxCalculationRowEffect] Calculated:`, {
      totalMicros: total.amountMicros,
      taxRate,
      calculatedTaxMicros: calculatedTaxAmountMicros,
      lastCalculatedTax: lastCalculatedTaxRef.current,
    });

    // 檢查是否與上次計算結果相同，避免無限循環
    if (lastCalculatedTaxRef.current === calculatedTaxAmountMicros) {
      console.log(`[SalesQuoteTaxCalculationRowEffect] Skipped: same as last`);
      return;
    }

    // 記錄本次計算結果
    lastCalculatedTaxRef.current = calculatedTaxAmountMicros;

    console.log(
      `[SalesQuoteTaxCalculationRowEffect] Updating tax for record ${recordId}`,
    );

    // 只更新稅金字段
    updateOneRecord?.({
      idToUpdate: recordId,
      updateOneRecordInput: {
        shuiJin: {
          amountMicros: calculatedTaxAmountMicros,
          currencyCode: total.currencyCode,
        },
      },
    });
  }, [total, taxRate, updateOneRecord, recordId]);

  return null;
};

