import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection, TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'

const HANDLE_SVG = `<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <circle cx="2.5" cy="2.5" r="1.5"/>
  <circle cx="7.5" cy="2.5" r="1.5"/>
  <circle cx="2.5" cy="8" r="1.5"/>
  <circle cx="7.5" cy="8" r="1.5"/>
  <circle cx="2.5" cy="13.5" r="1.5"/>
  <circle cx="7.5" cy="13.5" r="1.5"/>
</svg>`

class DragHandleView {
  private handle: HTMLElement
  private view: EditorView
  private currentNode: Node | null = null
  private currentPos: number = -1
  private hideTimer: ReturnType<typeof setTimeout> | null = null

  constructor(view: EditorView) {
    this.view = view

    this.handle = document.createElement('div')
    this.handle.className = 'tiptap-drag-handle'
    this.handle.setAttribute('draggable', 'true')
    this.handle.innerHTML = HANDLE_SVG
    this.handle.style.cssText = 'display:none'

    const container = view.dom.closest('.tiptap') ?? view.dom.parentElement
    if (container) {
      (container as HTMLElement).style.position = 'relative'
      container.appendChild(this.handle)
    }

    view.dom.addEventListener('mousemove', this.onMouseMove)
    view.dom.addEventListener('mouseleave', this.onMouseLeave)
    this.handle.addEventListener('mouseenter', this.onHandleEnter)
    this.handle.addEventListener('mouseleave', this.onHandleLeave)
    this.handle.addEventListener('dragstart', this.onDragStart)
    this.handle.addEventListener('dragend', this.onDragEnd)
  }

  private findTopLevelBlock(pos: number): { node: Node; pos: number } | null {
    const { doc } = this.view.state
    // Walk up to find a direct child of the document
    let $pos = doc.resolve(pos)
    for (let d = $pos.depth; d >= 1; d--) {
      if ($pos.node(d - 1) === doc) {
        return { node: $pos.node(d), pos: $pos.before(d) }
      }
    }
    return null
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null }

    const coords = { left: e.clientX, top: e.clientY }
    const pos = this.view.posAtCoords(coords)
    if (!pos) { this.hideHandle(); return }

    const block = this.findTopLevelBlock(pos.pos)
    if (!block) { this.hideHandle(); return }

    this.currentNode = block.node
    this.currentPos = block.pos

    const domNode = this.view.nodeDOM(block.pos)
    if (!domNode) { this.hideHandle(); return }

    const container = (this.handle.parentElement as HTMLElement)
    const containerRect = container.getBoundingClientRect()
    const nodeRect = (domNode as HTMLElement).getBoundingClientRect()

    const top = nodeRect.top - containerRect.top + container.scrollTop + (nodeRect.height / 2) - 12
    const left = nodeRect.left - containerRect.left - 22

    this.handle.style.display = 'flex'
    this.handle.style.position = 'absolute'
    this.handle.style.top = `${top}px`
    this.handle.style.left = `${left}px`
    this.handle.style.opacity = '0.4'
  }

  private onMouseLeave = (): void => {
    this.hideTimer = setTimeout(() => this.hideHandle(), 300)
  }

  private onHandleEnter = (): void => {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null }
    this.handle.style.opacity = '1'
  }

  private onHandleLeave = (): void => {
    this.hideTimer = setTimeout(() => this.hideHandle(), 300)
  }

  private hideHandle(): void {
    this.handle.style.display = 'none'
    this.currentNode = null
    this.currentPos = -1
  }

  private onDragStart = (e: DragEvent): void => {
    if (!e.dataTransfer || this.currentPos < 0 || !this.currentNode) return

    const { state } = this.view
    const from = this.currentPos
    const to = from + this.currentNode.nodeSize

    // Select the block so ProseMirror knows what's being dragged
    let sel
    try {
      sel = NodeSelection.create(state.doc, from)
    } catch {
      sel = TextSelection.create(state.doc, from, to)
    }
    const tr = state.tr.setSelection(sel)
    this.view.dispatch(tr)

    // Set drag data for ProseMirror
    const slice = state.doc.slice(from, to)
    this.view.dragging = { slice, move: true }

    const text = this.currentNode.textContent
    e.dataTransfer.clearData()
    e.dataTransfer.setData('text/plain', text)
    e.dataTransfer.effectAllowed = 'move'
  }

  private onDragEnd = (): void => {
    this.view.dragging = null
    this.hideHandle()
  }

  destroy(): void {
    this.view.dom.removeEventListener('mousemove', this.onMouseMove)
    this.view.dom.removeEventListener('mouseleave', this.onMouseLeave)
    this.handle.removeEventListener('mouseenter', this.onHandleEnter)
    this.handle.removeEventListener('mouseleave', this.onHandleLeave)
    this.handle.removeEventListener('dragstart', this.onDragStart)
    this.handle.removeEventListener('dragend', this.onDragEnd)
    this.handle.remove()
    if (this.hideTimer) clearTimeout(this.hideTimer)
  }
}

export const DragHandle = Extension.create({
  name: 'dragHandle',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('dragHandle'),
        view: (editorView) => new DragHandleView(editorView),
      }),
    ]
  },
})
