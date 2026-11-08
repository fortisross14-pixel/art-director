# Art Director v1.4: The Gilded Salon (Milestone 7, first pass)

The chosen visual identity, applied across the game, with touch-first
controls and animation for the big moments. The game is now titled
**Art Director**.

## Look
- **Gilded Salon:** oxblood ground, gold leaf, ivory type, Cormorant
  Garamond display over Inter.
- Panels are thin gilt frames. Gold buttons mean "go"; outlined buttons
  are everything else.
- The look is set in `src/ui/salon.css` as one layer over the old
  styles:
  - A generated block re-points every old light surface and dark text
    colour at the Salon palette.
  - A hand-written block covers the shell, controls and animations.

## Touch-first shell
- **Header:** season, league rank, and initiatives shown as gold
  tokens. Below it, visitors (with trend), reputation (Prestige /
  Popularity / Patrons) and cash (with weekly result).
- **Four-hub bottom bar** with badges for what needs you:
  - **Museum:** Floor, Season, Vault, Catalogue.
  - **Acquire:** Market, Digs, Artists.
  - **Institution:** Staff, Research, Finance.
  - **World:** City, Rankings.
- **Sub-tabs** are pills under the header.
- **Thumb dock** above the bar: "Sim to next opportunity" plus "+1 week".
- 44–64 px targets throughout. The artists table becomes cards on a
  phone.
- **Season budget = 20 points.** Big ± buttons and gold pips, with the
  money per point and the current effect on every line. No typing.

## Animation
- **Crates:**
  - Cards deal in one after another.
  - Face-down frames pulse in their rarity colour.
  - Cards flip in 3D with a colour flash.
  - Legend+ cards burst with gold light, then the City Herald front
    page appears over slowly rotating gold rays.
  - Salvaged cards fade.
- **Auctions:** the countdown ticks, "SOLD" lands like a hammer, and the
  result bar rises in.
- **Annual Report** (shown when a year ends):
  - The report is unveiled centre stage.
  - Rows arrive one by one with numbers counting up and growth
    percentages.
  - Critic stars spin in one at a time, then the quote fades in.
  - Acquisition, discovery and exhibition of the year slide in.
  - A **promotion** gets a gold shimmer banner and falling gold leaf.
- **Season review** slides up as a sheet after the report and leads to
  planning the new season.
- **Small touches:** the home screen rises in, toasts slide up, and the
  active hub's underline grows.
- Respects the reduced-motion setting.

## Still to do in M7
- Real artwork images (public domain) and a styled card for the rest.
- A proper redesign (not just reskin) of the older dense screens:
  black market, gala, dig board, staff.
- Building exteriors per tier.
