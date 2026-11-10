# Design guide: 月明かり / Tsukiakari

The interface is a quiet study workspace. Preserve the approved midnight/gold dark theme and warm-paper light theme; final content will arrive separately.

## Layout

- Site-wide horizontal top navigation at every width, with Study, Library, Tests, Statistics and Settings available across pages. The header remains visible while scrolling outside active tests. An active displayed attempt hides it and reserves zero header height. Desktop top-edge hover and keyboard or touch Menu activation reveal navigation in normal page flow, pushing the content down and updating sticky offsets; Escape and Menu dismiss it; outside interaction dismisses it only when unpinned, with an additional Close button only in the compact mobile layout (900px and below). Setup, previews, results and unrelated pages retain normal navigation. Storage status stays beside Settings; on narrow screens the main links use a second row.
- Main pages and the header share a centered 1288px outer cap, giving 1240px of content with 24px desktop padding. Narrow screens retain 16px horizontal padding. The test-area cap is 1240px, increased modestly from 1120px. Library panes use the available width within this centered frame.
- Personal decks use at most three columns. Active review panels are centered with a 1200px width cap and a 740px desktop height cap; waiting and paused panels retain natural height.
- Library retains its wider card list and flexible inspector, controls above the panes and independent reading scroll areas. Card browser and Mistakes remain normal scrolling pages with the footer below their bounded workspace; short viewports and expanded filters can grow the page. Notes remains a page-scrolling document with an optional title index.
- Active-test site navigation is an explicitly revealed row that reserves its measured height above the test toolbar, question navigator and case material; its height expands and collapses over 240ms with an ease-out curve, continuously updating sticky offsets. Reduced-motion preferences disable the transition. Clicking the non-link header background toggles pinning: pinned navigation survives pointer leave and outside interactions, and a second click collapses it. The background is a keyboard-operable button with pressed state. Escape, Menu and mobile Close remain explicit dismissal controls. Reset pinning when the displayed active-test context ends. Unpinned navigation stays open while hovered or keyboard focus remains inside, with a 200ms mouse-leave delay. Hidden navigation is inert. On desktop with a mouse (above 900px), Menu occupies no toolbar space and appears only on keyboard focus. Narrow layouts and touch devices retain the visible Menu button.
- Never cover reading content with controls. Advanced filters occupy normal layout space when expanded.

## Typography and color

- Use installed system fonts. The Japanese wordmark and crescent icon provide the identity; the icon is also the SVG browser favicon.
- Use existing theme variables for components. Gold identifies actions/selection; status colors supplement text labels rather than replacing them.
- Keep primary reading text spacious and metadata subordinate but legible. Use tabular numerals for study counts, intervals and durations.
- Wrap long names, sources and personal prose without horizontal page overflow.

## Interaction

- Keep 44px touch controls, visible keyboard focus, labelled inputs, and the skip-to-content link.
- A link opens its page at the top; Back and Forward keep the browser's restored position.
- Tests in progress show five questions per page, with the title, progress, save status and actions combined in one compact sticky toolbar. A narrower 216px question navigator sticks on the right with its own scrolling, leaving more width for questions and case studies. On narrow screens navigation sits below the questions. Jump targets and sticky case material clear both measured header heights.
- Answers keep their complete answer text and main explanation visible. Reference notes and source lists use native disclosures with counts. Incorrectly chosen test-option reasoning is visible immediately; other choice reasoning is collapsed. Changing question/card resets disclosures, while saves preserve them.
- Study review keeps Again/Right and Undo visible and puts Suspend under More actions. Touch layouts omit keyboard hints and use compact spacing with 44px controls.
- Normal click selects one card; Ctrl-click extends selection. Selection and saved-answer changes are immediate, without color animation.
- Limit hover treatment to pointer devices. Reduced motion disables transitions and animations.
- Use concise question/note titles as accessible control names; expose deck, status and note type as descriptions.
- After removing a focused editor or the last list item, return focus to a useful visible control. Preserve existing draft guards and failed-write recovery.

## Verification

Use the integrated browser suite for interactions, both themes, and 320–2560px layouts. Use Lighthouse navigation audits for fresh-route load performance and snapshots for populated reading/testing screens. Scores supplement keyboard and visual review; they do not certify all accessibility or predict hosted performance.
