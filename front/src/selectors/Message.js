import {
    TRANSPORT_SOCKET,
    TRANSPORT_HTTP
} from '../constants/Message'

export const getHttpPendingMessages = state => {
    const { byId, pendingIds } = state.messages
    const data = []
    
    pendingIds.forEach(id => {
        const message = byId[id]
        
        if (!message) return
        
        if (message.transport === TRANSPORT_HTTP &&
            message.state !== 'lost')
        {
            data.push(message)
        }
    })
    
    return data
}

export const getHttpLostMessages = state => {
    const { byId, lostIds } = state.messages
    const data = []
    
    lostIds.forEach(id => {
        const message = byId[id]
        
        if (!message) return
        
        if (message.transport === TRANSPORT_HTTP &&
            message.state === 'lost' &&
            message.retried !== true)
        {
            data.push(message)
        }
    })
    
    return data
}

export const getSocketLostMessages = state => {
    const { byId, lostIds } = state.messages
    const data = []
    
    lostIds.forEach(id => {
        const message = byId[id]
        
        if (!message) return
        
        if (message.transport === TRANSPORT_SOCKET &&
            message.state === 'lost' &&
            message.retried !== true)
        {
            data.push(message)
        }
    })
    
    return data
}
