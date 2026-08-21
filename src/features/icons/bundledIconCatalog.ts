const key = (name: string) => `iconify:fluent-emoji-flat:${name}`

export const bundledIconGroups = [
  { name: '餐饮', icons: ['fork-and-knife-with-plate', 'hamburger', 'pizza', 'hot-dog', 'taco', 'burrito', 'steaming-bowl', 'curry-rice', 'cooked-rice', 'bento-box', 'sushi', 'dumpling', 'fried-shrimp', 'french-fries', 'soft-ice-cream'] },
  { name: '购物', icons: ['shopping-cart', 'shopping-bags', 'dress', 't-shirt', 'running-shoe', 'handbag', 'lipstick', 'package', 'basket', 'credit-card', 'jeans', 'high-heeled-shoe', 'purse', 'ring', 'sunglasses'] },
  { name: '交通', icons: ['taxi', 'automobile', 'bus', 'metro', 'train', 'bicycle', 'motorcycle', 'airplane', 'fuel-pump', 'p-button', 'delivery-truck', 'rocket', 'ship', 'helicopter', 'kick-scooter'] },
  { name: '住房', icons: ['house', 'office-building', 'hotel', 'bed', 'key', 'light-bulb', 'couch-and-lamp', 'door', 'window', 'toolbox', 'bathtub', 'toilet', 'chair', 'brick', 'hammer'] },
  { name: '医疗', icons: ['hospital', 'health-worker', 'pill', 'syringe', 'adhesive-bandage', 'stethoscope', 'tooth', 'thermometer', 'medical-symbol', 'drop-of-blood', 'anatomical-heart', 'brain', 'lungs', 'bone', 'microscope'] },
  { name: '学习', icons: ['books', 'open-book', 'notebook', 'graduation-cap', 'student', 'pencil', 'memo', 'laptop', 'school', 'abacus', 'backpack', 'fountain-pen', 'magnifying-glass-tilted-left', 'desktop-computer', 'straight-ruler'] },
  { name: '娱乐', icons: ['video-game', 'cinema', 'musical-notes', 'microphone', 'ferris-wheel', 'badminton', 'soccer-ball', 'party-popper', 'artist-palette', 'trophy', 'clapper-board', 'headphone', 'performing-arts', 'bowling', 'bullseye'] },
  { name: '旅行', icons: ['airplane-departure', 'luggage', 'world-map', 'beach-with-umbrella', 'camping', 'tent', 'admission-tickets', 'camera', 'mountain', 'desert-island', 'compass', 'globe-showing-asia-australia', 'sunrise', 'national-park', 'identification-card'] },
  { name: '收入', icons: ['money-bag', 'coin', 'bank', 'chart-increasing', 'money-with-wings', 'dollar-banknote', 'euro-banknote', 'yen-banknote', 'gem-stone', 'wrapped-gift', 'atm-sign', 'currency-exchange', 'receipt', 'chart-increasing-with-yen', 'chart-decreasing'] },
  { name: '宠物', icons: ['cat', 'dog', 'paw-prints', 'hamster', 'rabbit', 'fish', 'bird', 'turtle', 'service-dog', 'horse', 'chicken', 'duck', 'parrot', 'lizard', 'hedgehog'] },
].map((group) => ({ ...group, icons: group.icons.map(key) }))

export const bundledIconKeys = bundledIconGroups.flatMap((group) => group.icons)
const bundledIconKeySet = new Set(bundledIconKeys)
export function isBundledIconKey(value: string) { return bundledIconKeySet.has(value) }
