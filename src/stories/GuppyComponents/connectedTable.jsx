import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import ConnectedFilter from '../../GuppyComponents/ConnectedFilter';
import GuppyWrapper from '../../GuppyComponents/GuppyWrapper';
import TableExample from './TableExample';
import './guppyWrapper.css';
import { filterConfig, guppyConfig, tableConfig } from './conf';

storiesOf('Guppy Wrapper', module).add('Connected Filter and Table', () => (
  <div className='guppy-wrapper'>
    <GuppyWrapper
      filterConfig={filterConfig}
      guppyConfig={guppyConfig}
      rawDataFields={tableConfig.map((e) => e.field)}
      onFilterChange={action('wrapper receive filter change')}
    >
      {(data) => (
        <>
          <ConnectedFilter
            className='guppy-wrapper__filter'
            filterConfig={filterConfig}
            guppyConfig={guppyConfig}
            filter={data.filter}
            onFilterChange={data.onFilterChange}
            receivedAggsData={data.receivedAggsData}
            initialTabsOptions={data.initialTabsOptions}
          />
          <TableExample
            className='guppy-wrapper__table'
            fetchAndUpdateRawData={data.fetchAndUpdateRawData}
            rawData={data.rawData}
            totalCount={data.totalCount}
          />
        </>
      )}
    </GuppyWrapper>
  </div>
));
