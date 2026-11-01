import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { html } from '@codemirror/lang-html'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import {
  Compartment,
  EditorState,
  Prec,
  StateEffect,
  StateField,
  Transaction,
} from '@codemirror/state'
import { Decoration, EditorView, keymap, type DecorationSet } from '@codemirror/view'
import { isolateHistory, undo, undoDepth } from '@codemirror/commands'
import { tags } from '@lezer/highlight'
import './code-editor.css'

export type EditorSnippet = Readonly<{ label: string; text: string }>
export type EditorDiagnostic = Readonly<{ message: string; line?: number }>
export type EditorHandle = {
  focusLine: (line?: number) => void
  focus: () => void
}
export type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  snippets: readonly EditorSnippet[]
  diagnostic?: EditorDiagnostic
  disabled?: boolean
  filename?: string
  ariaLabel?: string
  feedbackId?: string
  onInteraction?: (event: 'snippet' | 'undo') => void
}

// Diagnostics decorate the source only. Updating a result must never move the
// user's caret; the explicit "go to line" action owns that movement.
const setErrorLine = StateEffect.define<number | undefined>()
const errorLine = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(current, transaction) {
    let next = transaction.docChanged ? Decoration.none : current.map(transaction.changes)
    for (const effect of transaction.effects) {
      if (!effect.is(setErrorLine)) continue
      const line = effect.value
      next =
        line && Number.isInteger(line) && line > 0 && line <= transaction.state.doc.lines
          ? Decoration.set(
              Decoration.line({ class: 'tc-code-error-line' }).range(
                transaction.state.doc.line(line).from
              )
            )
          : Decoration.none
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

const colors = HighlightStyle.define([
  { tag: tags.tagName, color: '#67e5ff' },
  { tag: tags.attributeName, color: '#d5edff' },
  { tag: tags.attributeValue, color: '#a6edce' },
  { tag: tags.string, color: '#a6edce' },
  { tag: tags.angleBracket, color: '#97b7ca' },
  { tag: tags.comment, color: '#778e9f', fontStyle: 'italic' },
  { tag: tags.meta, color: '#d1bcff' },
  { tag: tags.invalid, color: '#ffb5bf', textDecoration: 'underline wavy' },
])

const theme = EditorView.theme(
  {
    '&': { backgroundColor: '#07121e', color: '#eef7ff', fontSize: '18px', height: '100%' },
    '.cm-scroller': {
      fontFamily: '"IBM Plex Mono", "Chakra Petch", monospace',
      lineHeight: '1.7',
      overflow: 'auto',
    },
    '.cm-content': { padding: '16px 0', caretColor: '#71e7ff' },
    '.cm-line': { padding: '0 16px' },
    '.cm-gutters': {
      backgroundColor: '#0b1927',
      color: '#627f96',
      borderRight: '1px solid #274153',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 8px', minWidth: '34px' },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#68dfff0b' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: '#265368 !important',
    },
    '.cm-cursor': { borderLeftColor: '#85ecff', borderLeftWidth: '2px' },
    '.cm-matchingBracket': {
      color: '#fff',
      backgroundColor: '#30839955',
      outline: '1px solid #71dce688',
    },
    '.cm-panels': { backgroundColor: '#102332', color: '#d5eaf3', borderColor: '#365369' },
    '&.cm-focused': { outline: 'none' },
  },
  { dark: true }
)

/** Original HTML editor for TechCare. No Python runtime or game rules live here. */
export const CodeEditor = forwardRef<EditorHandle, CodeEditorProps>(function CodeEditor(
  {
    value,
    onChange,
    onSubmit,
    snippets,
    diagnostic,
    disabled = false,
    filename = 'evidence.html',
    ariaLabel = 'เขียนโค้ด HTML',
    feedbackId,
    onInteraction,
  },
  ref
) {
  const host = useRef<HTMLDivElement>(null)
  const editor = useRef<EditorView | null>(null)
  const editable = useRef(new Compartment())
  const callbacks = useRef({ onChange, onSubmit, disabled, onInteraction })
  callbacks.current = { onChange, onSubmit, disabled, onInteraction }

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        editor.current?.focus()
      },
      focusLine(number = 1) {
        const view = editor.current
        if (!view) return
        const safe = Number.isFinite(number) ? Math.trunc(number) : 1
        const line = view.state.doc.line(Math.min(view.state.doc.lines, Math.max(1, safe)))
        view.dispatch({
          selection: { anchor: line.from },
          effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
        })
        view.focus()
      },
    }),
    []
  )

  useLayoutEffect(() => {
    if (!host.current) return
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          html(),
          syntaxHighlighting(colors),
          theme,
          errorLine,
          EditorView.lineWrapping,
          editable.current.of(EditorView.editable.of(!disabled)),
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  if (!callbacks.current.disabled) callbacks.current.onSubmit()
                  return true
                },
              },
            ])
          ),
          EditorView.contentAttributes.of({
            'aria-label': ariaLabel,
            ...(feedbackId ? { 'aria-describedby': feedbackId } : {}),
            spellcheck: 'false',
            autocorrect: 'off',
            autocapitalize: 'off',
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              update.view.contentDOM.setAttribute('aria-invalid', 'false')
              callbacks.current.onChange(update.state.doc.toString())
              if (update.transactions.some((transaction) => transaction.isUserEvent('undo')))
                callbacks.current.onInteraction?.('undo')
            }
          }),
        ],
      }),
    })
    editor.current = view
    return () => {
      editor.current = null
      view.destroy()
    }
    // This mount owns one editor. Prop updates are transactions below, so typing
    // does not recreate the view or discard selection/undo history.
  }, [])

  useLayoutEffect(() => {
    const view = editor.current
    if (view && view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    }
  }, [value])
  useEffect(() => {
    editor.current?.dispatch({
      effects: editable.current.reconfigure(EditorView.editable.of(!disabled)),
    })
  }, [disabled])
  useEffect(() => {
    const view = editor.current
    if (!view) return
    view.dispatch({ effects: setErrorLine.of(diagnostic?.line) })
    view.contentDOM.setAttribute('aria-invalid', diagnostic ? 'true' : 'false')
  }, [diagnostic])

  const insert = (snippet: string) => {
    const view = editor.current
    if (!view || disabled) return
    view.dispatch({
      ...view.state.replaceSelection(snippet),
      scrollIntoView: true,
      annotations: [Transaction.userEvent.of('input.snippet'), isolateHistory.of('full')],
    })
    view.focus()
    callbacks.current.onInteraction?.('snippet')
  }

  return (
    <section className="tc-code-editor" aria-label="เทอร์มินัลเขียน HTML" data-disabled={disabled}>
      <header className="tc-code-file">
        <span>
          <i aria-hidden="true" />
          {filename}
        </span>
        <span>
          HTML <kbd>Ctrl ↵</kbd>
        </span>
      </header>
      <div
        ref={host}
        className="tc-code-host"
        data-testid="html-editor"
        data-tutorial-target="edit-code"
      />
      <div className="tc-code-tools" role="group" aria-label="ตัวช่วยแทรกแท็ก HTML">
        <span className="tc-code-tools-label">แทรก</span>
        {snippets.map((snippet, index) => (
          <button
            key={`${snippet.label}-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => insert(snippet.text)}
            aria-label={`แทรก ${snippet.label}`}
            data-tutorial-target="editor-snippet"
          >
            {snippet.label}
          </button>
        ))}
        <button
          type="button"
          data-tutorial-target="editor-undo"
          aria-label="เลิกทำการแก้ไข"
          disabled={disabled || !editor.current || undoDepth(editor.current.state) === 0}
          onClick={() => {
            const view = editor.current
            if (view && !disabled) {
              undo(view)
              view.focus()
            }
          }}
        >
          ↶ เลิกทำ
        </button>
      </div>
    </section>
  )
})
