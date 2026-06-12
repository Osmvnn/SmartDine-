
const KEYWORD_EMOJI = [
  [/pizza/i, '🍕'],
  [/burger/i, '🍔'],
  [/sandwich|\bsub\b/i, '🥪'],
  [/wrap|burrito/i, '🌯'],
  [/taco/i, '🌮'],
  [/sushi/i, '🍣'],
  [/shrimp|prawn/i, '🍤'],
  [/fries|chips/i, '🍟'],
  [/fish/i, '🐟'],
  [/steak|beef/i, '🥩'],
  [/lamb|\bchop/i, '🍖'],
  [/chicken|wing/i, '🍗'],
  [/bacon/i, '🥓'],
  [/egg/i, '🍳'],
  [/pasta|spaghetti|carbonara|noodle/i, '🍝'],
  [/curry/i, '🍛'],
  [/rice|risotto/i, '🍚'],
  [/soup/i, '🍲'],
  [/salad/i, '🥗'],
  [/bread|baguette|toast/i, '🥖'],
  [/spring roll|dumpling|roll/i, '🥟'],
  [/pancake|waffle/i, '🧇'],
  [/donut|doughnut/i, '🍩'],
  [/cookie/i, '🍪'],
  [/cake|cheesecake|tiramisu/i, '🍰'],
  [/chocolate/i, '🍫'],
  [/ice cream|sundae|gelato/i, '🍨'],
  [/pie/i, '🥧'],
  [/fruit|berry|berries/i, '🍓'],
  [/cheese/i, '🧀'],
  [/coffee|cappuccino|espresso|latte|mocha/i, '☕'],
  [/tea/i, '🍵'],
  [/lemonade|lemon/i, '🍋'],
  [/juice|orange/i, '🍊'],
  [/water/i, '💧'],
  [/milkshake|shake|smoothie/i, '🥤'],
  [/soda|cola|soft drink/i, '🥤'],
  [/wine/i, '🍷'],
  [/beer/i, '🍺'],
  [/cocktail|mojito/i, '🍹']
]

const CATEGORY_EMOJI = [
  [/appet|starter/i, '🥗'],
  [/main|entree/i, '🍽️'],
  [/drink|beverage/i, '🥤'],
  [/dessert/i, '🍰'],
  [/side/i, '🍟'],
  [/breakfast/i, '🍳']
]

const DEFAULT_EMOJI = '🍽️'

export function getFoodEmoji(item) {
  const name = (typeof item === 'string' ? item : item?.name) || ''

  for (const [pattern, emoji] of KEYWORD_EMOJI) {
    if (pattern.test(name)) return emoji
  }

  const category = typeof item === 'object' ? (item?.category_name || item?.category || '') : ''
  if (category) {
    for (const [pattern, emoji] of CATEGORY_EMOJI) {
      if (pattern.test(category)) return emoji
    }
  }

  return DEFAULT_EMOJI
}
