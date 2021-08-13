import React from 'react';
import PropTypes from 'prop-types';
import ConnectedFilter from '../../GuppyComponents/ConnectedFilter';
import { FilterConfigType, GuppyConfigType } from '../configTypeDef';
import './ExplorerFilter.css';

/**
 * @typedef {Object} ExplorerFilterProps
 * @property {string} className
 * @property {boolean} hasAppliedFilters
 * @property {() => void} onFilterClear
 * @property {FilterConfig} filterConfig
 * @property {GuppyConfig} guppyConfig
 * @property {number} tierAccessLimit
 * @property {{ [x: string]: OptionFilter }} adminAppliedPreFilters
 * @property {FilterState} initialAppliedFilters
 * @property {SimpleAggsData} initialTabsOptions
 * @property {string[]} patientIds
 * @property {(x: string[]) => void} onPatientIdsChange
 */

/** @param {ExplorerFilterProps} props */
function ExplorerFilter({
  className = '',
  hasAppliedFilters,
  onFilterClear,
  ...filterProps
}) {
  return (
    <div className={className}>
      <div className='guppy-explorer-filter__title-container'>
        <h4 className='guppy-explorer-filter__title'>Filters</h4>
        {hasAppliedFilters && (
          <button
            type='button'
            className='guppy-explorer-filter__clear-button'
            onClick={onFilterClear}
          >
            Clear all
          </button>
        )}
      </div>
      <ConnectedFilter {...filterProps} />
    </div>
  );
}

ExplorerFilter.propTypes = {
  className: PropTypes.string,
  filterConfig: FilterConfigType.isRequired,
  guppyConfig: GuppyConfigType.isRequired,
  tierAccessLimit: PropTypes.number,
  adminAppliedPreFilters: PropTypes.object,
  initialAppliedFilters: PropTypes.object,
  patientIds: PropTypes.arrayOf(PropTypes.string),
  onPatientIdsChange: PropTypes.func,
  hasAppliedFilters: PropTypes.bool,
  onFilterClear: PropTypes.func,
  onFilterChange: PropTypes.func, // inherit from GuppyWrapper
};

export default ExplorerFilter;
