import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PageLayoutWidgetEntity } from 'src/engine/core-modules/page-layout/entities/page-layout-widget.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { TwentyORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { FieldMetadataType } from 'twenty-shared/types';

import {
    SharedContentDTO,
    SharedContentMetadata,
} from '../dto/shared-content.dto';

import { ShareLinkData } from './share-link.service';

/**
 * 外部內容服務
 * 負責獲取和格式化分享內容，確保資料安全性
 * 實現需求 3.2, 3.3, 3.4, 3.5, 3.6, 6.2, 6.4
 */
@Injectable()
export class ExternalContentService {
  constructor(
    private readonly twentyORMGlobalManager: TwentyORMGlobalManager,
    @InjectRepository(PageLayoutWidgetEntity)
    private readonly pageLayoutWidgetRepository: Repository<PageLayoutWidgetEntity>,
    @InjectRepository(ObjectMetadataEntity)
    private readonly objectMetadataRepository: Repository<ObjectMetadataEntity>,
    @InjectRepository(FieldMetadataEntity)
    private readonly fieldMetadataRepository: Repository<FieldMetadataEntity>,
  ) {}

  /**
   * 根據分享連結獲取內容
   * 實現需求 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 + 嚴格 workspace 隔離
   * 支援所有標準對象和自定義對象（通用邏輯）
   */
  async getContentByShareLink(
    shareLink: ShareLinkData,
  ): Promise<SharedContentDTO> {
    // 從 shareLink 直接獲取 workspaceId，確保 workspace 隔離
    const workspaceId = shareLink.workspaceId;

    if (!workspaceId) {
      throw new NotFoundException(
        'Invalid share link: missing workspace information',
      );
    }

    let content: any;
    let title: string;

    // 圖表分享使用專門的方法
    if (shareLink.resourceType === 'DASHBOARD_CHART') {
      content = await this.getDashboardChartContent(
        shareLink.resourceId,
        workspaceId,
      );
      title = content.title || 'Dashboard Chart';
    } else {
      // 所有表格分享使用通用方法（支援標準對象和自定義對象）
      content = await this.getTableContent(
        shareLink.resourceType,
        shareLink.resourceId,
        workspaceId,
      );
      title = this.getTableTitle(content, shareLink.resourceType);
    }

    const metadata = await this.getContentMetadata(shareLink, workspaceId);

    return {
      resourceType: shareLink.resourceType,
      resourceId: shareLink.resourceId,
      title,
      data: JSON.stringify(content), // 序列化成 JSON 字串
      metadata: JSON.stringify(metadata), // 序列化成 JSON 字串
    };
  }

  /**
   * 通用的表格內容獲取方法
   * 支援所有標準對象和自定義對象
   * 實現需求 3.2, 3.3, 3.4, 3.6, 20.7, 21.2
   */
  private async getTableContent(
    resourceType: string,
    resourceId: string,
    workspaceId: string,
  ): Promise<any> {
    // 1. 根據 resourceType 獲取 objectMetadata
    const objectMetadata = await this.getObjectMetadataByResourceType(
      resourceType,
      workspaceId,
    );

    if (!objectMetadata) {
      throw new NotFoundException('Resource not accessible');
    }

    // 2. 查詢資料
    const repository =
      await this.twentyORMGlobalManager.getRepositoryForWorkspace(
        workspaceId,
        objectMetadata.nameSingular,
        { shouldBypassPermissionChecks: true },
      );

    // 3. 獲取所有關聯欄位
    const relations = this.getRelationsForObject(objectMetadata);

    const record = await repository.findOne({
      where: { id: resourceId },
      relations,
    });

    if (!record) {
      throw new NotFoundException('Resource not accessible');
    }

    // 4. 過濾敏感欄位（通用邏輯）
    const filteredRecord = this.filterSensitiveFields(record, objectMetadata);

    // 5. 返回記錄和 objectMetadata（前端需要用來渲染）
    return {
      ...filteredRecord,
      objectMetadata: {
        nameSingular: objectMetadata.nameSingular,
        namePlural: objectMetadata.namePlural,
        labelSingular: objectMetadata.labelSingular,
        labelPlural: objectMetadata.labelPlural,
        fields: objectMetadata.fields.map((field) => ({
          name: field.name,
          label: field.label,
          type: field.type,
        })),
      },
    };
  }

  /**
   * 根據 resourceType 獲取 objectMetadata
   */
  private async getObjectMetadataByResourceType(
    resourceType: string,
    workspaceId: string,
  ): Promise<ObjectMetadataEntity | null> {
    // resourceType 格式：COMPANY, PERSON, SALES_QUOTE, CUSTOM_OBJECT_XXX
    // 需要轉換為 nameSingular：company, person, salesQuote, customObjectXxx

    // 轉換規則：UPPER_SNAKE_CASE -> camelCase
    const nameSingular = resourceType
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    return await this.objectMetadataRepository.findOne({
      where: { nameSingular, workspaceId },
      relations: ['fields'],
    });
  }

  /**
   * 獲取對象的所有關聯欄位
   */
  private getRelationsForObject(
    objectMetadata: ObjectMetadataEntity,
  ): string[] {
    const relations: string[] = [];

    // 遍歷所有欄位，找出 RELATION 類型的欄位
    for (const field of objectMetadata.fields || []) {
      if (field.type === FieldMetadataType.RELATION) {
        relations.push(field.name);
      }
    }

    return relations;
  }

  /**
   * 過濾敏感欄位（通用邏輯）
   * 只返回安全的公開欄位
   */
  private filterSensitiveFields(
    record: any,
    objectMetadata: ObjectMetadataEntity,
  ): any {
    const filtered: any = {
      id: record.id,
      __typename: objectMetadata.nameSingular,
    };

    // 定義敏感欄位關鍵字（不應該分享給外部用戶）
    const sensitiveKeywords = [
      'password',
      'token',
      'secret',
      'api',
      'internal',
      'private',
      'confidential',
      'deletedAt',
      'createdBy',
      'updatedBy',
    ];

    // 遍歷所有欄位
    for (const field of objectMetadata.fields || []) {
      const fieldName = field.name;
      const fieldValue = record[fieldName];

      // 跳過敏感欄位
      if (
        sensitiveKeywords.some((keyword) =>
          fieldName.toLowerCase().includes(keyword),
        )
      ) {
        continue;
      }

      // 跳過 undefined 或 null 的欄位
      if (fieldValue === undefined || fieldValue === null) {
        continue;
      }

      // 處理關聯欄位
      if (field.type === FieldMetadataType.RELATION && fieldValue) {
        // 遞迴過濾關聯對象（只保留基本資訊）
        if (Array.isArray(fieldValue)) {
          filtered[fieldName] = fieldValue.map((item) =>
            this.filterRelationObject(item),
          );
        } else {
          filtered[fieldName] = this.filterRelationObject(fieldValue);
        }
      } else {
        // 普通欄位直接複製
        filtered[fieldName] = fieldValue;
      }
    }

    return filtered;
  }

  /**
   * 過濾關聯對象（只保留基本資訊）
   */
  private filterRelationObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // 只保留常見的公開欄位
    const allowedFields = [
      'id',
      'name',
      'firstName',
      'lastName',
      'email',
      'phone',
      'domainName',
      'address',
      'city',
      'avatarUrl',
    ];

    const filtered: any = {};

    for (const key of allowedFields) {
      if (obj[key] !== undefined && obj[key] !== null) {
        filtered[key] = obj[key];
      }
    }

    return filtered;
  }

  /**
   * 獲取表格標題
   */
  private getTableTitle(content: any, resourceType: string): string {
    // 嘗試從常見欄位獲取標題
    if (content.name) {
      return content.name;
    }

    if (content.firstName || content.lastName) {
      return `${content.firstName || ''} ${content.lastName || ''}`.trim();
    }

    if (content.baoJiaDanHao) {
      return content.baoJiaDanHao;
    }

    if (content.mingCheng) {
      return content.mingCheng;
    }

    // 預設標題
    const typeName = resourceType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    return `${typeName} Information`;
  }

  /**
   * 獲取公司內容（保留向後兼容，但標記為廢棄）
   * @deprecated 使用 getTableContent() 替代
   */
  private async getCompanyContent(
    resourceId: string,
    workspaceId: string,
  ): Promise<any> {
    return this.getTableContent('COMPANY', resourceId, workspaceId);
  }

  /**
   * 獲取人員內容（保留向後兼容，但標記為廢棄）
   * @deprecated 使用 getTableContent() 替代
   */
  private async getPersonContent(
    resourceId: string,
    workspaceId: string,
  ): Promise<any> {
    return this.getTableContent('PERSON', resourceId, workspaceId);
  }

  /**
   * 獲取報價單內容（保留向後兼容，但標記為廢棄）
   * @deprecated 使用 getTableContent() 替代
   */
  private async getSalesQuoteContent(
    resourceId: string,
    workspaceId: string,
  ): Promise<any> {
    return this.getTableContent('SALES_QUOTE', resourceId, workspaceId);
  }

  /**
   * 獲取儀表板圖表內容（單個圖表）
   * 實現需求 3.5, 3.6, 20.7, 21.2
   *
   * resourceId 是 PageLayoutWidget 的 ID，對應單個圖表
   *
   * 重要：此方法會查詢並返回原始 GroupBy 資料，供外部分享連結使用
   * 前端會使用 Twenty 內部的 transformGroupByDataToBarChartData 轉換資料
   */
  private async getDashboardChartContent(
    resourceId: string,
    workspaceId: string,
  ): Promise<any> {
    console.log('[ExternalContentService] 📊 getDashboardChartContent called:', { resourceId, workspaceId });

    try {
      // PageLayoutWidget 是 Core Entity，使用注入的 repository
      console.log('[ExternalContentService] Fetching widget from database...');
      const widget = await this.pageLayoutWidgetRepository.findOne({
        where: {
          id: resourceId,
          workspaceId: workspaceId, // 確保 workspace 隔離
        },
      });

      console.log('[ExternalContentService] Widget found:', !!widget);

      if (!widget) {
        throw new NotFoundException('Resource not accessible');
      }

      // 解析圖表配置
      const configuration = widget.configuration as any;
      console.log('[ExternalContentService] Widget configuration:', {
        graphType: configuration?.graphType,
        objectMetadataId: widget.objectMetadataId,
        aggregateOperation: configuration?.aggregateOperation,
      });

      // 查詢原始 GroupBy 資料
      let groupByData = null;
      let objectMetadata = null;

      if (widget.objectMetadataId && configuration?.graphType) {
        try {
          // 獲取完整的 objectMetadata（包含所有 fields）
          console.log('[ExternalContentService] Fetching objectMetadata...');
          objectMetadata = await this.objectMetadataRepository.findOne({
            where: { id: widget.objectMetadataId, workspaceId },
            relations: ['fields'],
          });

          console.log('[ExternalContentService] ObjectMetadata found:', !!objectMetadata);

          if (!objectMetadata) {
            console.warn('[ExternalContentService] ⚠️ ObjectMetadata not found, returning empty data');
            groupByData = {};
          } else {
            console.log('[ExternalContentService] Querying groupBy data...');
            groupByData = await this.queryGroupByData(
              widget.objectMetadataId,
              configuration,
              workspaceId,
            );
            console.log('[ExternalContentService] GroupBy data retrieved:', {
              hasData: !!groupByData,
              keys: Object.keys(groupByData || {}),
              dataLength: Object.values(groupByData || {}).flat().length,
            });
          }
        } catch (error) {
          // 記錄錯誤但不拋出，返回空資料
          console.error('[ExternalContentService] ❌ Error querying chart data:', error);
          groupByData = {};
        }
      } else {
        console.warn('[ExternalContentService] ⚠️ Missing objectMetadataId or graphType');
      }

      // 返回完整的圖表資料（包含原始 GroupBy 資料和 objectMetadata）
      const result = {
        id: widget.id,
        title:
          widget.title || `${configuration?.graphType || 'Dashboard'} Chart`,
        type: configuration?.graphType || 'VERTICAL_BAR',
        widgetType: widget.type,
        // 返回完整的配置（前端需要用來轉換資料）
        configuration: configuration,
        objectMetadataId: widget.objectMetadataId,
        // ✅ 返回完整的 objectMetadata（前端需要用來轉換資料）
        objectMetadata: objectMetadata,
        // 原始 GroupBy 資料（格式與 GraphQL 查詢結果相同）
        groupByData: groupByData,
        metadata: {
          isSharedChart: true,
          sharedAt: new Date().toISOString(),
        },
      };

      console.log('[ExternalContentService] ✅ Returning chart content:', {
        id: result.id,
        title: result.title,
        type: result.type,
        hasGroupByData: !!result.groupByData,
        hasObjectMetadata: !!result.objectMetadata,
      });

      return result;
    } catch (error) {
      // 統一錯誤處理，不洩露具體資訊
      console.error('getDashboardChartContent error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Resource not accessible');
    }
  }

  /**
   * 查詢原始 GroupBy 資料
   * 執行與前端 useGraphWidgetGroupByQuery 相同的邏輯
   *
   * 返回格式與 GraphQL 查詢結果相同：
   * {
   *   "companyGroupBy": [
   *     {
   *       "groupByDimensionValues": ["Product A"],
   *       "count": 10,
   *       "sum": { "amount": 1000 },
   *       "avg": { "amount": 100 }
   *     }
   *   ]
   * }
   */
  private async queryGroupByData(
    objectMetadataId: string,
    configuration: any,
    workspaceId: string,
  ): Promise<Record<string, any[]>> {
    const aggregateOperation = configuration?.aggregateOperation || 'COUNT';
    const aggregateFieldMetadataId = configuration?.aggregateFieldMetadataId;
    const primaryAxisGroupByFieldMetadataId =
      configuration?.groupByFieldMetadataId ||
      configuration?.primaryAxisGroupByFieldMetadataId;
    const secondaryAxisGroupByFieldMetadataId =
      configuration?.secondaryAxisGroupByFieldMetadataId;

    // 日期分組配置
    const primaryAxisDateGranularity =
      configuration?.primaryAxisDateGranularity;
    const secondaryAxisDateGranularity =
      configuration?.secondaryAxisGroupByDateGranularity;

    // 複合欄位配置
    const primaryAxisSubFieldName =
      configuration?.primaryAxisGroupBySubFieldName;
    const secondaryAxisSubFieldName =
      configuration?.secondaryAxisGroupBySubFieldName;

    // 排序配置
    const primaryAxisOrderBy = configuration?.primaryAxisOrderBy;
    const secondaryAxisOrderBy = configuration?.secondaryAxisOrderBy;

    try {
      // 1. 獲取 objectMetadata
      const objectMetadata = await this.objectMetadataRepository.findOne({
        where: { id: objectMetadataId, workspaceId },
        relations: ['fields'],
      });

      if (!objectMetadata) {
        return {};
      }

      // 2. 如果沒有 primary groupBy 欄位，返回空資料
      if (!primaryAxisGroupByFieldMetadataId) {
        return {};
      }

      // 3. 獲取 primary groupBy field
      const primaryGroupByField = await this.fieldMetadataRepository.findOne({
        where: { id: primaryAxisGroupByFieldMetadataId, workspaceId },
      });

      if (!primaryGroupByField) {
        return {};
      }

      // 4. 獲取 aggregate field（如果有）
      let aggregateField: FieldMetadataEntity | null = null;

      if (aggregateFieldMetadataId) {
        aggregateField = await this.fieldMetadataRepository.findOne({
          where: { id: aggregateFieldMetadataId, workspaceId },
        });
      }

      // 5. 執行查詢
      const dataRepository =
        await this.twentyORMGlobalManager.getRepositoryForWorkspace(
          workspaceId,
          objectMetadata.nameSingular,
          { shouldBypassPermissionChecks: true },
        );

      const queryBuilder = dataRepository.createQueryBuilder(
        objectMetadata.nameSingular,
      );

      // 6. 添加 Primary GroupBy 維度（支援日期分組和複合欄位）
      const primaryGroupByExpression = this.buildGroupByExpression(
        primaryGroupByField,
        objectMetadata.nameSingular,
        primaryAxisDateGranularity,
        primaryAxisSubFieldName,
      );

      queryBuilder
        .select(primaryGroupByExpression, 'dimension1')
        .groupBy(primaryGroupByExpression);

      // 7. 如果有 secondary groupBy，添加第二維度
      let secondaryGroupByField: FieldMetadataEntity | null = null;

      if (secondaryAxisGroupByFieldMetadataId) {
        secondaryGroupByField = await this.fieldMetadataRepository.findOne({
          where: { id: secondaryAxisGroupByFieldMetadataId, workspaceId },
        });

        if (secondaryGroupByField) {
          const secondaryGroupByExpression = this.buildGroupByExpression(
            secondaryGroupByField,
            objectMetadata.nameSingular,
            secondaryAxisDateGranularity,
            secondaryAxisSubFieldName,
          );

          queryBuilder
            .addSelect(secondaryGroupByExpression, 'dimension2')
            .addGroupBy(secondaryGroupByExpression);
        }
      }

      // 8. 添加 Aggregate 操作
      queryBuilder.addSelect('COUNT(*)', 'count');

      if (aggregateField) {
        const columnName = `"${objectMetadata.nameSingular}"."${aggregateField.name}"`;

        switch (aggregateOperation.toUpperCase()) {
          case 'SUM':
            queryBuilder.addSelect(`SUM(${columnName})`, 'sum');
            break;
          case 'AVG':
            queryBuilder.addSelect(`AVG(${columnName})`, 'avg');
            break;
          case 'MIN':
            queryBuilder.addSelect(`MIN(${columnName})`, 'min');
            break;
          case 'MAX':
            queryBuilder.addSelect(`MAX(${columnName})`, 'max');
            break;
          case 'COUNT_UNIQUE':
            queryBuilder.addSelect(
              `COUNT(DISTINCT ${columnName})`,
              'countUnique',
            );
            break;
          case 'PERCENT_EMPTY':
            queryBuilder.addSelect(
              `(COUNT(*) FILTER (WHERE ${columnName} IS NULL) * 100.0 / COUNT(*))`,
              'percentEmpty',
            );
            break;
          case 'PERCENT_NOT_EMPTY':
            queryBuilder.addSelect(
              `(COUNT(*) FILTER (WHERE ${columnName} IS NOT NULL) * 100.0 / COUNT(*))`,
              'percentNotEmpty',
            );
            break;
        }
      }

      // 9. 添加排序
      if (primaryAxisOrderBy) {
        queryBuilder.orderBy(
          'dimension1',
          primaryAxisOrderBy.toUpperCase() as 'ASC' | 'DESC',
        );
      } else {
        // 預設按 count 降序排序
        queryBuilder.orderBy('"count"', 'DESC');
      }

      // 如果有 secondary dimension，添加第二排序
      if (secondaryGroupByField && secondaryAxisOrderBy) {
        queryBuilder.addOrderBy(
          'dimension2',
          secondaryAxisOrderBy.toUpperCase() as 'ASC' | 'DESC',
        );
      }

      // 10. 添加限制
      queryBuilder.limit(20);

      // 11. 執行查詢
      const results = await queryBuilder.getRawMany();

      // 12. 轉換為 GroupByRawResult 格式
      const groupByResults = results.map((row) => {
        const groupByDimensionValues = [row.dimension1];
        if (secondaryGroupByField) {
          groupByDimensionValues.push(row.dimension2);
        }

        const result: any = {
          groupByDimensionValues,
          count: parseInt(row.count) || 0,
        };

        // 添加其他 aggregate 結果
        if (aggregateField) {
          const fieldName = aggregateField.name;

          if (row.sum !== undefined && row.sum !== null) {
            result.sum = { [fieldName]: parseFloat(row.sum) };
          }
          if (row.avg !== undefined && row.avg !== null) {
            result.avg = { [fieldName]: parseFloat(row.avg) };
          }
          if (row.min !== undefined && row.min !== null) {
            result.min = { [fieldName]: parseFloat(row.min) };
          }
          if (row.max !== undefined && row.max !== null) {
            result.max = { [fieldName]: parseFloat(row.max) };
          }
          if (row.countUnique !== undefined && row.countUnique !== null) {
            result.countUnique = { [fieldName]: parseInt(row.countUnique) };
          }
          if (row.percentEmpty !== undefined && row.percentEmpty !== null) {
            result.percentEmpty = { [fieldName]: parseFloat(row.percentEmpty) };
          }
          if (
            row.percentNotEmpty !== undefined &&
            row.percentNotEmpty !== null
          ) {
            result.percentNotEmpty = {
              [fieldName]: parseFloat(row.percentNotEmpty),
            };
          }
        }

        return result;
      });

      // 13. 返回格式與 GraphQL 查詢結果相同
      const result = {
        [`${objectMetadata.namePlural}GroupBy`]: groupByResults,
      };

      return result;
    } catch (error) {
      console.error('Error in queryGroupByData:', error);
      return {};
    }
  }

  /**
   * 構建 GroupBy 表達式
   * 支援日期分組、複合欄位、所有欄位類型
   */
  private buildGroupByExpression(
    field: FieldMetadataEntity,
    tableName: string,
    dateGranularity?: string,
    subFieldName?: string,
  ): string {
    let columnName = `"${tableName}"."${field.name}"`;

    // 處理複合欄位（如 name.firstName）
    if (subFieldName) {
      columnName = `${columnName}->>'${subFieldName}'`;
    }

    // 處理日期分組
    if (dateGranularity && this.isDateField(field)) {
      switch (dateGranularity.toUpperCase()) {
        case 'DAY':
          return `DATE(${columnName})`;
        case 'WEEK':
          return `DATE_TRUNC('week', ${columnName})`;
        case 'MONTH':
          return `DATE_TRUNC('month', ${columnName})`;
        case 'QUARTER':
          return `DATE_TRUNC('quarter', ${columnName})`;
        case 'YEAR':
          return `DATE_TRUNC('year', ${columnName})`;
        default:
          return `DATE(${columnName})`;
      }
    }

    // 根據欄位類型決定如何分組
    switch (field.type) {
      case FieldMetadataType.DATE:
      case FieldMetadataType.DATE_TIME:
        // 日期欄位：如果沒有指定 granularity，預設按日期分組
        return `DATE(${columnName})`;

      case FieldMetadataType.SELECT:
      case FieldMetadataType.TEXT:
      case FieldMetadataType.EMAILS:
      case FieldMetadataType.PHONES:
      case FieldMetadataType.BOOLEAN:
        // 直接使用欄位值
        return columnName;

      case FieldMetadataType.NUMBER:
      case FieldMetadataType.NUMERIC:
        // 數值欄位：直接使用值
        return columnName;

      default:
        // 其他類型：嘗試轉換為文字
        return `CAST(${columnName} AS TEXT)`;
    }
  }

  /**
   * 判斷是否為日期欄位
   */
  private isDateField(field: FieldMetadataEntity): boolean {
    return (
      field.type === FieldMetadataType.DATE ||
      field.type === FieldMetadataType.DATE_TIME
    );
  }

  /**
   * 獲取內容元數據
   * 實現需求 3.7 + workspace 隔離
   */
  private async getContentMetadata(
    shareLink: ShareLinkData,
    workspaceId: string,
  ): Promise<SharedContentMetadata> {
    // 驗證 workspace 一致性
    if (shareLink.workspaceId !== workspaceId) {
      throw new NotFoundException('Workspace mismatch: access denied');
    }

    // 這裡需要獲取工作區資訊
    // 暫時返回基本資訊，後續會在完整實現中處理
    return {
      workspaceName: 'Y-CRM Workspace',
      workspaceLogo: undefined,
      sharedAt: shareLink.createdAt,
      expiresAt: shareLink.expiresAt,
    };
  }

  /**
   * 從分享連結獲取工作區 ID
   * 實現需求 6.1, 6.2 - 直接使用 shareLink.workspaceId 確保隔離
   */
  private async getWorkspaceIdFromShareLink(
    shareLink: ShareLinkData,
  ): Promise<string> {
    // 直接使用 shareLink 中的 workspaceId，確保 workspace 隔離
    if (!shareLink.workspaceId) {
      throw new NotFoundException(
        'Invalid share link: missing workspace information',
      );
    }

    return shareLink.workspaceId;
  }
}
