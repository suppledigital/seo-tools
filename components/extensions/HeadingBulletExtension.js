// components/extensions/HeadingBulletExtension.js
import { Extension } from '@tiptap/core'
import { InputRule, textblockTypeInputRule } from '@tiptap/pm/inputrules'

// We assume you installed @tiptap/extension-heading, @tiptap/extension-bullet-list, etc.

function createHeadingInputRule(level) {
  // match `H1: ` or `H2: ` at the start of a line
  return textblockTypeInputRule(
    new RegExp(`^(H${level}:)\\s$`),
    'heading',
    () => ({ level }),
  )
}

// A simple bullet list input rule for lines starting with `- ` or `* `
function createBulletListInputRule() {
  return new InputRule(/^([-\\*])\s$/, (state, match, start, end) => {
    // This is a naive approach. 
    // For a robust approach, you might prefer Tiptap's official list input rules
    let tr = state.tr.deleteRange(start, end)
    // optional: turn the current node into a bulletList or listItem, etc.
    return tr
  })
}

export const HeadingBulletExtension = Extension.create({
  name: 'headingBullet',

  addInputRules() {
    return [
      createHeadingInputRule(1),
      createHeadingInputRule(2),
      createHeadingInputRule(3),
      createHeadingInputRule(4),
      createHeadingInputRule(5),
      createHeadingInputRule(6),
      createBulletListInputRule(),
    ]
  },
})
