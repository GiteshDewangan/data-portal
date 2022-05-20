import { useEffect, useMemo, useReducer, useState } from 'react';
import cloneDeep from 'lodash.clonedeep';
import { useExplorerState } from '../ExplorerStateContext';
import {
  checkIfFilterEmpty,
  initializeWorkspaceState,
  storeWorkspaceState,
} from './utils';

/** @typedef {import("../types").ExplorerFilter} ExplorerFilter */
/** @typedef {import("../types").ExplorerFilterSet} ExplorerFilterSet */
/** @typedef {import('./types').FilterSetWorkspaceState} FilterSetWorkspaceState */
/** @typedef {import('./types').FilterSetWorkspaceAction} FilterSetWorkspaceAction */

/**
 * @param {FilterSetWorkspaceState} state
 * @param {FilterSetWorkspaceAction} action
 */
function reducer(state, action) {
  const { type, payload } = action;
  switch (type) {
    case 'CREATE': {
      const id = crypto.randomUUID();
      const filter = /** @type {ExplorerFilter} */ ({});

      payload.callback?.({ filter, id });

      return { ...state, [id]: { filter } };
    }
    case 'REMOVE': {
      const newState = cloneDeep(state);
      delete newState[payload.id];

      const [id, { filter }] = Object.entries(newState)[0];
      payload.callback?.({ filter, id });

      return newState;
    }
    case 'LOAD': {
      const id = crypto.randomUUID();
      const filterSet = cloneDeep(payload.filterSet);

      payload.callback?.({ filter: filterSet.filter, id });

      return { ...state, [id]: filterSet };
    }
    case 'DUPLICATE': {
      const id = crypto.randomUUID();
      const filter = cloneDeep(state[payload.id].filter);

      payload.callback?.({ filter, id });

      return { ...state, [id]: { filter } };
    }
    case 'UPDATE': {
      const { id, filter: newFilter } = payload;
      const filter = cloneDeep(newFilter);

      payload.callback?.({ filter, id });

      return { ...state, [id]: { filter } };
    }
    default:
      return state;
  }
}

export default function useFilterSetWorkspace() {
  const { explorerFilter, handleFilterChange } = useExplorerState();
  const initialWsState = useMemo(() => {
    const wsState = initializeWorkspaceState(explorerFilter);

    // sync filter UI with non-empty initial filter
    const values = Object.values(wsState);
    if (values.length > 1 || !checkIfFilterEmpty(values[0].filter))
      handleFilterChange(values[0].filter);

    return wsState;
  }, []);
  const [id, setId] = useState(Object.keys(initialWsState)[0]);
  const [wsState, dispatch] = useReducer(reducer, initialWsState);
  useEffect(() => storeWorkspaceState(wsState), [wsState]);

  /** @param {(filter: ExplorerFilter) => void} [callback] */
  function create(callback) {
    dispatch({
      type: 'CREATE',
      payload: {
        callback(args) {
          setId(args.id);
          callback?.(args.filter);
        },
      },
    });
  }
  /** @param {(filter: ExplorerFilter) => void} [callback] */
  function duplicate(callback) {
    dispatch({
      type: 'DUPLICATE',
      payload: {
        id,
        callback(args) {
          setId(args.id);
          callback?.(args.filter);
        },
      },
    });
  }

  /**
   * @param {ExplorerFilterSet} filterSet
   * @param {(filter: ExplorerFilter) => void} [callback]
   */
  function load(filterSet, callback) {
    dispatch({
      type: 'LOAD',
      payload: {
        filterSet,
        callback(args) {
          setId(args.id);
          callback?.(args.filter);
        },
      },
    });
  }

  /** @param {(filter: ExplorerFilter) => void} [callback] */
  function remove(callback) {
    dispatch({
      type: 'REMOVE',
      payload: {
        id,
        callback(args) {
          setId(args.id);
          callback?.(args.filter);
        },
      },
    });
  }

  /**
   * @param {ExplorerFilter} newFilter
   * @param {(filter: ExplorerFilter) => void} [callback]
   */
  function update(newFilter, callback) {
    dispatch({
      type: 'UPDATE',
      payload: {
        id,
        filter: newFilter,
        callback(args) {
          setId(args.id);
          callback?.(args.filter);
        },
      },
    });
  }
  useEffect(() => update(explorerFilter), [explorerFilter]);

  /**
   * @param {string} newId
   * @param {(filter: ExplorerFilter) => void} callback
   */
  function use(newId, callback) {
    setId(newId);
    callback?.(wsState[newId].filter);
  }

  return useMemo(
    () => ({
      active: { id, filter: wsState[id].filter },
      all: wsState,
      size: Object.keys(wsState).length,
      create,
      duplicate,
      load,
      remove,
      update,
      use,
    }),
    [id, wsState]
  );
}
