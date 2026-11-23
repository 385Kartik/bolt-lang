// ─── Bolt — Tailwind class merging ─────────────────────────────────────
// Bolt gives elements default classes (a button is blue, a row is flex ...).
// When you write your own `styled as:` classes they must WIN. Plain CSS does
// not guarantee that (two `bg-*` classes fight, the stylesheet order decides),
// so we drop the default class whenever you set the same kind of thing.
//
//   default:  px-4 py-2 bg-blue-600 hover:bg-blue-700
//   yours:    bg-red-600
//   result:   px-4 py-2 bg-red-600            (blue bg and its hover are gone)

// Splits "md:hover:bg-red-500" into { variants: "md:hover:", utility: "bg-red-500" }.
function splitVariants(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === '[') depth++;
    else if (c === ']') depth = Math.max(0, depth - 1);
    else if (c === ':' && depth === 0) cut = i;
  }
  return { variants: token.slice(0, cut + 1), utility: token.slice(cut + 1) };
}

const SIDES = { t: 't', r: 'r', b: 'b', l: 'l', x: 'x', y: 'y' };

// What kind of thing does this class set? (two classes of the same kind conflict)
function groupOf(rawUtility) {
  const u = rawUtility.replace(/^[!-]+/, '');
  let m;

  if (/^(flex|grid|block|inline|inline-block|inline-flex|inline-grid|hidden|table|contents)$/.test(u)) return 'display';
  if (/^flex-(row|col)(-reverse)?$/.test(u)) return 'flex-dir';
  if (/^flex-(wrap|nowrap|wrap-reverse)$/.test(u)) return 'flex-wrap';
  if (/^flex-(1|auto|initial|none)$/.test(u)) return 'flex-size';
  if (/^(static|fixed|absolute|relative|sticky)$/.test(u)) return 'position';
  if (/^items-/.test(u)) return 'items';
  if (/^justify-/.test(u)) return 'justify';
  if (/^self-/.test(u)) return 'self';
  if ((m = u.match(/^gap-(x|y)-/))) return 'gap-' + m[1];
  if (/^gap-/.test(u)) return 'gap';
  if ((m = u.match(/^(p|m)([trblxy])?-/))) return m[1] + (m[2] || '');
  if ((m = u.match(/^(min-w|max-w|min-h|max-h|w|h|size)-/))) return m[1];

  if (/^text-(xs|sm|base|lg|xl|[2-9]xl)$/.test(u) || /^text-\[[\d.]+(px|rem|em)\]$/.test(u)) return 'text-size';
  if (/^text-(left|center|right|justify|start|end)$/.test(u)) return 'text-align';
  if (/^text-(wrap|nowrap|balance|pretty|ellipsis|clip)$/.test(u)) return 'text-wrap';
  if (/^text-/.test(u)) return 'text-color';
  if (/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(u)) return 'font-weight';
  if (/^font-(sans|serif|mono)$/.test(u)) return 'font-family';
  if (/^leading-/.test(u)) return 'leading';
  if (/^tracking-/.test(u)) return 'tracking';
  if (/^(uppercase|lowercase|capitalize|normal-case)$/.test(u)) return 'text-transform';

  if (/^bg-gradient-/.test(u)) return 'bg-image';
  if (/^bg-(auto|cover|contain|center|top|bottom|left|right|repeat|no-repeat|fixed|local|scroll|clip-\w+|origin-\w+)$/.test(u)) return 'bg-other:' + u;
  if (/^bg-/.test(u)) return 'bg';

  if ((m = u.match(/^rounded(?:-(tl|tr|bl|br|ss|se|es|ee|t|r|b|l|s|e))?(?:-|$)/))) return 'rounded' + (m[1] ? '-' + m[1] : '');
  if (/^border-(solid|dashed|dotted|double|none|hidden)$/.test(u)) return 'border-style';
  if ((m = u.match(/^border(?:-([trblxy]))?(?:-(0|2|4|8))?$/))) return 'border-w' + (m[1] ? '-' + m[1] : '');
  if ((m = u.match(/^border-([trblxy])-/))) return 'border-color-' + m[1];
  if (/^border-/.test(u)) return 'border-color';
  if (/^divide-/.test(u)) return 'divide';

  if (/^shadow(-(sm|md|lg|xl|2xl|inner|none))?$/.test(u)) return 'shadow';
  if (/^shadow-/.test(u)) return 'shadow-color';
  if (/^ring-offset-(0|1|2|4|8)$/.test(u)) return 'ring-offset-w';
  if (/^ring-offset-/.test(u)) return 'ring-offset-color';
  if (/^ring(-(0|1|2|4|8|inset))?$/.test(u)) return 'ring-w';
  if (/^ring-/.test(u)) return 'ring-color';
  if (/^outline(-none)?$/.test(u)) return 'outline';

  if (/^opacity-/.test(u)) return 'opacity';
  if (/^z-/.test(u)) return 'z';
  if (/^overflow(-[xy])?-/.test(u)) return u.replace(/-(auto|hidden|visible|scroll|clip)$/, '');
  if (/^cursor-/.test(u)) return 'cursor';
  if (/^transition/.test(u)) return 'transition';
  if (/^duration-/.test(u)) return 'duration';
  if (/^ease-/.test(u)) return 'ease';
  if (/^(grid-cols|grid-rows|col-span|row-span)-/.test(u)) return u.replace(/-[^-]+$/, '').replace(/-\[.*$/, '');
  return 'class:' + u; // unknown utility: only an identical class conflicts
}

// If a user sets `p-4`, defaults `px-*`, `pt-*` ... are overridden too.
function coversOf(group) {
  const covers = [group];
  const m = group.match(/^(p|m)([trblxy])?$/);
  if (m) {
    const [, kind, side] = m;
    if (!side) covers.push(...['x', 'y', 't', 'r', 'b', 'l'].map(s => kind + s));
    else if (side === 'x') covers.push(kind + 'l', kind + 'r');
    else if (side === 'y') covers.push(kind + 't', kind + 'b');
  }
  if (group === 'gap') covers.push('gap-x', 'gap-y');
  if (group === 'rounded') covers.push(...['t', 'r', 'b', 'l', 'tl', 'tr', 'bl', 'br', 's', 'e', 'ss', 'se', 'es', 'ee'].map(s => 'rounded-' + s));
  if (group === 'border-w') covers.push(...['t', 'r', 'b', 'l', 'x', 'y'].map(s => 'border-w-' + s));
  if (group === 'size') covers.push('w', 'h');
  return covers;
}

function parse(token) {
  const { variants, utility } = splitVariants(token);
  const group = groupOf(utility);
  return { token, variants, utility, group, covers: coversOf(group) };
}

const STATE_VARIANTS = new Set(['hover:', 'focus:', 'active:']);
const COLOR_GROUPS = new Set(['bg', 'text-color', 'border-color']);

// Merge default classes with the user's. The user's classes always win.
export function mergeClasses(base, user) {
  const baseTokens = String(base || '').split(/\s+/).filter(Boolean);
  const userTokens = String(user || '').split(/\s+/).filter(Boolean);
  if (userTokens.length === 0) return [...new Set(baseTokens)].join(' ');

  const userInfo = userTokens.map(parse);

  const kept = baseTokens.filter(token => {
    const b = parse(token);
    for (const u of userInfo) {
      // same variant (md:, hover: ...) and same kind of thing
      if (u.variants === b.variants && u.covers.includes(b.group)) return false;

      // user recolored the element: drop the default hover/focus color of that same kind,
      // unless the user wrote their own for that state
      if (!u.variants && COLOR_GROUPS.has(u.group) && b.group === u.group && STATE_VARIANTS.has(b.variants)) {
        const userHasState = userInfo.some(x => x.variants === b.variants && x.group === b.group);
        if (!userHasState) return false;
      }
    }
    return true;
  });

  return [...new Set([...kept, ...userTokens])].join(' ');
}
