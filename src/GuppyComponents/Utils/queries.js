import fetch from 'isomorphic-fetch';
import flat from 'flat';
import papaparse from 'papaparse';
import { FILE_DELIMITERS } from './const';
import '../typedef';

const graphqlEndpoint = '/graphql';
const downloadEndpoint = '/download';
const statusEndpoint = '/_status';

/**
 * Converts JSON to a specified file format.
 * Defaultes to JSON if file format is not supported.
 * @param {Object} json
 * @param {string} format
 */
function jsonToFormat(json, format) {
  return format in FILE_DELIMITERS
    ? papaparse.unparse(
        Object.values(json).map((value) => flat(value, { delimiter: '_' })),
        { delimiter: FILE_DELIMITERS[format] }
      )
    : json;
}

/**
 * @param {string} field
 * @returns {string}
 */
function histogramQueryStrForEachField(field) {
  const [fieldName, ...nestedFieldNames] = field.split('.');
  return nestedFieldNames.length === 0
    ? `${fieldName} {
        histogram {
          key
          count
        }
      }`
    : `${fieldName} {
        ${histogramQueryStrForEachField(nestedFieldNames.join('.'))}
      }`;
}

/**
 * @param {object} opt
 * @param {string} opt.path
 * @param {string} opt.type
 * @param {string[]} opt.fields
 * @param {object} [opt.gqlFilter]
 * @param {AbortSignal} [opt.signal]
 */
export function queryGuppyForAggregationData({
  path,
  type,
  fields,
  gqlFilter,
  signal,
}) {
  const query = (gqlFilter !== undefined
    ? `query ($filter: JSON) {
        _aggregation {
          ${type} (filter: $filter, filterSelf: false, accessibility: all) {
            ${fields.map((field) => histogramQueryStrForEachField(field))}
          }
          accessible: ${type} (filter: $filter, accessibility: accessible) {
            _totalCount
          }
          all: ${type} (filter: $filter, accessibility: all) {
            _totalCount
          }
        }
      }`
    : `query {
        _aggregation {
          ${type} (accessibility: all) {
            ${fields.map((field) => histogramQueryStrForEachField(field))}
          }
          accessible: ${type} (accessibility: accessible) {
            _totalCount
          }
          all: ${type} (accessibility: all) {
            _totalCount
          }
        }
      }`
  ).replace(/\s+/g, ' ');

  return fetch(`${path}${graphqlEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { filter: gqlFilter } }),
    signal,
  }).then((response) => response.json());
}

/** @param {string} path */
export function queryGuppyForStatus(path) {
  return fetch(`${path}${statusEndpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());
}

/**
 * @param {string} mainField
 * @param {boolean} numericAggAsText
 */
function nestedHistogramQueryStrForEachField(mainField, numericAggAsText) {
  return `${mainField} {
    ${numericAggAsText ? 'asTextHistogram' : 'histogram'} {
      key
      count
      missingFields {
        field
        count
      }
      termsFields {
        field
        terms {
          key
          count
        }
      }
    }
  }`;
}

/**
 * @param {object} opt
 * @param {string} opt.path
 * @param {string} opt.type
 * @param {string} opt.mainField
 * @param {boolean} [opt.numericAggAsText]
 * @param {string[]} [opt.termsFields]
 * @param {string[]} [opt.missingFields]
 * @param {object} [opt.gqlFilter]
 * @param {AbortSignal} [opt.signal]
 */
export function queryGuppyForSubAggregationData({
  path,
  type,
  mainField,
  numericAggAsText = false,
  termsFields,
  missingFields,
  gqlFilter,
  signal,
}) {
  const query = (gqlFilter !== undefined
    ? `query ($filter: JSON, $nestedAggFields: JSON) {
        _aggregation {
            ${type} (filter: $filter, filterSelf: false, nestedAggFields: $nestedAggFields, accessibility: all) {
              ${nestedHistogramQueryStrForEachField(
                mainField,
                numericAggAsText
              )}
            }
          }
        }`
    : `query ($nestedAggFields: JSON) {
        _aggregation {
          ${type} (nestedAggFields: $nestedAggFields, accessibility: all) {
            ${nestedHistogramQueryStrForEachField(mainField, numericAggAsText)}
          }
        }
      }`
  ).replace(/\s+/g, ' ');

  return fetch(`${path}${graphqlEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        filter: gqlFilter,
        nestedAggFields: { termsFields, missingFields },
      },
    }),
    signal,
  })
    .then((response) => response.json())
    .catch((err) => {
      throw new Error(`Error during queryGuppyForSubAggregationData ${err}`);
    });
}

/**
 * @param {string} field
 * @returns {string}
 */
function rawDataQueryStrForEachField(field) {
  const [fieldName, ...nestedFieldNames] = field.split('.');
  return nestedFieldNames.length === 0
    ? `${fieldName}`
    : `${fieldName} {
      ${rawDataQueryStrForEachField(nestedFieldNames.join('.'))}
    }`;
}

/**
 * @param {object} opt
 * @param {string} opt.path
 * @param {string} opt.type
 * @param {string[]} opt.fields
 * @param {object} [opt.gqlFilter]
 * @param {*} [opt.sort]
 * @param {number} [opt.offset]
 * @param {number} [opt.size]
 * @param {AbortSignal} [opt.signal]
 * @param {string} [opt.format]
 * @param {boolean} [opt.withTotalCount]
 */
export function queryGuppyForRawData({
  path,
  type,
  fields,
  gqlFilter,
  sort,
  offset = 0,
  size = 20,
  signal,
  format,
  withTotalCount = false,
}) {
  const queryArgument = [
    sort ? '$sort: JSON' : '',
    gqlFilter ? '$filter: JSON' : '',
    format ? '$format: Format' : '',
  ]
    .filter((e) => e)
    .join(', ');
  const queryLine = queryArgument ? `query (${queryArgument})` : 'query';

  const dataTypeArgument = [
    'accessibility: accessible',
    `offset: ${offset}`,
    `first: ${size}`,
    format && 'format: $format',
    sort && 'sort: $sort',
    gqlFilter && 'filter: $filter',
  ]
    .filter((e) => e)
    .join(', ');
  const dataTypeLine = `${type} (${dataTypeArgument})`;

  const aggregationArgument = [
    'accessibility: accessible',
    gqlFilter ? 'filter: $filter' : '',
  ]
    .filter((e) => e)
    .join(', ');
  const aggregationFragment = withTotalCount
    ? `_aggregation {
      ${type} (${aggregationArgument}) {
        _totalCount
      }
    }`
    : '';

  const query = `${queryLine} {
    ${dataTypeLine} {
      ${fields.map(rawDataQueryStrForEachField).join('\n')}
    }
    ${aggregationFragment}
  }`.replace(/\s+/g, ' ');

  return fetch(`${path}${graphqlEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        format,
        filter: gqlFilter,
        sort,
      },
    }),
    signal,
  })
    .then((response) => response.json())
    .catch((err) => {
      throw new Error(`Error during queryGuppyForRawData ${err}`);
    });
}

/**
 * @param {string} fieldName
 * @param {RangeFilter | OptionFilter} filterValues
 * @returns {GqlInFilter | GqlSimpleAndFilter | undefined}
 */
function parseSimpleFilter(fieldName, filterValues) {
  const invalidFilterError = new Error(`Invalid filter object ${filterValues}`);
  if (filterValues === undefined) throw invalidFilterError;

  // a range-type filter
  if ('lowerBound' in filterValues) {
    const { lowerBound, upperBound } = filterValues;
    if (typeof lowerBound === 'number' && typeof upperBound === 'number')
      return {
        AND: [
          { GTE: { [fieldName]: lowerBound } },
          { LTE: { [fieldName]: upperBound } },
        ],
      };
  }

  // an option-type filter
  if ('selectedValues' in filterValues) {
    const { selectedValues, __combineMode } = filterValues;
    if (selectedValues.length > 0)
      return __combineMode === 'AND'
        ? {
            AND: selectedValues.map((selectedValue) => ({
              IN: { [fieldName]: [selectedValue] },
            })),
          }
        : { IN: { [fieldName]: selectedValues } };

    if (__combineMode !== undefined)
      // with a combine setting only - ignore it.
      return undefined;
  }

  throw invalidFilterError;
}

/**
 * Convert filter obj into GQL filter format
 * @param {FilterState} filter
 * @returns {GqlFilter}
 */
export function getGQLFilter(filter) {
  if (filter === undefined || Object.keys(filter).length === 0)
    return undefined;

  let facetIndex = 0;
  /** @type {(GqlInFilter | GqlSimpleAndFilter | GqlNestedFilter)[]} */
  const facetsList = [];
  /** @type {{ [path: string]: number }} */
  const nestedFacetIndices = {};
  for (const [field, filterValues] of Object.entries(filter)) {
    const [fieldStr, nestedFieldStr] = field.split('.');
    const isNestedField = nestedFieldStr !== undefined;
    const fieldName = isNestedField ? nestedFieldStr : fieldStr;
    const facetsPiece = parseSimpleFilter(fieldName, filterValues);

    if (facetsPiece === undefined)
      // eslint-disable-next-line no-continue
      continue;

    if (isNestedField) {
      const path = fieldStr; // parent path
      if (path in nestedFacetIndices) {
        const nestedFacetIndex = nestedFacetIndices[path];
        const nestedFilter = facetsList[nestedFacetIndex];
        if ('nested' in nestedFilter) nestedFilter.nested.AND.push(facetsPiece);
      } else {
        nestedFacetIndices[path] = facetIndex;
        const nestedFilter = {
          nested: {
            path,
            AND: [facetsPiece],
          },
        };
        facetsList.push(nestedFilter);
        facetIndex += 1;
      }
    } else {
      facetsList.push(facetsPiece);
      facetIndex += 1;
    }
  }

  return { AND: facetsList };
}

/** @param {object} filterTabConfigs */
export function getAllFieldsFromFilterConfigs(filterTabConfigs) {
  return filterTabConfigs.flatMap(({ fields }) => fields);
}

/**
 * Download all data from guppy using fields, filter, and sort args.
 * @param {object} opt
 * @param {string} opt.path
 * @param {string} opt.type
 * @param {string[]} [opt.fields]
 * @param {object} [opt.filter]
 * @param {*} [opt.sort]
 * @param {string} [opt.format]
 */
export function downloadDataFromGuppy({
  path,
  type,
  fields,
  filter,
  sort,
  format,
}) {
  const JSON_FORMAT = format === 'json' || format === undefined;
  return fetch(`${path}${downloadEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessibility: 'accessible',
      filter: getGQLFilter(filter),
      type,
      fields,
      sort,
    }),
  }).then((res) =>
    JSON_FORMAT ? res.json() : jsonToFormat(res.json(), format)
  );
}

/**
 * @param {object} opt
 * @param {string} opt.path
 * @param {string} opt.type
 * @param {object} [opt.filter]
 */
export function queryGuppyForTotalCounts({ path, type, filter }) {
  const query = (filter !== undefined || Object.keys(filter).length > 0
    ? `query ($filter: JSON) {
        _aggregation {
          ${type} (filter: $filter, accessibility: all) {
            _totalCount
          }
        }
      }`
    : `query {
        _aggregation {
          ${type} (accessibility: all) {
            _totalCount
          }
        }
      }`
  ).replace(/\s+/g, ' ');

  return fetch(`${path}${graphqlEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { filter: getGQLFilter(filter) },
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data._aggregation[type]._totalCount)
    .catch((err) => {
      throw new Error(`Error during download ${err}`);
    });
}

/**
 * @param {object} opt
 * @param {string} opt.path
 * @param {string} opt.type
 */
export function getAllFieldsFromGuppy({ path, type }) {
  return fetch(`${path}${graphqlEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `{
        _mapping {
          ${type}
        }
      }`.replace(/\s+/g, ' '),
    }),
  })
    .then((response) => response.json())
    .then((response) => response.data._mapping[type])
    .catch((err) => {
      throw new Error(`Error when getting fields from guppy: ${err}`);
    });
}
