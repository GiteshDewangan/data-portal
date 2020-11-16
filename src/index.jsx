import React from 'react';
import { render } from 'react-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faAngleUp,
  faAngleDown,
  faFlask,
  faMicroscope,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import ReactGA from 'react-ga';
import '@gen3/ui-component/dist/css/base.less';
import {
  fetchDictionary,
  fetchProjects,
  fetchSchema,
  fetchVersionInfo,
  fetchUserAccess,
  fetchUserAuthMapping,
} from './actions';
import getReduxStore from './reduxStore';
import { gaTracking } from './params';
import App from './App';
import sessionMonitor from './SessionMonitor';
import './index.less';

// monitor user's session
sessionMonitor.start();

// Google Analytics
ReactGA.initialize(gaTracking);
ReactGA.pageview(window.location.pathname + window.location.search);

// FontAwesome icons
library.add(faAngleUp, faAngleDown, faFlask, faMicroscope, faUser);

// render the app after the store is configured
async function init() {
  const store = await getReduxStore();

  // asyncSetInterval(() => store.dispatch(fetchUser), 60000);
  await Promise.all([
    store.dispatch(fetchSchema),
    store.dispatch(fetchDictionary),
    store.dispatch(fetchVersionInfo),
    // resources can be open to anonymous users, so fetch access:
    store.dispatch(fetchUserAccess),
    store.dispatch(fetchUserAuthMapping),
    store.dispatch(fetchProjects()),
  ]);

  render(<App store={store} />, document.getElementById('root'));
}

init();
