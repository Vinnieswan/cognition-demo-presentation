import { useState, useCallback, useRef, useEffect } from 'react'
import { RotateCcw, Anchor, Crosshair, Ship, ChevronRight, RotateCw } from 'lucide-react'
import './App.css'

// ─── Types ──────────────────────────────────────────────────────────────────

type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
type Phase = 'placement' | 'battle' | 'gameover'
type Orientation = 'horizontal' | 'vertical'

interface ShipDef {
  name: string
  size: number
}

interface PlacedShip {
  name: string
  size: number
  cells: [number, number][]
  sunk: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const BOARD_SIZE = 10
const SHIPS: ShipDef[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
]

const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

// ─── Helpers ────────────────────────────────────────────────────────────────

function createEmptyBoard(): CellState[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'empty' as CellState)
  )
}

function canPlaceShip(
  board: CellState[][],
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row
    const c = orientation === 'horizontal' ? col + i : col
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false
    if (board[r][c] !== 'empty') return false
  }
  return true
}

function getShipCells(
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): [number, number][] {
  const cells: [number, number][] = []
  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row
    const c = orientation === 'horizontal' ? col + i : col
    cells.push([r, c])
  }
  return cells
}

function placeShipOnBoard(
  board: CellState[][],
  cells: [number, number][]
): CellState[][] {
  const newBoard = board.map((row) => [...row])
  for (const [r, c] of cells) {
    newBoard[r][c] = 'ship'
  }
  return newBoard
}

function randomlyPlaceShips(): {
  board: CellState[][]
  ships: PlacedShip[]
} {
  const board = createEmptyBoard()
  const ships: PlacedShip[] = []

  for (const shipDef of SHIPS) {
    let placed = false
    let attempts = 0
    while (!placed && attempts < 1000) {
      attempts++
      const orientation: Orientation =
        Math.random() < 0.5 ? 'horizontal' : 'vertical'
      const row = Math.floor(Math.random() * BOARD_SIZE)
      const col = Math.floor(Math.random() * BOARD_SIZE)

      if (canPlaceShip(board, row, col, shipDef.size, orientation)) {
        const cells = getShipCells(row, col, shipDef.size, orientation)
        for (const [r, c] of cells) {
          board[r][c] = 'ship'
        }
        ships.push({ ...shipDef, cells, sunk: false })
        placed = true
      }
    }
    if (!placed) {
      console.error(`Failed to place ${shipDef.name} after 1000 attempts`)
    }
  }

  // Debug: Check for overlaps
  const allCells = ships.flatMap(ship => ship.cells)
  const cellCounts = new Map<string, number>()
  for (const [r, c] of allCells) {
    const key = `${r},${c}`
    cellCounts.set(key, (cellCounts.get(key) || 0) + 1)
  }
  const overlaps = Array.from(cellCounts.entries()).filter(([, count]) => count > 1)
  if (overlaps.length > 0) {
    console.error('Ship overlaps detected:', overlaps)
  }

  return { board, ships }
}

// Computer AI: aggressive hunt/target mode
function computerMove(
  board: CellState[][],
  lastHits: [number, number][]
): [number, number] {
  // If we have hits, prioritize targeting adjacent cells to the most recent hit
  if (lastHits.length > 0) {
    // Get the most recent hit (last in array)
    const mostRecentHit = lastHits[lastHits.length - 1]
    const [recentR, recentC] = mostRecentHit
    
    // First, try adjacent cells to the most recent hit (most aggressive)
    const directions: [number, number][] = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // up, down, left, right
    ]
    
    // Shuffle directions for some randomness but prioritize
    const shuffledDirections = directions.sort(() => Math.random() - 0.5)
    
    for (const [dr, dc] of shuffledDirections) {
      const nr = recentR + dr
      const nc = recentC + dc
      if (
        nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE &&
        board[nr][nc] !== 'hit' && board[nr][nc] !== 'miss' && board[nr][nc] !== 'sunk'
      ) {
        console.log(`AI targeting adjacent to recent hit: ${ROW_LABELS[nr]}${COL_LABELS[nc]}`)
        return [nr, nc]
      }
    }
    
    // If no adjacent cells available, try to determine ship orientation
    const hits = lastHits.map(([r, c]) => ({ r, c }))
    
    // Check if hits form a line (same row or same column)
    const sameRow = hits.every(h => h.r === hits[0].r)
    const sameCol = hits.every(h => h.c === hits[0].c)
    
    if (sameRow || sameCol) {
      // We've determined orientation, target along the line
      const row = hits[0].r
      const col = hits[0].c
      
      if (sameRow) {
        // Target horizontally along the same row
        const minCol = Math.min(...hits.map(h => h.c))
        const maxCol = Math.max(...hits.map(h => h.c))
        
        // Try to extend left
        if (minCol > 0 && board[row][minCol - 1] !== 'hit' && board[row][minCol - 1] !== 'miss' && board[row][minCol - 1] !== 'sunk') {
          console.log(`AI extending ship left: ${ROW_LABELS[row]}${COL_LABELS[minCol - 1]}`)
          return [row, minCol - 1]
        }
        // Try to extend right
        if (maxCol < BOARD_SIZE - 1 && board[row][maxCol + 1] !== 'hit' && board[row][maxCol + 1] !== 'miss' && board[row][maxCol + 1] !== 'sunk') {
          console.log(`AI extending ship right: ${ROW_LABELS[row]}${COL_LABELS[maxCol + 1]}`)
          return [row, maxCol + 1]
        }
      } else {
        // Target vertically along the same column
        const minRow = Math.min(...hits.map(h => h.r))
        const maxRow = Math.max(...hits.map(h => h.r))
        
        // Try to extend up
        if (minRow > 0 && board[minRow - 1][col] !== 'hit' && board[minRow - 1][col] !== 'miss' && board[minRow - 1][col] !== 'sunk') {
          console.log(`AI extending ship up: ${ROW_LABELS[minRow - 1]}${COL_LABELS[col]}`)
          return [minRow - 1, col]
        }
        // Try to extend down
        if (maxRow < BOARD_SIZE - 1 && board[maxRow + 1][col] !== 'hit' && board[maxRow + 1][col] !== 'miss' && board[maxRow + 1][col] !== 'sunk') {
          console.log(`AI extending ship down: ${ROW_LABELS[maxRow + 1]}${COL_LABELS[col]}`)
          return [maxRow + 1, col]
        }
      }
    } else {
      // Hits are not aligned, target adjacent cells to any hit
      for (const hit of hits) {
        const directions: [number, number][] = [
          [-1, 0], [1, 0], [0, -1], [0, 1]
        ]
        for (const [dr, dc] of directions) {
          const nr = hit.r + dr
          const nc = hit.c + dc
          if (
            nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE &&
            board[nr][nc] !== 'hit' && board[nr][nc] !== 'miss' && board[nr][nc] !== 'sunk'
          ) {
            console.log(`AI targeting adjacent to hit: ${ROW_LABELS[nr]}${COL_LABELS[nc]}`)
            return [nr, nc]
          }
        }
      }
    }
  }

  // Random hunt mode - target optimal pattern (checkerboard)
  const available: [number, number][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== 'hit' && board[r][c] !== 'miss' && board[r][c] !== 'sunk') {
        // Prefer checkerboard pattern for initial hunting
        if ((r + c) % 2 === 0) {
          available.unshift([r, c]) // Prioritize checkerboard squares
        } else {
          available.push([r, c])
        }
      }
    }
  }
  const target = available[Math.floor(Math.random() * available.length)]
  console.log(`AI hunting randomly: ${ROW_LABELS[target[0]]}${COL_LABELS[target[1]]}`)
  return target
}

function checkShipSunk(
  ship: PlacedShip,
  board: CellState[][]
): boolean {
  return ship.cells.every(([r, c]) => board[r][c] === 'hit')
}

function markShipSunk(
  board: CellState[][],
  ship: PlacedShip
): CellState[][] {
  const newBoard = board.map((row) => [...row])
  for (const [r, c] of ship.cells) {
    newBoard[r][c] = 'sunk'
  }
  return newBoard
}


// Helper function to get ship type for a cell
function getShipTypeForCell(row: number, col: number, ships: PlacedShip[]): string | undefined {
  for (const ship of ships) {
    if (ship.cells.some(([r, c]) => r === row && c === col)) {
      return ship.name
    }
  }
  return undefined
}
// ─── Components ─────────────────────────────────────────────────────────────

function Cell({
  state,
  isPlayerBoard,
  onClick,
  isPreview,
  isInvalid,
                  shipType,
}: {
  state: CellState
  isPlayerBoard: boolean
  onClick?: () => void
  isPreview?: boolean
  isInvalid?: boolean
  shipType?: string
}) {
  let bgClass = 'bg-sky-900/50'
  let content: React.ReactNode = null
  let hoverClass = ''

  if (isPreview && isInvalid) {
    bgClass = 'bg-red-500/60'
  } else if (isPreview) {
    bgClass = 'bg-emerald-400/50'
  } else if (state === 'ship' && isPlayerBoard) {
    bgClass = 'bg-slate-500'
    content = (
      <div className="w-4 h-4 flex items-center justify-center">
        {shipType === 'Carrier' && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 w-full h-full">
            <path d="M2 12h20v2H2v-2zm0-4h20v2H2V8zm0 8h20v2H2v-2zm0-12h20v2H2V4z"/>
          </svg>
        )}
        {shipType === 'Battleship' && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 w-full h-full">
            <path d="M2 10h20v4H2v-4zm0-2h20v2H2V8zm0 6h20v2H2v-2z"/>
          </svg>
        )}
        {shipType === 'Cruiser' && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 w-full h-full">
            <ellipse cx="12" cy="12" rx="10" ry="6"/>
            <rect x="10" y="8" width="4" height="8" fill="currentColor"/>
          </svg>
        )}
        {shipType === 'Submarine' && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 w-full h-full">
            <ellipse cx="12" cy="12" rx="10" ry="4"/>
            <rect x="10" y="8" width="4" height="8" fill="currentColor"/>
            <path d="M12 8v-4M8 6l4-2 4 2" stroke="currentColor" strokeWidth="1" fill="none"/>
          </svg>
        )}
        {shipType === 'Destroyer' && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 w-full h-full">
            <rect x="4" y="10" width="16" height="4" rx="2"/>
          </svg>
        )}
        {!shipType && (
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-300 w-full h-full">
            <path d="M2 12h20v2H2v-2z"/>
          </svg>
        )}
      </div>
    )
  } else if (state === 'hit') {
    bgClass = 'bg-red-600'
    content = <Crosshair className="w-4 h-4 text-white" />
  } else if (state === 'sunk') {
    bgClass = 'bg-red-800'
    content = <Crosshair className="w-4 h-4 text-red-300" />
  } else if (state === 'miss') {
    bgClass = 'bg-sky-900/50'
    content = <div className="w-2 h-2 rounded-full bg-slate-400" />
  } else if (onClick && !isPlayerBoard) {
    hoverClass = 'hover:bg-sky-700/70 cursor-crosshair'
  }

  return (
    <button
      className={`w-9 h-9 border border-sky-800/60 flex items-center justify-center transition-all duration-150 ${bgClass} ${hoverClass}`}
      onClick={onClick}
      disabled={!onClick}
    >
      {content}
    </button>
  )
}

function Board({
  ships,
  board,
  isPlayerBoard,
  onCellClick,
  previewCells,
  invalidPreview,
  label,
}: {
  board: CellState[][]
  isPlayerBoard: boolean
  onCellClick?: (row: number, col: number) => void
  previewCells?: Set<string>
  invalidPreview?: boolean
  label: string
  ships?: PlacedShip[]
}) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-bold text-sky-100 mb-3 tracking-wide uppercase flex items-center gap-2">
        {isPlayerBoard ? (
          <Anchor className="w-5 h-5 text-sky-400" />
        ) : (
          <Crosshair className="w-5 h-5 text-red-400" />
        )}
        {label}
      </h2>
      <div className="inline-block">
        {/* Column labels */}
        <div className="flex">
          <div className="w-7 h-7" />
          {COL_LABELS.map((l) => (
            <div
              key={l}
              className="w-9 h-7 flex items-center justify-center text-xs font-semibold text-sky-400"
            >
              {l}
            </div>
          ))}
        </div>
        {board.map((row, ri) => (
          <div key={ri} className="flex">
            {/* Row label */}
            <div className="w-7 h-9 flex items-center justify-center text-xs font-semibold text-sky-400">
              {ROW_LABELS[ri]}
            </div>
            {row.map((cell, ci) => {
              const key = `${ri},${ci}`
              const isPreview = previewCells?.has(key) ?? false
              const canClick =
                onCellClick != null &&
                (isPlayerBoard ||
                  (cell !== 'hit' && cell !== 'miss' && cell !== 'sunk'))

              return (
                <Cell
                  key={key}
                  state={cell}
                  isPlayerBoard={isPlayerBoard}
                  onClick={canClick ? () => onCellClick(ri, ci) : undefined}
                  isPreview={isPreview}
                  isInvalid={invalidPreview}
                  shipType={ships ? getShipTypeForCell(ri, ci, ships) : undefined}                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function ShipList({
  ships,
  title,
}: {
  ships: PlacedShip[]
  title: string
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-sky-300 mb-2">{title}</h3>
      <div className="space-y-1">
        {ships.map((ship) => (
          <div
            key={ship.name}
            className={`flex items-center gap-2 text-sm ${
              ship.sunk ? 'text-red-400 line-through' : 'text-sky-100'
            }`}
          >
            <Ship className={`w-4 h-4 ${ship.sunk ? 'text-red-400' : 'text-sky-400'}`} />
            <span>{ship.name}</span>
            <span className="text-sky-500">({ship.size})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────────────────────

function App() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [phase, setPhase] = useState<Phase>('placement')
  const [playerBoard, setPlayerBoard] = useState<CellState[][]>(createEmptyBoard)
  const [playerShips, setPlayerShips] = useState<PlacedShip[]>([])
  const [currentShipIndex, setCurrentShipIndex] = useState(0)
  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null)

  const [enemyBoard, setEnemyBoard] = useState<CellState[][]>(createEmptyBoard)
  const [enemyDisplayBoard, setEnemyDisplayBoard] = useState<CellState[][]>(createEmptyBoard)
  const [enemyShips, setEnemyShips] = useState<PlacedShip[]>([])

  const [computerHits, setComputerHits] = useState<[number, number][]>([])
  const [message, setMessage] = useState('Place your ships!')
  const [winner, setWinner] = useState<'player' | 'computer' | null>(null)
  const [playerTurn, setPlayerTurn] = useState(true)

  // Refs track the latest committed values so the deferred computer-turn
  // timeout can read current state without reintroducing stale-closure bugs
  // or relying on nested setState updater mutations.
  const playerBoardRef = useRef(playerBoard)
  const playerShipsRef = useRef(playerShips)
  const computerHitsRef = useRef(computerHits)

  useEffect(() => {
    playerBoardRef.current = playerBoard
  }, [playerBoard])
  useEffect(() => {
    playerShipsRef.current = playerShips
  }, [playerShips])
  useEffect(() => {
    computerHitsRef.current = computerHits
  }, [computerHits])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // ── Placement Phase ──

  const currentShip = SHIPS[currentShipIndex] as ShipDef | undefined

  const handlePlacementClick = useCallback(
    (row: number, col: number) => {
      if (phase !== 'placement' || !currentShip) return

      if (!canPlaceShip(playerBoard, row, col, currentShip.size, orientation))
        return

      const cells = getShipCells(row, col, currentShip.size, orientation)
      const newBoard = placeShipOnBoard(playerBoard, cells)
      setPlayerBoard(newBoard)

      const placed: PlacedShip = { ...currentShip, cells, sunk: false }
      const newShips = [...playerShips, placed]
      setPlayerShips(newShips)

      if (currentShipIndex + 1 >= SHIPS.length) {
        // All ships placed, start battle
        const enemy = randomlyPlaceShips()
        setEnemyBoard(enemy.board)
        setEnemyShips(enemy.ships)
        setEnemyDisplayBoard(createEmptyBoard())
        setPhase('battle')
        setMessage('Your turn! Click on the enemy board to fire.')
      } else {
        setCurrentShipIndex(currentShipIndex + 1)
        setMessage(`Place your ${SHIPS[currentShipIndex + 1].name} (${SHIPS[currentShipIndex + 1].size} cells)`)
      }
    },
    [phase, currentShip, playerBoard, orientation, playerShips, currentShipIndex]
  )

  const handlePlacementHover = useCallback(
    (row: number, col: number) => {
      if (phase !== 'placement') return
      setHoverCell([row, col])
    },
    [phase]
  )

  // Preview cells for placement
  let previewCells: Set<string> | undefined
  let invalidPreview = false
  if (phase === 'placement' && currentShip && hoverCell) {
    const [hr, hc] = hoverCell
    const cells = getShipCells(hr, hc, currentShip.size, orientation)
    
    // Filter cells to only show those within board bounds
    const validCells = cells.filter(([r, c]) => 
      r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE
    )
    
    const valid = canPlaceShip(playerBoard, hr, hc, currentShip.size, orientation)
    previewCells = new Set(validCells.map(([r, c]) => `${r},${c}`))
    invalidPreview = !valid || validCells.length < currentShip.size
  }

  // ── Battle Phase ──

  const handleAttack = useCallback(
    (row: number, col: number) => {
      if (phase !== 'battle' || !playerTurn) return
      if (
        enemyDisplayBoard[row][col] === 'hit' ||
        enemyDisplayBoard[row][col] === 'miss' ||
        enemyDisplayBoard[row][col] === 'sunk'
      )
        return

      let newEnemyBoard = enemyBoard.map((r) => [...r])
      let newDisplayBoard = enemyDisplayBoard.map((r) => [...r])
      const newEnemyShips = enemyShips.map((s) => ({ ...s }))

      if (newEnemyBoard[row][col] === 'ship') {
        newEnemyBoard[row][col] = 'hit'
        newDisplayBoard[row][col] = 'hit'

        // Check if any ship sunk
        let sunkMessage = ''
        for (const ship of newEnemyShips) {
          if (!ship.sunk && checkShipSunk(ship, newEnemyBoard)) {
            ship.sunk = true
            newEnemyBoard = markShipSunk(newEnemyBoard, ship)
            newDisplayBoard = markShipSunk(newDisplayBoard, ship)
            sunkMessage = ` You sunk the ${ship.name}!`
          }
        }

        setMessage(`Hit!${sunkMessage}`)

        // Check win
        if (newEnemyShips.every((s) => s.sunk)) {
          setPhase('gameover')
          setWinner('player')
          setMessage('You win! All enemy ships destroyed!')
          setEnemyBoard(newEnemyBoard)
          setEnemyDisplayBoard(newDisplayBoard)
          setEnemyShips(newEnemyShips)
          return
        }
      } else {
        newEnemyBoard[row][col] = 'miss'
        newDisplayBoard[row][col] = 'miss'
        setMessage('Miss! Computer is thinking...')
      }

      setEnemyBoard(newEnemyBoard)
      setEnemyDisplayBoard(newDisplayBoard)
      setEnemyShips(newEnemyShips)
      setPlayerTurn(false)

      // Computer's turn after a short delay.
      // All state is derived synchronously from refs so we can call each
      // setter exactly once with the final committed value. This avoids
      // (a) stale closures over state captured when handleAttack was defined,
      // (b) nested setState updaters that mutate already-committed state,
      // and (c) `setMessage` running before a deferred `setPlayerShips`
      // updater has produced the "sunk" flag.
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null

        let nextPlayerBoard = playerBoardRef.current.map((r) => [...r])
        const nextPlayerShips = playerShipsRef.current.map((s) => ({ ...s }))
        let nextComputerHits: [number, number][] = [...computerHitsRef.current]

        const [cr, cc] = computerMove(nextPlayerBoard, nextComputerHits)

        if (nextPlayerBoard[cr][cc] === 'ship') {
          nextPlayerBoard[cr][cc] = 'hit'
          nextComputerHits.push([cr, cc])

          let sunkMsg = ''
          for (const ship of nextPlayerShips) {
            if (!ship.sunk && checkShipSunk(ship, nextPlayerBoard)) {
              ship.sunk = true
              nextPlayerBoard = markShipSunk(nextPlayerBoard, ship)
              // Drop the sunk ship's cells from the AI's active target list
              // so the hunt/target heuristics don't keep probing around it.
              const sunkCells = new Set(
                ship.cells.map(([r, c]) => `${r},${c}`)
              )
              nextComputerHits = nextComputerHits.filter(
                ([r, c]) => !sunkCells.has(`${r},${c}`)
              )
              sunkMsg = ` Computer sunk your ${ship.name}!`
            }
          }

          setPlayerBoard(nextPlayerBoard)
          setPlayerShips(nextPlayerShips)
          setComputerHits(nextComputerHits)

          if (nextPlayerShips.every((s) => s.sunk)) {
            setPhase('gameover')
            setWinner('computer')
            setMessage('Game over! The computer destroyed all your ships.')
            return
          }

          setMessage(
            `Computer hit ${ROW_LABELS[cr]}${COL_LABELS[cc]}!${sunkMsg} Your turn.`
          )
        } else {
          nextPlayerBoard[cr][cc] = 'miss'
          setPlayerBoard(nextPlayerBoard)
          setMessage(
            `Computer missed ${ROW_LABELS[cr]}${COL_LABELS[cc]}. Your turn!`
          )
        }

        setPlayerTurn(true)
      }, 800)
    },
    [
      phase,
      playerTurn,
      enemyBoard,
      enemyDisplayBoard,
      enemyShips,
    ]
  )

  // ── Reset ──

  const handleReset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setPhase('placement')
    setPlayerBoard(createEmptyBoard())
    setPlayerShips([])
    setCurrentShipIndex(0)
    setOrientation('horizontal')
    setHoverCell(null)
    setEnemyBoard(createEmptyBoard())
    setEnemyDisplayBoard(createEmptyBoard())
    setEnemyShips([])
    setComputerHits([])
    setMessage('Place your ships!')
    setWinner(null)
    setPlayerTurn(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-slate-900 text-white">
      {/* Header */}
      <header className="py-6 text-center border-b border-sky-800/40">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-3">
          <Anchor className="w-9 h-9 text-sky-400" />
          <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">
            Battleship
          </span>
        </h1>
        <p className="mt-1 text-sky-400/80 text-sm">Classic Naval Combat</p>
      </header>

      {/* Message Bar */}
      <div className="flex justify-center py-4">
        <div
          className={`px-6 py-3 rounded-lg text-sm font-medium max-w-xl text-center ${
            winner === 'player'
              ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/40'
              : winner === 'computer'
              ? 'bg-red-600/30 text-red-200 border border-red-500/40'
              : 'bg-sky-800/30 text-sky-200 border border-sky-700/40'
          }`}
        >
          {message}
        </div>
      </div>

      {/* Placement Controls */}
      {phase === 'placement' && currentShip && (
        <div className="flex justify-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-sky-800/30 rounded-lg border border-sky-700/40 text-sm">
            <Ship className="w-4 h-4 text-sky-400" />
            <span className="text-sky-200">
              {currentShip.name} ({currentShip.size} cells)
            </span>
          </div>
          <button
            onClick={() =>
              setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')
            }
            className="flex items-center gap-2 px-4 py-2 bg-sky-700/40 hover:bg-sky-600/50 rounded-lg border border-sky-600/40 text-sm text-sky-200 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </button>
          <div className="flex items-center gap-1 text-xs text-sky-400/70">
            <ChevronRight className="w-3 h-3" />
            {SHIPS.length - currentShipIndex} ships remaining
          </div>
        </div>
      )}

      {/* Game Boards */}
      <div className="flex flex-wrap justify-center gap-8 px-4 pb-8">
        {/* Player Board */}
        <div
          onMouseLeave={() => setHoverCell(null)}
        >
          <div>
            <Board
              board={playerBoard}
              ships={playerShips}              isPlayerBoard={true}
              label="Your Fleet"
              previewCells={previewCells}
              invalidPreview={invalidPreview}
              onCellClick={
                phase === 'placement'
                  ? (r, c) => {
                      handlePlacementHover(r, c)
                      handlePlacementClick(r, c)
                    }
                  : undefined
              }
            />
          </div>
          <ShipList ships={playerShips} title="Your Ships" />
        </div>

        {/* Enemy Board */}
        {phase !== 'placement' && (
          <div>
            <Board
              board={enemyDisplayBoard}
              ships={enemyShips}              isPlayerBoard={false}
              onCellClick={phase === 'battle' && playerTurn ? handleAttack : undefined}
              label="Enemy Waters"
            />
            <ShipList ships={enemyShips} title="Enemy Ships" />
          </div>
        )}
      </div>

      {/* Reset / New Game */}
      {phase === 'gameover' && (
        <div className="flex justify-center pb-8">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-semibold text-white transition-colors shadow-lg shadow-sky-900/50"
          >
            <RotateCcw className="w-5 h-5" />
            New Game
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-sky-600/50 text-xs border-t border-sky-800/20">
        Battleship - Classic Naval Combat Game
      </footer>
    </div>
  )
}

export default App
