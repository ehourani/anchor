import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Minus, Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Skill } from '@/features/skills/sampleSkills'
import {
  nextCrisisPriority,
  useReorderCrisis,
  useSetCrisisMembership,
} from '@/features/skills/useSetCrisisMembership'

// One member of the crisis set: a drag handle (which carries the sortable
// listeners, so the rest of the row stays tappable), the title, and a remove
// control. Members are reordered by dragging the handle.
function SortableMember({
  skill,
  onRemove,
}: {
  skill: Skill
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-2xl border border-transparent bg-[hsl(10,76%,93%)] p-3 pl-2',
        isDragging && 'relative z-10 shadow-[0_12px_30px_-10px_hsl(8_60%_50%_/_0.5)]',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${skill.title}`}
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-[hsl(8,40%,55%)] transition-colors hover:bg-white/50 active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </button>
      <span className="min-w-0 flex-1 truncate font-semibold text-[hsl(8,50%,38%)]">
        {skill.title}
      </span>
      <button
        onClick={onRemove}
        aria-label={`Remove ${skill.title} from your crisis set`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[hsl(8,45%,52%)] transition-colors hover:bg-white/60"
      >
        <Minus className="size-4" />
      </button>
    </div>
  )
}

// Choose which skills belong in the crisis set, and what order they appear in.
// Members sit in a draggable, ordered list at the top; the rest can be added
// below with a tap. Every change saves instantly (optimistic) — no separate save.
export function CrisisSetupSheet({
  open,
  onClose,
  skills,
}: {
  open: boolean
  onClose: () => void
  skills: Skill[]
}) {
  const setMembership = useSetCrisisMembership()
  const reorder = useReorderCrisis()

  const sensors = useSensors(
    // A small drag threshold so taps on the remove button still register.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const members = skills
    .filter((s) => s.crisisPriority != null)
    .sort((a, b) => (a.crisisPriority ?? 0) - (b.crisisPriority ?? 0))
  const others = skills
    .filter((s) => s.crisisPriority == null)
    .sort((a, b) => a.title.localeCompare(b.title))
  const memberIds = members.map((s) => s.id)

  const add = (skill: Skill) =>
    setMembership.mutate({ skillId: skill.id, priority: nextCrisisPriority(skills) })
  const remove = (skill: Skill) =>
    setMembership.mutate({ skillId: skill.id, priority: null })

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = memberIds.indexOf(active.id as string)
    const to = memberIds.indexOf(over.id as string)
    if (from === -1 || to === -1) return
    reorder.mutate(arrayMove(memberIds, from, to))
  }

  return createPortal(
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[hsl(205,30%,25%)]/25 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your crisis skills"
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] max-w-md flex-col rounded-t-3xl border border-white/60 bg-[hsl(196,54%,98%)] shadow-[0_-12px_40px_-12px_hsl(200_50%_40%_/_0.3)] transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Your crisis skills
              </h2>
              <p className="mt-0.5 text-sm text-foreground/55">
                Pick the ones you'll want close in a hard moment, and drag to put
                them in the order that feels right.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Done"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-4">
          {/* The set itself — ordered, draggable. */}
          {members.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={memberIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {members.map((s) => (
                    <SortableMember
                      key={s.id}
                      skill={s}
                      onRemove={() => remove(s)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="rounded-2xl border border-white/70 bg-white/60 p-4 text-center text-sm text-foreground/55">
              Your crisis set is empty. Add a few steadying skills below.
            </p>
          )}

          {/* Everything else — tap to add to the set. */}
          {others.length > 0 && (
            <>
              <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-foreground/40">
                Add more skills
              </p>
              <div className="space-y-2">
                {others.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => add(s)}
                    aria-label={`Add ${s.title} to your crisis set`}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 text-left transition-colors hover:bg-white"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-foreground/25">
                      <Plus className="size-4 text-foreground/40" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                      {s.title}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
