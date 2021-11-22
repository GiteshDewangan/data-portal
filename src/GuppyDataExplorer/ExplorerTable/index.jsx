import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import Tooltip from 'rc-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import IconicLink from '../../components/buttons/IconicLink';
import { GuppyConfigType, TableConfigType } from '../configTypeDef';
import { capitalizeFirstLetter, humanFileSize } from '../../utils';
import './ExplorerTable.css';
import LockIcon from '../../img/icons/lock.svg';
import dictIcons from '../../img/icons/index';
import '../typedef';

/** @typedef {import('react-table').Column} ReactTableColumn */

/**
 * A simplified alternative to lodash/get using string path of property names only.
 * @param {object} object The object to query.
 * @param {string} path Path to the property to get, e.g. 'a.b.c'
 * @param {any} defaultValue The value returned if the resolved value is undefined.
 * @return Returns the resolved value.
 */
const get = (object, path, defaultValue) =>
  path.split('.').reduce((obj, key) => obj && obj[key], object) || defaultValue;

/**
 * @param {Object} args
 * @param {string} args.field
 * @param {string} args.columnName
 * @param {Array} args.linkFields
 * @param {Array} args.rawData
 */
function getColumnWidth({ field, columnName, linkFields, rawData }) {
  // special cases
  if ((rawData ?? []).length === 0) return 100;
  if (field === 'external_links') return 200;
  if (linkFields.includes(field)) return 80;

  // some magic numbers that work fine for table columns width
  const maxWidth = 400;
  const letterWidth = 8;
  const spacing = 20;

  const [fieldName] = field.split('.');
  let maxLetterLen = columnName.length;
  for (const d of rawData) {
    // the calculation logic here is a bit wild if it is a nested array field
    // it would convert the whole array to string and calculate
    // which in most cases would exceed the maxWidth so just use maxWidth
    const len = d?.[fieldName]?.toString().length ?? 0;
    maxLetterLen = Math.max(len, maxLetterLen);
  }

  return Math.min(maxLetterLen * letterWidth + spacing, maxWidth);
}

/**
 * @typedef {Object} ExplorerTableProps
 * @property {Object[]} rawData
 * @property {(args: { offset: number; size: number; sort: GqlSort }) => Promise} fetchAndUpdateRawData
 * @property {number} accessibleCount
 * @property {boolean} isLocked
 * @property {string} className
 * @property {number} defaultPageSize
 * @property {{ fields: string[]; linkFields: string[]; ordered: boolean }} tableConfig
 * @property {GuppyConfig} guppyConfig
 * @property {number} totalCount
 */

/**
 * @typedef {Object} ExplorerTableState
 * @property {number} pageSize
 * @property {number} currentPage
 * @property {boolean} isInitialFetchData
 */

/** @augments {React.Component<ExplorerTableProps, ExplorerTableState>} */
class ExplorerTable extends React.Component {
  /** @param {ExplorerTableProps} props */
  constructor(props) {
    super(props);
    /** @type {ExplorerTableState} */
    this.state = {
      pageSize: props.defaultPageSize,
      currentPage: 0,
      isInitialFetchData: true,
    };
  }

  /**
   * Build column configs for each table according to their locations and fields
   * @param {string} field: the full field name, if it is a nested field, it would contains at least 1 '.'
   * @param {boolean} isNestedTableColumn: control flag to determine if it is building column config for
   * the root table or inner nested tables
   * @param {boolean} isDetailedColumn: control flag to determine if it is building column config for inner
   * most nested table
   * @returns {ReactTableColumn} a column config for the input field which can be used by react-table
   */
  buildColumnConfig = (field, isNestedTableColumn, isDetailedColumn) => {
    const { fieldMapping } = this.props.guppyConfig;
    const overrideName = fieldMapping?.find((i) => i.field === field)?.name;
    const fieldStringsArray = field.split('.');
    // for nested table, we only display the children names in column header
    // i.e.: visits.follow_ups.follow_up_label => follow_ups.follow_up_label
    const fieldName =
      overrideName ?? isNestedTableColumn
        ? capitalizeFirstLetter(fieldStringsArray.slice(1).join('.'))
        : capitalizeFirstLetter(field);

    return {
      Header: fieldName,
      id: field,
      maxWidth: 600,
      // for nested table we set the width arbitrary wrt view width
      // because the width of its parent row is too big
      // @ts-ignore
      width: isNestedTableColumn
        ? '70vw'
        : getColumnWidth({
            field,
            columnName: fieldName,
            linkFields: this.props.tableConfig.linkFields,
            rawData: this.props.rawData,
          }),
      accessor: (d) => d[fieldStringsArray[0]],
      Cell: (row) => {
        let valueStr = '';
        if (fieldStringsArray.length > 1) {
          if (isDetailedColumn)
            // for inner most detailed table, 1 value per row
            return (
              <div className='rt-tbody'>
                <div className='rt-tr-group'>
                  {row.value.map((element, i) => (
                    <div
                      className={`rt-tr ${i % 2 === 0 ? '-even' : '-odd'}`}
                      key={i}
                    >
                      <div className='rt-td'>
                        <span>
                          {get(element, fieldStringsArray.slice(1).join('.'))}
                          <br />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );

          valueStr = Array.isArray(row.value)
            ? row.value
                .map((x) => get(x, fieldStringsArray.slice(1).join('.')))
                .join(', ')
            : get(row.value, fieldStringsArray.slice(1).join('.'));
        } else
          valueStr = Array.isArray(row.value)
            ? row.value.join(', ')
            : row.value;

        // handling some special field types
        if (this.props.guppyConfig.downloadAccessor)
          return (
            <div>
              <span title={valueStr}>
                <a href={`/files/${valueStr}`}>{valueStr}</a>
              </span>
            </div>
          );

        if (this.props.tableConfig.linkFields.includes(field))
          return field && valueStr ? (
            <IconicLink
              link={valueStr}
              className='explorer-table-link'
              buttonClassName='explorer-table-link-button'
              icon='exit'
              dictIcons={dictIcons}
              iconColor='#606060'
              target='_blank'
              isExternal
            />
          ) : null;

        if (field === 'filed_size')
          return (
            <div>
              <span title={valueStr}>{humanFileSize(valueStr)}</span>
            </div>
          );

        if (field === 'external_references.external_links') {
          if (row.value === null) return null;
          const [
            resourceName,
            resourceIconPath,
            subjectUrl,
          ] = row.value[0].external_links.split('|');
          return (
            <div className='explorer-table-external-links'>
              <a href={subjectUrl} target='_blank' rel='noopenner noreferrer'>
                <img src={resourceIconPath} alt={resourceName} />
              </a>
            </div>
          );
        }

        return (
          <div>
            <span title={valueStr}>{valueStr}</span>
          </div>
        );
      },
    };
  };

  /**
   * Build column configs nested array fields
   * We only need nested table if the nested field is an array
   * Otherwise the nested field will have 1-1 relationship to its parent
   * so can be displayed in one row
   * @param {{ [x: string]: string[] }} nestedArrayFieldNames: an object containing all the nested array fields,
   * separated by their parent names
   * e.g.:
   * {
   *    ActionableMutations: [ Lab ],
   *    Oncology_Primary: [ Multiplicitycounter, ICDOSite ]
   * }
   * @returns a collection of column configs for each nested table,
   * separated by their parent names. Each set of column configs contains two configs,
   * one for the 1st level nested table and one for the 2nd level table
   * e.g.:
   * {
   *    ActionableMutations: [
   *      <columnConfig for 1st level nested table>,
   *      <columnConfig for 2nd level nested table (the details table)>
   *    ],
   *    Oncology_Primary: [
   *      <columnConfig for 1st level nested table>,
   *      <columnConfig for 2nd level nested table (the details table)>
   *    ]
   * }
   */
  buildNestedArrayFieldColumnConfigs = (nestedArrayFieldNames) => {
    /** @type {{ [x: string]: ReactTableColumn[][] }} */
    const nestedArrayFieldColumnConfigs = {};
    for (const key of Object.keys(nestedArrayFieldNames)) {
      if (!nestedArrayFieldColumnConfigs[key])
        nestedArrayFieldColumnConfigs[key] = [];

      const firstLevelColumns = [];
      const secondLevelColumns = [];
      for (const nestedFieldName of nestedArrayFieldNames[key]) {
        const field = `${key}.${nestedFieldName}`;
        firstLevelColumns.push(this.buildColumnConfig(field, true, false));
        secondLevelColumns.push(this.buildColumnConfig(field, true, true));
      }

      nestedArrayFieldColumnConfigs[key].push(
        [{ Header: key, columns: firstLevelColumns }],
        [{ Header: key, columns: secondLevelColumns }]
      );
    }

    return nestedArrayFieldColumnConfigs;
  };

  render() {
    if (
      !this.props.tableConfig.fields ||
      this.props.tableConfig.fields.length === 0
    ) {
      return null;
    }
    // build column configs for root table first
    const rootColumnsConfig = this.props.tableConfig.fields.map((field) =>
      this.buildColumnConfig(field, false, false)
    );
    if (!this.props.tableConfig.ordered) {
      rootColumnsConfig.sort((a, b) =>
        String(a.Header).localeCompare(String(b.Header))
      );
    }
    /** @type {{ [x: string]: string[] }} */
    const nestedArrayFieldNames = {};
    this.props.tableConfig.fields.forEach((field) => {
      if (field.includes('.')) {
        const fieldStringsArray = field.split('.');
        if (
          this.props.rawData &&
          this.props.rawData.length > 0 &&
          Array.isArray(this.props.rawData[0][fieldStringsArray[0]])
        ) {
          if (!nestedArrayFieldNames[fieldStringsArray[0]]) {
            nestedArrayFieldNames[fieldStringsArray[0]] = [];
          }
          nestedArrayFieldNames[fieldStringsArray[0]].push(
            fieldStringsArray.slice(1, fieldStringsArray.length).join('.')
          );
        }
      }
    });
    /** @type {import('react-table').SubComponentFunction} */
    let subComponent = null;
    if (Object.keys(nestedArrayFieldNames).length > 0) {
      // eslint-disable-next-line max-len
      const nestedArrayFieldColumnConfigs = this.buildNestedArrayFieldColumnConfigs(
        nestedArrayFieldNames
      );
      // this is the subComponent of the two-level nested tables
      subComponent = (row) =>
        Object.keys(nestedArrayFieldColumnConfigs).map((key) => {
          const rowData =
            this.props.isLocked || !this.props.rawData
              ? []
              : this.props.rawData.slice(row.index, row.index + 1);
          return (
            <div className='explorer-nested-table' key={key}>
              <ReactTable
                data={this.props.isLocked || !rowData ? [] : rowData}
                columns={nestedArrayFieldColumnConfigs[key][0]}
                defaultPageSize={1}
                showPagination={false}
                SubComponent={() => (
                  <div className='explorer-nested-table'>
                    <ReactTable
                      data={this.props.isLocked || !rowData ? [] : rowData}
                      columns={nestedArrayFieldColumnConfigs[key][1]}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                )}
              />
            </div>
          );
        });
    }

    const { accessibleCount, totalCount } = this.props;
    const { pageSize } = this.state;
    const totalPages =
      Math.floor(accessibleCount / pageSize) +
      (accessibleCount % pageSize === 0 ? 0 : 1);
    const SCROLL_SIZE = 10000;
    const visiblePages = Math.min(
      totalPages,
      Math.round(SCROLL_SIZE / pageSize + 0.49)
    );
    const start = this.state.currentPage * this.state.pageSize + 1;
    const end = (this.state.currentPage + 1) * this.state.pageSize;
    const currentPageRange =
      // eslint-disable-next-line no-nested-ternary
      accessibleCount < end
        ? accessibleCount < 2
          ? accessibleCount.toLocaleString()
          : `${start.toLocaleString()} - ${accessibleCount.toLocaleString()}`
        : `${start.toLocaleString()} - ${end.toLocaleString()}`;
    const dataTypeString = pluralize(this.props.guppyConfig.dataType);
    const explorerTableCaption = `Showing ${currentPageRange} of ${accessibleCount.toLocaleString()} ${dataTypeString}`;

    return (
      <div className={`explorer-table ${this.props.className}`}>
        {!this.props.isLocked && (
          <p className='explorer-table__description'>
            {explorerTableCaption}{' '}
            {accessibleCount !== totalCount && (
              <Tooltip
                placement='right'
                arrowContent={<div className='rc-tooltip-arrow-inner' />}
                overlay={
                  <span>
                    This table only shows data you can access. Click
                    {' "Request Access"'} button above for more.
                  </span>
                }
              >
                <FontAwesomeIcon
                  icon='exclamation-triangle'
                  color='var(--pcdc-color__secondary)'
                />
              </Tooltip>
            )}
          </p>
        )}
        <ReactTable
          columns={rootColumnsConfig}
          manual
          data={
            this.props.isLocked || !this.props.rawData ? [] : this.props.rawData
          }
          showPageSizeOptions={!this.props.isLocked}
          // eslint-disable-next-line max-len
          pages={this.props.isLocked ? 0 : visiblePages} // Total number of pages, don't show 10000+ records in table
          onFetchData={
            this.state.isInitialFetchData
              ? () => this.setState({ isInitialFetchData: false })
              : (state) =>
                  this.props
                    .fetchAndUpdateRawData({
                      offset: state.page * state.pageSize,
                      size: state.pageSize,
                      sort: state.sorted.map((i) => ({
                        [i.id]: i.desc ? 'desc' : 'asc',
                      })),
                    })
                    .then(() =>
                      this.setState({
                        pageSize: state.pageSize,
                        currentPage: state.page,
                      })
                    )
          }
          defaultPageSize={this.props.defaultPageSize}
          className={'-striped -highlight '}
          minRows={3} // make room for no data component
          resizable={false}
          NoDataComponent={() =>
            this.props.isLocked ? (
              <div className='rt-noData'>
                <LockIcon width={30} />
                <p>You only have access to summary data</p>
              </div>
            ) : (
              <div className='rt-noData'>No data to display</div>
            )
          }
          SubComponent={this.props.isLocked ? null : subComponent}
        />
      </div>
    );
  }
}

ExplorerTable.propTypes = {
  rawData: PropTypes.array, // from GuppyWrapper
  fetchAndUpdateRawData: PropTypes.func.isRequired, // from GuppyWrapper
  accessibleCount: PropTypes.number.isRequired, // from GuppyWrapper
  isLocked: PropTypes.bool.isRequired,
  className: PropTypes.string,
  defaultPageSize: PropTypes.number,
  tableConfig: TableConfigType.isRequired,
  guppyConfig: GuppyConfigType.isRequired,
  totalCount: PropTypes.number,
};

ExplorerTable.defaultProps = {
  rawData: [],
  className: '',
  defaultPageSize: 20,
};

export default ExplorerTable;
