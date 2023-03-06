

## Ideas

### Canvas
Make a two-part canvas elm that hides the viewport sizing logic.

```tsx
<PlannerCanvas.Parent>
    <DnDContainer>
        <PlannerCanvas.Canvas>
            ...
        </PlannerCanvas.Canvas>                
    </DnDContainer>
</PlannerCanvas.Parent>
```

### Plan data overview

Planner:
- Blocks (BlockStore?)
- Plan

Plan:
- BLOCK INSTANCE
- block plan-id (plan specific)
- block name
- block dimensions
- block ref -> BlockKind lookup (Definition)
- connections:
  - block from
  - block to
  - Needs: block dimensions + derived height

UI state:
- zoom
- focus mode - Editor mode
- ...?"""

Block UI state:
- Hover?
- Focus?
- Resource focus?
- Show block actions


BlockProvider could attempt to do the loading?
Resources could too?

ErrorBoundaries + callback to the plannerContext on errors


- Views?
  - Derp
  - Focus view?


Plan:
- x,y,w,h
- 