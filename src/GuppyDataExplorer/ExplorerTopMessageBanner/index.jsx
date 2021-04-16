import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../gen3-ui-component/components/Button';
import './ExplorerTopMessageBanner.css';

function ExplorerTopMessageBanner({
  className = '',
  getAccessButtonLink,
  hideBanner = true,
  hideGetAccessButton = false,
}) {
  return hideBanner ? null : (
    <div className={className}>
      <div className='top-message-banner'>
        <div className='top-message-banner__space-column' />
        <div className='top-message-banner__text-column'>
          <div className='top-message-banner__button-wrapper'>
            {hideGetAccessButton ? null : (
              <Button
                label='Get Access'
                className='top-message-banner__button'
                buttonType='default'
                enabled={!!getAccessButtonLink}
                tooltipEnabled={!getAccessButtonLink}
                tooltipText='Coming soon'
                onClick={() =>
                  getAccessButtonLink && window.open(getAccessButtonLink)
                }
              />
            )}
          </div>
          <div className='top-message-banner__text-wrapper'>
            <span className='top-message-banner__normal-text'>
              You do not have permissions to view line-level data. To request
              access please reach out to the PCDC team.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

ExplorerTopMessageBanner.propTypes = {
  className: PropTypes.string,
  getAccessButtonLink: PropTypes.string,
  hideBanner: PropTypes.bool,
  hideGetAccessButton: PropTypes.bool,
};

export default ExplorerTopMessageBanner;
