import { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import Dropdown from '../gen3-ui-component/components/Dropdown';
import { getSubmitPath, overrideSelectTheme } from '../utils';
import './QueryForm.css';

class QueryForm extends Component {
  constructor(props) {
    super(props);
    const searchParams = new URLSearchParams(window.location.search);
    this.state = {
      selectValue: searchParams.has('node_type')
        ? {
            value: searchParams.get('node_type'),
            label: searchParams.get('node_type'),
          }
        : null,
    };
    this.updateValue = this.updateValue.bind(this);
    this.handleDownloadAll = this.handleDownloadAll.bind(this);
    this.handleQuerySubmit = this.handleQuerySubmit.bind(this);
  }

  handleDownloadAll(fileType) {
    window.open(
      `${getSubmitPath(this.props.project)}/export?node_label=${
        this.state.selectValue.value
      }&format=${fileType}`,
      '_blank'
    );
  }

  handleQuerySubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = { project: this.props.project };
    const queryParam = [];

    for (let i = 0; i < form.length; i += 1) {
      const input = form[i];
      if (input.name && input.value) {
        queryParam.push(`${input.name}=${input.value}`);
        data[input.name] = input.value;
      }
    }
    this.props.onSearchFormSubmit(data, queryParam.join('&'));
  }

  updateValue(newValue) {
    this.setState({
      selectValue: newValue,
    });
  }

  render() {
    const nodesForQuery = this.props.nodeTypes.filter(
      (nt) => !['program', 'project'].includes(nt)
    );
    const options = nodesForQuery.map((nodeType) => ({
      value: nodeType,
      label: nodeType,
    }));
    const state = this.state || {};
    return (
      <form onSubmit={this.handleQuerySubmit}>
        <Select
          className='query-form__select'
          name='node_type'
          options={options}
          value={state.selectValue}
          onChange={this.updateValue}
          theme={overrideSelectTheme}
        />
        <input
          className='query-form__input'
          placeholder='submitter_id'
          type='text'
          name='submitter_id'
        />
        <input
          className='query-form__search-button'
          type='submit'
          onSubmit={this.handleQuerySubmit}
          value='search'
        />
        {this.state.selectValue && this.props.queryNodeCount > 0 ? (
          <Dropdown className='query-node__download-button'>
            <Dropdown.Button>Download All</Dropdown.Button>
            <Dropdown.Menu>
              <Dropdown.Item
                rightIcon='download'
                onClick={() => this.handleDownloadAll('tsv')}
              >
                TSV
              </Dropdown.Item>
              <Dropdown.Item
                rightIcon='download'
                onClick={() => this.handleDownloadAll('json')}
              >
                JSON
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        ) : null}
      </form>
    );
  }
}

QueryForm.propTypes = {
  project: PropTypes.string.isRequired,
  nodeTypes: PropTypes.array,
  onSearchFormSubmit: PropTypes.func,
  queryNodeCount: PropTypes.number,
};

QueryForm.defaultProps = {
  nodeTypes: [],
  onSearchFormSubmit: null,
  queryNodeCount: 0,
};

export default QueryForm;
