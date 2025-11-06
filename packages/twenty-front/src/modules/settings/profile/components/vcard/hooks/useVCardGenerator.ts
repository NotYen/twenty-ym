import { useCallback } from 'react';

import { type VCardData } from '@/settings/profile/components/vcard/types/VCardData';

// vCard 生成器 hook（遵循 Twenty 的 React 架構）
export const useVCardGenerator = () => {
  // 生成 vCard 3.0 格式字串
  const generateVCard = useCallback((data: VCardData): string => {
    // 處理特殊字符轉義（vCard 規範）
    const escapeVCardText = (text: string): string => {
      return text.replace(/[;,\\]/g, '\\$&').replace(/\n/g, '\\n');
    };

    // 組合全名
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    // 生成 vCard 內容（使用 CRLF 行結束符）
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardText(fullName)}`,
      `N:${escapeVCardText(data.lastName)};${escapeVCardText(data.firstName)};;;`,
    ];

    // 新增組織（公司名稱）
    if (data.company) {
      vcardLines.push(`ORG:${escapeVCardText(data.company)}`);
    }

    // 新增職稱
    if (data.jobTitle) {
      vcardLines.push(`TITLE:${escapeVCardText(data.jobTitle)}`);
    }

    // 新增電話
    if (data.phone) {
      vcardLines.push(`TEL;TYPE=WORK,VOICE:${escapeVCardText(data.phone)}`);
    }

    // 新增 Email
    if (data.email) {
      vcardLines.push(`EMAIL;TYPE=INTERNET:${escapeVCardText(data.email)}`);
    }

    vcardLines.push('END:VCARD');

    // 使用 CRLF (\r\n) 符合 vCard 規範
    return vcardLines.join('\r\n');
  }, []);

  // 下載 vCard 檔案
  const downloadVCard = useCallback(
    (vcardString: string, fileName: string) => {
      try {
        // 創建 Blob（使用 UTF-8 編碼支援中文）
        const blob = new Blob([vcardString], {
          type: 'text/vcard;charset=utf-8',
        });

        // 創建下載連結
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.vcf`;

        // 觸發下載
        document.body.appendChild(link);
        link.click();

        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download vCard:', error);
        throw error;
      }
    },
    [],
  );

  return {
    generateVCard,
    downloadVCard,
  };
};

