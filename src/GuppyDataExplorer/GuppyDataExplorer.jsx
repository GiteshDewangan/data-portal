import React from 'react';
import PropTypes from 'prop-types';
import GuppyWrapper from '../GuppyComponents/GuppyWrapper';
import ExplorerErrorBoundary from './ExplorerErrorBoundary';
import ExplorerVisualization from './ExplorerVisualization';
import ExplorerFilter from './ExplorerFilter';
import ExplorerTopMessageBanner from './ExplorerTopMessageBanner';
import ExplorerCohort from './ExplorerCohort';
import { capitalizeFirstLetter } from '../utils';
import { validateFilter } from './utils';
import {
  GuppyConfigType,
  FilterConfigType,
  TableConfigType,
  ButtonConfigType,
  ChartConfigType,
  SurvivalAnalysisConfigType,
  PatientIdsConfigType,
} from './configTypeDef';
import './GuppyDataExplorer.css';

class GuppyDataExplorer extends React.Component {
  constructor(props) {
    super(props);

    const searchParams = new URLSearchParams(props.history.location.search);

    let initialAppliedFilters = {};
    if (searchParams.has('filter')) {
      try {
        const filterInUrl = JSON.parse(decodeURI(searchParams.get('filter')));
        if (validateFilter(filterInUrl, props.filterConfig))
          initialAppliedFilters = filterInUrl;
        else throw undefined;
      } catch (e) {
        console.error('Invalid filter value in URL.', e);
        props.history.push({ search: '' });
      }
    }

    const patientIds = props.patientIdsConfig?.enabled
      ? searchParams.has('patientIds')
        ? searchParams.get('patientIds').split(',')
        : []
      : undefined;

    this.state = {
      initialAppliedFilters,
      patientIds,
    };
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  updateInitialAppliedFilters = ({ filters }) => {
    if (this._isMounted) this.setState({ initialAppliedFilters: filters });
  };

  handleFilterChange = (filter) => {
    const searchParams = new URLSearchParams(
      this.props.history.location.search
    );
    searchParams.delete('filter');

    if (filter && Object.keys(filter).length > 0) {
      const allSearchFields = [];
      for (const { searchFields } of this.props.filterConfig.tabs)
        if (searchFields?.length > 0) allSearchFields.push(...searchFields);

      if (allSearchFields.length === 0) {
        searchParams.set('filter', JSON.stringify(filter));
      } else {
        const allSearchFieldSet = new Set(allSearchFields);
        const filterWithoutSearchFields = {};
        for (const field of Object.keys(filter))
          if (!allSearchFieldSet.has(field))
            filterWithoutSearchFields[field] = filter[field];

        if (Object.keys(filterWithoutSearchFields).length > 0)
          searchParams.set('filter', JSON.stringify(filterWithoutSearchFields));
      }
    }

    this.props.history.push({
      search: Array.from(searchParams.entries(), (e) => e.join('=')).join('&'),
    });
  };

  handlePatientIdsChange = this.props.patientIdsConfig?.enabled
    ? (patientIds) => {
        const searchParams = new URLSearchParams(
          this.props.history.location.search
        );
        searchParams.delete('patientIds');

        if (patientIds.length > 0)
          searchParams.set('patientIds', patientIds.join(','));

        this.setState({ patientIds });
        this.props.history.push({
          search: Array.from(searchParams.entries(), (e) => e.join('=')).join(
            '&'
          ),
        });
      }
    : () => {};

  render() {
    return (
      <ExplorerErrorBoundary>
        <div className='guppy-data-explorer'>
          <GuppyWrapper
            adminAppliedPreFilters={this.props.adminAppliedPreFilters}
            initialAppliedFilters={this.state.initialAppliedFilters}
            filterConfig={this.props.filterConfig}
            guppyConfig={this.props.guppyConfig}
            onFilterChange={this.handleFilterChange}
            rawDataFields={this.props.tableConfig.fields}
            patientIds={this.state.patientIds}
          >
            <ExplorerTopMessageBanner
              className='guppy-data-explorer__top-banner'
              getAccessButtonLink={this.props.getAccessButtonLink}
              hideGetAccessButton={this.props.hideGetAccessButton}
            />
            <ExplorerCohort
              className='guppy-data-explorer__cohort'
              onOpenCohort={this.updateInitialAppliedFilters}
              onDeleteCohort={this.updateInitialAppliedFilters}
            />
            <ExplorerFilter
              className='guppy-data-explorer__filter'
              filterConfig={this.props.filterConfig}
              guppyConfig={this.props.guppyConfig}
              getAccessButtonLink={this.props.getAccessButtonLink}
              hideGetAccessButton={this.props.hideGetAccessButton}
              tierAccessLimit={this.props.tierAccessLimit}
              adminAppliedPreFilters={this.props.adminAppliedPreFilters}
              initialAppliedFilters={this.props.initialAppliedFilters}
              onPatientIdsChange={this.handlePatientIdsChange}
            />
            <ExplorerVisualization
              className='guppy-data-explorer__visualization'
              chartConfig={this.props.chartConfig}
              tableConfig={this.props.tableConfig}
              survivalAnalysisConfig={this.props.survivalAnalysisConfig}
              buttonConfig={this.props.buttonConfig}
              guppyConfig={this.props.guppyConfig}
              history={this.props.history}
              nodeCountTitle={
                this.props.guppyConfig.nodeCountTitle ||
                capitalizeFirstLetter(this.props.guppyConfig.dataType)
              }
              tierAccessLimit={this.props.tierAccessLimit}
            />
          </GuppyWrapper>
        </div>
      </ExplorerErrorBoundary>
    );
  }
}

GuppyDataExplorer.propTypes = {
  guppyConfig: GuppyConfigType.isRequired,
  filterConfig: FilterConfigType.isRequired,
  tableConfig: TableConfigType.isRequired,
  survivalAnalysisConfig: SurvivalAnalysisConfigType.isRequired,
  patientIdsConfig: PatientIdsConfigType,
  chartConfig: ChartConfigType.isRequired,
  buttonConfig: ButtonConfigType.isRequired,
  nodeCountTitle: PropTypes.string,
  history: PropTypes.object.isRequired,
  tierAccessLimit: PropTypes.number.isRequired,
  getAccessButtonLink: PropTypes.string,
  hideGetAccessButton: PropTypes.bool,
  adminAppliedPreFilters: PropTypes.object,
};

GuppyDataExplorer.defaultProps = {
  nodeCountTitle: undefined,
  getAccessButtonLink: undefined,
  hideGetAccessButton: false,
  adminAppliedPreFilters: {},
};

export default GuppyDataExplorer;
