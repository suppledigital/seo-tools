import React, { useEffect, useState } from 'react'
import {
  EditorContent,
  useEditor,
  BubbleMenu,
  FloatingMenu,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Focus from '@tiptap/extension-focus'
import FloatingMenuExtension from '@tiptap/extension-floating-menu'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

import axios from 'axios'
import clsx from 'clsx'

// Material UI icons
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined'
import CodeIcon from '@mui/icons-material/Code'
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough'
import HighlightIcon from '@mui/icons-material/Highlight'
import LinkIcon from '@mui/icons-material/Link'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import TableChartIcon from '@mui/icons-material/TableChart'
import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'
import SaveIcon from '@mui/icons-material/Save'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'

import styles from './CollaborationEditor.module.css'

export default function CollaborationEditorWithVersions({
  projectId,
  entryId,
  fallbackHtml,
  doc,
  provider,
  userName,
}) {
  const [users, setUsers] = useState([])
  const [savingOne, setSavingOne] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [versions, setVersions] = useState([])
  const [showVersionSidebar, setShowVersionSidebar] = useState(false)

  // 1) Initialize the Tiptap editor
  const editor = useEditor({
    content: fallbackHtml || '',
    extensions: [
      StarterKit.configure({ history: false }),
      FloatingMenuExtension.configure({ /* optional pluginKey config here */ }),
      Collaboration.configure({ document: doc, field: 'root' }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName || 'Unknown',
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      }),
      Focus.configure({ className: 'has-focus', mode: 'deepest' }),
      Typography,
      CharacterCount.configure(),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Link.configure({ openOnClick: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    autofocus: true,
    editorProps: {
      // prevents Tiptap from rendering content before it’s fully mounted
      immediatelyRender: false,
    },
  })

  // 2) Track presence from CollaborationCursor
  useEffect(() => {
    if (!provider) return
    const awareness = provider.awareness

    const handleChange = () => {
      const states = Array.from(awareness.getStates().values())
      setUsers(states.map(s => s.user).filter(Boolean))
    }
    awareness.on('change', handleChange)
    handleChange()
    return () => awareness.off('change', handleChange)
  }, [provider])

  if (!editor) return <div>Loading Editor…</div>

  // 3) Save Single
  async function handleSaveSingle() {
    if (!projectId || !entryId) return alert('No project/page ID specified!')
    setSavingOne(true)
    try {
      const content = editor.getHTML()
      await axios.put(`/api/content/editor/projects/${projectId}/page/${entryId}`, { content })
      alert('Page saved successfully!')
    } catch (err) {
      console.error('Error saving single page:', err)
      alert('Error saving page.')
    } finally {
      setSavingOne(false)
    }
  }

  // 4) Save All
  async function handleSaveAll() {
    setSavingAll(true)
    try {
      const content = editor.getHTML()
      const pagesToSave = [{ entry_id: entryId, content }]
      await axios.put(`/api/content/editor/projects/${projectId}`, { pages: pagesToSave })
      alert('All pages saved successfully!')
    } catch (err) {
      console.error('Error saving all pages:', err)
      alert('Error saving all pages.')
    } finally {
      setSavingAll(false)
    }
  }

  // 5) Versions
  function handleCreateVersion() {
    const verName = prompt('Enter a version name', 'My Version') || 'Untitled'
    provider.sendStateless(JSON.stringify({
      action: 'version.created',
      versionName: verName,
    }))
    alert(`Created version "${verName}"!`)
  }

  async function loadVersions() {
    if (!projectId || !entryId) return
    try {
      const res = await axios.get(`/api/content/editor/projects/${projectId}/page/${entryId}/versions`)
      setVersions(res.data.versions || [])
    } catch (err) {
      console.error('Failed to load versions =>', err)
    }
  }

  async function handleRevert(versionId) {
    const confirmRevert = confirm(`Revert to version #${versionId}? Unsaved changes will be lost.`)
    if (!confirmRevert) return

    const newVerName = `Revert #${versionId} (${new Date().toLocaleString()})`
    provider.sendStateless(JSON.stringify({
      action: 'document.revert',
      versionId,
      newVersionName: newVerName,
    }))
    alert(`Reverted to version #${versionId} - new version name: ${newVerName}`)
  }

  // 6) Bubble Menu for text selection
  const bubbleMenu = (
    <BubbleMenu editor={editor} className={styles.bubbleMenu}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={clsx(
          editor.isActive('bold') && 'is-active',
        )}
      >
        <FormatBoldIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={clsx(
          editor.isActive('italic') && 'is-active',
        )}
      >
        <FormatItalicIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={clsx(
          editor.isActive('underline') && 'is-active',
        )}
      >
        <FormatUnderlinedIcon />
      </button>
    </BubbleMenu>
  )

  // 7) Top toolbar
  const topToolbar = (
    <div className={styles.topToolbar}>
      <div className={styles.headingDropdown}>
        <button className={styles.dropdownButton}>
          Headings <ArrowDropDownIcon />
        </button>
        <div className={styles.dropdownContent}>
          {[1, 2, 3, 4, 5, 6].map(lvl => (
            <button
              key={lvl}
              onClick={() => editor.chain().focus().toggleHeading({ level: lvl }).run()}
              className={clsx(
                editor.isActive('heading', { level: lvl }) && 'is-active'
              )}
            >
              H{lvl}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={clsx(
          editor.isActive('strike') && 'is-active',
        )}
      >
        <FormatStrikethroughIcon />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={clsx(
          editor.isActive('highlight') && 'is-active',
        )}
      >
        <HighlightIcon />
      </button>

      <button
        onClick={() => {
          const url = prompt('Enter link URL') || ''
          if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          } else {
            editor.chain().focus().unsetLink().run()
          }
        }}
        className={clsx(
          editor.isActive('link') && 'is-active',
        )}
      >
        <LinkIcon />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={clsx(
          editor.isActive('code') && 'is-active',
        )}
      >
        <CodeIcon />
      </button>

      <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <HorizontalRuleIcon />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={clsx(
          editor.isActive('orderedList') && 'is-active',
        )}
      >
        <FormatListNumberedIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={clsx(
          editor.isActive('bulletList') && 'is-active',
        )}
      >
        <FormatListBulletedIcon />
      </button>

      <button
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableChartIcon />
      </button>

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <UndoIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <RedoIcon />
      </button>

      {/* Save Single / Save All */}
      <button onClick={handleSaveSingle} disabled={savingOne}>
        {savingOne ? 'Saving...' : <><SaveIcon /> Save</>}
      </button>
      <button onClick={handleSaveAll} disabled={savingAll}>
        {savingAll ? 'Saving...' : <><SaveAsIcon /> Save All</>}
      </button>

      {/* Versioning Buttons */}
      <button onClick={handleCreateVersion}>
        Create Version
      </button>
      <button
        onClick={() => {
          if (!showVersionSidebar) loadVersions()
          setShowVersionSidebar(!showVersionSidebar)
        }}
      >
        {showVersionSidebar ? 'Hide Versions' : 'Show Versions'}
      </button>
    </div>
  )

  // 8) Character/Word Counts
  const chars = editor.storage.characterCount.characters()
  const words = editor.storage.characterCount.words()

   // 1) A floating menu for formatting
   const formattingMenu = (
    <FloatingMenu
      editor={editor}
      pluginKey="formattingMenu"
      tippyOptions={{ duration: 100 }}
      shouldShow={({ editor }) => {
        const { $from } = editor.state.selection
        const node = $from.node()
        // Appear only if empty paragraph
        return node.type.name === 'paragraph' && node.content.size === 0
      }}
    >
      <div className={styles.floatingMenu}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={clsx(
            styles.floatingBtnItem,
            editor.isActive('bold') && 'is-active'
          )}
        >
          <FormatBoldIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={clsx(
            styles.floatingBtnItem,
            editor.isActive('italic') && 'is-active'
          )}
        >
          <FormatItalicIcon />
        </button>
        {/* ... more buttons for heading, bullet list, etc. */}
      </div>
    </FloatingMenu>
  )

  // 2) Another floating menu for AI or custom actions
  const customActionsMenu = (
    <FloatingMenu
      editor={editor}
      pluginKey="aiMenu"
      tippyOptions={{ duration: 100 }}
      shouldShow={({ editor }) => {
        const { $from } = editor.state.selection
        const node = $from.node()
        return node.type.name === 'paragraph' && node.content.size === 0
      }}
    >
      <div className={styles.floatingMenu}>
        <button className={styles.floatingBtnItem} onClick={() => alert('Summarize')}>
          Summarize
        </button>
        <button className={styles.floatingBtnItem} onClick={() => alert('Generate')}>
          Generate
        </button>
      </div>
    </FloatingMenu>
  )

  return (
    <div className={styles.editorContainer}>
      {topToolbar}
      {bubbleMenu}

      <div style={{ display: 'flex', gap: '2rem' }}>
        {customActionsMenu}
      </div>

      {showVersionSidebar && (
        <div className={styles.sidebar}>
          <h3>Versions</h3>
          <button onClick={loadVersions} style={{ marginBottom: '0.5rem' }}>
            Refresh
          </button>
          <div
            style={{
              maxHeight: '80vh',
              overflowY: 'auto',
              border: '1px solid #ddd',
              padding: '0.5rem',
            }}
          >
            {versions.length === 0 && <p>No versions found yet.</p>}
            {versions.map((v) => (
              <div
                key={`version-${v.id}`}
                style={{ borderBottom: '1px solid #eee', marginBottom: '0.3rem' }}
              >
                <strong>#{v.id}</strong> - {v.version_name} <br />
                <span style={{ fontSize: '0.8rem' }}>{v.created_at}</span> <br />
                <button onClick={() => handleRevert(v.id)}>Revert</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.editorContent}>
        <EditorContent editor={editor} />
      </div>

      <div className={styles.bottomPanel}>
        <div>{chars} chars • {words} words</div>
        <div>
          {users.length} user(s)&nbsp;
          {users.map((u, i) => (
            <span className={styles.userChip} key={`cursor-user-${i}`}>
              {u.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
