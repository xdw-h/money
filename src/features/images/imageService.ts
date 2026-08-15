const MAX_FILE_SIZE = 20 * 1024 * 1024

export function assertImageFile(file: File) {
  if (!file.type.startsWith('image/')) throw new TypeError(`${file.name}：仅支持图片文件`)
  if (file.size > MAX_FILE_SIZE) throw new RangeError(`${file.name}：图片不能超过 20 MB`)
}

export function imageExtension(mimeType: string) {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[mimeType] ?? 'bin'
}

async function drawToBlob(file: File, maxEdge: number, quality: number): Promise<Blob> {
  let source: CanvasImageSource
  let width: number
  let height: number
  let cleanup = () => {}
  try {
    const bitmap = await createImageBitmap(file)
    source = bitmap; width = bitmap.width; height = bitmap.height; cleanup = () => bitmap.close()
  } catch {
    const url = URL.createObjectURL(file)
    const image = new Image()
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('图片内容损坏或浏览器不支持')); image.src = url })
    source = image; width = image.naturalWidth; height = image.naturalHeight; cleanup = () => URL.revokeObjectURL(url)
  }
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法处理图片')
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  cleanup()
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片压缩失败')), 'image/webp', quality)
  })
}

export async function processImage(file: File) {
  assertImageFile(file)
  const [blob, thumbnailBlob] = await Promise.all([
    drawToBlob(file, 1920, 0.82),
    drawToBlob(file, 320, 0.76),
  ])
  return { blob, thumbnailBlob, mimeType: 'image/webp' }
}
