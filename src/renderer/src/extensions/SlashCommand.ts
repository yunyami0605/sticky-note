import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import { SLASH_COMMANDS, SlashCommandMenu } from '../components/SlashCommandMenu'
import type { SlashCommandMenuHandle } from '../components/SlashCommandMenu'

const SlashCommandPluginKey = new PluginKey('slashCommand')

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return { dark: false }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: SlashCommandPluginKey,
        editor: this.editor,
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase()
          if (!q) return SLASH_COMMANDS
          return SLASH_COMMANDS.filter(
            (item) =>
              item.title.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
          )
        },
        render: () => {
          let renderer: ReactRenderer<SlashCommandMenuHandle> | null = null
          let popup: HTMLDivElement | null = null

          return {
            onStart: (props) => {
              popup = document.createElement('div')
              popup.style.cssText = 'position:fixed;z-index:9999'
              document.body.appendChild(popup)

              renderer = new ReactRenderer(SlashCommandMenu, {
                props: { ...props, dark: false },
                editor: props.editor,
              })
              popup.appendChild(renderer.element)
              positionPopup(popup, props.clientRect?.())
            },

            onUpdate: (props) => {
              renderer?.updateProps({ ...props, dark: false })
              positionPopup(popup, props.clientRect?.())
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                cleanup()
                return true
              }
              return renderer?.ref?.onKeyDown(props.event) ?? false
            },

            onExit: () => cleanup(),
          }

          function cleanup(): void {
            renderer?.destroy()
            popup?.remove()
            renderer = null
            popup = null
          }

          function positionPopup(el: HTMLDivElement | null, rect: DOMRect | null | undefined): void {
            if (!el || !rect) return
            const viewH = window.innerHeight
            const spaceBelow = viewH - rect.bottom
            if (spaceBelow < 300) {
              el.style.bottom = `${viewH - rect.top + 4}px`
              el.style.top = ''
            } else {
              el.style.top = `${rect.bottom + 4}px`
              el.style.bottom = ''
            }
            el.style.left = `${rect.left}px`
          }
        },
      }),
    ]
  },
})
