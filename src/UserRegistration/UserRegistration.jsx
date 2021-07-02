import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SimplePopup from '../components/SimplePopup';
import { headers, userapiPath } from '../localconf';
import RegistrationForm from './RegistrationForm';
import './UserRegistration.css';
import './typedef';

/**
 * @param {Object} prop
 * @param {UserRegistrationDocument[]} prop.docsToBeReviewed
 * @param {boolean} prop.shouldRegister
 * @param {(responses: Response[]) => Promise<('success' | 'error')>} prop.updateAccess
 */
function UserRegistration({ docsToBeReviewed, shouldRegister, updateAccess }) {
  const [show, setShow] = useState(shouldRegister);

  function handleClose() {
    setShow(false);
  }

  function handleRegister(/** @type {UserRegistrationInput} */ userInput) {
    return Promise.all([
      fetch(`${userapiPath}user/`, {
        body: JSON.stringify(userInput),
        credentials: 'include',
        headers,
        method: 'PUT',
      }),
    ]).then(updateAccess);
  }

  function handleSubscribe() {
    window.open('http://sam.am/PCDCnews', '_blank');
  }

  return (
    show && (
      <SimplePopup>
        <RegistrationForm
          docsToBeReviewed={docsToBeReviewed}
          onClose={handleClose}
          onRegister={handleRegister}
          onSubscribe={handleSubscribe}
        />
      </SimplePopup>
    )
  );
}

UserRegistration.propTypes = {
  docsToBeReviewed: PropTypes.array,
  shouldRegister: PropTypes.bool.isRequired,
  updateAccess: PropTypes.func.isRequired,
};

export default UserRegistration;
