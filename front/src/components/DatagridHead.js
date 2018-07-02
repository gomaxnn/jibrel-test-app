import React from 'react'
import { pure } from 'recompose'

const DatagridHead = ({ id, transport, created, data, state, result }) => (
    <div className="row" style={{ height: 30 }}>
        <div className="col-1 font-weight-bold">{id}</div>
        <div className="col-2 font-weight-bold">{transport}</div>
        <div className="col-3 font-weight-bold">{created}</div>
        <div className="col-3 font-weight-bold">{data}</div>
        <div className="col-2 font-weight-bold">{state}</div>
        <div className="col-1 font-weight-bold">{result}</div>
    </div>
)

export default pure(DatagridHead)
