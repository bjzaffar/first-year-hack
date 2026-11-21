import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { adjustCrop, type Crop, type CropHandle } from './crop.js';

const corners = ['nw', 'ne', 'sw', 'se'] as const;
const labels = { nw: 'top left', ne: 'top right', sw: 'bottom left', se: 'bottom right' };

export function CropSelection({ source, crop, disabled, onChange }: {
  source: string; crop: Crop; disabled: boolean; onChange: (crop: Crop) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; width: number; height: number; crop: Crop; handle: CropHandle } | null>(null);

  function start(event: PointerEvent<HTMLElement>, handle: CropHandle) {
    if (disabled || !event.isPrimary || event.button !== 0 || gesture.current) return;
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds?.width || !bounds.height) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
      width: bounds.width, height: bounds.height, crop, handle };
  }
  function move(event: PointerEvent<HTMLElement>) {
    const drag = gesture.current;
    if (disabled || !drag || drag.id !== event.pointerId) return;
    onChange(adjustCrop(drag.crop, drag.handle,
      (event.clientX - drag.x) / drag.width * 100, (event.clientY - drag.y) / drag.height * 100));
  }
  function end(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.id === event.pointerId) gesture.current = null;
  }
  function keyboard(event: KeyboardEvent<HTMLElement>, handle: CropHandle) {
    if (disabled) return;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault(); event.stopPropagation();
    const step = event.shiftKey ? 5 : 1;
    onChange(adjustCrop(crop, handle, delta[0] * step, delta[1] * step));
  }
  return <>
    <p id="crop-help" className="crop-help">Drag a corner to resize. Drag inside the box to move it. You can also focus the box or a corner and use the arrow keys.</p>
    <div ref={frame} className="crop-frame" onPointerMove={move} onPointerUp={end}
      onPointerCancel={end} onLostPointerCapture={end}>
      <img src={source} alt="Source photograph" draggable={false} />
      <div className="crop-selection" style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}>
        <div className="crop-move" role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled}
          aria-label="Move crop selection" aria-describedby="crop-help"
          onPointerDown={e => start(e, 'move')} onKeyDown={e => keyboard(e, 'move')} />
        {corners.map(corner => <button key={corner} type="button" disabled={disabled}
          className={`crop-handle crop-handle-${corner}`} aria-label={`Resize crop from ${labels[corner]} corner`}
          aria-describedby="crop-help" onPointerDown={e => start(e, corner)} onKeyDown={e => keyboard(e, corner)} />)}
      </div>
    </div>
  </>;
}
