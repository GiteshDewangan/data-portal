import { useState } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SimpleInputField from '../../components/SimpleInputField';
import Button from '../../gen3-ui-component/components/Button';
import { overrideSelectTheme } from '../../utils';
import { defaultFilterSet as survivalDefaultFilterSet } from '../ExplorerSurvivalAnalysis/ControlForm';
import FilterSetQueryDisplay from './FilterSetQueryDisplay';
import './ExplorerFilterSet.css';

/** @typedef {import('./types').ExplorerFilter} ExplorerFilter */
/** @typedef {import('./types').ExplorerFilterSet} ExplorerFilterSet */
/** @typedef {import('./types').ExplorerFilterSetActionType} ExplorerFilterSetActionType */

/**
 * @param {Object} prop
 * @param {boolean} prop.isFilterSetEmpty
 * @param {boolean} prop.hasNoSavedFilterSets
 * @param {(option: { label: string; value: ExplorerFilterSetActionType }) => void} prop.onSelectAction
 */
export function FilterSetActionMenu({
  isFilterSetEmpty,
  hasNoSavedFilterSets,
  onSelectAction,
}) {
  /** @type {{ label: string; value: ExplorerFilterSetActionType; isDisabled?: boolean }[]} */
  const options = [
    { label: 'New', value: 'new', isDisabled: isFilterSetEmpty },
    { label: 'Open', value: 'open', isDisabled: hasNoSavedFilterSets },
    { label: 'Save', value: 'save' },
    { label: 'Save As', value: 'save as', isDisabled: isFilterSetEmpty },
    { label: 'Delete', value: 'delete', isDisabled: isFilterSetEmpty },
  ];
  return (
    <Select
      aria-label='Manage filter sets'
      className='explorer-filter-set__menu'
      isSearchable={false}
      value={{ label: 'Manage Filter Set', value: '' }}
      options={options}
      theme={overrideSelectTheme}
      onChange={onSelectAction}
    />
  );
}

FilterSetActionMenu.propTypes = {
  isFilterSetEmpty: PropTypes.bool,
  hasNoSavedFilterSets: PropTypes.bool,
  onSelectAction: PropTypes.func,
};

function FilterSetButton(props) {
  return <Button className='explorer-filter-set__button' {...props} />;
}

/**
 * @param {Object} prop
 * @param {ExplorerFilterSet} prop.currentFilterSet
 * @param {ExplorerFilterSet[]} prop.filterSets
 * @param {(opened: ExplorerFilterSet) => void} prop.onAction
 * @param {() => void} prop.onClose
 */
function FilterSetOpenForm({
  currentFilterSet,
  filterSets,
  onAction,
  onClose,
}) {
  const options = filterSets.map((filterSet) => ({
    label: filterSet.name,
    value: filterSet,
  }));
  const [selected, setSelected] = useState({
    label: currentFilterSet.name,
    value: currentFilterSet,
  });
  return (
    <div className='explorer-filter-set__form'>
      <h4>Select a saved Filter Set to open</h4>
      <form onSubmit={(e) => e.preventDefault()}>
        <SimpleInputField
          label='Name'
          input={
            <Select
              inputId='open-filter-set-name'
              options={options}
              value={selected}
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus
              isClearable={false}
              theme={overrideSelectTheme}
              onChange={(e) => setSelected(e)}
            />
          }
        />
        <SimpleInputField
          label='Description'
          input={
            <textarea
              id='open-filter-set-description'
              disabled
              placeholder='No description'
              value={selected.value.description}
            />
          }
        />
        <FilterSetQueryDisplay filter={selected.value.filter} />
      </form>
      <div>
        <FilterSetButton
          buttonType='default'
          label='Back to page'
          onClick={onClose}
        />
        <FilterSetButton
          label='Open Filter Set'
          enabled={selected.value.name !== ''}
          onClick={() => onAction(selected.value)}
        />
      </div>
    </div>
  );
}

FilterSetOpenForm.propTypes = {
  currentFilterSet: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    filters: PropTypes.object,
    id: PropTypes.number,
  }),
  filterSets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      filters: PropTypes.object,
      id: PropTypes.number,
    })
  ),
  onAction: PropTypes.func,
  onClose: PropTypes.func,
};

/**
 * @param {Object} prop
 * @param {ExplorerFilterSet} prop.currentFilterSet
 * @param {ExplorerFilter} prop.currentFilter
 * @param {ExplorerFilterSet[]} prop.filterSets
 * @param {boolean} prop.isFiltersChanged
 * @param {(created: ExplorerFilterSet) => void} prop.onAction
 * @param {() => void} prop.onClose
 */
function FilterSetCreateForm({
  currentFilterSet,
  currentFilter,
  filterSets,
  isFiltersChanged,
  onAction,
  onClose,
}) {
  const [filterSet, setFilterSet] = useState(currentFilterSet);
  const [error, setError] = useState({ isError: false, message: '' });
  function validate() {
    if (filterSet.name === '')
      setError({ isError: true, message: 'Name is required!' });
    else if (filterSet.name === survivalDefaultFilterSet.name)
      setError({ isError: true, message: 'Name is reserved!' });
    else if (filterSets.filter((c) => c.name === filterSet.name).length > 0)
      setError({ isError: true, message: 'Name is already in use!' });
    else setError({ isError: false, message: '' });
  }
  return (
    <div className='explorer-filter-set__form'>
      <h4>Save as a new Filter Set</h4>
      {currentFilterSet.name !== '' && isFiltersChanged && (
        <p>
          <FontAwesomeIcon
            icon='triangle-exclamation'
            color='var(--pcdc-color__secondary)'
          />{' '}
          You have changed filters for this Filter Set.
        </p>
      )}
      <form onSubmit={(e) => e.preventDefault()}>
        <SimpleInputField
          label='Name'
          input={
            <input
              id='create-filter-set-name'
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus
              placeholder='Enter the Filter Set name'
              value={filterSet.name}
              onBlur={validate}
              onChange={(e) => {
                e.persist();
                setFilterSet((prev) => ({ ...prev, name: e.target.value }));
              }}
            />
          }
          error={error}
        />
        <SimpleInputField
          label='Description'
          input={
            <textarea
              id='create-filter-set-description'
              placeholder='Describe the Filter Set (optional)'
              value={filterSet.description}
              onChange={(e) => {
                e.persist();
                setFilterSet((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
              }}
            />
          }
        />
        <FilterSetQueryDisplay filter={currentFilter} />
      </form>
      <div>
        <FilterSetButton
          buttonType='default'
          label='Back to page'
          onClick={onClose}
        />
        <FilterSetButton
          enabled={filterSet.name !== currentFilterSet.name && !error.isError}
          label='Save Filter Set'
          onClick={() => onAction({ ...filterSet, filter: currentFilter })}
        />
      </div>
    </div>
  );
}

FilterSetCreateForm.propTypes = {
  currentFilterSet: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    filters: PropTypes.object,
    id: PropTypes.number,
  }),
  currentFilter: PropTypes.object,
  filterSets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      filters: PropTypes.object,
      id: PropTypes.number,
    })
  ),
  isFiltersChanged: PropTypes.bool,
  onAction: PropTypes.func,
  onClose: PropTypes.func,
};

/**
 * @param {Object} prop
 * @param {ExplorerFilterSet} prop.currentFilterSet
 * @param {ExplorerFilter} prop.currentFilter
 * @param {ExplorerFilterSet[]} prop.filterSets
 * @param {boolean} prop.isFiltersChanged
 * @param {(updated: ExplorerFilterSet) => void} prop.onAction
 * @param {() => void} prop.onClose
 */
function FilterSetUpdateForm({
  currentFilterSet,
  currentFilter,
  filterSets,
  isFiltersChanged,
  onAction,
  onClose,
}) {
  const [filterSet, setFilterSet] = useState(currentFilterSet);
  const [error, setError] = useState({ isError: false, message: '' });
  function validate() {
    if (filterSet.name === '')
      setError({ isError: true, message: 'Name is required!' });
    else if (
      filterSets.filter(
        (c) => c.name === filterSet.name && c.name !== currentFilterSet.name
      ).length > 0
    )
      setError({ isError: true, message: 'Name is already in use!' });
    else setError({ isError: false, message: '' });
  }
  return (
    <div className='explorer-filter-set__form'>
      <h4>Save changes to the current Filter Set</h4>
      {isFiltersChanged && (
        <p>
          <FontAwesomeIcon
            icon='triangle-exclamation'
            color='var(--pcdc-color__secondary)'
          />{' '}
          You have changed filters for this Filter Set.
        </p>
      )}
      <form onSubmit={(e) => e.preventDefault()}>
        <SimpleInputField
          label='Name'
          input={
            <input
              id='update-ohort-name'
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus
              placeholder='Enter the Filter Set name'
              value={filterSet.name}
              onBlur={validate}
              onChange={(e) => {
                e.persist();
                setFilterSet((prev) => ({ ...prev, name: e.target.value }));
              }}
            />
          }
          error={error}
        />
        <SimpleInputField
          label='Description'
          input={
            <textarea
              id='update-filter-set-description'
              placeholder='Describe the Filter Set (optional)'
              value={filterSet.description}
              onChange={(e) => {
                e.persist();
                setFilterSet((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
              }}
            />
          }
        />
        <FilterSetQueryDisplay filter={filterSet.filter} />
        {isFiltersChanged && (
          <FilterSetQueryDisplay
            filter={currentFilter}
            title='Filters (changed)'
          />
        )}
      </form>
      <div>
        <FilterSetButton
          buttonType='default'
          label='Back to page'
          onClick={onClose}
        />
        <FilterSetButton
          label='Save changes'
          enabled={
            (isFiltersChanged ||
              filterSet.name !== currentFilterSet.name ||
              filterSet.description !== currentFilterSet.description) &&
            !error.isError
          }
          onClick={() => onAction({ ...filterSet, filter: currentFilter })}
        />
      </div>
    </div>
  );
}

FilterSetUpdateForm.propTypes = {
  currentFilterSet: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    filters: PropTypes.object,
    id: PropTypes.number,
  }),
  currentFilter: PropTypes.object,
  filterSets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      filters: PropTypes.object,
      id: PropTypes.number,
    })
  ),
  isFiltersChanged: PropTypes.bool,
  onAction: PropTypes.func,
  onClose: PropTypes.func,
};

/**
 * @param {Object} prop
 * @param {ExplorerFilterSet} prop.currentFilterSet
 * @param {(deleted: ExplorerFilterSet) => void} prop.onAction
 * @param {() => void} prop.onClose
 */
function FilterSetDeleteForm({ currentFilterSet, onAction, onClose }) {
  return (
    <div className='explorer-filter-set__form'>
      <h4>Are you sure to delete the current Filter Set?</h4>
      <div>
        <FilterSetButton
          buttonType='default'
          label='Back to page'
          onClick={onClose}
        />
        <FilterSetButton
          label='Delete Filter Set'
          onClick={() => onAction(currentFilterSet)}
        />
      </div>
    </div>
  );
}

FilterSetDeleteForm.propTypes = {
  currentFilterSet: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    filters: PropTypes.object,
    id: PropTypes.number,
  }),
  onAction: PropTypes.func,
  onClose: PropTypes.func,
};

/**
 * @param {Object} prop
 * @param {ExplorerFilterSetActionType} prop.actionType
 * @param {ExplorerFilterSet} prop.currentFilterSet
 * @param {ExplorerFilter} prop.currentFilter
 * @param {ExplorerFilterSet[]} prop.filterSets
 * @param {object} prop.handlers
 * @param {(opened: ExplorerFilterSet) => void} prop.handlers.handleOpen
 * @param {(created: ExplorerFilterSet) => void} prop.handlers.handleCreate
 * @param {(updated: ExplorerFilterSet) => void} prop.handlers.handleUpdate
 * @param {(deleted: ExplorerFilterSet) => void} prop.handlers.handleDelete
 * @param {() => void} prop.handlers.handleClose
 * @param {boolean} prop.isFiltersChanged
 */
export function FilterSetActionForm({
  actionType,
  currentFilterSet,
  currentFilter,
  filterSets,
  handlers,
  isFiltersChanged,
}) {
  const { handleOpen, handleCreate, handleUpdate, handleDelete, handleClose } =
    handlers;

  switch (actionType) {
    case 'open':
      return (
        <FilterSetOpenForm
          currentFilterSet={currentFilterSet}
          filterSets={filterSets}
          onAction={handleOpen}
          onClose={handleClose}
        />
      );
    case 'save':
      return currentFilterSet.name === '' ? (
        <FilterSetCreateForm
          currentFilterSet={currentFilterSet}
          currentFilter={currentFilter}
          filterSets={filterSets}
          isFiltersChanged={isFiltersChanged}
          onAction={handleCreate}
          onClose={handleClose}
        />
      ) : (
        <FilterSetUpdateForm
          currentFilterSet={currentFilterSet}
          currentFilter={currentFilter}
          filterSets={filterSets}
          isFiltersChanged={isFiltersChanged}
          onAction={handleUpdate}
          onClose={handleClose}
        />
      );
    case 'save as':
      return (
        <FilterSetCreateForm
          currentFilterSet={currentFilterSet}
          currentFilter={currentFilter}
          filterSets={filterSets}
          isFiltersChanged={isFiltersChanged}
          onAction={handleCreate}
          onClose={handleClose}
        />
      );
    case 'delete':
      return (
        <FilterSetDeleteForm
          currentFilterSet={currentFilterSet}
          onAction={handleDelete}
          onClose={handleClose}
        />
      );
    default:
      return null;
  }
}

FilterSetActionForm.propTypes = {
  actionType: PropTypes.oneOf(['new', 'open', 'save', 'save as', 'delete']),
  currentFilterSet: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    filters: PropTypes.object,
    id: PropTypes.number,
  }),
  currentFilter: PropTypes.object,
  filterSets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      description: PropTypes.string,
      filters: PropTypes.object,
      id: PropTypes.number,
    })
  ),
  handlers: PropTypes.shape({
    handleOpen: PropTypes.func,
    handleCreate: PropTypes.func,
    handleUpdate: PropTypes.func,
    handleDelete: PropTypes.func,
    handleClose: PropTypes.func,
  }),
  isFiltersChanged: PropTypes.bool,
};
