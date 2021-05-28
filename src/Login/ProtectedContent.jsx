import React from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  fetchDictionary,
  fetchProjects,
  fetchSchema,
  fetchUser,
  fetchUserAccess,
} from '../actions';
import Spinner from '../components/Spinner';
import getReduxStore from '../reduxStore';
import { requiredCerts } from '../localconf';
import ReduxAuthTimeoutPopup from '../Popup/ReduxAuthTimeoutPopup';
import { intersection, isPageFullScreen } from '../utils';
import './ProtectedContent.css';

/**
 * @typedef {Object} ComponentState
 * @property {boolean} authenticated
 * @property {boolean} dataLoaded
 * @property {?string} redirectTo
 * @property {?string} from
 * @property {?Object} user
 */

/** @typedef {Object} ReduxStore */

const LOCATIONS_DICTIONARY = [
  '/dd',
  '/dd/:node',
  '/submission/map',
  '/:project',
];
const LOCATIONS_PROJECTS = ['/files/*'];
const LOCATIONS_SCHEMA = ['/query'];

/**
 * Container for components that require authentication to access.
 * Takes a few properties
 * @typedef {object} Props
 * @property {React.ComponentType<*>} component required child component
 * @property {*} location from react-router
 * @property {*} history from react-router
 * @property {*} match from react-router.match
 * @property {boolean} isAdminOnly default false - if true, redirect to index page
 * @property {boolean} isPublic default false - set true to disable auth-guard
 * @property {() => Promise} filter optional filter to apply before rendering the child component
 * @extends {React.Component<Props>}
 */
class ProtectedContent extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = /** @type {ComponentState} */ {
      authenticated: false,
      dataLoaded: false,
      redirectTo: null,
      from: null,
      user: null,
    };

    this._isMounted = false;
  }

  /**
   * We start out in an unauthenticated state
   * After mount, checks if the current session is authenticated
   */
  componentDidMount() {
    this._isMounted = true;
    window.scrollTo(0, 0);

    if (this._isMounted)
      getReduxStore().then((store) =>
        Promise.all([
          store.dispatch({ type: 'CLEAR_COUNTS' }), // clear some counters
          store.dispatch({ type: 'CLEAR_QUERY_NODES' }),
        ]).then(() => {
          const { filter } = this.props;

          if (this.props.isPublic) {
            const latestState = { ...store, dataLoaded: true };

            if (typeof filter === 'function') {
              filter().finally(
                () => this._isMounted && this.setState(latestState)
              );
            } else if (this._isMounted) {
              this.setState(latestState);
            }
          } else
            this.checkLoginStatus(store, this.state)
              .then((newState) => this.checkIfRegisterd(newState))
              .then((newState) => this.checkIfAdmin(newState))
              .then((newState) => this.checkQuizStatus(newState))
              .then((newState) => {
                const latestState = { ...newState, dataLoaded: true };

                if (newState.authenticated && typeof filter === 'function') {
                  filter().finally(() => {
                    if (this._isMounted) this.setState(latestState);
                    this.fetchResources(store);
                  });
                } else {
                  if (this._isMounted) this.setState(latestState);
                  this.fetchResources(store);
                }
              });
        })
      );
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  /**
   * Start filter the 'newState' for the checkLoginStatus component.
   * Check if the user is logged in, and update state accordingly.
   * @param {ReduxStore} store
   * @param {ComponentState} initialState
   * @returns {Promise<ComponentState>}
   */
  checkLoginStatus = (store, initialState) => {
    const newState = {
      ...initialState,
      authenticated: true,
      redirectTo: null,
      user: store.getState().user,
    };

    // assume we're still logged in after 1 minute ...
    if (Date.now() - newState.user.lastAuthMs < 10000)
      return Promise.resolve(newState);

    return store
      .dispatch(fetchUser) // make an API call to see if we're still logged in ...
      .then(() => {
        newState.user = store.getState().user;
        if (!newState.user.username) {
          // not authenticated
          newState.redirectTo = '/login';
          newState.authenticated = false;
          newState.from = this.props.location; // save previous location
        } else {
          store.dispatch(fetchUserAccess);
        }
        return newState;
      });
  };

  /**
   * Check if user is registered, and update state accordingly.
   * @param {ComponentState} initialState
   * @returns {ComponentState}
   */
  checkIfRegisterd = (initialState) => {
    const isUserRegistered =
      initialState.user.authz !== undefined &&
      Object.keys(initialState.user.authz).length > 0;

    return this.props.location.pathname === '/' || isUserRegistered
      ? initialState
      : { ...initialState, redirectTo: '/' };
  };

  /**
   * Check if user is admin if needed, and update state accordingly.
   * @param {ComponentState} initialState
   * @returns {ComponentState}
   */
  checkIfAdmin = (initialState) => {
    if (!this.props.isAdminOnly) return initialState;

    const resourcePath = '/services/sheepdog/submission/project';
    const isAdminUser =
      initialState.user.authz?.[resourcePath]?.[0].method === '*';
    return isAdminUser ? initialState : { ...initialState, redirectTo: '/' };
  };

  /**
   * Filter the 'newState' for the ProtectedComponent.
   * User needs to take a security quiz before he/she can acquire tokens
   * @param {ComponentState} initialState
   * @returns {ComponentState}
   */
  checkQuizStatus = (initialState) => {
    const isUserAuthenticated =
      initialState.authenticated &&
      initialState.user &&
      initialState.user.username;
    if (!isUserAuthenticated) return initialState;

    const newState = { ...initialState };
    const userCerts = newState.user.certificates_uploaded;
    const isUserMissingCerts =
      intersection(requiredCerts, userCerts).length !== requiredCerts.length;
    // take quiz if this user doesn't have required certificate
    if (this.props.match.path !== '/quiz' && isUserMissingCerts) {
      newState.redirectTo = '/quiz';
      newState.from = this.props.location;
      // do not update lastAuthMs (indicates time of last successful auth)
    } else if (this.props.match.path === '/quiz' && !isUserMissingCerts) {
      newState.redirectTo = '/';
      newState.from = this.props.location;
    }
    return newState;
  };

  /**
   * Fetch resources on demand based on path
   * @param {ReduxStore} store
   */
  fetchResources({ dispatch, getState }) {
    const { graphiql, project, submission } = getState();
    const { path } = this.props.match;

    if (LOCATIONS_DICTIONARY.includes(path) && !submission.dictionary) {
      dispatch(fetchDictionary);
    } else if (LOCATIONS_PROJECTS.includes(path) && !project.projects) {
      dispatch(fetchProjects);
    } else if (LOCATIONS_SCHEMA.includes(path) && !graphiql.schema) {
      dispatch(fetchSchema);
    }
  }

  render() {
    if (this.state.redirectTo)
      return (
        <Redirect
          to={{ pathname: this.state.redirectTo }} // send previous location to redirect
          from={
            this.state.from && this.state.from.pathname
              ? this.state.from.pathname
              : '/'
          }
        />
      );

    const pageClassName = isPageFullScreen(this.props.location.pathname)
      ? 'protected-content protected-content--full-screen'
      : 'protected-content';
    return (
      <div className={pageClassName}>
        {(this.props.isPublic
          ? (this.state.dataLoaded ||
              typeof this.props.filter !== 'function') &&
            this.props.children
          : this.state.authenticated && (
              <>
                <ReduxAuthTimeoutPopup />
                {this.props.children}
              </>
            )) || <Spinner />}
      </div>
    );
  }
}

ProtectedContent.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.object,
    path: PropTypes.string,
  }).isRequired,
  isAdminOnly: PropTypes.bool,
  isPublic: PropTypes.bool,
  filter: PropTypes.func,
};

ProtectedContent.defaultProps = {
  isAdminOnly: false,
  isPublic: false,
  filter: null,
};

export default ProtectedContent;
