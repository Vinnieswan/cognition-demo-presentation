import { useState, useCallback } from 'react'
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
    if (r >= BOARD_SIZE || c >= BOARD_SIZE) return false
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
    while (!placed) {
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
  }

  return { board, ships }
}

// Computer AI: hunt/target mode
function computerMove(
  board: CellState[][],
  lastHits: [number, number][]
): [number, number] {
  // If we have recent hits that haven't sunk a ship, target adjacent cells
  if (lastHits.length > 0) {
    const directions: [number, number][] = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]
    for (const [hr, hc] of lastHits) {
      for (const [dr, dc] of directions) {
        const nr = hr + dr
        const nc = hc + dc
        if (
          nr >= 0 &&
          nr < BOARD_SIZE &&
          nc >= 0 &&
          nc < BOARD_SIZE &&
          (board[nr][nc] === 'empty' || board[nr][nc] === 'ship')
        ) {
          return [nr, nc]
        }
      }
    }
  }

  // Random hunt
  const available: [number, number][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'empty' || board[r][c] === 'ship') {
        available.push([r, c])
      }
    }
  }
  return available[Math.floor(Math.random() * available.length)]
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

// ─── Components ─────────────────────────────────────────────────────────────

function Cell({
  state,
  isPlayerBoard,
  onClick,
  isPreview,
  isInvalid,
}: {
  state: CellState
  isPlayerBoard: boolean
  onClick?: () => void
  isPreview?: boolean
  isInvalid?: boolean
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
                !isPlayerBoard &&
                onCellClick &&
                cell !== 'hit' &&
                cell !== 'miss' &&
                cell !== 'sunk'

              return (
                <Cell
                  key={key}
                  state={cell}
                  isPlayerBoard={isPlayerBoard}
                  onClick={canClick ? () => onCellClick(ri, ci) : undefined}
                  isPreview={isPreview}
                  isInvalid={invalidPreview}
                />
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
    const valid = canPlaceShip(playerBoard, hr, hc, currentShip.size, orientation)
    previewCells = new Set(cells.map(([r, c]) => `${r},${c}`))
    invalidPreview = !valid
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

      // Computer's turn after a short delay
      setTimeout(() => {
        let newPlayerBoard = playerBoard.map((r) => [...r])
        const newPlayerShips = playerShips.map((s) => ({ ...s }))
        const newComputerHits = [...computerHits]

        const [cr, cc] = computerMove(newPlayerBoard, newComputerHits)

        if (newPlayerBoard[cr][cc] === 'ship') {
          newPlayerBoard[cr][cc] = 'hit'
          newComputerHits.push([cr, cc])

          let sunkMsg = ''
          for (const ship of newPlayerShips) {
            if (!ship.sunk && checkShipSunk(ship, newPlayerBoard)) {
              ship.sunk = true
              newPlayerBoard = markShipSunk(newPlayerBoard, ship)
              // Remove sunk ship's cells from targeting
              const sunkCells = new Set(ship.cells.map(([r, c]) => `${r},${c}`))
              const filtered = newComputerHits.filter(
                ([r, c]) => !sunkCells.has(`${r},${c}`)
              )
              newComputerHits.length = 0
              newComputerHits.push(...filtered)
              sunkMsg = ` Computer sunk your ${ship.name}!`
            }
          }

          setMessage(
            `Computer hit ${ROW_LABELS[cr]}${COL_LABELS[cc]}!${sunkMsg} Your turn.`
          )

          // Check computer win
          if (newPlayerShips.every((s) => s.sunk)) {
            setPhase('gameover')
            setWinner('computer')
            setMessage('Game over! The computer destroyed all your ships.')
            setPlayerBoard(newPlayerBoard)
            setPlayerShips(newPlayerShips)
            setComputerHits(newComputerHits)
            return
          }
        } else {
          newPlayerBoard[cr][cc] = 'miss'
          setMessage(
            `Computer missed ${ROW_LABELS[cr]}${COL_LABELS[cc]}. Your turn!`
          )
        }

        setPlayerBoard(newPlayerBoard)
        setPlayerShips(newPlayerShips)
        setComputerHits(newComputerHits)
        setPlayerTurn(true)
      }, 800)
    },
    [
      phase,
      playerTurn,
      enemyBoard,
      enemyDisplayBoard,
      enemyShips,
      playerBoard,
      playerShips,
      computerHits,
    ]
  )

  // ── Reset ──

  const handleReset = () => {
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
              isPlayerBoard={true}
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
              isPlayerBoard={false}
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
