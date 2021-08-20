/**
 * @typedef {Object} OptionFilter
 * @property {string[]} selectedValues
 * @property {'AND' | 'OR'} [__combineMode]
 */

/**
 * @typedef {Object} RangeFilter
 * @property {number} lowerBound
 * @property {number} upperBound
 */

/**
 * @typedef {{ [x: string]: OptionFilter | RangeFilter }} SimpleFilterState
 */

/**
 * @typedef {{ filter: SimpleFilterState }} AnchoredFilterState
 */

/**
 * @typedef {{ [x: string]: OptionFilter | RangeFilter | AnchoredFilterState }} FilterState
 */

/**
 * @typedef {Object} GqlInFilter
 * @property {{ [x: string]: string[] }} IN
 */

/**
 * @typedef {Object} GqlRangeFilter
 * @property {{ [x: string]: number }} [GTE]
 * @property {{ [x: string]: number }} [LTE]
 */

/**
 * @typedef {Object} GqlSimpleAndFilter
 * @property {GqlSimpleFilter[]} AND
 */

/**
 * @typedef {GqlInFilter | GqlRangeFilter | GqlSimpleAndFilter} GqlSimpleFilter
 */

/**
 * @typedef {Object} GqlNestedFilter
 * @property {Object} nested
 * @property {string} nested.path
 * @property {GqlFilter[]} nested.AND
 */

/**
 * @typedef {Object} GqlAndFilter
 * @property {GqlFilter[]} AND
 */

/**
 * @typedef {Object} GqlSearchFilter
 * @property {Object} search
 * @property {string} search.keyword
 * @property {string[]} search.fields
 */

/**
 * @typedef {GqlSimpleFilter | GqlNestedFilter | GqlAndFilter | GqlSearchFilter} GqlFilter
 */

/**
 * @typedef {{ [x: string]: 'asc' | 'desc' }[]} GqlSort
 */

/**
 * @typedef {Object} FilterTabsOption
 * @property {string} title
 * @property {string[]} fields
 * @property {string[]} searchFields
 */

/**
 * @typedef {Object} FilterConfig
 * @property {FilterTabsOption[]} tabs
 */

/**
 * @typedef {Object} GuppyConfig
 * @property {string} dataType
 * @property {string} nodeCountTitle
 * @property {{ field: string; name: string; }[]} [fieldMapping]
 * @property {Object} [manifestMapping]
 * @property {string} manifestMapping.resourceIndexType
 * @property {string} manifestMapping.resourceIdField
 * @property {string} manifestMapping.referenceIdFieldInResourceIndex
 * @property {string} manifestMapping.referenceIdFieldInDataIndex
 * @property {string} [getAccessButtonLink]
 * @property {string} [terraExportURL]
 * @property {string} [path]
 * @property {string} [mainField]
 * @property {string} [mainFieldTitle]
 * @property {boolean} [mainFieldIsNumeric]
 * @property {string[]} [aggFields]
 * @property {string} [downloadAccessor]
 * @property {string} [fileCountField]
 */

/**
 * @typedef {Object} AggsTextCount
 * @property {number} count
 * @property {string} key
 * @property {any} [accessible]
 */

/**
 * @typedef {Object} AggsRangeCount
 * @property {number} count
 * @property {[number, number]} key
 * @property {any} [accessible]
 */

/**
 * @typedef {AggsRangeCount | AggsTextCount} AggsCount
 */

/**
 * @typedef {{ [x: string]: { histogram: AggsCount[] } }} SimpleAggsData
 */

/**
 * @typedef {{ [x: string]: { histogram: AggsCount[] } | SimpleAggsData }} AggsData
 */

/**
 * @typedef {(args: { anchorValue?: string; filter: FilterState }) => void} FilterChangeHandler
 */

/**
 * @typedef {Object} GuppyData
 * @property {number} accessibleCount
 * @property {AggsData} aggsData
 * @property {string[]} allFields
 * @property {FilterState} filter
 * @property {SimpleAggsData} initialTabsOptions
 * @property {boolean} isLoadingAggsData
 * @property {boolean} isLoadingRawData
 * @property {Array} rawData
 * @property {SimpleAggsData} tabsOptions
 * @property {number} totalCount
 * @property {(args: { format: string; sort: GqlSort }) => void} downloadRawData
 * @property {(args: { fields: string[]; sort: GqlSort }) => void} downloadRawDataByFields
 * @property {(type: string, filter: FilterState, fields: string[]) => void} downloadRawDataByTypeAndFilter
 * @property {(type: string, filter: FilterState) => void} getTotalCountsByTypeAndFilter
 * @property {(args: { offset: number; size: number; sort: GqlSort }) => void} fetchAndUpdateRawData
 * @property {FilterChangeHandler} onFilterChange
 */
