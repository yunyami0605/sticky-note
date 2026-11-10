import { Extension, Node, mergeAttributes } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'

const MentionPluginKey = new PluginKey('mentionSuggestion')
import { ReactRenderer } from '@tiptap/react'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { createElement } from 'react'

// ── Mention Node ──────────────────────────────────────────────
export const MentionNode = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-mention]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-mention': '', 'data-id': node.attrs.id }),
      `@${node.attrs.label as string}`,
    ]
  },
})

// ── Mention Popup Component ───────────────────────────────────
interface MentionItem { id: string; label: string }

interface MentionMenuProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
  dark?: boolean
}

export interface MentionMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

export const MentionMenuComponent = forwardRef<MentionMenuHandle, MentionMenuProps>(
  ({ items, command, dark }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowUp') { setSelectedIndex((i) => (i - 1 + items.length) % items.length); return true }
        if (event.key === 'ArrowDown') { setSelectedIndex((i) => (i + 1) % items.length); return true }
        if (event.key === 'Enter') { if (items[selectedIndex]) command(items[selectedIndex]); return true }
        return false
      },
    }))

    if (!items.length) return null

    return createElement(
      'div',
      {
        className: 'rounded-xl shadow-2xl border overflow-hidden',
        style: {
          minWidth: 180,
          maxHeight: 220,
          overflowY: 'auto' as const,
          backgroundColor: dark ? '#1e1e30' : '#ffffff',
          borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
        },
      },
      items.map((item, index) =>
        createElement(
          'button',
          {
            key: item.id,
            onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); command(item) },
            onMouseEnter: () => setSelectedIndex(index),
            className: 'flex items-center gap-2 w-full px-3 py-2 text-left text-xs transition-colors',
            style: {
              backgroundColor: index === selectedIndex
                ? dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                : 'transparent',
              color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
            },
          },
          createElement('span', { className: 'opacity-50 text-[10px]' }, '@'),
          item.label
        )
      )
    )
  }
)

MentionMenuComponent.displayName = 'MentionMenuComponent'

// ── Mention Extension ─────────────────────────────────────────
export const Mention = Extension.create({
  name: 'mentionSuggestion',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: MentionPluginKey,
        editor: this.editor,
        char: '@',
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'mention',
              attrs: { id: (props as MentionItem).id, label: (props as MentionItem).label },
            })
            .run()
        },
        items: async ({ query }: { query: string }) => {
          try {
            const notes = await window.api.note.getAll()
            const q = query.toLowerCase()
            return notes
              .filter((n) => {
                if (!n.content) return false
                try {
                  const parsed = JSON.parse(n.content)
                  const texts: string[] = []
                  const walk = (node: { text?: string; content?: unknown[] }): void => {
                    if (node.text) texts.push(node.text)
                    node.content?.forEach((c) => walk(c as typeof node))
                  }
                  parsed.content?.forEach((nd: unknown) => walk(nd as { text?: string; content?: unknown[] }))
                  const title = texts.join(' ').trim() || '메모'
                  return !q || title.toLowerCase().includes(q)
                } catch { return false }
              })
              .slice(0, 8)
              .map((n) => {
                try {
                  const parsed = JSON.parse(n.content)
                  const texts: string[] = []
                  const walk = (node: { text?: string; content?: unknown[] }): void => {
                    if (node.text) texts.push(node.text)
                    node.content?.forEach((c) => walk(c as typeof node))
                  }
                  parsed.content?.forEach((nd: unknown) => walk(nd as { text?: string; content?: unknown[] }))
                  return { id: n.id, label: texts.join(' ').trim().slice(0, 30) || '메모' }
                } catch { return { id: n.id, label: '메모' } }
              })
          } catch { return [] }
        },
        render: () => {
          let renderer: ReactRenderer<MentionMenuHandle> | null = null
          let popup: HTMLDivElement | null = null

          return {
            onStart: (props) => {
              popup = document.createElement('div')
              popup.style.cssText = 'position:fixed;z-index:9999'
              document.body.appendChild(popup)
              renderer = new ReactRenderer(MentionMenuComponent, { props: { ...props, dark: false }, editor: props.editor })
              popup.appendChild(renderer.element)
              positionPopup(popup, props.clientRect?.())
            },
            onUpdate: (props) => {
              renderer?.updateProps({ ...props, dark: false })
              positionPopup(popup, props.clientRect?.())
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') { cleanup(); return true }
              return renderer?.ref?.onKeyDown(props.event) ?? false
            },
            onExit: () => cleanup(),
          }

          function cleanup(): void { renderer?.destroy(); popup?.remove(); renderer = null; popup = null }
          function positionPopup(el: HTMLDivElement | null, rect: DOMRect | null | undefined): void {
            if (!el || !rect) return
            const viewH = window.innerHeight
            const spaceBelow = viewH - rect.bottom
            if (spaceBelow < 240) { el.style.bottom = `${viewH - rect.top + 4}px`; el.style.top = '' }
            else { el.style.top = `${rect.bottom + 4}px`; el.style.bottom = '' }
            el.style.left = `${rect.left}px`
          }
        },
      }),
    ]
  },
})
