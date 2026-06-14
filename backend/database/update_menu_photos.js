// One-off data update: assign free stock food photos (LoremFlickr) to menu items
// that currently use generic category placeholder SVGs.

const photoKeywords = {
  1: 'salad,caesar',
  2: 'chicken,wings',
  3: 'bread,garlic',
  4: 'soup',
  5: 'springrolls,asian',
  6: 'chicken,grilled',
  7: 'steak,beef',
  8: 'pasta,carbonara',
  9: 'fish,chips',
  10: 'burger,vegetarian',
  11: 'lamb,chops',
  12: 'orangejuice,juice',
  13: 'soda,drink',
  14: 'cappuccino,coffee',
  15: 'icedtea,tea',
  16: 'water,bottle',
  17: 'chocolate,cake',
  18: 'icecream,sundae',
  19: 'cheesecake,dessert',
  20: 'tiramisu,dessert',
  21: 'turkish,breakfast',
  22: 'avocado,toast',
  23: 'omelette,eggs',
  24: 'pancakes,breakfast',
  25: 'pizza,margherita',
  26: 'pizza,pepperoni',
  27: 'pizza,bbq',
  28: 'pizza,vegetable',
  29: 'salmon,grilled',
  30: 'shrimp,pasta',
  31: 'seabass,fish',
  32: 'calamari,squid',
  33: 'quinoa,chicken',
  34: 'falafel,bowl',
  35: 'greeksalad,salad',
  36: 'vegan,bowl',
  37: 'lemonade,mint',
  38: 'turkishcoffee,coffee',
  39: 'baklava,dessert',
  40: 'fruit,plate'
}

module.exports = { photoKeywords }

if (require.main === module) {
  const db = require('../src/config/db')
  ;(async () => {
    for (const id of Object.keys(photoKeywords)) {
      const url = `/images/menu/${id}.jpg`
      try {
        await db.query('UPDATE menu_items SET image_url = ? WHERE id = ?', [url, id])
        console.log('OK   ', id, url)
      } catch (err) {
        console.error('FAIL ', id, '-', err.message)
      }
    }
    process.exit(0)
  })()
}
