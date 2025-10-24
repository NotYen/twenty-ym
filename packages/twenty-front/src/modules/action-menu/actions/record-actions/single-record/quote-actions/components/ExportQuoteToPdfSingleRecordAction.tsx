import { Action } from '@/action-menu/actions/components/Action';
import { useSelectedRecordIdOrThrow } from '@/action-menu/actions/record-actions/single-record/hooks/useSelectedRecordIdOrThrow';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useRecoilValue } from 'recoil';
import { exportQuoteToPdf } from '../utils/exportQuoteToPdf';

type QuoteRecord = ObjectRecord & {
  quotenumber: string;
  title: string;
  company?: {
    name: string;
  } | null;
  contact?: {
    name: {
      firstName: string;
      lastName: string;
    };
  } | null;
  issuedate: string;
  validuntil: string;
  subtotal: {
    amountMicros: number;
  };
  taxrate?: number | null;
  taxamount?: {
    amountMicros: number;
  } | null;
  total: {
    amountMicros: number;
  };
  status: string;
  terms?: string | null;
  notes?: string | null;
};

type QuoteLineItemRecord = ObjectRecord & {
  productname: string;
  description?: string | null;
  quantity: number;
  unitprice: {
    amountMicros: number;
  };
  discount?: number | null;
  amount: {
    amountMicros: number;
  };
};

export const ExportQuoteToPdfSingleRecordAction = () => {
  const recordId = useSelectedRecordIdOrThrow();
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();

  // 获取 Quote 记录
  const selectedQuote = useRecoilValue(recordStoreFamilyState(recordId)) as QuoteRecord;

  // 查询 QuoteLineItem 记录
  const { records: lineItems } = useFindManyRecords<QuoteLineItemRecord>({
    objectNameSingular: 'salesquotelineitem',
    filter: { salesquoteId: { eq: recordId } },
    skip: !recordId,
  });

  const handleClick = async () => {
    console.log('=== PDF Export Debug ===');
    console.log('1. Selected Quote:', selectedQuote);
    console.log('2. Line Items:', lineItems);
    console.log('3. Record ID:', recordId);

    if (!selectedQuote) {
      console.error('Error: selectedQuote is null or undefined');
      enqueueErrorSnackBar('無法找到報價單數據');
      return;
    }

    console.log('4. Quote Number:', selectedQuote.quotenumber);
    console.log('5. Title:', selectedQuote.title);
    console.log('6. Issue Date:', selectedQuote.issuedate);
    console.log('7. Valid Until:', selectedQuote.validuntil);

    // 验证必填字段
    if (
      !selectedQuote.quotenumber ||
      !selectedQuote.title ||
      !selectedQuote.issuedate ||
      !selectedQuote.validuntil
    ) {
      console.error('Error: Missing required fields');
      enqueueErrorSnackBar('報價單數據不完整，請檢查必填字段');
      return;
    }

    // 显示加载提示（首次加载 PDF 模块需要时间）
    enqueueSuccessSnackBar('正在生成 PDF，請稍候...');

    try {
      console.log('8. Preparing PDF data...');
      const pdfData = {
        quote: {
          quoteNumber: selectedQuote.quotenumber,
          title: selectedQuote.title,
          company: selectedQuote.company,
          contact: selectedQuote.contact,
          issueDate: selectedQuote.issuedate,
          validUntil: selectedQuote.validuntil,
          subtotal: selectedQuote.subtotal,
          taxRate: selectedQuote.taxrate,
          taxAmount: selectedQuote.taxamount,
          total: selectedQuote.total,
          status: selectedQuote.status,
          terms: selectedQuote.terms,
          notes: selectedQuote.notes,
        },
        lineItems: (lineItems || []).map((item) => ({
          id: item.id,
          productName: item.productname,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitprice,
          discount: item.discount,
          amount: item.amount,
        })),
        language: 'zh',
      };
      console.log('9. PDF Data:', pdfData);

      console.log('10. Calling exportQuoteToPdf...');
      await exportQuoteToPdf(pdfData);

      console.log('11. PDF export successful!');
      enqueueSuccessSnackBar('PDF 已成功導出');
    } catch (error) {
      console.error('PDF Export Error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      enqueueErrorSnackBar('PDF 導出失敗，請稍後再試');
    }
  };

  return <Action onClick={handleClick} />;
};

