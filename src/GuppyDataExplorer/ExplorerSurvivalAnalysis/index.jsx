/* eslint-disable no-shadow */
import { memo, useMemo, useState } from 'react';
import { schemeCategory10 } from 'd3-scale-chromatic';
import Spinner from '../../components/Spinner';
import { useExplorerConfig } from '../ExplorerConfigContext';
import useSurvivalAnalysisResult from './useSurvivalAnalysisResult';
import SurvivalPlot from './SurvivalPlot';
import ControlForm from './ControlForm';
import RiskTable from './RiskTable';
import './ExplorerSurvivalAnalysis.css';
import './typedef';

function ExplorerSurvivalAnalysis() {
  const [[risktable, survival], refershResult] = useSurvivalAnalysisResult();
  const [timeInterval, setTimeInterval] = useState(2);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(20);

  const colorScheme = useMemo(() => {
    /** @type {ColorScheme} */
    const colorScheme = {};
    let count = 0;
    for (const { name } of survival)
      if (colorScheme[name] === undefined) {
        colorScheme[name] = schemeCategory10[count % 9];
        count += 1;
      }

    return colorScheme;
  }, [survival]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isError, setIsError] = useState(false);
  /** @type {UserInputSubmitHandler} */
  const handleSubmit = ({
    timeInterval,
    startTime,
    endTime,
    usedFilterSets,
  }) => {
    if (isError) setIsError(false);
    setIsUpdating(true);
    setTimeInterval(timeInterval);
    setStartTime(startTime);
    setEndTime(endTime);

    refershResult(usedFilterSets)
      .then(() => setIsUpdating(false))
      .catch(() => {
        setIsError(true);
        setIsUpdating(false);
      });
  };

  const { survivalAnalysisConfig: config } = useExplorerConfig().current;

  return (
    <div className='explorer-survival-analysis'>
      <div className='explorer-survival-analysis__column-left'>
        <ControlForm
          onSubmit={handleSubmit}
          timeInterval={timeInterval}
          isError={isError}
        />
      </div>
      <div className='explorer-survival-analysis__column-right'>
        {/* eslint-disable-next-line no-nested-ternary */}
        {isUpdating ? (
          <Spinner />
        ) : isError ? (
          <div className='explorer-survival-analysis__error'>
            <h1>Error obtaining survival analysis result...</h1>
            <p>
              Please retry by clicking {'"Apply"'} button or refreshing the
              page. If the problem persists, please contact administrator for
              more information.
            </p>
          </div>
        ) : (
          <>
            {config.result?.survival && (
              <SurvivalPlot
                colorScheme={colorScheme}
                data={survival}
                endTime={endTime}
                startTime={startTime}
                timeInterval={timeInterval}
              />
            )}
            {config.result?.risktable && (
              <RiskTable
                data={risktable}
                endTime={endTime}
                startTime={startTime}
                timeInterval={timeInterval}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(ExplorerSurvivalAnalysis);
