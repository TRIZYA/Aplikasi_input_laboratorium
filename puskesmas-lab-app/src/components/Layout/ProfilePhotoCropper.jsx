import { useEffect, useId, useRef, useState } from 'react'
import { FiUser } from 'react-icons/fi'

const CROP_SIZE = 256

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function ProfilePhotoCropper({ value, onChange }) {
  const inputId = useId()
  const dragRef = useRef(null)
  const [source, setSource] = useState('')
  const [image, setImage] = useState(null)
  const [imageSize, setImageSize] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!source) return undefined

    const nextImage = new Image()
    nextImage.onload = () => {
      const width = nextImage.naturalWidth
      const height = nextImage.naturalHeight
      const fitScale = CROP_SIZE / Math.min(width, height)
      setImage(nextImage)
      setImageSize({ width, height })
      setZoom(1)
      setOffset({
        x: (CROP_SIZE - width * fitScale) / 2,
        y: (CROP_SIZE - height * fitScale) / 2,
      })
    }
    nextImage.onerror = () => setError('File gambar tidak dapat dibuka.')
    nextImage.src = source

    return () => URL.revokeObjectURL(source)
  }, [source])

  const scale = imageSize
    ? (CROP_SIZE / Math.min(imageSize.width, imageSize.height)) * zoom
    : 1
  const renderedWidth = imageSize ? imageSize.width * scale : CROP_SIZE
  const renderedHeight = imageSize ? imageSize.height * scale : CROP_SIZE

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Pilih file JPG, PNG, atau WebP.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Ukuran file maksimal 8 MB.')
      return
    }

    setError('')
    setImage(null)
    setImageSize(null)
    setSource(URL.createObjectURL(file))
  }

  const handlePointerDown = (event) => {
    if (!image) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    }
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current || !imageSize) return
    const drag = dragRef.current
    setOffset({
      x: clamp(drag.offsetX + event.clientX - drag.x, CROP_SIZE - renderedWidth, 0),
      y: clamp(drag.offsetY + event.clientY - drag.y, CROP_SIZE - renderedHeight, 0),
    })
  }

  const handleZoomChange = (event) => {
    if (!imageSize) return
    const nextZoom = Number(event.target.value)
    const nextScale = (CROP_SIZE / Math.min(imageSize.width, imageSize.height)) * nextZoom
    const centerX = (CROP_SIZE / 2 - offset.x) / scale
    const centerY = (CROP_SIZE / 2 - offset.y) / scale
    const nextWidth = imageSize.width * nextScale
    const nextHeight = imageSize.height * nextScale

    setZoom(nextZoom)
    setOffset({
      x: clamp(CROP_SIZE / 2 - centerX * nextScale, CROP_SIZE - nextWidth, 0),
      y: clamp(CROP_SIZE / 2 - centerY * nextScale, CROP_SIZE - nextHeight, 0),
    })
  }

  const handleUsePhoto = () => {
    if (!image || !imageSize) return
    const canvas = document.createElement('canvas')
    canvas.width = CROP_SIZE
    canvas.height = CROP_SIZE
    const context = canvas.getContext('2d')
    if (!context) {
      setError('Browser tidak dapat memproses gambar ini.')
      return
    }

    const sourceSize = CROP_SIZE / scale
    const sourceX = clamp(-offset.x / scale, 0, imageSize.width - sourceSize)
    const sourceY = clamp(-offset.y / scale, 0, imageSize.height - sourceSize)
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, CROP_SIZE, CROP_SIZE)
    onChange(canvas.toDataURL('image/jpeg', 0.84))
    setSource('')
    setImage(null)
    setImageSize(null)
  }

  const cancelCrop = () => {
    setSource('')
    setImage(null)
    setImageSize(null)
    setError('')
  }

  return (
    <div className="profile-photo-editor">
      <div className="profile-photo-current">
        {value ? <img src={value} alt="Foto profil saat ini" /> : <FiUser aria-hidden="true" />}
      </div>
      <div className="profile-photo-controls">
        <label className="mini-button profile-photo-select" htmlFor={inputId}>
          Pilih foto
        </label>
        <input
          id={inputId}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
        <span className="field-hint">JPG, PNG, atau WebP. Area crop persegi 256 × 256.</span>
        {error && <span className="profile-photo-error" role="alert">{error}</span>}
      </div>

      {source && (
        <div className="profile-photo-crop">
          <div
            className="profile-photo-crop-stage"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={() => { dragRef.current = null }}
            onPointerCancel={() => { dragRef.current = null }}
            role="application"
            aria-label="Geser gambar untuk memilih area crop persegi"
          >
            {image && (
              <img
                src={source}
                alt="Pilih area foto profil"
                draggable="false"
                style={{ width: renderedWidth, height: renderedHeight, left: offset.x, top: offset.y }}
              />
            )}
          </div>
          <label className="profile-photo-zoom">
            Zoom
            <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={handleZoomChange} />
          </label>
          <div className="profile-photo-crop-actions">
            <button type="button" className="mini-button" onClick={cancelCrop}>Batal</button>
            <button type="button" className="action-button" disabled={!image} onClick={handleUsePhoto}>
              Gunakan foto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePhotoCropper