import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

// 注册 Noto Sans SC 字体（支持简体和繁体中文）
// 使用项目 public 目录中的本地字体文件
Font.register({
  family: 'Noto Sans SC',
  src: '/fonts/NotoSansSC-Regular.ttf',
});

// PDF 样式定义
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans SC',
    padding: 40,
    fontSize: 10,
    color: '#333333',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #4a5568',
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 120,
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  logo: {
    maxWidth: 120,
    maxHeight: 50,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 8,
  },
  quoteNumber: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 10,
    borderBottom: '1 solid #e2e8f0',
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    width: 100,
    fontSize: 10,
    color: '#718096',
    fontWeight: 700,
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: '#2d3748',
  },
  table: {
    marginTop: 15,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a5568',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e2e8f0',
    padding: 8,
    minHeight: 35,
  },
  tableRowEven: {
    backgroundColor: '#f7fafc',
  },
  tableCol1: {
    width: '35%',
    paddingRight: 5,
  },
  tableCol2: {
    width: '15%',
    textAlign: 'right',
    paddingRight: 5,
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 5,
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
    paddingRight: 5,
  },
  tableCol5: {
    width: '15%',
    textAlign: 'right',
  },
  tableCellText: {
    fontSize: 9,
    color: '#2d3748',
  },
  tableCellDescription: {
    fontSize: 8,
    color: '#718096',
    marginTop: 2,
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: '#4a5568',
  },
  totalValue: {
    fontSize: 11,
    color: '#2d3748',
    fontWeight: 700,
  },
  grandTotalRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    backgroundColor: '#4a5568',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 700,
  },
  grandTotalValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 700,
  },
  termsSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f7fafc',
    borderRadius: 4,
    borderLeft: '3 solid #4a5568',
  },
  termsText: {
    fontSize: 9,
    color: '#4a5568',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#a0aec0',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 700,
    color: '#ffffff',
  },
});

// 状态颜色映射
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#718096',
  SENT: '#3182ce',
  ACCEPTED: '#38a169',
  REJECTED: '#e53e3e',
  EXPIRED: '#dd6b20',
};

// 状态标签映射
const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  DRAFT: { zh: '草稿', en: 'Draft' },
  SENT: { zh: '已發送', en: 'Sent' },
  ACCEPTED: { zh: '已接受', en: 'Accepted' },
  REJECTED: { zh: '已拒絕', en: 'Rejected' },
  EXPIRED: { zh: '已過期', en: 'Expired' },
};

// 格式化货币
const formatCurrency = (amountMicros: number | null | undefined): string => {
  if (amountMicros === null || amountMicros === undefined) {
    return '$0.00';
  }
  const amount = amountMicros / 1000000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// 格式化日期
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 类型定义
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

type QuotePDFTemplateProps = {
  quote: QuoteData;
  lineItems: QuoteLineItemData[];
  companyLogoUrl?: string;
  language?: 'zh' | 'en';
};

export const QuotePDFTemplate = ({
  quote,
  lineItems,
  companyLogoUrl,
  language = 'zh',
}: QuotePDFTemplateProps) => {
  const t = {
    zh: {
      quotation: '報價單',
      quotationEn: 'QUOTATION',
      quoteNo: '編號',
      customer: '客戶信息',
      company: '公司名稱',
      contact: '聯絡人',
      issueDate: '開立日期',
      validUntil: '有效期限',
      items: '報價項目',
      product: '產品/服務',
      quantity: '數量',
      unitPrice: '單價',
      discount: '折扣',
      amount: '金額',
      subtotal: '小計',
      tax: '稅金',
      total: '總計',
      terms: '條款說明',
      notes: '備註',
      generatedOn: '生成日期',
    },
    en: {
      quotation: 'Quotation',
      quotationEn: '',
      quoteNo: 'Quote No.',
      customer: 'Customer Information',
      company: 'Company',
      contact: 'Contact',
      issueDate: 'Issue Date',
      validUntil: 'Valid Until',
      items: 'Quote Items',
      product: 'Product/Service',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      discount: 'Discount',
      amount: 'Amount',
      subtotal: 'Subtotal',
      tax: 'Tax',
      total: 'Total',
      terms: 'Terms & Conditions',
      notes: 'Notes',
      generatedOn: 'Generated On',
    },
  };

  const labels = t[language];
  const statusColor = STATUS_COLORS[quote.status] || '#718096';
  const statusLabel = STATUS_LABELS[quote.status]?.[language] || quote.status;

  const contactName = quote.contact
    ? `${quote.contact.name.firstName} ${quote.contact.name.lastName}`
    : '-';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>
                {labels.quotation}
                {labels.quotationEn ? ` ${labels.quotationEn}` : ''}
              </Text>
              <Text style={styles.quoteNumber}>
                {labels.quoteNo}: {quote.quoteNumber}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusColor }]}
              >
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </View>
            {companyLogoUrl && (
              <View style={styles.logoContainer}>
                <Image src={companyLogoUrl} style={styles.logo} />
              </View>
            )}
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.customer}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{labels.company}:</Text>
            <Text style={styles.infoValue}>{quote.company?.name || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{labels.contact}:</Text>
            <Text style={styles.infoValue}>{contactName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{labels.issueDate}:</Text>
            <Text style={styles.infoValue}>{formatDate(quote.issueDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{labels.validUntil}:</Text>
            <Text style={styles.infoValue}>{formatDate(quote.validUntil)}</Text>
          </View>
        </View>

        {/* Quote Title */}
        <View style={styles.section}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#2d3748',
              marginBottom: 5,
            }}
          >
            {quote.title}
          </Text>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.items}</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.tableCol1}>
                <Text style={styles.tableHeaderText}>{labels.product}</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text style={styles.tableHeaderText}>{labels.quantity}</Text>
              </View>
              <View style={styles.tableCol3}>
                <Text style={styles.tableHeaderText}>{labels.unitPrice}</Text>
              </View>
              <View style={styles.tableCol4}>
                <Text style={styles.tableHeaderText}>{labels.discount}</Text>
              </View>
              <View style={styles.tableCol5}>
                <Text style={styles.tableHeaderText}>{labels.amount}</Text>
              </View>
            </View>

            {/* Table Rows */}
            {lineItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : {},
                ]}
              >
                <View style={styles.tableCol1}>
                  <Text style={styles.tableCellText}>{item.productName}</Text>
                  {item.description && (
                    <Text style={styles.tableCellDescription}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <View style={styles.tableCol2}>
                  <Text style={styles.tableCellText}>{item.quantity}</Text>
                </View>
                <View style={styles.tableCol3}>
                  <Text style={styles.tableCellText}>
                    {formatCurrency(item.unitPrice.amountMicros)}
                  </Text>
                </View>
                <View style={styles.tableCol4}>
                  <Text style={styles.tableCellText}>
                    {item.discount || 0}%
                  </Text>
                </View>
                <View style={styles.tableCol5}>
                  <Text style={styles.tableCellText}>
                    {formatCurrency(item.amount.amountMicros)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{labels.subtotal}:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(quote.subtotal.amountMicros)}
            </Text>
          </View>
          {quote.taxRate && quote.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {labels.tax} ({quote.taxRate}%):
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quote.taxAmount?.amountMicros || 0)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{labels.total}:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(quote.total.amountMicros)}
            </Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        {quote.terms && (
          <View style={styles.termsSection}>
            <Text
              style={[
                styles.sectionTitle,
                { borderBottom: 'none', marginBottom: 8 },
              ]}
            >
              {labels.terms}
            </Text>
            <Text style={styles.termsText}>{quote.terms}</Text>
          </View>
        )}

        {/* Notes */}
        {quote.notes && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.sectionTitle}>{labels.notes}</Text>
            <Text style={styles.termsText}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {labels.generatedOn}: {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
