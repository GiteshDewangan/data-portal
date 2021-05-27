import { components } from '../params';
import { getFileNodes, getNodeTypes } from '../graphutils';
import { getDictionaryWithExcludeSystemProperties } from './utils';

const submission = (state = {}, action) => {
  switch (action.type) {
    case 'REQUEST_UPLOAD':
      return { ...state, file: action.file, file_type: action.file_type };
    case 'UPDATE_FILE':
      return { ...state, file: action.file, file_type: action.file_type };
    case 'UPDATE_FORM_SCHEMA':
      return {
        ...state,
        formSchema: { ...state.formSchema, ...action.formSchema },
      };
    case 'RECEIVE_PROJECT_LIST': {
      //
      // Note - save projectsByName, b/c we acquire more data for individual tables
      // over time
      //
      const projectsByName = { ...(state.projectsByName || {}) };
      action.data.projectList.forEach((proj) => {
        const old = projectsByName[proj.name] || {};
        projectsByName[proj.name] = Object.assign(old, proj);
      });
      const summaryCounts = {
        ...(state.summaryCounts || {}),
        ...action.data.summaryCounts,
      };
      const lastestListUpdating = Date.now();
      // const { error, ...state } = state;
      return {
        ...state,
        projectsByName,
        summaryCounts,
        lastestListUpdating,
        countNames: components.charts.indexChartNames,
      };
    }
    case 'RECEIVE_PROJECT_DETAIL': {
      const projectsByName = { ...(state.projectsByName || {}) };
      projectsByName[action.data.name] = action.data;
      const lastestDetailsUpdating = Date.now();
      return { ...state, projectsByName, lastestDetailsUpdating };
    }
    case 'RECEIVE_TRANSACTION_LIST': {
      return { ...state, transactions: action.data };
    }
    case 'RECEIVE_RELAY_FAIL': {
      return { ...state, error: action.data };
    }
    case 'RECEIVE_NODE_TYPES':
      return { ...state, nodeTypes: action.data };
    case 'RECEIVE_DICTIONARY':
      return {
        ...state,
        dictionary: getDictionaryWithExcludeSystemProperties(action.data),
        nodeTypes: getNodeTypes(action.data),
        file_nodes: getFileNodes(action.data),
      };
    case 'RECEIVE_SUBMISSION': {
      const prevCounts = state.submit_entity_counts ?? {};
      const newCounts = (action.data.entities || [])
        .map((ent) => ent.type || 'unknown')
        .reduce((db, type) => {
          const res = db;
          res[type] = (res[type] || 0) + 1;
          return res;
        }, prevCounts);
      const data = state.submit_result
        ? state.submit_result.concat(action.data.entities || [])
        : action.data.entities;
      const status = state.submit_status
        ? Math.max(state.submit_status, action.submit_status)
        : action.submit_status;
      return {
        ...state,
        submit_entity_counts: newCounts,
        submit_result: data,
        submit_result_string: state.submit_result_string
          .concat(JSON.stringify(action.data, null, '    '))
          .concat('\n\n'),
        submit_status: status,
        submit_counter: state.submit_counter + 1,
        submit_total: action.total,
      };
    }
    case 'SUBMIT_SEARCH_FORM':
      return { ...state, search_form: action.data };
    case 'RECEIVE_SEARCH_ENTITIES':
      return {
        ...state,
        search_result: action.data,
        search_status: action.search_status,
      };
    case 'RECEIVE_COUNTS':
      return {
        ...state,
        counts_search: action.data,
        links_search: Object.entries(action.data).reduce((acc, entry) => {
          acc[entry[0]] = entry[1].length;
          return acc;
        }, {}),
      };
    case 'CLEAR_COUNTS':
      return { ...state, counts_search: null, links_search: null };
    case 'RECEIVE_UNMAPPED_FILES':
      return { ...state, unmappedFiles: action.data };
    case 'RECEIVE_UNMAPPED_FILE_STATISTICS':
      return {
        ...state,
        unmappedFileCount: action.data.count,
        unmappedFileSize: action.data.totalSize,
      };
    case 'RECEIVE_FILES_TO_MAP':
      return { ...state, filesToMap: action.data };
    case 'RESET_SUBMISSION_STATUS':
      return {
        ...state,
        submit_entity_counts: [],
        submit_result: null,
        submit_result_string: '',
        submit_status: 0,
        submit_counter: 0,
        submit_total: 0,
      };
    default:
      return state;
  }
};

export default submission;
