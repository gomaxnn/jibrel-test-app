import React from 'react'
import { onlyUpdateForKeys } from 'recompose'

const Button = ({ btnText, btnClass, onClick }) => (
    <nav className="navbar sticky-top bg-light mb-3 pt-3 pb-3 justify-content-center">
        <button
            className={btnClass}
            onClick={onClick}
        >{btnText}</button>
    </nav>
)

export default onlyUpdateForKeys(['btnText', 'btnClass'])(Button)
