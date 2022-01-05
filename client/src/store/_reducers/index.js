import { combineReducers } from 'redux';
import user from './user_reducer';
import chat from './chat_reducer';
import dashboardReducer from './dashboardReducer';
import callReducer from './callReducer'

const rootReducer = combineReducers({
    user,
    chat,
    dashboard: dashboardReducer,
    call: callReducer
});

export default rootReducer;