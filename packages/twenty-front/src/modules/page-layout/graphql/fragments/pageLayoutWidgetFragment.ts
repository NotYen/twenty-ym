import { gql } from '@apollo/client';

export const PAGE_LAYOUT_WIDGET_FRAGMENT = gql`
  fragment PageLayoutWidgetFragment on PageLayoutWidget {
    id
    title
    type
    objectMetadataId
    createdAt
    updatedAt
    deletedAt
    gridPosition {
      column
      columnSpan
      row
      rowSpan
    }
    configuration {
      ... on BarChartConfiguration {
        graphType
        aggregateFieldMetadataId
        aggregateOperation
        primaryAxisGroupByFieldMetadataId
        primaryAxisGroupBySubFieldName
        primaryAxisDateGranularity
        primaryAxisOrderBy
        secondaryAxisGroupByFieldMetadataId
        secondaryAxisGroupBySubFieldName
        secondaryAxisGroupByDateGranularity
        secondaryAxisOrderBy
        omitNullValues
        axisNameDisplay
        displayDataLabel
        rangeMin
        rangeMax
        color
        description
        filter
        groupMode
        timezone
        firstDayOfTheWeek
        isCumulative
        tooltipDisplayFieldMetadataId
      }
      ... on LineChartConfiguration {
        graphType
        aggregateFieldMetadataId
        aggregateOperation
        primaryAxisGroupByFieldMetadataId
        primaryAxisGroupBySubFieldName
        primaryAxisDateGranularity
        primaryAxisOrderBy
        secondaryAxisGroupByFieldMetadataId
        secondaryAxisGroupBySubFieldName
        secondaryAxisGroupByDateGranularity
        secondaryAxisOrderBy
        omitNullValues
        axisNameDisplay
        displayDataLabel
        rangeMin
        rangeMax
        color
        description
        filter
        timezone
        firstDayOfTheWeek
        isCumulative
        tooltipDisplayFieldMetadataId
      }
      ... on PieChartConfiguration {
        graphType
        groupByFieldMetadataId
        aggregateFieldMetadataId
        aggregateOperation
        groupBySubFieldName
        dateGranularity
        orderBy
        displayDataLabel
        color
        description
        filter
        timezone
        firstDayOfTheWeek
        tooltipDisplayFieldMetadataId
        valueDisplayType
      }
      ... on AggregateChartConfiguration {
        graphType
        aggregateFieldMetadataId
        aggregateOperation
        label
        displayDataLabel
        format
        description
        filter
        timezone
        firstDayOfTheWeek
        tooltipDisplayFieldMetadataId
      }
      ... on GaugeChartConfiguration {
        graphType
        aggregateFieldMetadataId
        aggregateOperation
        displayDataLabel
        color
        description
        filter
        timezone
        firstDayOfTheWeek
        tooltipDisplayFieldMetadataId
      }
      ... on IframeConfiguration {
        url
      }
    }
    pageLayoutTabId
  }
`;
