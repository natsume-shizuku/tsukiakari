// Regenerates src/content/simulator-fixture-bank.json. Output is deterministic.
// Every item is an everyday engineering fixture for trying the exam tools. None of it is
// certification material, and it must never be copied into a real pack.
import { writeFileSync } from 'node:fs';

const SERIES_NOTE = 'This generated fixture exercises the simulator tools. It is not certification material.';
const domains = [17, 32, 12, 12, 17, 10].map((weight, index) => ({ id: 'fixture-domain-' + (index + 1), title: 'Fixture domain ' + (index + 1), weight }));
const domainTargets = [22, 41, 15, 15, 22, 13];

const MATCH_THEMES = [
  { title: 'Community fair planning', tray: 'Actions', rowHeading: 'Requirement', answerHeading: 'Action', scenario: 'A community center is planning a weekend fair and wants the day to run smoothly for visitors and volunteers.',
    pairs: [['Help visitors find the food stalls', 'Put up signs at the main entrance'], ['Shorten the queue at the ticket table', 'Open a second ticket table at noon'], ['Reunite lost children with their families quickly', 'Name a meeting point near the stage'], ['Keep volunteers rested through the afternoon', 'Publish a rota with short breaks for each shift']],
    distractors: ['Repaint the hall before the next season begins', 'Order extra chairs for the spring concert'] },
  { title: 'Allotment garden season', tray: 'Tasks', rowHeading: 'Goal', answerHeading: 'Task', scenario: 'An allotment society is preparing its shared garden for a dry summer.',
    pairs: [['Reduce how often the beds need watering', 'Spread mulch across the vegetable beds'], ['Protect young plants from a late frost', 'Cover seedlings with fleece overnight'], ['Share tools fairly between members', 'Start a sign-out sheet in the shed'], ['Have compost ready for the autumn', 'Turn the compost heap once a month']],
    distractors: ['Replace the car park gravel', 'Move the annual meeting to a different evening'] },
  { title: 'Neighborhood cafe', tray: 'Configurations', rowHeading: 'Requirement', answerHeading: 'Configuration', scenario: 'A small cafe wants to serve the morning rush faster without adding staff or changing its menu.',
    pairs: [['Prepare the most common orders ahead of time', 'Batch-brew coffee before opening'], ['Stop customers ordering sold-out items', 'Update the chalkboard after each delivery'], ['Move takeaway customers through quickly', 'Add a separate collection counter'], ['Know which pastries to bake tomorrow', 'Count unsold items at closing time']],
    distractors: ['Install a larger sign above the door', 'Print a new loyalty card design'] },
  { title: 'Weekend hiking club', tray: 'Features', rowHeading: 'Need', answerHeading: 'Feature', scenario: 'A hiking club wants beginners to feel safe on its monthly walks.',
    pairs: [['Make sure nobody is left behind on the trail', 'A volunteer walks at the back of the group'], ['Warn members about a route change', 'A message goes out the evening before'], ['Match walks to fitness levels', 'Each walk is graded by distance and climb'], ['Know who to call in an emergency', 'Everyone completes a contact card']],
    distractors: ['A new club logo on the water bottles', 'A photo competition held each winter'] },
  { title: 'School library reorganization', tray: 'Actions', rowHeading: 'Requirement', answerHeading: 'Action', scenario: 'A school library is reorganizing its shelves over the holidays, and staff want the change to be easy for pupils to follow.',
    pairs: [['Help younger pupils find picture books', 'Place picture books on the lowest shelves'], ['Reduce the number of overdue returns', 'Send a reminder two days before each due date'], ['Stop popular titles from sitting unused', 'Rotate a display of recommended books each month'], ['Give classes a quiet place to read together', 'Reserve the back room for class visits']],
    distractors: ['Replace the carpet in the staff room', 'Buy new curtains for the main corridor'] },
];
const HOTSPOT_THEMES = [
  { title: 'Bicycle workshop', rowHeading: 'Requirement', answerHeading: 'Action', scenario: 'A community bicycle workshop wants repairs to take less time and to return bikes safely.',
    rows: [['Stop a bike being returned with loose brakes', ['Test the brakes before handing the bike back', 'Oil the chain', 'Check the tire pressure at the next visit'], 0], ['Find the right spare part quickly', ['Label each storage drawer', 'Move the workbench closer to the door', 'Sort the drawers once a year', 'Buy a larger toolbox'], 0]] },
  { title: 'Food bank shifts', rowHeading: 'Requirement', answerHeading: 'Configuration', scenario: 'A local food bank needs each volunteer shift to start on time and finish tidily.',
    rows: [['Volunteers know their duties when they arrive', ['Hand out a task list at the door', 'Hold a quarterly review', 'Add a second notice board'], 0], ['The next shift starts with a clean space', ['Add a closing checklist', 'Change the opening hours', 'Ask donors to arrive earlier'], 0]] },
  { title: 'Village hall bookings', rowHeading: 'Goal', answerHeading: 'Feature', scenario: 'A village hall committee wants to prevent double bookings and to reduce paperwork for its treasurer.',
    rows: [['Two groups never book the same room', ['A shared booking calendar', 'A longer meeting agenda', 'A second key for the side door', 'A larger notice in the porch'], 0], ['The treasurer can see who has paid', ['A payment column beside each booking', 'A monthly newsletter', 'A printed copy of the rules', 'A new cash box'], 0]] },
  { title: 'Choir concert', rowHeading: 'Requirement', answerHeading: 'Action', scenario: 'A community choir is preparing for its first concert in a new venue.',
    rows: [['Singers can be heard at the back of the hall', ['Hold a rehearsal in the venue', 'Print larger programs', 'Move the interval earlier'], 0], ['The audience knows when to return from the interval', ['Ring a bell five minutes before restarting', 'Lengthen the second half', 'Add the time to next season\'s poster'], 0]] },
  { title: 'Repair cafe', rowHeading: 'Requirement', answerHeading: 'Configuration', scenario: 'A monthly repair cafe wants to help more people without asking volunteers to stay late.',
    rows: [['Visitors know how long they will wait', ['Give each visitor a numbered ticket', 'Add more tables to the entrance', 'Close the doors earlier'], 0], ['Unsafe electrical items are spotted early', ['Check items at a welcome desk', 'Ask visitors to return next month', 'Move electrical repairs to the end of the day'], 0], ['Every repair is recorded', ['Log repairs on a shared sheet', 'Take a group photo', 'Announce results at the end'], 0]] },
];
const ORDER_THEMES = [
  { tray: 'Actions', scenario: 'A volunteer is setting up a stall at a weekend market.', steps: ['Unfold the table', 'Lay out the stock', 'Put out the price cards', 'Greet the first customers'], distractors: ['Pack the van after closing', 'Count the takings for last month'] },
  { tray: 'Steps', scenario: 'A baker is making a loaf of bread from a simple recipe.', steps: ['Mix the flour, water and yeast', 'Knead the dough', 'Leave the dough to rise', 'Bake the loaf'], distractors: ['Slice the loaf while it is hot', 'Freeze the raw flour'] },
  { tray: 'Actions', scenario: 'A club secretary is sending out the notice for an annual meeting.', steps: ['Agree the date with the committee', 'Write the agenda', 'Send the notice to members', 'Collect apologies'], distractors: ['Archive last year\'s minutes unread', 'Choose next year\'s holiday trip'] },
];
const SELECT_THEMES = [
  { scenario: 'A neighborhood group is organizing a street cleanup.', goal: 'make sure the cleanup is safe', correct: ['Hand out gloves to every volunteer', 'Keep the group away from moving traffic', 'Agree a first-aid contact before starting'], wrong: ['Ask volunteers to bring their own ladders', 'Start after dark to avoid the heat', 'Skip the briefing to save time'] },
  { scenario: 'A family is planning a long car journey with young children.', goal: 'keep the journey calm', correct: ['Plan a break every two hours', 'Pack snacks within easy reach', 'Bring games that need no batteries'], wrong: ['Leave at the busiest time of day', 'Pack the snacks under the luggage', 'Cancel the rest stops'] },
  { scenario: 'A small office wants to use less paper.', goal: 'reduce printing', correct: ['Set printers to double-sided by default', 'Share meeting notes online', 'Remove personal desk printers'], wrong: ['Buy a heavier grade of paper', 'Print every email for the records', 'Add a second copy of each form'] },
  { scenario: 'A sports club is reviewing how it welcomes new members.', goal: 'help new members settle in', correct: ['Pair each newcomer with an existing member', 'Send a short welcome note', 'Invite newcomers to a social evening'], wrong: ['Hold all training in the early morning', 'Ask for a full year of fees up front', 'Remove beginners from the schedule'] },
];
const SERIES = [
  { id: 'fixture-series-1', title: 'Fixture series: bakery delivery', scenario: 'Engineering fixture scenario. A bakery delivers fresh bread to six cafes each morning. Deliveries sometimes arrive after the cafes open.\n\nThe bakery needs every delivery to arrive before opening time.',
    solutions: [['Solution: Load the van the evening before and leave thirty minutes earlier.', 0], ['Solution: Print the delivery list in a larger font.', 1], ['Solution: Plan the route so the earliest-opening cafe is served first.', 0], ['Solution: Change the color of the delivery van.', 1]] },
  { id: 'fixture-series-2', title: 'Fixture series: museum tickets', scenario: 'Engineering fixture scenario. A small museum has long queues at its ticket desk on rainy weekends.\n\nThe museum needs visitors to get through the door within five minutes.',
    solutions: [['Solution: Sell timed tickets online in advance.', 0], ['Solution: Open a second ticket desk on rainy weekends.', 0], ['Solution: Move the gift shop to the top floor.', 1], ['Solution: Print a longer visitor guide.', 1]] },
];
const exhibit = (id, title, body) => ({ id, title, body });
const CASES = [
  { id: 'fixture-case-1', title: 'Fixture case study: Lantern Street Bakery', exhibits: [
    exhibit('background', 'Background', 'Engineering fixture, not certification material.\n\nLantern Street Bakery is a fictional family business with three shops. It bakes everything at one central kitchen and delivers to its shops before they open each morning.\n\nThe owners want to open a fourth shop next year without adding night-shift staff.'),
    exhibit('current', 'Current environment', 'Orders are written in a shared notebook at each shop.\n\nThe kitchen runs two ovens and one van.\n\nShop managers telephone the kitchen before closing to confirm the next day.\n\nPrices are printed on paper cards and updated by hand.'),
    exhibit('business', 'Business requirements', 'Each shop must have fresh bread before opening.\n\nWaste must fall by a fifth within a year.\n\nCustomers must be able to pre-order for special occasions.\n\nStaff must not need to stay later than they do today.'),
    exhibit('technical', 'Technical requirements', 'Order changes must reach the kitchen by four in the afternoon.\n\nDeliveries must be planned so that the van makes one trip.\n\nRecords must be kept for two years.'),
    exhibit('issues', 'Issues', 'The notebook is sometimes unreadable.\n\nThe kitchen often bakes too much on Mondays.\n\nOne shop regularly runs out of rolls by midday.\n\nThe van is sometimes late because of school traffic.'),
  ] },
  { id: 'fixture-case-2', title: 'Fixture case study: Northgate Tool Library', exhibits: [
    exhibit('background', 'Background', 'Engineering fixture, not certification material.\n\nNorthgate Tool Library is a fictional charity that lends tools to local residents. It has one workshop, four hundred members and a team of volunteers.\n\nThe charity wants members to borrow more often while keeping every tool safe to use.'),
    exhibit('current', 'Current environment', 'Tools are stored on open shelves.\n\nLoans are recorded on paper slips.\n\nVolunteers check tools when they have time.\n\nMembers reserve tools by telephone.'),
    exhibit('business', 'Business requirements', 'Members must be able to see which tools are available.\n\nEvery tool must be safety checked between loans.\n\nVolunteers must spend less time on paperwork.'),
    exhibit('technical', 'Technical requirements', 'Loan records must be searchable by member and by tool.\n\nA tool that fails a check must not be available to borrow.\n\nRecords must be kept for one year.'),
    exhibit('issues', 'Issues', 'Paper slips are sometimes lost.\n\nSome tools are lent twice on the same day.\n\nDamaged tools can stay on the shelf for weeks.'),
  ] },
  { id: 'fixture-case-3', title: 'Fixture case study: Harbor Lane Community Pool', exhibits: [
    exhibit('background', 'Background', 'Engineering fixture, not certification material.\n\nHarbor Lane Community Pool is a fictional public pool run by a small trust. It offers lessons, lane swimming and family sessions.\n\nThe trust wants to fill more of its quiet weekday sessions.'),
    exhibit('current', 'Current environment', 'Sessions are booked in person or by telephone.\n\nLifeguard rotas are planned on a wall chart.\n\nThe timetable is printed each term.'),
    exhibit('business', 'Business requirements', 'Swimmers must be able to see how busy a session is.\n\nEvery session must have the required number of lifeguards.\n\nMembers must be told about timetable changes.'),
    exhibit('technical', 'Technical requirements', 'Bookings must close one hour before a session.\n\nLifeguard qualifications must be checked each year.\n\nChanges must reach members at least a day ahead.'),
    exhibit('issues', 'Issues', 'Lessons sometimes overrun into lane swimming.\n\nStaff learn about cancelled shifts too late.\n\nThe printed timetable is out of date within weeks.'),
  ] },
];

let serial = 0;
const next = () => String(++serial).padStart(3, '0');
const assigned = domainTargets.map(() => 0);
function nextDomain(total) {
  let best = 0, bestGap = -Infinity;
  domainTargets.forEach((target, index) => {
    const gap = target * (serial / total) - assigned[index];
    if (gap > bestGap) { best = index; bestGap = gap; }
  });
  assigned[best]++;
  return domains[best].id;
}
const take = (list, count, offset) => Array.from({ length: count }, (_, index) => list[(offset + index) % list.length]);
const opt = (prefix, index) => `${prefix}-option-${index + 1}`;
function base(kind, intro, extra) {
  const number = next();
  const id = `simulator-fixture-${number}`;
  return { id, revision: 1, kind, domainId: nextDomain(128), objectiveIds: ['fixture-objective-1'], conceptId: `simulator-fixture-${kind}-${number}`,
    prompt: `Engineering fixture ${number}: ${intro}`, answer: '', explanation: SERIES_NOTE, sourceIds: ['simulator-fixture-source'],
    tags: ['developer-fixture', 'simulator-preview'], optionExplanations: {}, relatedNotes: [], status: 'approved', ...extra };
}
function explain(question, correctIds, ids) {
  for (const id of ids) question.optionExplanations[id] = correctIds.includes(id) ? 'Fixture explanation: this is the sample answer.' : 'Fixture explanation: this is a sample distractor.';
}
function match(index, groupId) {
  const theme = MATCH_THEMES[index % MATCH_THEMES.length];
  const rowCount = index % 11 === 7 ? 4 : index % 7 === 3 ? 3 : 2;
  const pairs = take(theme.pairs, rowCount, index);
  const q = base('match', `${theme.scenario}\n\nThe organizers have these requirements:\n${pairs.map(pair => '- ' + pair[0]).join('\n')}\n\nYou need to choose an action for each requirement.`, { tray: theme.tray, table: { title: theme.title, rowHeading: theme.rowHeading, answerHeading: theme.answerHeading } });
  // A shared answer shows that one token can fill two rows.
  const reuse = index % 5 === 2;
  const correct = pairs.map(pair => pair[1]);
  if (reuse) correct[1] = correct[0];
  const texts = [...new Set(correct)];
  for (const text of take(theme.distractors, Math.max(2, 4 - texts.length), index)) if (!texts.includes(text)) texts.push(text);
  while (texts.length < 3) texts.push(`Sample extra choice ${texts.length + 1}`);
  q.tokens = texts.map((text, tokenIndex) => ({ id: opt(q.id, tokenIndex), text }));
  q.rows = pairs.map((pair, rowIndex) => ({ id: `${q.id}-row-${rowIndex + 1}`, label: pair[0], correctTokenId: opt(q.id, texts.indexOf(correct[rowIndex])) }));
  q.answer = pairs.map((pair, rowIndex) => `${pair[0]}: ${correct[rowIndex]}.`).join(' ');
  explain(q, q.rows.map(row => row.correctTokenId), q.tokens.map(token => token.id));
  if (groupId) q.groupId = groupId;
  return q;
}
function order(index, groupId) {
  const theme = ORDER_THEMES[index % ORDER_THEMES.length];
  const count = index % 2 ? 4 : 3;
  const steps = theme.steps.slice(0, count);
  const q = base('order', `${theme.scenario}\n\nYou need to choose the ${count === 3 ? 'three' : 'four'} actions that complete the job, in order.`, { tray: theme.tray });
  // Steps are placed out of order in the tray, so the correct order is never the visual order.
  const texts = [...steps.slice().reverse(), ...theme.distractors];
  q.tokens = texts.map((text, tokenIndex) => ({ id: opt(q.id, tokenIndex), text }));
  q.correctOrder = steps.map(step => opt(q.id, texts.indexOf(step)));
  q.answer = steps.join(', then ') + '.';
  explain(q, q.correctOrder, q.tokens.map(token => token.id));
  if (groupId) q.groupId = groupId;
  return q;
}
function hotspot(index, groupId) {
  const theme = HOTSPOT_THEMES[index % HOTSPOT_THEMES.length];
  const q = base('hotspot', `${theme.scenario}\n\nYou need to choose the best answer for each requirement.`, { table: { title: theme.title, rowHeading: theme.rowHeading, answerHeading: theme.answerHeading } });
  q.rows = theme.rows.map((row, rowIndex) => {
    const [label, options, correct] = row;
    const rotation = (index + rowIndex) % options.length;
    const texts = options.map((_, optionIndex) => options[(optionIndex + rotation) % options.length]);
    const id = `${q.id}-row-${rowIndex + 1}`;
    return { id, label, options: texts.map((text, optionIndex) => ({ id: `${id}-option-${optionIndex + 1}`, text })), correctOptionId: `${id}-option-${texts.indexOf(options[correct]) + 1}` };
  });
  q.answer = q.rows.map(row => `${row.label}: ${row.options.find(option => option.id === row.correctOptionId).text}.`).join(' ');
  explain(q, q.rows.map(row => row.correctOptionId), q.rows.flatMap(row => row.options.map(option => option.id)));
  if (groupId) q.groupId = groupId;
  return q;
}
function selection(kind, index, groupId) {
  const theme = SELECT_THEMES[index % SELECT_THEMES.length];
  const count = kind === 'single' ? 1 : index % 6 === 5 ? 3 : 2;
  const words = ['one', 'two', 'three'];
  const style = index % 2 ? 'Each correct answer presents part of the solution.' : 'Each correct answer presents a complete solution.';
  const q = base(kind, `${theme.scenario}\n\nYou need to ${theme.goal}.\n\n${kind === 'single' ? 'What should you do?' : `Which ${words[count - 1]} actions should you take? ${style}`}`, {});
  const correct = take(theme.correct, count, index);
  const texts = [...correct, ...take(theme.wrong, 5 - count, index)];
  const rotated = texts.map((_, position) => texts[(position + index) % texts.length]);
  q.options = rotated.map((text, optionIndex) => ({ id: opt(q.id, optionIndex), text }));
  q.correctOptionIds = correct.map(text => opt(q.id, rotated.indexOf(text)));
  q.answer = correct.join('. ') + '.';
  explain(q, q.correctOptionIds, q.options.map(option => option.id));
  if (groupId) q.groupId = groupId;
  return q;
}

const questions = [];
const repeat = (count, build) => { for (let index = 0; index < count; index++) questions.push(build(index)); };
repeat(20, index => match(index));
repeat(4, index => order(index));
repeat(28, index => hotspot(index));
repeat(24, index => selection('multiple', index));
repeat(17, index => selection('single', index));
CASES.forEach((group, caseIndex) => {
  repeat(4, index => match(caseIndex * 4 + index, group.id));
  questions.push(order(caseIndex, group.id));
  repeat(2, index => hotspot(caseIndex * 2 + index, group.id));
  questions.push(selection('multiple', caseIndex, group.id));
  questions.push(selection('single', caseIndex, group.id));
});
for (const series of SERIES) {
  for (const [text, correct] of series.solutions) {
    const q = base('single', `${text}\n\nDoes the solution meet the goal?`, { groupId: series.id });
    q.options = [{ id: opt(q.id, 0), text: 'Yes' }, { id: opt(q.id, 1), text: 'No' }];
    q.correctOptionIds = [opt(q.id, correct)];
    q.answer = correct === 0 ? 'Yes.' : 'No.';
    explain(q, q.correctOptionIds, q.options.map(option => option.id));
    questions.push(q);
  }
}

const bank = {
  id: 'simulator-test-fixture', version: '1.0.0', title: 'Exam simulator preview',
  description: '128 generated software fixtures in every simulator format. This is not certification material.',
  fixture: true, domains,
  sources: [{ id: 'simulator-fixture-source', title: 'Wolfram MathWorld: Addition', url: 'https://mathworld.wolfram.com/Addition.html' }],
  questions,
  groups: [...CASES.map(group => ({ id: group.id, kind: 'case-study', title: group.title, exhibits: group.exhibits })),
    ...SERIES.map(series => ({ id: series.id, kind: 'series', title: series.title, exhibits: [exhibit('scenario', 'Scenario', series.scenario)] }))],
  blueprint: { defaultCount: 50, caseStudyEvery: 50, seriesEvery: 100, shares: { match: 25, order: 5, hotspot: 27, multiple: 21, single: 16, series: 6 } },
};
writeFileSync(new URL('../src/content/simulator-fixture-bank.json', import.meta.url), JSON.stringify(bank, null, 1) + '\n');
console.log(`Wrote ${questions.length} fixture questions; domains ${assigned.join('/')}.`);
