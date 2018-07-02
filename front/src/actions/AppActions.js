import {
    WS_START_MESSAGING,
    APP_START,
    APP_STOP
} from '../constants/App'

export function appStart () {
    return { type: APP_START }
}

export function appStop () {
    return { type: APP_STOP }
}

export function wsStartMessaging () {
    return { type: WS_START_MESSAGING }
}
