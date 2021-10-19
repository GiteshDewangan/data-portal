import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../gen3-ui-component/components/Button';
import './ExplorerTopMessageBanner.css';

/**
 * @typedef {Object} ExplorerTopMessageBannerProps
 * @property {string} [className]
 * @property {string} getAccessButtonLink
 * @property {boolean} [hideGetAccessButton]
 * @property {number} accessibleCount
 * @property {number} totalCount
 */

/** @param {ExplorerTopMessageBannerProps} props */
function ExplorerTopMessageBanner({
  className = '',
  getAccessButtonLink,
  hideGetAccessButton = false,
  accessibleCount,
  totalCount,
}) {
  return (
    accessibleCount !== totalCount && (
      <div className={className}>
        <div className='top-message-banner'>
          <div className='top-message-banner__space-column' />
          <div className='top-message-banner__text-column'>
            <div className='top-message-banner__button-wrapper'>
              {hideGetAccessButton ? null : (
                <Button
                  label='Request Access'
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
                {accessibleCount === 0
                  ? 'You do not have permissions to view line-level data. To request access, please reach out to the PCDC team.'
                  : 'You have only limited access to line-level data. To request access to more data, please reach out to the PCDC team.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

ExplorerTopMessageBanner.propTypes = {
  className: PropTypes.string,
  getAccessButtonLink: PropTypes.string,
  hideGetAccessButton: PropTypes.bool,
  accessibleCount: PropTypes.number,
  totalCount: PropTypes.number,
};

export default ExplorerTopMessageBanner;
