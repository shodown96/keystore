"use client"

import { TableKit } from "@tiptap/extension-table"
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  BetweenHorizontalEnd,
  BetweenVerticalEnd,
  Bold,
  Code,
  Grid2x2X,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  PanelTop,
  Quote,
  SquareCode,
  Strikethrough,
  Table2,
  TableColumnsSplit,
  TableRowsSplit,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

export function RichTextEditor({
  content,
  onChange,
}: {
  content: JSONContent | null
  onChange: (doc: JSONContent) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: content ?? undefined,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "tiptap-content min-h-64 px-4 py-3 outline-none" },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  })

  return (
    <div className="rounded-lg border bg-background focus-within:ring-3 focus-within:ring-ring/50">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

export function RichTextViewer({ content }: { content: JSONContent }) {
  const editor = useEditor({
    // Same extensions as the editor so saved tables (and column widths) render.
    extensions: [StarterKit, TableKit],
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "tiptap-content outline-none" } },
  })
  return <EditorContent editor={editor} />
}

type ToolbarItem = { icon: LucideIcon; label: string; run: () => void; active?: boolean }

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      codeBlock: editor.isActive("codeBlock"),
      inTable: editor.isActive("table"),
    }),
  })

  const chain = () => editor.chain().focus()

  const formatting: ToolbarItem[] = [
    { icon: Heading2, label: "Heading", active: state.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
    { icon: Heading3, label: "Subheading", active: state.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    { icon: Bold, label: "Bold", active: state.bold, run: () => chain().toggleBold().run() },
    { icon: Italic, label: "Italic", active: state.italic, run: () => chain().toggleItalic().run() },
    { icon: Strikethrough, label: "Strikethrough", active: state.strike, run: () => chain().toggleStrike().run() },
    { icon: Code, label: "Inline code", active: state.code, run: () => chain().toggleCode().run() },
    { icon: List, label: "Bullet list", active: state.bullet, run: () => chain().toggleBulletList().run() },
    { icon: ListOrdered, label: "Numbered list", active: state.ordered, run: () => chain().toggleOrderedList().run() },
    { icon: Quote, label: "Quote", active: state.quote, run: () => chain().toggleBlockquote().run() },
    { icon: SquareCode, label: "Code block", active: state.codeBlock, run: () => chain().toggleCodeBlock().run() },
    {
      icon: Table2,
      label: "Insert table",
      active: state.inTable,
      run: () => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
  ]

  // Only shown while the cursor is inside a table.
  const tableTools: ToolbarItem[] = [
    { icon: BetweenHorizontalEnd, label: "Add row below", run: () => chain().addRowAfter().run() },
    { icon: BetweenVerticalEnd, label: "Add column right", run: () => chain().addColumnAfter().run() },
    { icon: TableRowsSplit, label: "Delete row", run: () => chain().deleteRow().run() },
    { icon: TableColumnsSplit, label: "Delete column", run: () => chain().deleteColumn().run() },
    { icon: PanelTop, label: "Toggle header row", run: () => chain().toggleHeaderRow().run() },
    { icon: Grid2x2X, label: "Delete table", run: () => chain().deleteTable().run() },
  ]

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
      {formatting.map((item) => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      {state.inTable && (
        <>
          <span className="mx-1 h-5 w-px bg-border" />
          {tableTools.map((item) => (
            <ToolbarButton key={item.label} {...item} />
          ))}
        </>
      )}
    </div>
  )
}

function ToolbarButton({ icon: Icon, label, run, active }: ToolbarItem) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={run}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
