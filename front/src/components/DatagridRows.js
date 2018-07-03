import React from 'react'
import VirtualList from 'react-virtual-list'

const formatCreated = (created) => new Date(created).toLocaleString()

const formatResult = (result, state, refId) => {
    let data
    
    if (result === undefined && state === 'lost' && refId) {
        const refIdStr = `#${refId}`
        data = (<a href={refIdStr}>{refIdStr}</a>)
    }
    else if (result === undefined) {
        data = '...'
    }
    else {
        data = result.toString()
    }
    
    return data
}

const DatagridRows = ({ virtual, itemHeight }) => (
    <div style={virtual.style}>
        {virtual.items.map(m => (
            <div key={m.id} id={m.id} className="row" style={{ height: itemHeight }}>
                <div className="col-2">{m.id}</div>
                <div className="col-3">{formatCreated(m.created)}</div>
                <div className="col-3">{m.data}</div>
                <div className="col-2">{m.state}</div>
                <div className="col-2">{formatResult(m.result, m.state, m.refId)}</div>
            </div>
        ))}
    </div>
)

export default VirtualList()(DatagridRows)
