import { lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { Edge as RFEdge, Node as RFNode, NodeProps, ReactFlowInstance } from '@xyflow/react'

export type FlowNodeData = { label: string }
export type FlowNode = RFNode<FlowNodeData>
export type FlowEdge = RFEdge

export interface FlowchartCanvasProps {
  initialNodes: FlowNode[]
  initialEdges: FlowEdge[]
  onChange: (nodes: FlowNode[], edges: FlowEdge[]) => void
  editable: boolean
  dark: boolean
}

/**
 * Lazily loads React Flow (and its CSS) and builds the whole interactive graph
 * component inside the loader — hooks like useNodesState come from the dynamically
 * imported module, so the canvas (and a small custom editable-label node type)
 * has to be assembled here rather than at module scope (same reasoning as
 * ExcalidrawCanvas.tsx's lazy-loaded Canvas wrapper).
 */
export const FlowchartCanvas = lazy(async () => {
  const [{ ReactFlow, Background, Controls, MiniMap, Handle, Position, useNodesState, useEdgesState, addEdge }] =
    await Promise.all([import('@xyflow/react'), import('@xyflow/react/dist/style.css')])

  type EditableNodeData = FlowNodeData & {
    editable: boolean
    onRename: (id: string, label: string) => void
  }

  function EditableNode({ id, data }: NodeProps<RFNode<EditableNodeData>>): React.JSX.Element {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(data.label)

    useEffect(() => setText(data.label), [data.label])

    const commit = (): void => {
      setEditing(false)
      if (text.trim() && text !== data.label) data.onRename(id, text.trim())
      else setText(data.label)
    }

    return (
      <div
        className="flowchart-node"
        onDoubleClick={() => data.editable && setEditing(true)}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid var(--border-strong, #555)',
          background: 'var(--surface-2, #2a2a2a)',
          color: 'var(--text, #eee)',
          minWidth: 90,
          textAlign: 'center',
          fontSize: 13
        }}
      >
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Left} id="l" />
        <Handle type="source" position={Position.Right} id="r" />
        {editing ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setText(data.label)
                setEditing(false)
              }
              e.stopPropagation()
            }}
            style={{
              width: '100%',
              background: 'var(--bg, #1a1a1a)',
              color: 'inherit',
              border: '1px solid var(--primary, #4a90d9)',
              borderRadius: 4,
              font: 'inherit',
              textAlign: 'center'
            }}
          />
        ) : (
          <span>{data.label || 'Node'}</span>
        )}
        <Handle type="source" position={Position.Bottom} />
      </div>
    )
  }

  const nodeTypes = { editable: EditableNode }

  function Canvas({ initialNodes, initialEdges, onChange, editable, dark }: FlowchartCanvasProps): React.JSX.Element {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
    // Loosely typed on purpose: ReactFlow's exact node generic here doesn't line up
    // with the ad-hoc `displayNodes` mapping below, and fitView() doesn't need it.
    const rfInstance = useRef<ReactFlowInstance<never, never> | null>(null)

    const onRename = useCallback(
      (id: string, label: string) => {
        setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)))
      },
      [setNodes]
    )

    // Push live changes up to the TipTap node attrs (caller debounces the write).
    useEffect(() => {
      onChange(
        nodes.map((n) => ({ ...n, data: { label: n.data.label } })),
        edges
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges])

    const onConnect = useCallback(
      (params: Parameters<typeof addEdge>[0]) => setEdges((eds) => addEdge(params, eds)),
      [setEdges]
    )

    const addNode = (): void => {
      // Date.now() alone can collide when a user clicks "+ Node" rapidly (multiple
      // calls land in the same millisecond) — React Flow silently drops nodes that
      // share an id, so a random suffix is needed, not just a timestamp.
      const id = `n${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: 'editable',
          position: { x: 60 + Math.random() * 240, y: 60 + Math.random() * 200 },
          data: { label: 'New node', editable, onRename }
        }
      ])
      // `fitView` (the ReactFlow prop below) only runs once on mount, so a node added
      // later at a random position can land outside the current viewport — refit after
      // React commits the new node so it's always visible.
      requestAnimationFrame(() => rfInstance.current?.fitView({ padding: 0.3, duration: 200 }))
    }

    const displayNodes = nodes.map((n) => ({ ...n, type: 'editable', data: { ...n.data, editable, onRename } }))

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {editable && (
          <button
            onClick={addNode}
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 5,
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid var(--border, #444)',
              background: 'var(--surface-3, #333)',
              color: 'var(--text, #eee)',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            + Node
          </button>
        )}
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={editable ? onNodesChange : undefined}
          onEdgesChange={editable ? onEdgesChange : undefined}
          onConnect={editable ? onConnect : undefined}
          nodesDraggable={editable}
          nodesConnectable={editable}
          elementsSelectable={editable}
          colorMode={dark ? 'dark' : 'light'}
          fitView
          onInit={(instance) => {
            rfInstance.current = instance as unknown as ReactFlowInstance<never, never>
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={editable} />
          <MiniMap pannable zoomable />
        </ReactFlow>
      </div>
    )
  }

  return { default: Canvas }
})
