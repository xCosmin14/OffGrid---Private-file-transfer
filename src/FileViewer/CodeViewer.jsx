import React, { useState, useEffect } from "react"

import SyntaxHighlighter from 'react-syntax-highlighter'
import { atelierLakesideDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'

import { extensionToLanguage } from "../MyFiles/FileColors"
import "./FileViewers.css"

export default function CodeViewer(props) {
    const [codeText, setCodeText] = useState("")

    const handleScroll = (e) => {
        const el = e.target
        const progress = el.scrollTop / (el.scrollHeight - el.clientHeight)
        el.style.setProperty('--scroll-progress', `${Math.round(progress * 100)}%`)
    }

    useEffect(() => {
        if (props.fileContent) {
            fetch(props.fileContent)
                .then(res => res.text())
                .then(text => setCodeText(text))
                .catch(err => console.error(err))
        }
    }, [props.fileContent])

    return (
        <SyntaxHighlighter 
            language={extensionToLanguage[props.file.extension]}
            showLineNumbers="1"

            style={atelierLakesideDark}
            customStyle={{ 
                background: "transparent", 
                backgroundColor: "transparent",
                color: "var(--text)",
                paddingInline: "0",
                overflowX: "visible", overflowY: "scroll" 
            }}
            onScroll={handleScroll}
        >
            {codeText}
        </SyntaxHighlighter>
    )
}