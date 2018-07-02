import { take, put, call, fork, race, cancel, cancelled, select } from 'redux-saga/effects'
import { WS_START_MESSAGING } from '../constants/Message'
import { APP_START, APP_STOP } from '../constants/App'
import * as actions from '../actions/MessageActions'
import * as selectors from '../selectors/Message'
import { delay, eventChannel } from 'redux-saga'
import randomkey from 'randomkey'
import * as API from '../api'

const wsEvents = {
    SERVER_ONLINE: 'SERVER_ONLINE',
    MESSAGE_CREATE: 'MESSAGE_CREATE',
    MESSAGE_UPDATE: 'MESSAGE_UPDATE',
    MESSAGE_CREATE_CONFIRM: 'MESSAGE_CREATE_CONFIRM',
    MESSAGE_UPDATE_CONFIRM: 'MESSAGE_UPDATE_CONFIRM'
}

function fakeData () {
    return randomkey(16, randomkey.safe)
}

/**
 * HTTP: Create messages
 */
function* postLoop () {
    try {
        while (true) {
            const data = yield call(() => {
                const body = { data: fakeData() }
                return API.postRequest(body)
            })
            yield put(actions.requestMessageCreateDone(data))
            yield call(delay, 500)
        }
    }
    catch (err) {
        yield put(actions.requestMessageCreateFail())
    }
    finally {
        if (yield cancelled()) {
            console.log('Post loop cancelled')
        }
        console.log('Post loop ended')
    }
}

/**
 * HTTP: Resend lost messages
 */
function* postLostMessage (message) {
    try {
        // update lost message retried state
        message.retried = true
        yield put(actions.updateLostMessage(message))
        const data = yield call(() => {
            const body = { data: message.data }
            return API.postRequest(body)
        })
        
        // update lost message with refId
        message.refId = data.id
        yield put(actions.updateLostMessage(message))
        
        yield put(actions.requestMessageCreateDone(data))
    }
    catch (err) {
        yield put(actions.requestMessageCreateFail())
        
        // update lost message retried state
        message.retried = false
        yield put(actions.updateLostMessage(message))
    }
}

function* postLostLoop () {
    try {
        while (true) {
            const messages = yield select(selectors.getHttpLostMessages)
            yield messages.map(message => fork(postLostMessage, message))
            yield call(delay, 1000)
        }
    }
    finally {
        if (yield cancelled()) {
            console.log('Post stuck loop cancelled')
        }
        console.log('Post stuck loop ended')
    }
}

/**
 * HTTP: Read messages
 */
function* getMessage (message) {
    try {
        const data = yield call(() => API.getRequest(message.id))
        yield put(actions.requestMessageReadDone(data))
        yield call(delay, 500)
    }
    catch (err) {
        yield put(actions.requestMessageReadFail())
    }
}

function* getLoop () {
    try {
        while (true) {
            const messages = yield select(selectors.getHttpPendingMessages)
            yield messages.map(message => fork(getMessage, message))
            yield call(delay, 1000)
        }
    }
    finally {
        if (yield cancelled()) {
            console.log('Get loop cancelled')
        }
        console.log('Get loop ended')
    }
}

/**
 * Websocket watcher
 */
function watchMessages (socket) {
    return eventChannel(emit => {
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data)
            emit(message)
        }
        
        return () => {
            socket.close()
        }
    })
}

function* wsProcessor () {
    const socket = new WebSocket(CONFIG.WSS_URL)
    
    socket.onopen = () => {
        console.info('Websocket connection opened')
    }
    
    const channel = yield call(watchMessages, socket)
    
    const { cancel } = yield race({
        task: [
            call(wsSender, socket),
            call(wsLostSender, socket),
            call(wsReciever, [ socket, channel ])
        ],
        cancel: take(APP_STOP)
    })
    
    if (cancel) {
        channel.close()
    }
}

function* wsSender (socket) {
    yield take(WS_START_MESSAGING) // waiting for websocket connection
    while (true) {
        yield call(delay, 500)
        const message = JSON.stringify({
            type: wsEvents.MESSAGE_CREATE,
            data: { data: fakeData() }
        })
        yield call(() => socket.send(message))
    }
}

function* wsSendLostMessage (args) {
    const [ socket, message ] = args
    
    try {
        const { id, data } = message
        yield call(delay, 500)
        // update lost message retried state
        message.retried = true
        yield put(actions.updateLostMessage(message))
        
        socket.send(JSON.stringify({
            type: wsEvents.MESSAGE_CREATE,
            data: { data, lostId: id }
        }))
    }
    catch (err) {
        // update lost message retried state
        message.retried = false
        yield put(actions.updateLostMessage(message))
    }
}

function* wsLostSender (socket) {
    yield take(WS_START_MESSAGING) // waiting for websocket connection
    while (true) {
        yield call(delay, 1000)
        const messages = yield select(selectors.getSocketLostMessages)
        yield messages.map(message => fork(wsSendLostMessage, [ socket, message ]))
    }
}

function* wsReciever (args) {
    const [ socket, channel ] = args
    
    while (true) {
        const payload = yield take(channel)
        const { type, data } = payload
        
        // server online
        if (type === wsEvents.SERVER_ONLINE) {
            yield put(actions.wsStartMessaging())
        }
        // message created
        else if (type === wsEvents.MESSAGE_CREATE) {
            const { id, lostId } = data
            if (lostId) {
                delete data.lostId
                const lostMessage = { id: lostId, refId: id }
                yield put(actions.updateLostMessage(lostMessage))
            }
            yield put(actions.wsMessageCreateDone(data))
            socket.send(JSON.stringify({
                type: wsEvents.MESSAGE_CREATE_CONFIRM,
                data
            }))
        }
        // message updated
        else if (type === wsEvents.MESSAGE_UPDATE) {
            yield put(actions.wsMessageUpdateDone(data))
            socket.send(JSON.stringify({
                type: wsEvents.MESSAGE_UPDATE_CONFIRM,
                data
            }))
        }
    }
}

/**
 * Managing loops
 */
export default function* driverSaga () {
    while (yield take(APP_START)) {
        // starts tasks in the background
        const tasks = [
            yield fork(wsProcessor),
            yield fork(postLostLoop),
            yield fork(postLoop),
            yield fork(getLoop)
        ]
        
        // wait for the user stop action
        yield take(APP_STOP)
        
        // user clicked stop. cancel the background tasks
        yield tasks.map(task => cancel(task))
    }
}
