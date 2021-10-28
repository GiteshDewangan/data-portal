import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import GuppyDataExplorer from './GuppyDataExplorer';
import { guppyUrl, tierAccessLimit, explorerConfig } from '../localconf';
import { capitalizeFirstLetter } from '../utils';
import './GuppyExplorer.css';
import './typedef';

export default function Explorer() {
  if (explorerConfig.length === 0) {
    return null;
  }
  const explorerIds = explorerConfig.map(({ id }) => id);
  const history = useHistory();

  const initialSearchParams = new URLSearchParams(history.location.search);
  const initialSearchParamId = initialSearchParams.has('id')
    ? Number(initialSearchParams.get('id'))
    : undefined;
  const initialExplorerId = explorerIds.includes(initialSearchParamId)
    ? initialSearchParamId
    : explorerIds[0];

  const [explorerId, setExporerId] = useState(initialExplorerId);
  useEffect(() => {
    const searchParams = new URLSearchParams(history.location.search);
    searchParams.set('id', String(explorerId));
    history.push({
      search: Array.from(searchParams.entries(), (e) => e.join('=')).join('&'),
    });
  }, [explorerId]);

  /** @type {SingleExplorerConfig} */
  const config = explorerConfig.find(({ id }) => id === explorerId);
  const isMultiExplorer = explorerConfig.length > 1;

  return (
    <div className='guppy-explorer'>
      {isMultiExplorer && (
        <div className='guppy-explorer__tabs'>
          {explorerConfig.map(({ guppyConfig, id, label }) => (
            <div
              key={id}
              className={'guppy-explorer__tab'.concat(
                explorerId === id ? ' guppy-explorer__tab--selected' : ''
              )}
              onClick={() => setExporerId(id)}
              onKeyPress={(e) => {
                if (e.charCode === 13 || e.charCode === 32) {
                  e.preventDefault();
                  setExporerId(id);
                }
              }}
              role='button'
              tabIndex={0}
            >
              <h3>{capitalizeFirstLetter(label || guppyConfig.dataType)}</h3>
            </div>
          ))}
        </div>
      )}
      <div className={isMultiExplorer ? 'guppy-explorer__main' : ''}>
        <GuppyDataExplorer
          adminAppliedPreFilters={config.adminAppliedPreFilters}
          chartConfig={config.charts}
          filterConfig={config.filters}
          tableConfig={config.table}
          survivalAnalysisConfig={config.survivalAnalysis}
          patientIdsConfig={config.patientIds}
          guppyConfig={{
            path: guppyUrl,
            ...config.guppyConfig,
          }}
          buttonConfig={{
            buttons: config.buttons,
            dropdowns: config.dropdowns,
            terraExportURL: config.terraExportURL,
            terraTemplate: config.terraTemplate,
            sevenBridgesExportURL: config.sevenBridgesExportURL,
          }}
          tierAccessLimit={tierAccessLimit}
          getAccessButtonLink={config.getAccessButtonLink}
          hideGetAccessButton={config.hideGetAccessButton}
          // the "fully uncontrolled component with a key" trick
          key={config.id}
        />
      </div>
    </div>
  );
}
