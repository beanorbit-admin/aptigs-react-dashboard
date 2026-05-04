import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Undo2, Redo2,
} from 'lucide-react'

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-1 self-center" />
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const suppressEffect = useRef(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editorProps: {
      attributes: { class: 'rich-editor focus:outline-none' },
    },
    onUpdate({ editor }) {
      suppressEffect.current = true
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    if (suppressEffect.current) { suppressEffect.current = false; return }
    const incoming = value || ''
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, false)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <span className="text-xs font-bold leading-none">H1</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <span className="text-xs font-bold leading-none">H2</span>
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo (Ctrl+Shift+Z)">
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {/* Editable area */}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty && placeholder && (
          <p className="absolute top-0 left-0 px-3 py-2 text-sm text-gray-400 pointer-events-none select-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  )
}
