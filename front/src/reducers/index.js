import { APP_START, APP_STOP } from '../constants/App'

import {
    REQUEST_MSG_CREATE_DONE,
    REQUEST_MSG_CREATE_FAIL,
    WS_MSG_CREATE_DONE,
    WS_MSG_UPDATE_DONE,
    WS_START_MESSAGING,
    UPDATE_LOST_MSG,
    REQUEST_MSG_READ_DONE,
    REQUEST_MSG_READ_FAIL,
    TRANSPORT_SOCKET,
    TRANSPORT_HTTP
} from '../constants/Message'

const initialState = {
    appRun: false,
    messages: {
        byId: {
            /*
            id: {
                id: String, // message id
                transport: String, // http or websocket
                created: Number, // creation timestamp
                data: String, // random generated data for processing
                result: Boolean, // result of processing
                state: String, // state of proceccing
                refId: String, // reference to a new message when lost
                retried: Boolean // true while sending a repeated request when lost
            }
            */
        },
        allIds: [],
        pendingIds: [], // messages waiting for result
        lostIds: [] // resent lost messages 
    }
}

export default function (state = initialState, action) {
    
    const { type, data } = action
    
    switch (type) {
        /**
         * Toggle app
         */
        case APP_START: {
            const runState = { appRun: true }
            return { ...state, ...runState }
        }
        
        case APP_STOP: {
            const runState = { appRun: false }
            return { ...state, ...runState }
        }
        
        /**
         * Create messages
         */
        case REQUEST_MSG_CREATE_DONE: {
            const transport = { transport: TRANSPORT_HTTP }
            const message = { ...data, ...transport }
            
            return {
                ...state,
                messages: {
                    ...state.messages,
                    byId: {
                        ...state.messages.byId,
                        [data.id]: message
                    },
                    allIds: [...state.messages.allIds, data.id],
                    pendingIds: [ ...state.messages.pendingIds, data.id ]
                }
            }
        }
        
        case REQUEST_MSG_CREATE_FAIL:
            return { ...state }
        
        case WS_MSG_CREATE_DONE: {
            const transport = { transport: TRANSPORT_SOCKET }
            const message = { ...data, ...transport }
            
            return {
                ...state,
                messages: {
                    ...state.messages,
                    byId: {
                        ...state.messages.byId,
                        [data.id]: message
                    },
                    allIds: [...state.messages.allIds, data.id]
                }
            }
        }
        
        case UPDATE_LOST_MSG: {
            const message = { ...state.messages.byId[data.id], ...data }
            let lostIds = [ ...state.messages.lostIds ]
            const lostIndex = lostIds.indexOf(data.id)
            
            if (lostIndex !== -1 && data.refId) {
                lostIds = [
                    ...state.messages.lostIds.slice(0, lostIndex),
                    ...state.messages.lostIds.slice(lostIndex + 1)
                ]
            }
            
            return {
                ...state,
                messages: {
                    ...state.messages,
                    byId: {
                        ...state.messages.byId,
                        [data.id]: message
                    },
                    lostIds
                }
            }
        }
        
        /**
         * Read messages
         */
        case REQUEST_MSG_READ_DONE: {
            const message = { ...state.messages.byId[data.id], ...data }
            let pendingIds = [ ...state.messages.pendingIds ]
            const pendingIndex = pendingIds.indexOf(data.id)
            let lostIds = [ ...state.messages.lostIds ]
            
            if (data.state === 'completed'  || data.state === 'lost') {
                pendingIds = [
                    ...state.messages.pendingIds.slice(0, pendingIndex),
                    ...state.messages.pendingIds.slice(pendingIndex + 1)
                ]
            }
            
            if (data.state === 'lost') {
                lostIds = [ ...state.messages.lostIds, data.id ]
            }
            
            return {
                ...state,
                messages: {
                    ...state.messages,
                    byId: {
                        ...state.messages.byId,
                        [data.id]: message
                    },
                    pendingIds,
                    lostIds
                }
            }
        }
        
        case REQUEST_MSG_READ_FAIL:
            return { ...state }
        
        case WS_MSG_UPDATE_DONE: {
            if (!state.messages.byId[data.id]) {
                return { ...state }
            }
            
            const message = { ...state.messages.byId[data.id], ...data }
            
            const lostIds = (data.state === 'lost')
                ? [ ...state.messages.lostIds, data.id ]
                : [ ...state.messages.lostIds ]
            
            return {
                ...state,
                messages: {
                    ...state.messages,
                    byId: {
                        ...state.messages.byId,
                        [data.id]: message
                    },
                    lostIds
                }
            }
        }
        
        case WS_START_MESSAGING:
            return { ...state }
        
        default:
            return { ...state }
    }
}
