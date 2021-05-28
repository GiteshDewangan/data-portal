import { connect } from 'react-redux';
import { getIndexPageCounts } from '../Index/utils';
import UserRegistration from './UserRegistration';
import { fetchUserAccess } from '../actions';

const mapStateToProps = (state) => ({
  shouldRegister:
    !state.user.authz || Object.keys(state.user.authz).length === 0,
});

const mapDispatchToProps = (dispatch) => ({
  /**
   * @param {Response} response
   * @returns {Promise<('success' | 'error')>}
   */
  updateAccess: (response) =>
    response.ok
      ? response.json().then((user) => {
          if (user.authz['/portal'] !== undefined) {
            dispatch({ type: 'RECEIVE_USER', user });
            dispatch(fetchUserAccess);
            getIndexPageCounts();
            return 'success';
          }
          return 'error';
        })
      : Promise.resolve('error'),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserRegistration);
