import { connect } from 'react-redux';
import ExplorerButtonGroup from '.';
import {
  dispatchJob,
  checkJob,
  fetchJobResult,
  resetJobState,
} from '../../actions';

const mapStateToProps = (state) => ({
  job: state.kube.job,
  userAccess: state.userAccess.access,
});

const mapDispatchToProps = (dispatch) => ({
  submitJob: (body) => dispatch(dispatchJob(body)),
  checkJobStatus: () => dispatch(checkJob()),
  fetchJobResult: (jobId) => dispatch(fetchJobResult(jobId)),
  resetJobState: () => dispatch(resetJobState()),
});
const ReduxExplorerButtonGroup = connect(
  mapStateToProps,
  mapDispatchToProps
)(ExplorerButtonGroup);
export default ReduxExplorerButtonGroup;
