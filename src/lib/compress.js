import imageCompression from 'browser-image-compression'

/**
 * 업로드 전 이미지의 긴 변이 1600px를 넘지 않도록 압축한다.
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressPhoto(file) {
  if (!file) return null
  try {
    return await imageCompression(file, {
      maxWidthOrHeight: 1600,
      maxSizeMB: 1.5,
      useWebWorker: true,
      initialQuality: 0.85,
    })
  } catch (err) {
    console.error('이미지 압축 실패, 원본 사용:', err)
    return file
  }
}

/** File -> base64 data URL (localStorage 모드 저장용) */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
