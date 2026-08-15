export type ThemeId = 'rose' | 'taro' | 'tiffany' | 'spring' | 'lemon' | 'mist' | 'caramel'

export interface AppTheme {
  id: ThemeId
  name: string
  description: string
  colors: [string, string, string]
  tokens: Record<string, string>
}

export const appThemes: AppTheme[] = [
  { id: 'rose', name: '奶油淡红', description: '温柔、轻盈的默认手账风', colors: ['#f07b70', '#fbf7f1', '#fff7f2'], tokens: { paper: '#fbf7f1', surface: '#fffdfa', 'surface-soft': '#fff7f2', ink: '#312c2a', muted: '#9a918c', 'grid-line': 'rgba(180,154,137,.10)', primary: '#f07b70', 'primary-soft': '#fff0ed', income: '#72ad66', expense: '#e56f68', accent: '#f4b66d', lavender: '#a894cd', blue: '#7ca9cc', border: '#eee2d9', shadow: '87,57,39' } },
  { id: 'taro', name: '芋泥紫', description: '低饱和紫调，安静细腻', colors: ['#76558f', '#f3edf7', '#dfd0e9'], tokens: { paper: '#f3edf7', surface: '#fffcff', 'surface-soft': '#ebe1f1', ink: '#342c39', muted: '#8e8195', 'grid-line': 'rgba(112,78,137,.12)', primary: '#76558f', 'primary-soft': '#e6d8ee', income: '#719879', expense: '#b45f76', accent: '#ad8966', lavender: '#9477aa', blue: '#7d94ad', border: '#dfd1e6', shadow: '76,52,91' } },
  { id: 'tiffany', name: '蒂芙尼蓝', description: '清透、精致的蓝绿色调', colors: ['#159f9a', '#eff8f7', '#d8f0ed'], tokens: { paper: '#eff8f7', surface: '#fcfffe', 'surface-soft': '#e5f5f3', ink: '#263534', muted: '#7f9290', 'grid-line': 'rgba(21,159,154,.09)', primary: '#159f9a', 'primary-soft': '#dff3f1', income: '#579673', expense: '#d46f78', accent: '#d8a95e', lavender: '#998ab7', blue: '#579cad', border: '#d7e9e7', shadow: '34,91,88' } },
  { id: 'spring', name: '嫩绿色', description: '柔和、自然的新芽气息', colors: ['#78a96f', '#f3f8ef', '#e2efdc'], tokens: { paper: '#f3f8ef', surface: '#fdfffb', 'surface-soft': '#eaf4e5', ink: '#2f382c', muted: '#879083', 'grid-line': 'rgba(100,151,88,.09)', primary: '#78a96f', 'primary-soft': '#e3f0de', income: '#5f9568', expense: '#d57670', accent: '#d4a95f', lavender: '#9c8ab7', blue: '#719eb1', border: '#dde9d8', shadow: '66,96,58' } },
  { id: 'lemon', name: '柠檬黄', description: '明亮但不刺眼的奶油黄', colors: ['#d0a526', '#fffbed', '#f7edbd'], tokens: { paper: '#fffbed', surface: '#fffef8', 'surface-soft': '#fbf3cf', ink: '#3b3727', muted: '#948e76', 'grid-line': 'rgba(184,147,30,.09)', primary: '#c69a18', 'primary-soft': '#f8eeba', income: '#6f9567', expense: '#cf6f68', accent: '#d29a34', lavender: '#9c8bad', blue: '#779dab', border: '#eee5bc', shadow: '105,85,34' } },
  { id: 'mist', name: '雾霾蓝', description: '冷静、清爽的灰蓝风格', colors: ['#6e8fac', '#f1f5f8', '#dfe9f0'], tokens: { paper: '#f1f5f8', surface: '#fcfdff', 'surface-soft': '#e8eff4', ink: '#2d343a', muted: '#818c95', 'grid-line': 'rgba(91,126,155,.09)', primary: '#6e8fac', 'primary-soft': '#e1ebf2', income: '#63937a', expense: '#c86f78', accent: '#c89b5d', lavender: '#9387ad', blue: '#6e8fac', border: '#dce5eb', shadow: '55,75,91' } },
  { id: 'caramel', name: '焦糖奶茶', description: '温暖、沉稳的奶茶棕', colors: ['#a87852', '#faf5ee', '#efe1d2'], tokens: { paper: '#faf5ee', surface: '#fffdf9', 'surface-soft': '#f4e9dd', ink: '#3b312b', muted: '#92867d', 'grid-line': 'rgba(151,110,77,.09)', primary: '#a87852', 'primary-soft': '#f0dfd0', income: '#708f68', expense: '#c86b61', accent: '#c9934f', lavender: '#9c86ad', blue: '#7896a8', border: '#eaded2', shadow: '89,61,43' } },
]

const storageKey = 'money-theme'
export function getThemeId(): ThemeId {
  const value = localStorage.getItem(storageKey)
  return appThemes.some((theme) => theme.id === value) ? value as ThemeId : 'rose'
}
export function applyTheme(id: ThemeId) {
  const theme = appThemes.find((item) => item.id === id) ?? appThemes[0]
  const root = document.documentElement
  root.dataset.theme = theme.id
  Object.entries(theme.tokens).forEach(([name, value]) => root.style.setProperty(`--${name}`, value))
  localStorage.setItem(storageKey, theme.id)
}
