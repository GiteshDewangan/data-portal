/* eslint-disable no-shadow */
import { memo, useState } from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';
import Spinner from '../../components/Spinner';
import { useExplorerConfig } from '../ExplorerConfigContext';
import useSurvivalAnalysisResult from './useSurvivalAnalysisResult';
import SurvivalPlot from './SurvivalPlot';
import ControlForm from './ControlForm';
import RiskTable from './RiskTable';
import UserAgreement from './UserAgreement';
import { checkUserAgreement, handleUserAgreement } from './utils';
import './ExplorerSurvivalAnalysis.css';

/** @typedef {import('./types').UserInputSubmitHandler} UserInputSubmitHandler */

function ExplorerSurvivalAnalysis() {
  const [isUserCompliant, setIsUserCompliant] = useState(checkUserAgreement());

  const [parsedResult, refershResult] = useSurvivalAnalysisResult();
  const [timeInterval, setTimeInterval] = useState(4);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(undefined);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  /** @type {UserInputSubmitHandler} */
  const handleSubmit = ({
    timeInterval,
    startTime,
    endTime,
    efsFlag,
    usedFilterSets,
  }) => {
    setError(null);
    setIsUpdating(true);
    setTimeInterval(timeInterval);
    setStartTime(startTime);
    setEndTime(endTime);

    refershResult({ efsFlag, usedFilterSets })
      .catch(setError)
      .finally(() => setIsUpdating(false));
  };

  const { survivalAnalysisConfig: config } = useExplorerConfig().current;

  return (
    <div className='explorer-survival-analysis'>
      {isUserCompliant ? (
        <>
          <div className='explorer-survival-analysis__column-left'>
            <ControlForm
              countByFilterSet={parsedResult.count}
              onSubmit={handleSubmit}
              timeInterval={timeInterval}
            />
          </div>
          <div className='explorer-survival-analysis__column-right'>
            {isUpdating ? (
              <Spinner />
            ) : (
              <ErrorBoundary
                fallback={
                  <div className='explorer-survival-analysis__error'>
                    <h1>Error obtaining survival analysis result...</h1>
                    {error?.message ? (
                      <p className='explorer-survival-analysis__error-message'>
                        <pre>
                          <strong>Error message:</strong> {error.message}
                        </pre>
                      </p>
                    ) : null}
                    <p>
                      Please retry by clicking {'"Apply"'} button or refreshing
                      the page. If the problem persists, please contact the
                      administrator (
                      <a href='mailto:pcdc_help@lists.uchicago.edu'>
                        pcdc_help@lists.uchicago.edu
                      </a>
                      ) for more information.
                    </p>
                  </div>
                }
              >
                {config.result?.survival && (
                  <SurvivalPlot
                    data={parsedResult.survival}
                    endTime={endTime}
                    startTime={startTime}
                    timeInterval={timeInterval}
                  />
                )}
                {config.result?.risktable && (
                  <RiskTable
                    data={parsedResult.risktable}
                    endTime={endTime}
                    startTime={startTime}
                    timeInterval={timeInterval}
                  />
                )}
              </ErrorBoundary>
            )}
          </div>
        </>
      ) : (
        <UserAgreement
          onAgree={() => {
            handleUserAgreement();
            setIsUserCompliant(checkUserAgreement());
          }}
        />
      )}
    </div>
  );
}

export default memo(ExplorerSurvivalAnalysis);
