/* eslint-disable no-shadow */
import { memo, useRef, useState } from 'react';
import { contactEmail } from '../../localconf';
import ErrorBoundary from '../../components/ErrorBoundary';
import Spinner from '../../components/Spinner';
import { updateSurvivalResult } from '../../redux/explorer/asyncThunks';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import SurvivalPlot from './SurvivalPlot';
import ControlForm from './ControlForm';
import RiskTable from './RiskTable';
import UserAgreement from './UserAgreement';
import { checkUserAgreement, handleUserAgreement } from './utils';
import './ExplorerSurvivalAnalysis.css';

/** @typedef {import('./types').UserInputSubmitHandler} UserInputSubmitHandler */

function ExplorerSurvivalAnalysis() {
  const dispatch = useAppDispatch();
  const config = useAppSelector(
    (state) => state.explorer.config.survivalAnalysisConfig
  );
  const result = useAppSelector(
    (state) => state.explorer.survivalAnalysisResult
  );

  const [isUserCompliant, setIsUserCompliant] = useState(checkUserAgreement());
  const [timeInterval, setTimeInterval] = useState(4);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(undefined);

  const prevEfsFlag = useRef(false);
  /** @type {UserInputSubmitHandler} */
  const handleSubmit = ({
    timeInterval,
    startTime,
    endTime,
    efsFlag,
    usedFilterSets,
  }) => {
    setTimeInterval(timeInterval);
    setStartTime(startTime);
    setEndTime(endTime);

    const shouldRefetch = prevEfsFlag.current !== efsFlag;
    if (shouldRefetch) prevEfsFlag.current = efsFlag;
    dispatch(updateSurvivalResult({ efsFlag, shouldRefetch, usedFilterSets }));
  };

  return (
    <div className='explorer-survival-analysis'>
      {isUserCompliant ? (
        <>
          <div className='explorer-survival-analysis__column-left'>
            <ControlForm
              countByFilterSet={result.parsed?.count}
              onSubmit={handleSubmit}
              timeInterval={timeInterval}
            />
          </div>
          <div className='explorer-survival-analysis__column-right'>
            {result.isPending ? (
              <Spinner />
            ) : (
              <ErrorBoundary
                fallback={
                  <div className='explorer-survival-analysis__error'>
                    <h1>Error obtaining survival analysis result...</h1>
                    {result.error?.message ? (
                      <p className='explorer-survival-analysis__error-message'>
                        <pre>
                          <strong>Error message:</strong> {result.error.message}
                        </pre>
                      </p>
                    ) : null}
                    <p>
                      Please retry by clicking {'"Apply"'} button or refreshing
                      the page. If the problem persists, please contact the
                      administrator (
                      <a href={`mailto:${contactEmail}`}>{contactEmail}</a>) for
                      more information.
                    </p>
                  </div>
                }
              >
                {config.result?.survival && (
                  <SurvivalPlot
                    data={result.parsed?.survival}
                    endTime={endTime}
                    startTime={startTime}
                    timeInterval={timeInterval}
                  />
                )}
                {config.result?.risktable && (
                  <RiskTable
                    data={result.parsed?.risktable}
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
