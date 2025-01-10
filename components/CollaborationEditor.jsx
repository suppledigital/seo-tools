import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import axios from 'axios'

/** Tiptap Extensions (some omitted for brevity) */
import History from '@tiptap/extension-history'
import Focus from '@tiptap/extension-focus'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import Heading from '@tiptap/extension-heading'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Code from '@tiptap/extension-code'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

/** Example Material UI icons */
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

export default function CollaborationEditor({

    
  /** Single-page info: */
  projectId,
  entryId, // the current page's ID
  fallbackHtml,
  
  /** If you want "Save All," you might need parent's data. For simplicity we do example calls here. */
  
  /** Y.js Collab */
  doc,
  provider,
  userName,
}) {
  const [users, setUsers] = useState([])
  const [savingOne, setSavingOne] = useState(false)
  const [savingAll, setSavingAll] = useState(false)

  const editor = useEditor({
    content: fallbackHtml || '',
    extensions: [
      StarterKit.configure({ history: false }),
      History.configure({ depth: 100 }),
      Collaboration.configure({ document: provider?.document, field: 'root' }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userName,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      }),
      Focus.configure({ className: 'has-focus', mode: 'deepest' }),
      Typography,
      CharacterCount.configure(),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      HorizontalRule,
      BulletList,
      OrderedList,
      ListItem,
      Code,
      Highlight,
      Link.configure({ openOnClick: true }),
      Strike,
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    autofocus: true,
  })

  /** Presence updates for other collab users */
  useEffect(() => {
    if (!provider) return
    const aw = provider.awareness
    const handleChange = () => {
      const states = Array.from(aw.getStates().values())
      setUsers(states.map(s => s.user).filter(Boolean))
    }
    aw.on('change', handleChange)
    handleChange()
    return () => aw.off('change', handleChange)
  }, [provider])

  if (!editor) return <div>Loading Editor…</div>

  /** Single page Save (PUT /api/content/editor/projects/[projectId]/page/[entryId]) */
  async function handleSaveSingle() {
    if (!projectId || !entryId) return alert('No project/page ID specified!')
    setSavingOne(true)
    try {
      // Gather updated content from Tiptap
      const content = editor.getHTML()

      await axios.put(
        `/api/content/editor/projects/${projectId}/page/${entryId}`,
        {
          content, // The new HTML
          url: '', // Or pass real fields if you have them
          meta_title: '',
          meta_description: '',
          page_type: '',
          content_type: '',
        },
      )
      alert('Page saved successfully!')
    } catch (err) {
      console.error('Error saving single page:', err)
      alert('Error saving page.')
    } finally {
      setSavingOne(false)
    }
  }

  /** Save All Pages (PUT /api/content/editor/projects/[projectId]) */
  async function handleSaveAll() {
    // Typically you'd gather all pages data from parent or context
    // For demonstration, we create a single array item. If you have multiple, pass them all
    setSavingAll(true)
    try {
      const content = editor.getHTML()
      const pagesToSave = [
        {
          entry_id: entryId,
          content,
          url: '',
          meta_title: '',
          meta_description: '',
          page_type: '',
          content_type: '',
        },
        // or more pages ...
      ]

      await axios.put(`/api/content/editor/projects/${projectId}`, {
        pages: pagesToSave,
      })
      alert('All pages saved successfully!')
    } catch (err) {
      console.error('Error saving all pages:', err)
      alert('Error saving all pages.')
    } finally {
      setSavingAll(false)
    }
  }

  /** Bubble menu for text selection (bold/italic/underline) */
  const bubbleMenu = (
    <BubbleMenu editor={editor} className={styles.bubbleMenu}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? styles.isActive : ''}
      >
        <FormatBoldIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? styles.isActive : ''}
      >
        <FormatItalicIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? styles.isActive : ''}
      >
        <FormatUnderlinedIcon />
      </button>
    </BubbleMenu>
  )

  /** The top toolbar for headings, formatting, etc. */
  const topToolbar = (
    <div className={styles.topToolbar}>

      {/* Example: heading dropdown or simple H1/H2 buttons */}
      <div className={styles.headingDropdown}>
        <button className={styles.dropdownButton}>
          Headings <ArrowDropDownIcon />
        </button>
        <div className={styles.dropdownContent}>
          {[1, 2, 3, 4, 5, 6].map((lvl) => (
            <button
              key={lvl}
              onClick={() => editor.chain().focus().toggleHeading({ level: lvl }).run()}
              className={editor.isActive('heading', { level: lvl }) ? styles.isActive : ''}
            >
              H{lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Strike */}
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? styles.isActive : ''}
      >
        <FormatStrikethroughIcon />
      </button>

      {/* Highlight */}
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={editor.isActive('highlight') ? styles.isActive : ''}
      >
        <HighlightIcon />
      </button>

      {/* Link */}
      <button
        onClick={() => {
          const url = prompt('Enter link URL') || ''
          if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          } else {
            editor.chain().focus().unsetLink().run()
          }
        }}
        className={editor.isActive('link') ? styles.isActive : ''}
      >
        <LinkIcon />
      </button>

      {/* Code */}
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? styles.isActive : ''}
      >
        <CodeIcon />
      </button>

      {/* Insert HR */}
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <HorizontalRuleIcon />
      </button>

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? styles.isActive : ''}
      >
        <FormatListNumberedIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? styles.isActive : ''}
      >
        <FormatListBulletedIcon />
      </button>

      {/* Table */}
      <button
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <TableChartIcon />
      </button>

      {/* Undo/Redo */}
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <UndoIcon />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <RedoIcon />
      </button>

      {/* Save Single / Save All */}
      <button onClick={handleSaveSingle} disabled={savingOne}>
        {savingOne ? 'Saving...' : <><SaveIcon /> Save</>}
      </button>
      <button onClick={handleSaveAll} disabled={savingAll}>
        {savingAll ? 'Saving...' : <><SaveAsIcon /> Save All</>}
      </button>
    </div>
  )

  // Show character/word counts
  const chars = editor.storage.characterCount.characters()
  const words = editor.storage.characterCount.words()

  return (
    <div className={styles.editorContainer}>
      {topToolbar}
      {bubbleMenu}

      <div className={styles.editorContent}>
        <EditorContent editor={editor} />
      </div>

      <div className={styles.bottomPanel}>
        <div>{chars} chars • {words} words</div>
        <div>
          {users.length} user(s){' '}
          {users.map((u, i) => (
            <span className={styles.userChip} key={i}>{u.name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
