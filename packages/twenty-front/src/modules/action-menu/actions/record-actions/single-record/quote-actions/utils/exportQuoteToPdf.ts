import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { QuotePDFTemplate } from '../templates/QuotePDFTemplate';

type QuoteLineItemData = {
  id: string;
  productName: string;
  description?: string | null;
  quantity: number;
  unitPrice: {
    amountMicros: number;
  };
  discount?: number | null;
  amount: {
    amountMicros: number;
  };
};

type QuoteData = {
  quoteNumber: string;
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
  issueDate: string;
  validUntil: string;
  subtotal: {
    amountMicros: number;
  };
  taxRate?: number | null;
  taxAmount?: {
    amountMicros: number;
  } | null;
  total: {
    amountMicros: number;
  };
  status: string;
  terms?: string | null;
  notes?: string | null;
};

type ExportQuoteToPdfOptions = {
  quote: QuoteData;
  lineItems: QuoteLineItemData[];
  companyLogoUrl?: string;
  language?: 'zh' | 'en';
};

/**
 * 导出报价单为 PDF 文件
 * 
 * 功能：
 * - 生成专业格式的报价单 PDF
 * - 支持中英文双语
 * - 支持公司 Logo
 * - 自动下载文件
 * 
 * @param options - 导出选项
 * @param options.quote - 报价单数据
 * @param options.lineItems - 报价项目列表
 * @param options.companyLogoUrl - 公司 Logo URL（可选）
 * @param options.language - 语言（'zh' 或 'en'，默认 'zh'）
 * 
 * @example
 * ```typescript
 * await exportQuoteToPdf({
 *   quote: quoteData,
 *   lineItems: lineItemsData,
 *   companyLogoUrl: 'https://example.com/logo.png',
 *   language: 'zh'
 * });
 * ```
 */
export const exportQuoteToPdf = async ({
  quote,
  lineItems,
  companyLogoUrl,
  language = 'zh',
}: ExportQuoteToPdfOptions): Promise<void> => {
  try {
    // 生成 PDF 文档
    const document = QuotePDFTemplate({
      quote,
      lineItems,
      companyLogoUrl,
      language,
    });

    // 将 React 组件渲染为 PDF Blob
    const blob = await pdf(document).toBlob();

    // 生成文件名：Quote-Q-2025-001.pdf
    const fileName = `Quote-${quote.quoteNumber}.pdf`;

    // 触发浏览器下载
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error exporting quote to PDF:', error);
    throw new Error('Failed to export quote to PDF');
  }
};

/**
 * 验证报价单数据是否完整
 * 
 * @param quote - 报价单数据
 * @returns 是否有效
 */
export const validateQuoteData = (quote: QuoteData): boolean => {
  return !!(
    quote.quoteNumber &&
    quote.title &&
    quote.issueDate &&
    quote.validUntil &&
    quote.subtotal &&
    quote.total
  );
};

/**
 * 获取报价单预览 URL（用于在新标签页打开）
 * 
 * @param options - 导出选项
 * @returns Blob URL
 */
export const getQuotePdfBlobUrl = async ({
  quote,
  lineItems,
  companyLogoUrl,
  language = 'zh',
}: ExportQuoteToPdfOptions): Promise<string> => {
  try {
    // 懒加载 PDF 相关模块
    const [{ pdf }, { QuotePDFTemplate }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../templates/QuotePDFTemplate'),
    ]);

    const document = QuotePDFTemplate({
      quote,
      lineItems,
      companyLogoUrl,
      language,
    });

    const blob = await pdf(document).toBlob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating quote PDF preview:', error);
    throw new Error('Failed to generate quote PDF preview');
  }
};

