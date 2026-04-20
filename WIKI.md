# Battleship Game - Deep Wiki

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Game Mechanics](#game-mechanics)
4. [Components](#components)
5. [AI Implementation](#ai-implementation)
6. [State Management](#state-management)
7. [Bug Fixes & Improvements](#bug-fixes--improvements)
8. [Development Setup](#development-setup)
9. [Deployment](#deployment)
10. [Testing](#testing)

---

## Project Overview

### Description
Battleship is a classic naval combat game implemented in React with TypeScript. The game features a player-controlled fleet against an AI opponent with intelligent targeting strategies.

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Vercel

### Key Features
- Interactive ship placement phase
- Intelligent computer AI with hunt/target mode
- Real-time battle mechanics
- Responsive design with modern UI
- Comprehensive game state management

---

## Architecture

### File Structure
```
battleship/
src/
  App.tsx          # Main application component
  App.css          # Global styles
  index.css        # Tailwind base styles
  assets/          # Static assets
  lib/             # Utility libraries
public/
  vite.svg         # Vite logo
```

### Component Architecture

#### Main App Component (`App.tsx`)
The application follows a single-component architecture with all game logic contained within the main `App` component. This approach was chosen for simplicity and to maintain tight coupling between game state and UI.

#### Key Architectural Patterns
- **Functional Components**: Uses React hooks for state management
- **Immutable State**: All state updates use immutable patterns
- **Callback Optimization**: `useCallback` for performance optimization
- **Timeout Management**: Proper cleanup and race condition prevention

---

## Game Mechanics

### Game Flow
1. **Placement Phase**: Player places 5 ships on their board
2. **Battle Phase**: Players take turns attacking enemy ships
3. **Game Over**: When all ships of one player are destroyed

### Ship Types
```typescript
const SHIPS: ShipDef[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
]
```

### Board System
- **10x10 Grid**: Standard Battleship board size
- **Cell States**: `'empty' | 'ship' | 'hit' | 'miss' | 'sunk'`
- **Coordinate System**: A-J rows, 1-10 columns

### Game Phases
```typescript
type Phase = 'placement' | 'battle' | 'gameover'
```

---

## Components

### Cell Component
```typescript
interface CellProps {
  state: CellState
  isPlayerBoard: boolean
  onClick?: () => void
  isPreview?: boolean
  isInvalid?: boolean
}
```

**Responsibilities**:
- Render individual board cells
- Handle click events
- Display hit/miss/sunk states
- Show placement previews

### Board Component
```typescript
interface BoardProps {
  board: CellState[][]
  isPlayerBoard: boolean
  onCellClick?: (row: number, col: number) => void
  previewCells?: Set<string>
  invalidPreview?: boolean
  label: string
}
```

**Responsibilities**:
- Render 10x10 grid
- Manage cell interactions
- Display board labels
- Handle placement previews

### ShipList Component
```typescript
interface ShipListProps {
  ships: PlacedShip[]
  title: string
}
```

**Responsibilities**:
- Display ship status
- Show sunk/active states
- Provide visual fleet overview

---

## AI Implementation

### Computer AI Strategy

The computer AI uses a sophisticated hunt/target mode with the following priority system:

#### 1. Aggressive Adjacent Targeting
```typescript
// Immediately target cells around most recent hit
const mostRecentHit = lastHits[lastHits.length - 1]
const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]] // up, down, left, right
```

#### 2. Ship Orientation Detection
```typescript
// Determine if hits form horizontal or vertical line
const sameRow = hits.every(h => h.r === hits[0].r)
const sameCol = hits.every(h => h.c === hits[0].c)
```

#### 3. Systematic Ship Extension
```typescript
// Extend along established orientation
if (sameRow) {
  // Try left, then right
} else {
  // Try up, then down
}
```

#### 4. Checkerboard Hunt Pattern
```typescript
// Optimal initial hunting pattern
if ((r + c) % 2 === 0) {
  available.unshift([r, c]) // Prioritize checkerboard
}
```

### AI Debugging
The AI includes comprehensive logging:
- Target selection reasoning
- Ship orientation detection
- Hunt vs target mode transitions

---

## State Management

### Core State Variables
```typescript
const [phase, setPhase] = useState<Phase>('placement')
const [playerBoard, setPlayerBoard] = useState<CellState[][]>(createEmptyBoard)
const [playerShips, setPlayerShips] = useState<PlacedShip[]>([])
const [enemyBoard, setEnemyBoard] = useState<CellState[][]>(createEmptyBoard)
const [computerHits, setComputerHits] = useState<[number, number][]>([])
const [playerTurn, setPlayerTurn] = useState(true)
```

### State Update Patterns

#### Functional Updates (Recommended)
```typescript
// Prevents race conditions
setComputerHits(currentHits => {
  const newHits = [...currentHits, [newRow, newCol]]
  return newHits
})
```

#### Immutable Updates
```typescript
// Always create new arrays/objects
const newBoard = board.map(row => [...row])
const newShips = ships.map(ship => ({ ...ship }))
```

### Timeout Management
```typescript
const timeoutRef = useRef<NodeJS.Timeout | null>(null)

// Proper cleanup
useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }
}, [])
```

---

## Bug Fixes & Improvements

### Critical Bug Fixes

#### 1. Ship Overlap Issue
**Problem**: Ships overlapping on enemy board making game unwinnable
**Root Cause**: Race condition in computer move timeout
**Fix**: Implemented functional state updates and proper timeout management

#### 2. Non-Aggressive AI Targeting
**Problem**: AI targeting random cells after successful hits
**Root Cause**: Poor targeting priority system
**Fix**: Restructured AI to prioritize adjacent cells to recent hits

#### 3. Race Conditions
**Problem**: Stale state access in async operations
**Root Cause**: Direct state access in timeout callbacks
**Fix**: Converted to functional updates pattern

#### 4. Memory Leaks
**Problem**: Uncleaned timeouts on component unmount
**Fix**: Added comprehensive timeout cleanup

### Performance Improvements
- `useCallback` optimization for event handlers
- Immutable state updates for React performance
- Efficient board rendering with memoization
- Optimized AI targeting algorithms

### User Experience Enhancements
- Real-time placement preview
- Visual feedback for valid/invalid placements
- Smooth animations and transitions
- Responsive design for mobile devices

---

## Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn package manager

### Installation
```bash
# Clone repository
git clone https://github.com/Vinnieswan/cognition-demo-presentation.git
cd battleship/cognition-demo-presentation/battleship

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Variables
Create `.env.local` for environment-specific configuration:
```env
VITE_API_URL=http://localhost:3000
```

---

## Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
npx vercel --prod

# Deploy preview
npx vercel
```

### Build Process
The application uses Vite for optimized builds:
- TypeScript compilation
- Tailwind CSS processing
- Asset optimization
- Code splitting

### Production URL
https://cognition-demo-presentation.vercel.app

---

## Testing

### Manual Testing Checklist

#### Ship Placement
- [ ] Ships can be placed horizontally and vertically
- [ ] Ships cannot overlap
- [ ] Ships cannot exceed board boundaries
- [ ] All 5 ships can be placed successfully
- [ ] Preview shows valid/invalid placements

#### Battle Mechanics
- [ ] Player can click enemy cells to attack
- [ ] Hit/miss states display correctly
- [ ] Ships sink when all cells are hit
- [ ] Game ends when all ships are destroyed
- [ ] Turn switching works correctly

#### AI Behavior
- [ ] AI targets adjacent cells after hits
- [ ] AI uses checkerboard hunting pattern
- [ ] AI correctly identifies ship orientation
- [ ] AI extends ships systematically
- [ ] AI stops targeting sunk ships

#### Edge Cases
- [ ] Game resets properly
- [ ] Timeouts are cleaned up
- [ ] State updates are consistent
- [ ] No memory leaks on repeated games

### Debugging Tools
- Browser console for AI targeting logs
- React DevTools for state inspection
- Network tab for API calls (if any)

### Performance Testing
- Monitor memory usage during extended play
- Check for unnecessary re-renders
- Verify smooth animations
- Test on mobile devices

---

## Future Enhancements

### Planned Features
- Multiplayer support
- Ship rotation during placement
- Sound effects and music
- Statistics tracking
- Different AI difficulty levels
- Custom ship configurations
- Tournament mode

### Technical Improvements
- Component-based architecture refactor
- State management library integration
- Unit testing implementation
- E2E testing with Playwright
- Performance monitoring
- Accessibility improvements

---

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow React functional component patterns
- Use Tailwind for styling
- Implement proper error handling
- Add comprehensive logging

### Git Workflow
1. Create feature branch
2. Implement changes with tests
3. Submit pull request
4. Code review and merge
5. Deploy to staging/production

### Bug Reporting
1. Describe the issue clearly
2. Provide reproduction steps
3. Include browser/console logs
4. Suggest expected behavior
5. Attach screenshots if applicable

---

## License

This project is part of the cognition-demo-presentation repository. Please refer to the main repository for licensing information.

---

*Last updated: April 19, 2026*
