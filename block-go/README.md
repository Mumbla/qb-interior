# Block Go

A block puzzle party game for phones, built as a web app (PWA). Drag pieces onto a 9×9 board, clear rows and columns, raise your bet multiplier, and work through events, card albums and friend challenges.

No build step and no dependencies: it is plain HTML, CSS and JavaScript modules.

## Run it

```bash
cd block-go
npm start              # serves on http://localhost:8080 (needs python3)
npm test               # board logic tests (Node 18+)
```

Open the URL on your phone (same Wi-Fi, use your computer's IP) or in desktop Chrome with device mode turned on.

## What's in v1

| Area | Features |
| --- | --- |
| **Core puzzle** | 9×9 board, drag and drop with a ghost preview, row and column clears, combos, board-clear bonus, next-piece preview |
| **Bets & energy** | x1–x50 bet chip (energy cost and coin payout scale with it), energy that refills over time |
| **Boosters** | Single Block, Rotate, Hammer (smashes a plus-shaped area), Trash; buy more with coins when you run out |
| **No space** | When no piece fits: use a Shield (clears the 3 fullest rows), trash the piece, or start a new board |
| **Events** | Event bar gift, Daily Streak (7-day cycle), Trail (30 steps, prizes every 5), Hide & Pick (find the jackpot), Golden keys (4 reward tiers) |
| **Cards** | 3 albums of 9 cards, rarity stars, packs of 3, duplicates turn into stars, album completion prizes |
| **Social (simulated)** | Friend suggestions, invites and requests, energy gifts, news feed, weekly leaderboard, VS race (first to 12 lines) |
| **Profile** | Name, Go buddy avatar, settings (sound and vibration), How To Play, copy player ID, invite link |
| **Polish** | Glossy cubes drawn in code, mascot faces, particles, confetti, coin fly-ins, screen shake, synth sound effects, haptics |
| **PWA** | Installable, works offline, saves progress on the device |

## Code map

```
index.html            app shell (HUD, screens, dock)
styles.css            all styling; brand colors are the CSS variables at the top
js/main.js            wires everything up, timers
js/state.js           save data (localStorage) and energy refill
js/board.js           pure board rules (tested)
js/pieces.js          shapes, rotation
js/render.js          canvas drawing for the glossy cubes; brand block palette
js/game.js            play screen: drag/drop, scoring, boosters, bets
js/events.js          daily streak, trail, hide & pick, golden, event gift
js/cards.js           albums and packs
js/shop.js            shop items
js/social.js          friends, gifts, news, leaderboard, VS (simulated)
js/menu.js            profile menu, settings, how to play
js/icons.js           every icon as original SVG
js/fx.js / audio.js   particles and synth sound
```

## Rebranding

- **Colors:** the `:root` variables in `styles.css` and the `PALETTE` in `js/render.js`.
- **Name:** `index.html` `<title>`, `manifest.webmanifest`, `icons/icon.svg`.
- **Cards, mascots, event names:** `js/cards.js` (`ALBUMS`) and the labels in `index.html`.

## Next steps

1. **Real backend.** Replace the bots in `js/social.js` with Supabase or Firebase (accounts, friends, gifts, leaderboard, VS). The module's exports are the seam.
2. **App stores.** Wrap the PWA with Capacitor for iOS and Android, then add in-app purchases to `js/shop.js`.
3. **City builder meta.** Spend coins on themed districts.
4. **Art pass.** Swap the code-drawn mascots and banners for commissioned 3D renders.
5. **Live ops.** Move event schedules and rewards to remote config.
