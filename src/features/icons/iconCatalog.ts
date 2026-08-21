export const approvedIconPrefixes = ['mdi', 'tabler', 'fluent-emoji-flat'] as const
export const searchableIconPrefix = 'fluent-emoji-flat' as const

const intentQueries: Record<string, string[]> = {
  餐饮: ['food', 'restaurant', 'rice', 'bowl'], 吃饭: ['food', 'restaurant', 'rice', 'bowl'],
  早餐: ['breakfast', 'bread', 'egg'], 午餐: ['lunch', 'bento', 'rice'], 晚餐: ['dinner', 'restaurant', 'plate'],
  外卖: ['takeout', 'delivery', 'bento'], 火锅: ['hot-pot', 'pot', 'food'], 烧烤: ['barbecue', 'meat', 'fire'],
  咖啡: ['coffee', 'hot-beverage', 'cup'], 奶茶: ['bubble-tea', 'cup-with-straw', 'beverage'],
  交通: ['transport', 'automobile', 'bus'], 打车: ['taxi', 'automobile'], 公交: ['bus', 'bus-stop'],
  地铁: ['metro', 'train', 'station'], 开车: ['automobile', 'car'], 加油: ['fuel-pump', 'automobile'], 停车: ['parking', 'automobile'],
  购物: ['shopping-bags', 'shopping-cart'], 买菜: ['shopping-basket', 'vegetables', 'supermarket'],
  超市: ['shopping-cart', 'shopping-basket'], 网购: ['package', 'shopping-bags', 'mobile-phone'], 衣服: ['clothing', 't-shirt', 'dress'],
  住房: ['house', 'home'], 房租: ['house', 'money-bag'], 水费: ['droplet', 'water'], 电费: ['high-voltage', 'light-bulb'],
  燃气: ['flame', 'cooking'], 物业: ['office-building', 'house'], 医疗: ['hospital', 'doctor', 'medical-symbol'],
  看病: ['doctor', 'hospital'], 药品: ['pill', 'syringe'], 宠物: ['paw-prints', 'dog', 'cat'], 猫: ['cat'], 狗: ['dog'],
  学习: ['books', 'open-book', 'student'], 娱乐: ['video-game', 'cinema', 'musical-notes'], 旅行: ['airplane', 'luggage', 'world-map'],
  工资: ['money-bag', 'bank', 'chart-increasing'], 奖金: ['money-with-wings', 'trophy'], 收入: ['money-bag', 'coin'],
  礼物: ['wrapped-gift', 'party-popper'], 账本: ['notebook', 'ledger'], 手机: ['mobile-phone'], 电脑: ['laptop'],
}

export const iconQueryAliases: Record<string, string> = Object.fromEntries(
  Object.entries(intentQueries).map(([query, keywords]) => [query, keywords[0]]),
)

export function iconQueriesFor(normalizedQuery: string) {
  return intentQueries[normalizedQuery] ?? [normalizedQuery]
}

export const recommendedIconKeys = [
  'iconify:fluent-emoji-flat:fork-and-knife-with-plate', 'iconify:fluent-emoji-flat:shopping-cart',
  'iconify:fluent-emoji-flat:house', 'iconify:fluent-emoji-flat:taxi',
  'iconify:fluent-emoji-flat:hospital', 'iconify:fluent-emoji-flat:books',
  'iconify:fluent-emoji-flat:wrapped-gift', 'iconify:fluent-emoji-flat:video-game',
  'iconify:fluent-emoji-flat:credit-card', 'iconify:fluent-emoji-flat:money-bag',
  'iconify:fluent-emoji-flat:notebook', 'iconify:fluent-emoji-flat:cat',
]
