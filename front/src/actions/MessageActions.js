import {
    REQUEST_MSG_CREATE_DONE,
    REQUEST_MSG_CREATE_FAIL,
    WS_MSG_CREATE_DONE,
    WS_MSG_UPDATE_DONE,
    WS_START_MESSAGING,
    UPDATE_LOST_MSG,
    REQUEST_MSG_READ_DONE,
    REQUEST_MSG_READ_FAIL
} from '../constants/Message'

export function requestMessageCreateDone (data) {
    return { type: REQUEST_MSG_CREATE_DONE, data }
}

export function requestMessageCreateFail () {
    return { type: REQUEST_MSG_CREATE_FAIL }
}

export function wsStartMessaging () {
    return { type: WS_START_MESSAGING }
}

export function wsMessageCreateDone (data) {
    return { type: WS_MSG_CREATE_DONE, data }
}

export function wsMessageUpdateDone (data) {
    return { type: WS_MSG_UPDATE_DONE, data }
}

export function updateLostMessage (data) {
    return { type: UPDATE_LOST_MSG, data }
}

export function requestMessageReadDone (data) {
    return { type: REQUEST_MSG_READ_DONE, data }
}

export function requestMessageReadFail () {
    return { type: REQUEST_MSG_READ_FAIL }
}
