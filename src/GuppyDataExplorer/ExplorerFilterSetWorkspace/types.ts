import type { ExplorerFilter, ExplorerFilterSet } from '../types';

export type UnsavedExplorerFilterSet = Pick<
  ExplorerFilterSet,
  'filter' | 'id'
> & {
  name?: never;
  description?: never;
};

export type FilterSetWorkspaceState = {
  [key: string]: ExplorerFilterSet | UnsavedExplorerFilterSet;
};

export type FilterSetWorkspaceActionCallback = (args: {
  id: string;
  filterSet: ExplorerFilterSet | UnsavedExplorerFilterSet;
}) => void;

type FilterSetWorkspaceClearAction = {
  type: 'CLEAR';
  payload: {
    callback?: FilterSetWorkspaceActionCallback;
  };
};

type FilterSetWorkspaceCreactAction = {
  type: 'CREATE';
  payload: {
    callback?: FilterSetWorkspaceActionCallback;
  };
};

type FilterSetWorkspaceDuplicateAction = {
  type: 'DUPLICATE';
  payload: {
    id: string;
    callback?: FilterSetWorkspaceActionCallback;
  };
};

type FilterSetWorkspaceLoadAction = {
  type: 'LOAD';
  payload: {
    id?: string;
    filterSet: ExplorerFilterSet;
    callback?: FilterSetWorkspaceActionCallback;
  };
};

type FilterSetWorkspaceSaveAction = {
  type: 'SAVE';
  payload: {
    id: string;
    filterSet: ExplorerFilterSet;
    callback?: FilterSetWorkspaceActionCallback;
  };
};

type FilterSetWorkspaceRemoveAction = {
  type: 'REMOVE';
  payload: {
    id: string;
    callback?: FilterSetWorkspaceActionCallback;
  };
};

type FilterSetWorkspaceUpdateAction = {
  type: 'UPDATE';
  payload: {
    id: string;
    filter: ExplorerFilter;
    callback?: FilterSetWorkspaceActionCallback;
  };
};

export type FilterSetWorkspaceAction =
  | FilterSetWorkspaceClearAction
  | FilterSetWorkspaceCreactAction
  | FilterSetWorkspaceDuplicateAction
  | FilterSetWorkspaceLoadAction
  | FilterSetWorkspaceSaveAction
  | FilterSetWorkspaceRemoveAction
  | FilterSetWorkspaceUpdateAction;
