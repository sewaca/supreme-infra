/**
 * PostCSS plugin: dvh/svh/lvh → @supports fallback
 *
 * Transforms:
 *   .rule { min-height: 100dvh }
 * into:
 *   .rule { min-height: 100vh }
 *   @supports (height: 1dvh) { .rule { min-height: 100dvh } }
 *
 * The @supports pattern survives Lightning CSS (Turbopack) which strips
 * cascade fallbacks (min-height:100vh; min-height:100dvh) as "duplicates".
 */
const postcss = require('postcss');

const DVH_RE = /\b(\d+(?:\.\d+)?)[dsl]v([hw])\b/;

const dvhFallback = () => ({
  postcssPlugin: 'dvh-supports-fallback',
  OnceExit(root) {
    const toInsert = [];

    root.walkDecls((decl) => {
      if (!DVH_RE.test(decl.value)) return;
      const parent = decl.parent;
      if (!parent || parent.type !== 'rule') return;

      const dvhValue = decl.value;
      const vhValue = decl.value.replace(/\b(\d+(?:\.\d+)?)[dsl]v([hw])\b/g, '$1v$2');

      decl.value = vhValue;
      toInsert.push({ after: parent, selector: parent.selector, prop: decl.prop, value: dvhValue });
    });

    for (const { after, selector, prop, value } of toInsert) {
      const supports = postcss.atRule({
        name: 'supports',
        params: '(height: 1dvh)',
        raws: { afterName: ' ' },
      });
      supports.append(postcss.rule({ selector }).append(postcss.decl({ prop, value })));
      after.parent.insertAfter(after, supports);
    }
  },
});

dvhFallback.postcss = true;

module.exports = dvhFallback;
