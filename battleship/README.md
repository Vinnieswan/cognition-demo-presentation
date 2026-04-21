# 🚢 Battleship

A classic Battleship game built with React, TypeScript, and Tailwind CSS. Place your fleet, take turns firing at the enemy grid, and sink all of their ships before they sink yours.

![Battleship screenshot](./public/screenshot.png)

## Features

- Classic 10×10 grid, two-player flow (you vs. computer)
- - Drag/click-to-place ship setup with rotation and validation (no overlaps, no out-of-bounds)
  - - Randomize fleet placement with one click
    - - Turn-based gameplay with hit / miss / sunk feedback and visual animations
      - - Computer opponent with a "hunt & target" AI (fires randomly until it hits, then targets adjacent cells)
        - - Game status panel: remaining ships, shots fired, accuracy, hits, misses
          - - Win/lose screen with option to play again
            - - Responsive layout and keyboard-friendly controls
              - - Built with accessible UI components (shadcn/ui) and Lucide icons
               
                - ## Fleet
               
                - | Ship        | Size |
                - | ----------- | :--: |
                - | Carrier     |  5   |
                - | Battleship  |  4   |
                - | Cruiser     |  3   |
                - | Submarine   |  3   |
                - | Destroyer   |  2   |
               
                - ## Tech stack
               
   - - [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
     - - [Vite 6](https://vitejs.dev/) for dev server and bundling
     - - [Tailwind CSS](https://tailwindcss.com/) with `tailwindcss-animate`
        - - [shadcn/ui](https://ui.shadcn.com/) primitives (`class-variance-authority`, `clsx`, `tailwind-merge`)
             - - [Lucide](https://lucide.dev/) icons
                 - - [Recharts](https://recharts.org/) for the stats panel
                   - - ESLint 9 + `typescript-eslint`
                             
                   - ## Getting started
                             
                     - Requirements: **Node.js 18+** and npm.
                             
                       - ```bash
                         # from the repo root
                         cd battleship

                         # install dependencies
                         npm install

                         # start the dev server (http://localhost:5173)
                         npm run dev
                                ```

                           ### Available scripts

                                | Script            | What it does                                  |
                                | ----------------- | --------------------------------------------- |
                                | `npm run dev`     | Start the Vite dev server with HMR            |
                                | `npm run build`   | Type-check with `tsc -b` and build for prod   |
                                | `npm run preview` | Preview the production build locally          |
                                | `npm run lint`    | Run ESLint over the project                   |

                                ## How to play

                                1. **Place your fleet.** Click a ship in the sidebar, choose orientation (horizontal/vertical), then click a cell on your board to place it. Use **Randomize** to auto-place, or **Reset** to clear.
                                2. 2. **Start the game** once all five ships are placed.
                                   3. 3. **Take your shot** by clicking a cell on the enemy grid. A red marker is a hit, white is a miss. Sinking a ship reveals it.
                                      4. 4. **The computer fires back** after each of your shots.
                                         5. 5. **First to sink the opposing fleet wins.**
                                           
                                            6. ## Project structure
                                           
                                            7. ```
                                               battleship/
                                               ├── public/                 # static assets
                                               ├── src/
                                               │   ├── assets/             # images / art
                                               │   ├── lib/                # game logic (board, ships, AI, utils)
                                               │   ├── App.tsx             # top-level game container
                                               │   ├── App.css
                                               │   ├── index.css           # Tailwind entry
                                               │   ├── main.tsx            # React entry point
                                               │   └── vite-env.d.ts
                                               ├── index.html
                                               ├── tailwind.config.js
                                               ├── postcss.config.js
                                               ├── vite.config.ts
                                               ├── tsconfig*.json
                                               └── package.json
                                               ```

                                               ## Roadmap / ideas

                                               - Local two-player "pass and play" mode
                                               - - Smarter AI with probability-density targeting
                                                 - - Online multiplayer via WebSockets
                                                   - - Sound effects and richer hit/explosion animations
                                                     - - Persistent stats with localStorage
                                                       - - Unit tests for game logic (Vitest)
                                                        
                                                         - ## License
                                                        
                                                         - MIT — feel free to fork and remix.
                                                         - 
