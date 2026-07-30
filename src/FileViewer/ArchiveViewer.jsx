import { useState, useEffect } from "react"
import { ZipReader, HttpReader, BlobReader } from "@zip.js/zip.js"

import ArrowDown from "../assets/SVG/ArrowDown.svg?react"
import Folder from "../assets/SVG/FileIcons/Folder.svg?react"

import "./FileViewers.css"

function buildFileTree(zipEntries) {
    const root = { name: "root", isDir: true, children: {} }

    zipEntries.forEach((entry) => {
        const isDir = entry.directory || entry.filename.endsWith("/")
        const parts = entry.filename.split("/").filter(Boolean)

        let current = root
        parts.forEach((part, index) => {
            const isLast = index === parts.length - 1
            if (!current.children[part]) {
                current.children[part] = {
                    name: part,
                    isDir: isLast ? isDir : true,
                    children: {}
                }
            } else if (!isLast) current.children[part].isDir = true
            current = current.children[part]
        })
    })

    return root
}

function TreeNode({ node }) {
    const [isOpen, setIsOpen] = useState(true)

    const childrenKeys = Object.keys(node.children).sort((a, b) => {
        const childA = node.children[a]
        const childB = node.children[b]
        if (childA.isDir && !childB.isDir) return -1
        if (!childA.isDir && childB.isDir) return 1
        return a.localeCompare(b)
    })

    const hasChildren = childrenKeys.length > 0

    const toggleOpen = () => {
        if (hasChildren) setIsOpen((prev) => !prev)
    }

    return (
        <li className={node.isDir ? "archiveFolder" : "archiveFile"}>
            <span 
                className="archiveName" onClick={toggleOpen}
            >
                {hasChildren && (
                    <ArrowDown 
                        style={{
                            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                            transition: "transform 0.15s ease"
                        }} 
                    />
                )}
                {node.isDir && <Folder />}
                {node.name}
            </span>

            {hasChildren && isOpen && (
                <ul className="archiveSubTree">
                    {childrenKeys.map((key) => (
                        <TreeNode key={key} node={node.children[key]} />
                    ))}
                </ul>
            )}
        </li>
    )
}

export default function ArchiveViewer(props) {
    const [tree, setTree] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        let zipReader = null

        const readZip = async () => {
            try {
                let sourceReader

                if (props.fileUrl) sourceReader = new HttpReader(props.fileUrl)
                else if (props.fileBlob) sourceReader = new BlobReader(props.fileBlob)
                else return

                zipReader = new ZipReader(sourceReader)
                const entries = await zipReader.getEntries()
                const builtTree = buildFileTree(entries)
                setTree(builtTree)
            } catch (err) {
                setError("Could not read ZIP archive content")
            } finally {
                if (zipReader) await zipReader.close()
            }
        }

        const extension = props.file?.extension?.toLowerCase()
        if (extension === "zip") readZip()
        else setError("Unsupported archive format")
    }, [props.fileBlob, props.fileUrl, props.file])

    if (error) return <div id="archiveViewer">{error}</div>
    if (!tree) return <div id="archiveViewer">Reading archive metadata...</div>

    const rootKeys = Object.keys(tree.children).sort((a, b) => {
        const childA = tree.children[a]
        const childB = tree.children[b]
        if (childA.isDir && !childB.isDir) return -1
        if (!childA.isDir && childB.isDir) return 1
        return a.localeCompare(b)
    })

    return (
        <div id="archiveViewer">
            <ul className="archiveTree">
                {rootKeys.map((key) => (
                    <TreeNode key={key} node={tree.children[key]} />
                ))}
            </ul>
        </div>
    )
}