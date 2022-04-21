import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { headers, userapiPath } from '../../localconf';
import Button from '../../gen3-ui-component/components/Button';

const pcdcStatisticalManualLink = (
  <a
    href='https://commons.cri.uchicago.edu/wp-content/uploads/2022/04/PCDC-Analytics-Tool-Documentation-Statistical-Manual.pdf'
    target='_black'
    rel='noopener noreferrer'
  >
    PCDC Statistical Manual
    <i className='g3-icon g3-icon--external-link g3-icon--sm g3-icon-color__gray' />
  </a>
);
const statisticalConsiderationVidoeLink = (
  <a
    href='https://youtu.be/d_x8taJ-lP8'
    target='_black'
    rel='noopener noreferrer'
  >
    Watch this video
    <i className='g3-icon g3-icon--external-link g3-icon--sm g3-icon-color__gray' />
  </a>
);

const checkItems = [
  <>
    I have read the {pcdcStatisticalManualLink} and agree to abide by the
    principles and policies set forth in the manual.
  </>,
  'My activity on the PCDC Data Portal will be logged and audited to assess the effectiveness of the pilot and to investigate possible misuse or abuse.',
  'PCDC staff may contact me to investigate cases of suspected abuse or misuse of web-based analytics tools. I will promptly respond to inquiries regarding my use of the tools.',
  'I will not violate the PCDC Terms of Use or Acceptable Use Policy.',
  'I will not engage in p-hacking or other forms of statistical misuse.',
  'I will not reproduce or distribute results generated using web-based analytics tools.',
  'I will follow a hypothesis-driven approach when performing analyses and maintain a hypothesis record.',
];

/** @param {{ user: import('@src/types').UserState }} state */
function fullnameSelector(state) {
  const { additional_info: info, username } = state.user;
  return info?.firstName && info?.lastName
    ? `${info?.firstName} ${info?.lastName}`
    : username;
}

/** @param {{ onAgree: () => void }} props */
function AgreementForm({ onAgree }) {
  const fullname = useSelector(fullnameSelector);

  const initalCheckStatus = {};
  for (const i of checkItems.keys()) initalCheckStatus[i] = false;
  const [checkStatus, setCheckstatus] = useState(initalCheckStatus);
  return (
    <>
      <p>
        The PCDC is piloting a Kaplan-Meier survival analysis tool. Due to the
        potential for statistical misuse and abuse with use of the tool,
        safeguards have been implemented to facilitate responsible data
        exploration.
      </p>
      <p>
        All users of the Kaplan-Meier survival analysis tool are required to
        review the {pcdcStatisticalManualLink}. The manual outlines principles
        for responsible data exploration and sets forth policies users must
        agree to abide by. {statisticalConsiderationVidoeLink} for a summary of
        important statistical considerations.
      </p>
      <p>I, {fullname}, agree that:</p>
      <ul>
        {checkItems.map((item, i) => (
          <li key={i}>
            <label>
              <input
                type='checkbox'
                checked={checkStatus[i]}
                onChange={(e) => {
                  e.persist();
                  setCheckstatus((prev) => ({
                    ...prev,
                    [i]: e.target.checked,
                  }));
                }}
              />{' '}
              {item}
            </label>
          </li>
        ))}
      </ul>
      <div className='explorer-survival-analysis__button-group'>
        <Button
          buttonType='primary'
          label='I Agree'
          enabled={Object.values(checkStatus).every(Boolean)}
          onClick={onAgree}
        />
      </div>
    </>
  );
}

AgreementForm.propTypes = { onAgree: PropTypes.func };

/** @param {{ onAgree: () => void }} props */
function ReminderForm({ onAgree }) {
  return (
    <>
      <p>
        You must agree to the following terms, as outlined in the{' '}
        {pcdcStatisticalManualLink} and Acceptable Use Policy, to proceed:
      </p>
      <ul style={{ listStyleType: 'initial' }}>
        <li>I will not engage in p-hacking.</li>
        <li>I will maintain a hypothesis record.</li>
        <li>I will not reproduce or distribute results without permission.</li>
        <li>My use will be logged and audited.</li>
      </ul>

      <div className='explorer-survival-analysis__button-group'>
        <Button buttonType='primary' label='Continue' onClick={onAgree} />
      </div>
    </>
  );
}

ReminderForm.propTypes = { onAgree: PropTypes.func };

/** @param {{ user: import('@src/types').UserState }} state */
function userAgreementDocSelector(state) {
  return state.user.docs_to_be_reviewed.find(
    ({ type }) => type === 'survival-user-agreement'
  );
}

/** @param {{ onAgree: () => void }} props */
function UserAgreement({ onAgree }) {
  const userAgreementDoc = useSelector(userAgreementDocSelector);

  function submitSurvivalUserAgreement() {
    fetch(`${userapiPath}user/documents`, {
      body: JSON.stringify({ [userAgreementDoc?.id]: true }),
      credentials: 'include',
      headers,
      method: 'POST',
    }).then(() => {
      onAgree();
    });
  }

  return (
    <div className='explorer-survival-analysis__user-agreement'>
      {userAgreementDoc !== undefined ? (
        <AgreementForm onAgree={submitSurvivalUserAgreement} />
      ) : (
        <ReminderForm onAgree={onAgree} />
      )}
    </div>
  );
}

UserAgreement.propTypes = { onAgree: PropTypes.func };

export default UserAgreement;
