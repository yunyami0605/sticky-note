import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { Node } from '@tiptap/pm/model'

const HANDLE_SVG = `<svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
  <circle cx="2.5" cy="2.5" r="1.5"/>
  <circle cx="7.5" cy="2.5" r="1.5"/>
  <circle cx="2.5" cy="8" r="1.5"/>
  <circle cx="7.5" cy="8" r="1.5"/>
  <circle cx="2.5" cy="13.5" r="1.5"/>
  <circle cx="7.5" cy="13.5" r="1.5"/>
</svg>`

const HANDLE_W = 20
const HANDLE_H = 24
const HANDLE_GAP = 6
const DRAG_THRESHOLD = 5

class DragHandleView {
  private handle: HTMLElement
  private dropLine: HTMLElement
  private view: EditorView

  // Handle hover state
  private currentPos = -1
  private currentNode: Node | null = null
  private hideTimer: ReturnType<typeof setTimeout> | null = null

  // Mouse-drag state (no HTML5 DnD)
  private isDragging = false
  private dragStartY = 0
  private dragFromPos = -1
  private dragNode: Node | null = null

  constructor(view: EditorView) {
    this.view = view

    this.handle = document.createElement('div')
    this.handle.className = 'tiptap-drag-handle'
    this.handle.innerHTML = HANDLE_SVG
    this.handle.style.cssText = `position:fixed;display:none;z-index:999;width:${HANDLE_W}px;height:${HANDLE_H}px`
    document.body.appendChild(this.handle)

    // Drop position indicator line
    this.dropLine = document.createElement('div')
    this.dropLine.style.cssText = `position:fixed;display:none;z-index:998;height:2px;background:#6366f1;border-radius:1px;pointer-events:none`
    document.body.appendChild(this.dropLine)

    document.addEventListener('mousemove', this.onDocMouseMove)
    this.handle.addEventListener('mousedown', this.onMouseDown)
  }

  private findTopLevelBlock(pos: number): { node: Node; pos: number } | null {
    const { doc } = this.view.state
    const $pos = doc.resolve(pos)
    for (let d = $pos.depth; d >= 1; d--) {
      if ($pos.node(d - 1) === doc) {
        return { node: $pos.node(d), pos: $pos.before(d) }
      }
    }
    return null
  }

  private onDocMouseMove = (e: MouseEvent): void => {
    // During drag, don't update hover state
    if (this.isDragging) {
      this.updateDropLine(e.clientX, e.clientY)
      return
    }

    if (this.handle.contains(e.target as Node)) {
      if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null }
      return
    }

    const container = this.view.dom.parentElement as HTMLElement | null
    const containerRect = container?.getBoundingClientRect() ?? this.view.dom.getBoundingClientRect()

    if (
      e.clientY < containerRect.top ||
      e.clientY > containerRect.bottom ||
      e.clientX > containerRect.right ||
      e.clientX < containerRect.left - HANDLE_W - HANDLE_GAP - 8
    ) {
      this.scheduleHide()
      return
    }

    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null }

    const pos = this.view.posAtCoords({ left: this.editorX(), top: e.clientY })
    if (!pos) return

    const block = this.findTopLevelBlock(pos.pos)
    if (!block) return

    if (block.pos === this.currentPos) return

    this.currentNode = block.node
    this.currentPos = block.pos

    const domNode = this.view.nodeDOM(block.pos) as HTMLElement | null
    if (!domNode) return

    const nodeRect = domNode.getBoundingClientRect()
    const left = Math.max(nodeRect.left - HANDLE_W - HANDLE_GAP, 2)
    const top = nodeRect.top + nodeRect.height / 2 - HANDLE_H / 2

    this.handle.style.display = 'flex'
    this.handle.style.left = `${left}px`
    this.handle.style.top = `${top}px`
  }

  private editorX(): number {
    const rect = this.view.dom.getBoundingClientRect()
    return rect.left + rect.width / 2
  }

  private updateDropLine(clientX: number, clientY: number): void {
    const pos = this.view.posAtCoords({ left: this.editorX(), top: clientY })
    if (!pos) { this.dropLine.style.display = 'none'; return }

    const block = this.findTopLevelBlock(pos.pos)
    if (!block) { this.dropLine.style.display = 'none'; return }

    const domNode = this.view.nodeDOM(block.pos) as HTMLElement | null
    if (!domNode) { this.dropLine.style.display = 'none'; return }

    const rect = domNode.getBoundingClientRect()
    const isAbove = clientY < rect.top + rect.height / 2
    const lineY = isAbove ? rect.top - 1 : rect.bottom - 1

    this.dropLine.style.display = 'block'
    this.dropLine.style.left = `${rect.left}px`
    this.dropLine.style.top = `${lineY}px`
    this.dropLine.style.width = `${rect.width}px`
  }

  private scheduleHide(): void {
    if (this.hideTimer) return
    this.hideTimer = setTimeout(() => {
      this.handle.style.display = 'none'
      this.currentNode = null
      this.currentPos = -1
      this.hideTimer = null
    }, 400)
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0 || this.currentPos < 0 || !this.currentNode) return
    e.preventDefault()

    this.dragFromPos = this.currentPos
    this.dragNode = this.currentNode
    this.dragStartY = e.clientY

    document.addEventListener('mousemove', this.onDragMove)
    document.addEventListener('mouseup', this.onMouseUp)
  }

  private onDragMove = (e: MouseEvent): void => {
    if (!(e.buttons & 1)) {
      this.endDrag()
      return
    }
    if (!this.isDragging && Math.abs(e.clientY - this.dragStartY) > DRAG_THRESHOLD) {
      this.isDragging = true
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    }
    if (this.isDragging) {
      this.updateDropLine(e.clientX, e.clientY)
    }
  }

  private onMouseUp = (e: MouseEvent): void => {
    if (this.isDragging && this.dragFromPos >= 0 && this.dragNode) {
      const pos = this.view.posAtCoords({ left: this.editorX(), top: e.clientY })
      if (pos) {
        this.performMove(this.dragFromPos, this.dragNode, pos.pos, e.clientY)
      }
    }
    this.endDrag()
  }

  private endDrag(): void {
    this.isDragging = false
    this.dragFromPos = -1
    this.dragNode = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    this.dropLine.style.display = 'none'
    document.removeEventListener('mousemove', this.onDragMove)
    document.removeEventListener('mouseup', this.onMouseUp)
  }

  private performMove(fromPos: number, fromNode: Node, toPos: number, toClientY: number): void {
    const { state } = this.view
    const from = fromPos
    const to = fromPos + fromNode.nodeSize

    if (toPos >= from && toPos <= to) return

    const targetBlock = this.findTopLevelBlock(toPos)
    if (!targetBlock || targetBlock.pos === from) return

    const targetDom = this.view.nodeDOM(targetBlock.pos) as HTMLElement | null
    const targetRect = targetDom?.getBoundingClientRect()
    const insertBefore = targetRect
      ? toClientY < targetRect.top + targetRect.height / 2
      : targetBlock.pos < from

    const insertPos = insertBefore
      ? targetBlock.pos
      : targetBlock.pos + targetBlock.node.nodeSize

    const tr = state.tr

    if (insertPos <= from) {
      tr.insert(insertPos, fromNode)
      tr.delete(tr.mapping.map(from), tr.mapping.map(to))
    } else {
      tr.delete(from, to)
      tr.insert(tr.mapping.map(insertPos), fromNode)
    }

    this.view.dispatch(tr)
    this.view.focus()
  }

  destroy(): void {
    document.removeEventListener('mousemove', this.onDocMouseMove)
    document.removeEventListener('mousemove', this.onDragMove)
    document.removeEventListener('mouseup', this.onMouseUp)
    this.handle.remove()
    this.dropLine.remove()
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
