# Design guide: 月明かり / Tsukiakari

The interface is a quiet study workspace. Preserve the approved midnight/gold dark theme and warm-paper light theme; final content will arrive separately.

## Layout

- Desktop sidebar; mobile top navigation. Storage status stays beside Settings.
- Main pages use available width with 24px desktop / 16px narrow-screen horizontal padding.
- Personal decks use at most three columns. Active review panels are centered with a 1200px width cap and a 740px desktop height cap; waiting and paused panels retain natural height.
- Library retains its wider card list and flexible inspector, fixed controls and independent reading scroll areas. Notes remains a page-scrolling document with an optional title index.
- Never cover reading content with controls. Advanced filters occupy normal layout space when expanded.

## Typography and color

- Use installed system fonts. The Japanese wordmark and crescent icon provide the identity; the icon is also the SVG browser favicon.
- Use existing theme variables for components. Gold identifies actions/selection; status colors supplement text labels rather than replacing them.
- Keep primary reading text spacious and metadata subordinate but legible. Use tabular numerals for study counts, intervals and durations.
- Wrap long names, sources and personal prose without horizontal page overflow.

## Interaction

- Keep 44px touch controls, visible keyboard focus, labelled inputs, and the skip-to-content link.
- Normal click selects one card; Ctrl-click extends selection. Selection and saved-answer changes are immediate, without color animation.
- Limit hover treatment to pointer devices. Reduced motion disables transitions and animations.
- Use concise question/note titles as accessible control names; expose deck, status and note type as descriptions.
- After removing a focused editor or the last list item, return focus to a useful visible control. Preserve existing draft guards and failed-write recovery.

## Verification

Use the integrated browser suite for interactions, both themes, and 320–2560px layouts. Use Lighthouse navigation audits for fresh-route load performance and snapshots for populated reading/testing screens. Scores supplement keyboard and visual review; they do not certify all accessibility or predict hosted performance.
