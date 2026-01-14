import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useQuoteCalculations } from '@/object-record/hooks/useQuoteCalculations';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useRecoilValue } from 'recoil';
import { isDefined } from 'twenty-shared/utils';
import { logDebug } from '~/utils/logDebug';
import { logError } from '~/utils/logError';
import { exportQuoteToPdf } from '../utils/exportQuoteToPdf';

// Rich Text 欄位的結構（如 jiaoYiTiaoJian）
type RichTextField = {
  __typename?: string;
  blocknote?: string;
  markdown?: string;
} | string | null;

type QuoteRecord = ObjectRecord & {
  baoJiaDanHao: string;
  mingCheng: string;
  company?: {
    name: string;
  } | null;
  contact?: {
    name: {
      firstName: string;
      lastName: string;
    };
  } | null;
  baoJiaRiQi: string;
  jieZhiRiQi: string;
  xiaoJi: {
    amountMicros: number;
    currencyCode: string;
  };
  shuiLu?: number | null;
  shuiJin?: {
    amountMicros: number;
    currencyCode: string;
  } | null;
  zongJi: {
    amountMicros: number;
    currencyCode: string;
  };
  baoJiaDanZhuangTai: string;
  jiaoYiTiaoJian?: RichTextField;
};

/**
 * 從 Rich Text 欄位提取純文字內容
 * Rich Text 欄位可能是物件 {__typename, blocknote, markdown} 或字串
 */
const extractTextFromRichTextField = (field: RichTextField): string | null => {
  if (!field) return null;

  // 如果已經是字串，直接返回
  if (typeof field === 'string') return field;

  // 如果是物件，優先使用 markdown，其次 blocknote
  if (typeof field === 'object') {
    if (field.markdown) return field.markdown;
    if (field.blocknote) {
      // blocknote 是 JSON 格式，嘗試提取文字
      try {
        const blocks = JSON.parse(field.blocknote);
        // 簡單提取所有文字內容
        const extractText = (obj: unknown): string => {
          if (typeof obj === 'string') return obj;
          if (Array.isArray(obj)) return obj.map(extractText).join('');
          if (typeof obj === 'object' && obj !== null) {
            const record = obj as Record<string, unknown>;
            if (record.text) return String(record.text);
            if (record.content) return extractText(record.content);
            if (record.children) return extractText(record.children);
            return Object.values(record).map(extractText).join('');
          }
          return '';
        };
        return extractText(blocks) || null;
      } catch {
        return null;
      }
    }
  }

  return null;
};

type QuoteLineItemRecord = ObjectRecord & {
  chanPinMingCheng: string;
  baoJiaDanXiXiangMiaoShu?: string | null;
  shuLiang: number;
  danJia: {
    amountMicros: number;
    currencyCode: string;
  };
  zheKou?: number | null;
  jinE: {
    amountMicros: number;
    currencyCode: string;
  };
};

const normalizeTaxRate = (value?: number | null): number => {
  if (!value || Number.isNaN(Number(value))) {
    return 0;
  }

  const numericValue = Number(value);

  if (numericValue <= 0) {
    return 0;
  }

  return numericValue > 1 ? numericValue / 100 : numericValue;
};

const formatTaxRateForDisplay = (value?: number | null): number => {
  if (!value || Number.isNaN(Number(value))) {
    return 0;
  }

  const numericValue = Number(value);

  if (numericValue <= 0) {
    return 0;
  }

  return numericValue > 1 ? numericValue : numericValue * 100;
};

const resolveCurrencyCode = ({
  quote,
  lineItems,
}: {
  quote: QuoteRecord;
  lineItems: QuoteLineItemRecord[] | undefined;
}): string => {
  if (isDefined(quote.xiaoJi?.currencyCode)) {
    return quote.xiaoJi.currencyCode;
  }

  if (isDefined(quote.zongJi?.currencyCode)) {
    return quote.zongJi.currencyCode;
  }

  if (isDefined(quote.shuiJin?.currencyCode)) {
    return quote.shuiJin.currencyCode;
  }

  const firstLineItemCurrency = lineItems?.find((item) =>
    isDefined(item?.danJia?.currencyCode),
  )?.danJia?.currencyCode;

  if (isDefined(firstLineItemCurrency)) {
    return firstLineItemCurrency;
  }

  return 'USD';
};

export const ExportQuoteToPdfSingleRecordAction = () => {
  const recordId = useSelectedRecordIdOrThrow();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  const { calculateLineItemAmount, calculateQuoteAmounts } =
    useQuoteCalculations();

  // 获取 Quote 记录
  const selectedQuote = useRecoilValue(
    recordStoreFamilyState(recordId),
  ) as QuoteRecord;

  // 查询 QuoteLineItem 记录
  const { records: lineItems } = useFindManyRecords<QuoteLineItemRecord>({
    objectNameSingular: 'salesQuoteLineItem',
    filter: { salesQuoteId: { eq: recordId } },
    skip: !recordId,
  });

  const handleClick = async () => {
    logDebug('=== PDF Export Debug ===');
    logDebug('1. Selected Quote:', selectedQuote);
    logDebug('2. Line Items:', lineItems);
    logDebug('3. Record ID:', recordId);

    if (!selectedQuote) {
      logError('Error: selectedQuote is null or undefined');
      enqueueErrorSnackBar({ message: '無法找到報價單數據' });
      return;
    }

    logDebug('4. Quote Number:', selectedQuote.baoJiaDanHao);
    logDebug('5. Title:', selectedQuote.mingCheng);
    logDebug('6. Issue Date:', selectedQuote.baoJiaRiQi);
    logDebug('7. Valid Until:', selectedQuote.jieZhiRiQi);
    logDebug('8. Subtotal:', selectedQuote.xiaoJi);
    logDebug('9. Total:', selectedQuote.zongJi);

    // 验证必填字段并收集缺失字段信息
    const missingFields: string[] = [];

    if (!selectedQuote.baoJiaDanHao) missingFields.push('報價單編號');
    if (!selectedQuote.mingCheng) missingFields.push('標題');
    if (!selectedQuote.baoJiaRiQi) missingFields.push('報價日期');
    if (!selectedQuote.jieZhiRiQi) missingFields.push('有效期至');
    if (!selectedQuote.xiaoJi) missingFields.push('小計');
    if (!selectedQuote.zongJi) missingFields.push('總計');

    if (missingFields.length > 0) {
      const missingFieldsList = missingFields.join('、');
      logError(`Error: Missing required fields: ${missingFields.join(', ')}`);
      enqueueErrorSnackBar({
        message: `報價單數據不完整，請填寫以下必填欄位：${missingFieldsList}`,
      });
      return;
    }

    // 显示加载提示（首次加载 PDF 模块需要时间）
    enqueueSuccessSnackBar({ message: '正在生成 PDF，請稍候...' });

    try {
      logDebug('10. Preparing PDF data...');

      const currencyCode = resolveCurrencyCode({
        quote: selectedQuote,
        lineItems,
      });

      const normalizedLineItems = (lineItems || []).map((item) => {
        const quantity = Number(item.shuLiang ?? 0);
        const unitPriceMicros = item.danJia?.amountMicros ?? 0;
        const discount = Number(item.zheKou ?? 0);
        const calculatedAmountMicros = calculateLineItemAmount(
          quantity,
          unitPriceMicros,
          discount,
        );

        return {
          id: item.id,
          productName: item.chanPinMingCheng,
          description: item.baoJiaDanXiXiangMiaoShu,
          quantity,
          unitPrice: item.danJia,
          discount,
          amount: {
            amountMicros: calculatedAmountMicros,
          },
        };
      });

      const hasLineItems = normalizedLineItems.length > 0;

      const rawTaxRate = selectedQuote.shuiLu ?? 0;
      const normalizedTaxRate = normalizeTaxRate(rawTaxRate);
      const displayTaxRate = formatTaxRateForDisplay(rawTaxRate);

      const recalculatedTotals = calculateQuoteAmounts(
        normalizedLineItems.map((item) => ({
          amount: {
            amountMicros: item.amount.amountMicros,
          },
        })),
        normalizedTaxRate,
      );

      const subtotalMicros = hasLineItems
        ? recalculatedTotals.subtotalMicros
        : (selectedQuote.xiaoJi?.amountMicros ?? 0);

      const taxAmountMicros = hasLineItems
        ? recalculatedTotals.taxAmountMicros
        : (selectedQuote.shuiJin?.amountMicros ?? 0);

      const totalMicros = hasLineItems
        ? recalculatedTotals.totalMicros
        : (selectedQuote.zongJi?.amountMicros ?? 0);

      const pdfData = {
        quote: {
          quoteNumber: selectedQuote.baoJiaDanHao,
          title: selectedQuote.mingCheng,
          company: selectedQuote.company,
          contact: selectedQuote.contact,
          issueDate: selectedQuote.baoJiaRiQi,
          validUntil: selectedQuote.jieZhiRiQi,
          subtotal: {
            amountMicros: subtotalMicros,
            currencyCode,
          },
          taxRate: displayTaxRate,
          taxAmount: {
            amountMicros: taxAmountMicros,
            currencyCode,
          },
          total: {
            amountMicros: totalMicros,
            currencyCode,
          },
          status: selectedQuote.baoJiaDanZhuangTai,
          terms: extractTextFromRichTextField(selectedQuote.jiaoYiTiaoJian),
        },
        lineItems: normalizedLineItems,
        language: 'zh' as const,
      };
      logDebug('11. PDF Data:', pdfData);

      logDebug('12. Calling exportQuoteToPdf...');
      await exportQuoteToPdf(pdfData);

      logDebug('13. PDF export successful!');
      enqueueSuccessSnackBar({ message: 'PDF 已成功導出' });
    } catch (error) {
      logError('PDF Export Error');
      logError({
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      enqueueErrorSnackBar({ message: 'PDF 導出失敗，請稍後再試' });
    }
  };

  return <Action onClick={handleClick} />;
};
