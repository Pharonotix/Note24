import { lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { Edge as RFEdge, Node as RFNode, NodeProps, ReactFlowInstance } from '@xyflow/react'

export type ComponentKind = 'resistor' | 'capacitor' | 'inductor' | 'ic' | 'source' | 'ground'

export type CircuitNodeData = { kind: ComponentKind; label: string }
export type CircuitFlowNode = RFNode<CircuitNodeData>
export type CircuitFlowEdge = RFEdge

export interface CircuitCanvasProps {
  initialNodes: CircuitFlowNode[]
  initialEdges: CircuitFlowEdge[]
  onChange: (nodes: CircuitFlowNode[], edges: CircuitFlowEdge[]) => void
  editable: boolean
  dark: boolean
}

export const COMPONENT_DEFS: { kind: ComponentKind; label: string; defaultLabel: string }[] = [
  { kind: 'resistor', label: 'Resistor', defaultLabel: 'R1' },
  { kind: 'capacitor', label: 'Capacitor', defaultLabel: 'C1' },
  { kind: 'inductor', label: 'Inductor', defaultLabel: 'L1' },
  { kind: 'ic', label: 'IC', defaultLabel: 'U1' },
  { kind: 'source', label: 'Source', defaultLabel: 'V1' },
  { kind: 'ground', label: 'Ground', defaultLabel: 'GND' }
]

/** Minimal standard schematic symbols, drawn in a 80x36 viewBox (ground is 40x36). */
function Symbol({ kind }: { kind: ComponentKind }): React.JSX.Element {
  const stroke = 'currentColor'
  switch (kind) {
    case 'resistor':
      return (
        <svg width={80} height={36} viewBox="0 0 80 36">
          <path
            d="M0 18 H16 L22 6 L30 30 L38 6 L46 30 L54 6 L62 18 H80"
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
        </svg>
      )
    case 'capacitor':
      return (
        <svg width={80} height={36} viewBox="0 0 80 36">
          <path d="M0 18 H34 M46 18 H80 M34 4 V32 M46 4 V32" fill="none" stroke={stroke} strokeWidth={2} />
        </svg>
      )
    case 'inductor':
      return (
        <svg width={80} height={36} viewBox="0 0 80 36">
          <path
            d="M0 18 H12 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 H80"
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
        </svg>
      )
    case 'source':
      return (
        <svg width={80} height={36} viewBox="0 0 80 36">
          <path d="M0 18 H30 M30 6 V30 M50 10 V26 M50 18 H80" fill="none" stroke={stroke} strokeWidth={2} />
          <text x="26" y="6" fontSize="10" fill={stroke}>
            +
          </text>
        </svg>
      )
    case 'ic':
      return (
        <svg width={80} height={44} viewBox="0 0 80 44">
          <rect x={10} y={4} width={60} height={36} fill="none" stroke={stroke} strokeWidth={2} rx={2} />
          <path d="M0 12 H10 M0 32 H10 M70 12 H80 M70 32 H80" stroke={stroke} strokeWidth={2} />
        </svg>
      )
    case 'ground':
      return (
        <svg width={40} height={36} viewBox="0 0 40 36">
          <path d="M20 0 V16 M8 16 H32 M12 22 H28 M16 28 H24" stroke={stroke} strokeWidth={2} />
        </svg>
      )
    default:
      return <svg width={80} height={36} />
  }
}

/**
 * Lazily loads React Flow and builds the interactive circuit canvas inside the loader —
 * same architectural reasoning as FlowchartCanvas.tsx (hooks come from the dynamic
 * import, so the whole component has to be assembled here).
 */
export const CircuitCanvas = lazy(async () => {
  const [{ ReactFlow, Background, Controls, Handle, Position, useNodesState, useEdgesState, addEdge }] =
    await Promise.all([import('@xyflow/react'), import('@xyflow/react/dist/style.css')])

  type EditableData = CircuitNodeData & { editable: boolean; onRename: (id: string, label: string) => void }

  function ComponentNode({ id, data }: NodeProps<RFNode<EditableData>>): React.JSX.Element {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(data.label)
    useEffect(() => setText(data.label), [data.label])

    const commit = (): void => {
      setEditing(false)
      if (text.trim() && text !== data.label) data.onRename(id, text.trim())
      else setText(data.label)
    }

    const horizontal = data.kind !== 'ground'

    return (
      <div
        onDoubleClick={() => data.editable && setEditing(true)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text, #eee)' }}
      >
        {horizontal ? (
          <>
            <Handle type="source" position={Position.Left} id="left" style={{ top: 18 }} />
            <Handle type="source" position={Position.Right} id="right" style={{ top: 18 }} />
          </>
        ) : (
          <Handle type="source" position={Position.Top} id="top" />
        )}
        <Symbol kind={data.kind} />
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
              width: 60,
              textAlign: 'center',
              background: 'var(--bg, #1a1a1a)',
              color: 'inherit',
              border: '1px solid var(--primary, #4a90d9)',
              borderRadius: 4,
              font: 'inherit',
              marginTop: 2
            }}
          />
        ) : (
          <span style={{ fontSize: 12, marginTop: 2 }}>{data.label}</span>
        )}
      </div>
    )
  }

  const nodeTypes = { component: ComponentNode }

  function Canvas({ initialNodes, initialEdges, onChange, editable, dark }: CircuitCanvasProps): React.JSX.Element {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
    const rfInstance = useRef<ReactFlowInstance<never, never> | null>(null)

    const onRename = useCallback(
      (id: string, label: string) => {
        setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)))
      },
      [setNodes]
    )

    useEffect(() => {
      onChange(
        nodes.map((n) => ({ ...n, data: { kind: n.data.kind, label: n.data.label } })),
        edges
      )
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges])

    const onConnect = useCallback(
      (params: Parameters<typeof addEdge>[0]) => setEdges((eds) => addEdge({ ...params, type: 'step' }, eds)),
      [setEdges]
    )

    const addComponent = (kind: ComponentKind, defaultLabel: string): void => {
      const id = `n${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: 'component',
          position: { x: 60 + Math.random() * 260, y: 60 + Math.random() * 200 },
          data: { kind, label: defaultLabel, editable, onRename }
        }
      ])
      requestAnimationFrame(() => rfInstance.current?.fitView({ padding: 0.3, duration: 200 }))
    }

    const displayNodes = nodes.map((n) => ({ ...n, type: 'component', data: { ...n.data, editable, onRename } }))

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }} data-circuit-canvas="">
        {editable && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 5,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              maxWidth: '70%'
            }}
          >
            {COMPONENT_DEFS.map((c) => (
              <button
                key={c.kind}
                onClick={() => addComponent(c.kind, c.defaultLabel)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--border, #444)',
                  background: 'var(--surface-3, #333)',
                  color: 'var(--text, #eee)',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                + {c.label}
              </button>
            ))}
          </div>
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
        </ReactFlow>
      </div>
    )
  }

  return { default: Canvas }
})
