'use strict'

const bodyParser = require('body-parser'),
    express = require('express'),
    config = require('./config'),
    WebSocket = require('ws'),
    faker = require('faker'),
    Queue = require('bull'),
    cors = require('cors'),
    app = express()

/**
 * WEBSOCKET SERVER
 */
const wsEvents = {
    SERVER_ONLINE: 'SERVER_ONLINE',
    MESSAGE_CREATE: 'MESSAGE_CREATE',
    MESSAGE_UPDATE: 'MESSAGE_UPDATE',
    MESSAGE_CREATE_CONFIRM: 'MESSAGE_CREATE_CONFIRM',
    MESSAGE_UPDATE_CONFIRM: 'MESSAGE_UPDATE_CONFIRM'
}

// stack for preventing messages loss when connection aborted
const wsMessagesStack = {
    created: {},
    updated: {}
}

function addToStack (key = 'created', message) {
    wsMessagesStack[key][message.id] = message
}

function deleteFromStack (key = 'created', messageId) {
    if (wsMessagesStack[key][messageId]) {
        delete wsMessagesStack[key][messageId]
    }
}

function stackBroadcast () {
    Object.keys(wsMessagesStack.created).forEach(id => {
        pushMessage(wsEvents.MESSAGE_CREATE, wsMessagesStack.created[id])
    })
    
    Object.keys(wsMessagesStack.updated).forEach(id => {
        pushMessage(wsEvents.MESSAGE_UPDATE, wsMessagesStack.updated[id])
    })
}

const wss = new WebSocket.Server({ port: config.wssPort }, () => {
    console.info(`Websocket server is up on port ${config.wssPort}`)
})

wss.on('connection', (socket) => {
    
    socket.on('message', async (message) => {
        const msg = parsedMessage(message)
        
        if (!msg.type) {
            return
        }
        
        if (msg.type === wsEvents.MESSAGE_CREATE) {
            const data = await createJob(socketQueue, msg.data)
            const result = JSON.stringify({ type: wsEvents.MESSAGE_CREATE, data })
            addToStack('created', data)
            return socket.send(result, ack)
        }
        else if (msg.type === wsEvents.MESSAGE_CREATE_CONFIRM) {
            deleteFromStack('created', msg.data.id)
        }
        else if (msg.type === wsEvents.MESSAGE_UPDATE_CONFIRM) {
            deleteFromStack('updated', msg.data.id)
        }
    })
    
    socket.send(JSON.stringify({ type: wsEvents.SERVER_ONLINE }), ack)
    setTimeout(stackBroadcast, 500)
})

function pushMessage (eventName, data) {
    const message = JSON.stringify({
        type: wsEvents[eventName],
        data
    })
    
    wss.clients.forEach(client => client.send(message, ack))
}

function parsedMessage (message) {
    try {
        return JSON.parse(message)
    } catch (err) {
        return {}
    }
}

// Errors handler
function ack (err) {
    if (err) {
        console.error(err)
    }
}

/**
 * QUEUES
 */
const httpQueueName = 'http-queue'
const httpQueue = createQueue(httpQueueName)

const socketQueueName = 'socket-queue'
const socketQueue = createQueue(socketQueueName)

function createQueue (queueName) {
    const q = new Queue(queueName, config.redisUrl)
    
    q.on('completed', async function (job, result) {
        try {
            await job.update(result)
            console.info(`Job ${job.id} completed with result`, result)
            
            if (job.queue.name === socketQueueName) {
                const data = Object.assign({
                    id: job.id,
                    state: 'completed'
                }, result)
                
                addToStack('updated', data)
                pushMessage(wsEvents.MESSAGE_UPDATE, data)
            }
        }
        catch (err) {
            console.error(err)
        }
    })
    
    q.on('failed', async function (job, err) {
        try {
            // fake job loss
            await job.remove()
            console.info(`Job ${job.id} failed`)
            
            if (job.queue.name === socketQueueName) {
                const data = { id: job.id, state: 'lost' }
                addToStack('updated', data)
                pushMessage(wsEvents.MESSAGE_UPDATE, data)
            }
        }
        catch (err) {
            console.error(err)
        }
    })
    
    q.on('error', err => {
        console.error('Queue error occured', err)
    })
    
    q.process(jobsProcessor)
    
    return q
}

function jobsProcessor (job) {
    const delays = [100, 200, 300, 400, 500],
        delay = faker.helpers.randomize(delays),
        message = job.data
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // fake error
            if (delay === delays[0]) {
                reject(new Error('Job processing error'))
            }
            // fake processing
            else {
                message.result = faker.random.boolean()
                resolve(message)
            }
        }, delay)
    })
}

async function createJob (queue, data) {
    const job = await queue.add(data)
    const state = await job.getState(job)
    
    const message = Object.assign(data, {
        created: job.timestamp,
        id: job.id,
        state
    })
    
    return message
}

/**
 * HTTP SERVER
 */
app.use(
    // CORS
    cors({ optionsSuccessStatus: 200 }),
    
    // parse application/x-www-form-urlencoded
    bodyParser.urlencoded({ extended: false }),
    
    // parse application/json
    bodyParser.json()
)

app.post('/messages', async (req, res, next) => {
    try {
        const message = await createJob(httpQueue, req.body)
        res.json(message)
    }
    catch (err) {
        next(err)
    }
})

app.get('/messages/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        const job = await httpQueue.getJob(id)
        const state = job ? await job.getState() : 'lost'
        
        const message = Object.assign(
            { id, state },
            (state === 'completed') ? job.data : {}
        )
        
        res.json(message)
    }
    catch (err) {
        next(err)
    }
})

app.listen(config.apiPort, () => {
    console.info(`API server is up on port ${config.apiPort}`)
})
