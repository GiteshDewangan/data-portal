import { buildClientSchema, getIntrospectionQuery } from 'graphql/utilities';
import { receiveGraphvizLayout } from './DataDictionary/action';
import { receiveGuppySchema, receiveSchema } from './GraphQLEditor/actions';
import {
  userapiPath,
  guppyGraphQLUrl,
  headers,
  hostname,
  submissionApiPath,
  authzPath,
  guppyUrl,
  jobapiPath,
} from './localconf';
import { config } from './params';
import { receiveDictionary } from './Submission/actions';
import { asyncSetInterval } from './utils';

/** @typedef {import('redux').AnyAction} AnyAction */
/** @typedef {import('redux').Dispatch} Dispatch */
/** @typedef {import('redux-thunk').ThunkDispatch} ThunkDispatch */
/** @typedef {import('./types').FetchHelperOptions} FetchHelperOptions */
/** @typedef {import('./types').FetchHelperResult} FetchHelperResult */
/** @typedef {import('./types').KubeState} KubeState */
/** @typedef {import('./types').UserAccessState} UserAccessState */
/** @typedef {import('./types').PopupState} PopupState */
/** @typedef {import('./types').ProjectState} ProjectState */
/** @typedef {import('./DataDictionary/types').DdgraphState} DdgraphState */
/** @typedef {import('./GraphQLEditor/types').GraphiqlState} GraphiqlState */
/** @typedef {import('./Submission/types').SubmissionState} SubmissionState */

/**
 * @param {Partial<PopupState>} state
 * @returns {AnyAction}
 */
export const updatePopup = (state) => ({
  type: 'UPDATE_POPUP',
  payload: state,
});

/** @returns {AnyAction} */
export const connectionError = () => {
  console.log('connection error');
  return {
    type: 'REQUEST_ERROR',
    payload: 'connection_error',
  };
};

export const fetchErrored = (payload) => ({
  type: 'FETCH_ERROR',
  payload,
});

/** @type {{ [path: string]: string; }} */
const fetchCache = {};

/**
 * @param {string} path
 * @param {Response} response
 * @param {boolean} useCache
 * @param {string} method
 * @returns {Promise<FetchHelperResult>}
 */
const getJsonOrText = (path, response, useCache, method = 'GET') =>
  response.text().then((textData) => {
    let data = textData;
    if (data) {
      try {
        data = JSON.parse(data);
        if (useCache && method === 'GET' && response.status === 200)
          fetchCache[path] = textData;
      } catch (e) {
        // # do nothing
      }
    }
    return {
      response,
      data,
      status: response.status,
      headers: response.headers,
    };
  });

/** @type {Promise<FetchHelperResult>} */
let pendingRequest = null;
/**
 * @param {Object} opts
 * @param {string} [opts.path]
 * @param {string} [opts.method]
 * @param {Dispatch} [opts.dispatch]
 */
export const fetchCreds = (opts) => {
  if (pendingRequest) {
    return pendingRequest;
  }
  const { path = `${userapiPath}user/`, method = 'GET', dispatch } = opts;

  pendingRequest = fetch(path, {
    credentials: 'include',
    headers,
    method,
  })
    .then((response) => {
      pendingRequest = null;
      return getJsonOrText(path, response, false);
    })
    .catch((error) => {
      pendingRequest = null;
      if (dispatch) {
        dispatch(connectionError());
      }
      return error;
    });
  return pendingRequest;
};

/**
 * Little helper issues fetch, then resolves response
 * as text, and tries to JSON.parse the text before resolving, but
 * ignores JSON.parse failure and reponse.status, and returns {response, data} either way.
 * If dispatch is supplied, then dispatch(connectionError()) on fetch reject.
 * If useCache is supplied and method is GET,
 * then text for 200 JSON responses are cached, and re-used, and
 * the result promise only includes {data, status} - where JSON data is re-parsed
 * every time to avoid mutation by the client
 *
 * @param {FetchHelperOptions} opts
 * @return {Promise<FetchHelperResult>}
 */
export const fetchWithCreds = (opts) => {
  const {
    path,
    method = 'GET',
    body = null,
    customHeaders,
    dispatch,
    useCache,
    signal,
  } = opts;
  if (useCache && method === 'GET' && fetchCache[path]) {
    return Promise.resolve({ status: 200, data: JSON.parse(fetchCache[path]) });
  }
  /** @type {RequestInit} */
  const request = {
    credentials: 'include',
    headers: { ...headers, ...customHeaders },
    method,
    body,
    signal,
  };
  return fetch(path, request)
    .then((response) => {
      if (response.status !== 403 && response.status !== 401)
        return getJsonOrText(path, response, useCache, method);

      return fetchCreds({ dispatch }).then((resp) => {
        switch (resp.status) {
          case 200:
            return fetch(path, request).then((res) =>
              getJsonOrText(path, res, useCache, method)
            );
          default:
            return {
              response: resp.response,
              data: { data: {} },
              status: resp.status,
              headers: resp.headers,
            };
        }
      });
    })
    .catch((error) => {
      if (dispatch) {
        dispatch(connectionError());
      }
      return Promise.reject(error);
    });
};

/**
 * @param {FetchHelperOptions} opts
 * @param {number} timeoutInMS
 */
export const fetchWithCredsAndTimeout = (opts, timeoutInMS) => {
  let didTimeOut = false;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      didTimeOut = true;
      reject(new Error('Request timed out'));
    }, timeoutInMS);

    fetchWithCreds(opts)
      .then((response) => {
        // Clear the timeout as cleanup
        clearTimeout(timeout);
        if (!didTimeOut) {
          resolve(response);
        }
      })
      .catch((err) => {
        // Rejection already happened with setTimeout
        if (didTimeOut) return;
        // Reject with error
        reject(err);
      });
  });
};

/**
 * @param {import('./types').User} payload
 * @returns {AnyAction}
 */
export const receiveUser = (payload) => ({
  type: 'RECEIVE_USER',
  payload,
});

/**
 * @param {FetchHelperResult} result
 * @returns {AnyAction}
 */
const handleFetchUser = ({ status, data }) => {
  switch (status) {
    case 200:
      return receiveUser(data);
    case 401:
      return updatePopup({ authPopup: true });
    default:
      return fetchErrored(data.error);
  }
};

export const fetchUser = () => (/** @type {Dispatch} */ dispatch) =>
  fetchCreds({ dispatch }).then((res) => dispatch(handleFetchUser(res)));

/** @param {boolean} displayAuthPopup */
export const logoutAPI =
  (displayAuthPopup = false) =>
  (/** @type {Dispatch} */ dispatch) =>
    fetch(
      `${userapiPath}/logout?next=${hostname}${
        process.env.NODE_ENV === 'development' ? 'dev.html' : ''
      }`
    ).then((response) => {
      if (displayAuthPopup) dispatch(updatePopup({ authPopup: true }));
      else document.location.replace(response.url);

      window.localStorage.clear();
      window.sessionStorage.clear();
    });

/**
 * @param {Object} opts
 * @param {string} [opts.path]
 * @param {string} [opts.method]
 * @param {Dispatch} [opts.dispatch]
 * @returns {?Promise<FetchHelperResult>}
 */
export const fetchIsUserLoggedInNoRefresh = (opts) => {
  const { path = `${submissionApiPath}`, method = 'GET', dispatch } = opts;

  let requestPromise = fetch(path, {
    credentials: 'include',
    headers,
    method,
  }).then(
    (response) => {
      requestPromise = null;
      return getJsonOrText(path, response, false);
    },
    (error) => {
      requestPromise = null;
      if (dispatch) dispatch(connectionError());

      return error;
    }
  );
  return requestPromise;
};

export const fetchUserNoRefresh = () => (/** @type {Dispatch} */ dispatch) =>
  fetchIsUserLoggedInNoRefresh({ dispatch }).then((res) =>
    dispatch(handleFetchUser(res))
  );

const receiveProjects = (payload) => ({
  type: 'RECEIVE_PROJECTS',
  payload,
});

/**
 * redux-thunk support asynchronous redux actions via 'thunks' -
 * lambdas that accept dispatch and getState functions as arguments
 */
export const fetchProjects =
  () =>
  /**
   * @param {Dispatch} dispatch
   * @param {() => { project: ProjectState }} getState
   */
  (dispatch, getState) =>
    getState().project.projects
      ? Promise.resolve()
      : fetchWithCreds({
          path: `${submissionApiPath}graphql`,
          body: JSON.stringify({
            query:
              'query { project(first:0) {code, project_id, availability_type}}',
          }),
          method: 'POST',
        }).then(({ status, data }) => {
          if (status === 200) dispatch(receiveProjects(data.data.project));
          else dispatch(fetchErrored(data));
        });

/**
 * Fetch the schema for graphi, and stuff it into redux - handled by router
 */
export const fetchSchema =
  () =>
  /**
   * @param {Dispatch} dispatch
   * @param {() => { graphiql: GraphiqlState }} getState
   */
  (dispatch, getState) =>
    getState().graphiql.schema
      ? Promise.resolve()
      : import('../data/schema.json').then(({ default: { data } }) =>
          dispatch(receiveSchema(buildClientSchema(data)))
        );

export const fetchGuppySchema =
  () =>
  /**
   * @param {Dispatch} dispatch
   * @param {() => { graphiql: GraphiqlState }} getState
   */
  (dispatch, getState) =>
    getState().graphiql.guppySchema
      ? Promise.resolve()
      : fetch(guppyGraphQLUrl, {
          credentials: 'include',
          headers,
          method: 'POST',
          body: JSON.stringify({
            query: getIntrospectionQuery(),
            operationName: 'IntrospectionQuery',
          }),
        })
          .then((response) => response.json())
          .then(({ data }) =>
            dispatch(receiveGuppySchema(buildClientSchema(data)))
          );

export const fetchDictionary =
  () =>
  /**
   * @param {Dispatch} dispatch
   * @param {() => { submission: SubmissionState }} getState
   */
  (dispatch, getState) =>
    getState().submission.dictionary
      ? Promise.resolve()
      : import('../data/dictionary.json').then(({ default: data }) =>
          dispatch(receiveDictionary(data))
        );

export const fetchGraphvizLayout =
  () =>
  /**
   * @param {import('redux').Dispatch} dispatch
   * @param {() => { ddgraph: DdgraphState }} getState
   */
  (dispatch, getState) =>
    getState().ddgraph.graphvizLayout
      ? Promise.resolve()
      : import('../data/graphvizLayout.json').then(({ default: data }) => {
          dispatch(
            receiveGraphvizLayout(
              /** @type {DdgraphState['graphvizLayout']} */ (data)
            )
          );
        });

/**
 * @param {import('./types').VersionInfoState['dataVersion']} payload
 * @returns {AnyAction}
 */
const receiveDataVersion = (payload = '') => ({
  type: 'RECEIVE_DATA_VERSION',
  payload,
});

export const fetchVersionInfo = () => (/** @type {Dispatch} */ dispatch) =>
  fetchWithCreds({
    path: `${guppyUrl}/_data_version`,
    method: 'GET',
    useCache: true,
  }).then(({ status, data }) => {
    if (status === 200) dispatch(receiveDataVersion(data));
    else dispatch(fetchErrored(data));
  });

/**
 * @param {UserAccessState['access']} payload
 * @returns {AnyAction}
 */
const receiveUserAccess = (payload) => ({
  type: 'RECEIVE_USER_ACCESS',
  payload,
});

/**
 * Asks arborist which restricted access components the user has access to
 */
export const fetchUserAccess =
  () => async (/** @type {Dispatch} */ dispatch) => {
    /**
     * restricted access components and their associated arborist resources:
     * @type {{ [name: string]: { [key: string]: string } }}
     */
    const resourceMapping = config.componentToResourceMapping || {};
    const resourceNames = Object.keys(resourceMapping);

    const userAccessResults = await Promise.all(
      resourceNames.map((name) => {
        const { resource, method, service } = resourceMapping[name];
        return fetch(
          `${authzPath}?resource=${resource}&method=${method}&service=${service}`
        ).then(({ status, ok }) => {
          switch (status) {
            case 401: // user is not logged in
            case 403: // user is not allowed to access the resource
              return false;
            case 200: // valid input -> check "ok" field for authorization
              return ok;
            default:
              console.error(
                `Unknown status "${status}" returned by arborist call`
              );
              return false;
          }
        });
      })
    );

    /** @type {UserAccessState['access']} */
    const userAccess = {};
    userAccessResults.forEach((hasAccess, i) => {
      userAccess[resourceNames[i]] = hasAccess;
    });

    dispatch(receiveUserAccess(userAccess));
  };

/**
 * @param {string} did
 * @param {string} method
 */
export const getPresignedUrl = (did, method) => {
  const urlPath = `${userapiPath}data/${method}/${did}`;
  return fetchWithCreds({ path: urlPath, method: 'GET' }).then(
    ({ data }) => /** @type {string} */ (data.url)
  );
};

/** @param {any} body */
export const dispatchJob = (body) => (/** @type {Dispatch} */ dispatch) =>
  fetchWithCreds({
    path: `${jobapiPath}dispatch`,
    body: JSON.stringify(body),
    method: 'POST',
    dispatch,
  })
    .then(({ status, data }) => {
      switch (status) {
        case 200:
          return {
            type: 'RECEIVE_JOB_DISPATCH',
            payload: data,
          };
        default:
          return fetchErrored(data);
      }
    }, fetchErrored)
    .then((msg) => {
      dispatch(msg);
    });

/**
 *
 * @param {Dispatch} dispatch
 * @param {() => ({ kube: KubeState })} getState
 * @returns
 */
export const checkJobStatus = (dispatch, getState) => {
  const state = getState();
  let jobId = null;
  if (state.kube.job) {
    jobId = state.kube.job.uid;
  }
  return fetchWithCreds({
    path: `${jobapiPath}status?UID=${jobId}`,
    method: 'GET',
    dispatch,
  })
    .then(({ status, data }) => {
      // stop fetching job status once it stops running
      if (data.status !== 'Running') {
        window.clearInterval(state.kube.jobStatusInterval);
      }
      switch (status) {
        case 200:
          return {
            type: 'RECEIVE_JOB_STATUS',
            payload: data,
          };
        default:
          return fetchErrored(data);
      }
    }, fetchErrored)
    .then((msg) => {
      dispatch(msg);
    });
};

// dispatch the job with body
// then start pulling job status
// save the interval id in redux that can be used to clear the timer later

// TODO: need to get result urls from a Gen3 service
export const submitJob = (body) => (/** @type {ThunkDispatch} */ dispatch) =>
  dispatch(dispatchJob(body));

export const checkJob = () => (/** @type {ThunkDispatch} */ dispatch) =>
  asyncSetInterval(() => dispatch(checkJobStatus), 1000).then(
    (intervalValue) => {
      dispatch({ type: 'JOB_STATUS_INTERVAL', payload: intervalValue });
    }
  );

/** @param {string} jobId */
export const fetchJobResult = (jobId) => (/** @type {Dispatch} */ dispatch) =>
  fetchWithCreds({
    path: `${jobapiPath}output?UID=${jobId}`,
    method: 'GET',
    dispatch,
  }).then((data) => data);

export const resetJobState = () => (/** @type {Dispatch} */ dispatch) =>
  dispatch({ type: 'RESET_JOB' });
