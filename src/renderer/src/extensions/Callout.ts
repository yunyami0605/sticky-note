import { Node, mergeAttributes } from '@tiptap/core'

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      emoji: { default: '💡' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'callout', 'data-emoji': node.attrs.emoji }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        (emoji = '💡') =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { emoji })
        },
      toggleCallout:
        (emoji = '💡') =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { emoji })
        },
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (emoji?: string) => ReturnType
      toggleCallout: (emoji?: string) => ReturnType
    }
  }
}
