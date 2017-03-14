import { fetchWrapper } from './actions';
import { submissionapi_path, submissionapi_oauth_path } from '../localconf';

export const updateSearchForm = (value) => {
  return {
    type: 'UPDATE_SEARCH_FORM',
    form: value
  }
}


export const submitSearchForm = ({node_type, submitter_id, project}) => {
  return fetchWrapper({
    path: submissionapi_path + 'graphql',
    body: JSON.stringify({
      'query': `query Test { ${node_type} (project_id: \"${project}\", quick_search: \"${submitter_id}\") {id, type, submitter_id}}`
    }),
    method: 'POST',
    handler: receiveSearchEntities
  })
}

export const receiveSearchEntities = ({status, data}) => {
  switch (status) {
    case 200:
      return {
        type: 'RECEIVE_SEARCH_ENTITIES',
        search_status: 'succeed: ' + status,
        data: data
      }
    default:
      return {
        type: 'RECEIVE_SEARCH_ENTITIES',
        search_status: 'failed: ' + status,
        data: data
      }
  }
} 

export const deleteNode = ({id, project}) => {
	let receiveDelete = ({status, data}) => {
		return receiveDeleteResponse({status, data, id, project})
	}
  return fetchWrapper({
    path: get_submit_path(project) + '/' + id,
    method: 'DELETE',
    handler: receiveDelete
  })
}

export const receiveDeleteResponse = ({status, data, id, project}) => {
	switch (status) {
		case 200:
			return {
				type: 'DELETE_SUCCEED',
				id: id
			}

		default:
			return {
				type: 'DELETE_FAIL',
				id: id,
				error: data
			}
	}

}
