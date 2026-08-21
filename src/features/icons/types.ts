export interface IconAsset {
  key: string
  prefix: string
  name: string
  body: string
  width: number
  height: number
  cachedAt: string
}

export interface ParsedIconKey { prefix: string; name: string }
