import { combineReducers } from 'redux';
// import coreMetadata from './CoreMetadata/reducers';
import ddgraph from './DataDictionary/reducers';
import graphiql from './GraphQLEditor/reducers';
import index from './Index/reducers';
import login from './Login/reducers';
import popups from './Popup/reducers';
import queryNodes from './QueryNode/reducers';
import submission from './Submission/reducers';
import userProfile from './UserProfile/reducers';

/** @typedef {import('./types').KubeState} KubeState */
/** @typedef {import('./types').ProjectState} ProjectState */
/** @typedef {import('./types').StatusState} StatusState */
/** @typedef {import('./types').UserState} UserState */
/** @typedef {import('./types').UserAccessState} UserAccessState */
/** @typedef {import('./types').VersionInfoState} VersionInfoState */

/** @type {import('redux').Reducer<KubeState>} */
const kube = (state = /** @type {KubeState} */ ({}), action) => {
  switch (action.type) {
    case 'RECEIVE_JOB_DISPATCH':
      return { ...state, job: action.data };
    case 'RECEIVE_JOB_STATUS': {
      const job = { ...action.data, resultURL: action.resultURL };
      return { ...state, job };
    }
    case 'JOB_STATUS_INTERVAL':
      return { ...state, jobStatusInterval: action.value };
    case 'RESET_JOB':
      return { ...state, job: null, jobStatusInterval: null, resultURL: null };
    default:
      return state;
  }
};

/** @type {import('redux').Reducer<ProjectState>} */
const project = (state = /** @type {ProjectState} */ ({}), action) => {
  /** @type {ProjectState['projects']} */
  const projects = {};
  /** @type {ProjectState['projectAvail']} */
  const projectAvail = {};
  switch (action.type) {
    case 'RECEIVE_PROJECTS':
      for (const d of action.data) {
        projects[d.code] = d.project_id;
        projectAvail[d.project_id] = d.availability_type;
      }
      return { ...state, projects, projectAvail };
    default:
      return state;
  }
};

/** @type {import('redux').Reducer<StatusState>} */
const status = (state = /** @type {StatusState} */ ({}), action) => {
  switch (action.type) {
    case 'REQUEST_ERROR':
      return { ...state, request_state: 'error', error_type: action.error };
    default:
      return state;
  }
};

/** @type {import('redux').Reducer<UserState>} */
const user = (state = /** @type {UserState} */ ({}), action) => {
  switch (action.type) {
    case 'RECEIVE_USER':
      return {
        ...state,
        ...action.user,
        fetched_user: true,
        lastAuthMs: Date.now(),
      };
    case 'FETCH_ERROR':
      return { ...state, fetched_user: true, fetch_error: action.error };
    case 'RECEIVE_API_LOGOUT':
      return { ...state, lastAuthMs: 0 };
    default:
      return state;
  }
};

/** @type {import('redux').Reducer<UserAccessState>} */
const userAccess = (
  state = /** @type {UserAccessState} */ ({ access: {} }),
  action
) => {
  switch (action.type) {
    case 'RECEIVE_USER_ACCESS':
      return { ...state, access: action.data };
    default:
      return state;
  }
};

/** @type {import('redux').Reducer<VersionInfoState>} */
const versionInfo = (state = /** @type {VersionInfoState} */ ({}), action) => {
  switch (action.type) {
    case 'RECEIVE_VERSION_INFO':
      return {
        ...state,
        dataVersion: action.data || '',
      };
    default:
      return state;
  }
};

const reducers = combineReducers({
  // coreMetadata,
  ddgraph,
  index,
  graphiql,
  kube,
  login,
  popups,
  project,
  queryNodes,
  status,
  submission,
  user,
  userAccess,
  userProfile,
  versionInfo,
});

export default reducers;
