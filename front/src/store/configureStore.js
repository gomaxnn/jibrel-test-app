import { createStore, applyMiddleware } from 'redux'
import rootReducer from '../reducers'
// import logger from 'redux-logger'
import createSagaMiddleware from 'redux-saga'
import driverSaga from '../sagas'

const sagaMiddleware = createSagaMiddleware()

export default function configureStore (initialState) {
    const store = createStore(
        rootReducer,
        initialState,
        applyMiddleware(sagaMiddleware/*, logger*/)
    )
    
    sagaMiddleware.run(driverSaga)
    return store
}
