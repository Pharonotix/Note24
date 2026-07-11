import { lazy, type ComponentProps } from 'react'
import type { Excalidraw as ExcalidrawType } from '@excalidraw/excalidraw'

type ExcalidrawProps = ComponentProps<typeof ExcalidrawType>

/**
 * Shared Excalidraw wrapper used by both drawing blocks and the note-wide
 * annotation overlay. Lazily loads Excalidraw (and its CSS) and renders a
 * trimmed, app-themed MainMenu (just Clear canvas) instead of Excalidraw's
 * own default menu items.
 *
 * `MainMenu.DefaultItems` are static properties on the real `MainMenu`
 * component; React.lazy() strips static properties from whatever it wraps,
 * so the whole composition is built once *inside* this single lazy loader
 * rather than lazy-loading `MainMenu` on its own.
 */
export const ExcalidrawCanvas = lazy(async () => {
  const [{ Excalidraw, MainMenu }] = await Promise.all([
    import('@excalidraw/excalidraw'),
    import('@excalidraw/excalidraw/index.css')
  ])

  function Canvas(props: ExcalidrawProps): React.JSX.Element {
    return (
      <Excalidraw {...props}>
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
        </MainMenu>
      </Excalidraw>
    )
  }

  return { default: Canvas }
})
