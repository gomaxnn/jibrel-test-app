import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions/AppActions'
import Button from '../components/Button'
import DatagridHead from '../components/DatagridHead'
import DatagridRows from '../components/DatagridRows'

const scrollRef = 'scrollTarget'

class App extends Component {
    
    componentDidUpdate () {
        // auto scroll to bottom
        this.refs[scrollRef].scrollIntoView({ behavior: 'smooth' })
    }
    
    // start/stop application
    toggle () {
        const { appRun, dispatch } = this.props
        
        if (appRun) {
            dispatch(actions.appStop())
        }
        else {
            dispatch(actions.appStart())
        }
    }
    
    renderButton () {
        const { appRun } = this.props,
            btnClass = `btn ${appRun ? 'btn-success' : 'btn-primary'}`,
            btnText = `${appRun ? 'Stop' : 'Start'} Sending`
        
        return (
            <Button
                btnClass={btnClass}
                btnText={btnText}
                onClick={this.toggle.bind(this)}
            />
        )
    }
    
    renderDatagrid () {
        const headers = {
            id: 'ID',
            transport: 'Transport',
            created: 'Created',
            data: 'Data',
            state: 'State',
            result: 'Result'
        }
        
        const messages = this.props.messages.map(m => (
            { ...m, ...{ key: m.id } }
        ))
        
        return (
            <div className="container">
                <DatagridHead
                    id={headers.id}
                    transport={headers.transport}
                    created={headers.created}
                    data={headers.data}
                    state={headers.state}
                    result={headers.result}
                />
                <DatagridRows
                    items={messages}
                    itemHeight={30}
                />
            </div>
        )
    }
    
    render () {
        return (
            <div>
                {this.renderButton()}
                {this.renderDatagrid()}
                <div ref={scrollRef}></div>
            </div>
        )
    }
}

// Connect
const mapStateToProps = (state) => {
    const { appRun, messages } = state
    return {
        appRun,
        ids: messages.allIds,
        messages: Object.keys(messages.byId)
            .map(id => messages.byId[id])
            .sort((a, b) => {
                if (a.created < b.created) return -1
                if (a.created > b.created) return 1
                return 0
            })
    }
}

export default connect(mapStateToProps)(App)
