import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

/**
 * KleeCanvas — loads YOUR klee.glb model
 *
 * SETUP:
 * 1. npm install three
 * 2. Put klee.glb inside your /public folder  →  public/klee.glb
 * 3. Drop <KleeCanvas /> in your Header.jsx right column
 *
 * TUNING (adjust these if Klee looks too big/small/high/low):
 */
const MODEL_PATH  = '/klee.glb'   // path inside /public
const MODEL_SCALE = 1.8            // increase = bigger, decrease = smaller
const CAMERA_Y    = 1.2            // increase = shows more of her top
const CAMERA_Z    = 3.5            // decrease = zoom in, increase = zoom out
const FLOOR_Y     = 0              // raise if she floats, lower if she sinks

export default function KleeCanvas({ className = '' }) {
  const mountRef  = useRef(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth  || 480
    const H = mount.clientHeight || 540

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    // ── Scene ──
    const scene = new THREE.Scene()

    // ── Camera ──
    const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 100)
    cam.position.set(0, CAMERA_Y, CAMERA_Z)
    cam.lookAt(0, CAMERA_Y * 0.55, 0)

    // ── Lights ──
    // Warm ambient
    scene.add(new THREE.AmbientLight(0xfff0e0, 0.7))

    // Key light (warm white, casts shadow)
    const key = new THREE.DirectionalLight(0xfff5e6, 1.4)
    key.position.set(3, 6, 4)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far  = 20
    key.shadow.camera.left = key.shadow.camera.bottom = -3
    key.shadow.camera.right = key.shadow.camera.top   =  3
    scene.add(key)

    // Fill light (cool purple — Mondstadt vibe)
    const fill = new THREE.DirectionalLight(0xc084fc, 0.4)
    fill.position.set(-3, 2, -2)
    scene.add(fill)

    // Rim light (golden from behind)
    const rim = new THREE.DirectionalLight(0xfbbf24, 0.45)
    rim.position.set(0, 4, -5)
    scene.add(rim)

    // Hemisphere (sky/ground bounce)
    scene.add(new THREE.HemisphereLight(0xfef3c7, 0x7c3aed, 0.25))

    // ── Ground shadow catcher ──
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2, 48),
      new THREE.ShadowMaterial({ opacity: 0.2 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = FLOOR_Y
    ground.receiveShadow = true
    scene.add(ground)

    // Soft glow ring under Klee (pyro red)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444, transparent: true, opacity: 0.14, side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 1.1, 48), ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = FLOOR_Y + 0.01
    scene.add(ring)

    // Rune hexagon
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xef4444, transparent: true, opacity: 0.1, side: THREE.DoubleSide
    })
    const rune = new THREE.Mesh(new THREE.CircleGeometry(0.65, 6), runeMat)
    rune.rotation.x = -Math.PI / 2
    rune.position.y = FLOOR_Y + 0.011
    scene.add(rune)

    // ── Fire spark particles ──
    const sparkCount = 45
    const spkGeo  = new THREE.BufferGeometry()
    const spkPos  = new Float32Array(sparkCount * 3)
    const spkCol  = new Float32Array(sparkCount * 3)
    const spkData = []
    const fireColors = [
      [1, 0.28, 0.04],
      [1, 0.58, 0.08],
      [1, 0.82, 0.18],
      [1, 0.14, 0.0],
    ]
    for (let i = 0; i < sparkCount; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 0.35 + Math.random() * 1.4
      spkPos[i * 3]     = Math.cos(a) * r
      spkPos[i * 3 + 1] = FLOOR_Y + Math.random() * 2.8
      spkPos[i * 3 + 2] = Math.sin(a) * r * 0.55
      spkData.push({
        baseY:  spkPos[i * 3 + 1],
        phase:  Math.random() * Math.PI * 2,
        speed:  0.5 + Math.random() * 1.5,
        angle:  a,
        rad:    r,
      })
      const c = fireColors[i % 4]
      spkCol[i * 3] = c[0]; spkCol[i * 3 + 1] = c[1]; spkCol[i * 3 + 2] = c[2]
    }
    spkGeo.setAttribute('position', new THREE.BufferAttribute(spkPos, 3))
    spkGeo.setAttribute('color',    new THREE.BufferAttribute(spkCol, 3))
    const sparks = new THREE.Points(spkGeo, new THREE.PointsMaterial({
      size: 0.05, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true,
    }))
    scene.add(sparks)

    // ── Load klee.glb ──
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    let model = null
    let mixer = null

    loader.load(
      MODEL_PATH,
      (gltf) => {
        model = gltf.scene

        // Auto-fit: center + scale to MODEL_SCALE height
        const box    = new THREE.Box3().setFromObject(model)
        const size   = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale  = MODEL_SCALE / maxDim

        model.scale.setScalar(scale)
        // Center horizontally, sit on floor
        model.position.x = -center.x * scale
        model.position.y = FLOOR_Y - box.min.y * scale
        model.position.z = -center.z * scale

        // Shadows + material quality on all meshes
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow    = true
            child.receiveShadow = true
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(m => { m.envMapIntensity = 0.5 })
              } else {
                child.material.envMapIntensity = 0.5
              }
            }
          }
        })

        scene.add(model)

        // Play idle / first animation if available
        if (gltf.animations?.length > 0) {
          mixer = new THREE.AnimationMixer(model)
          const clip =
            gltf.animations.find(a =>
              /idle|wait|stand|breath/i.test(a.name)
            ) || gltf.animations[0]
          mixer.clipAction(clip).play()
        }

        setStatus('ready')
      },
      (xhr) => {
        if (xhr.total > 0) setProgress(Math.round(xhr.loaded / xhr.total * 100))
      },
      (err) => {
        console.error('KleeCanvas: failed to load model', err)
        setStatus('error')
      }
    )

    // ── Mouse tracking ──
    let mx = 0, my = 0, tRx = 0, tRy = 0
    const onMove = (e) => {
      const r = mount.getBoundingClientRect()
      mx = ((e.clientX - r.left) / r.width  - 0.5) * 2
      my = ((e.clientY - r.top)  / r.height - 0.5) * 2
    }
    const onLeave = () => { mx = 0; my = 0 }
    mount.addEventListener('mousemove',  onMove)
    mount.addEventListener('mouseleave', onLeave)

    // ── Animation loop ──
    let t = 0, rafId
    const clock = new THREE.Clock()

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      t += delta

      if (mixer) mixer.update(delta)

      if (model) {
        // Smooth mouse look
        tRy += (mx * 0.5  - tRy) * 0.05
        tRx += (-my * 0.15 - tRx) * 0.05
        model.rotation.y = tRy
        model.rotation.x = tRx

        // Gentle idle float
        model.position.y = (FLOOR_Y - model.userData._baseY || 0) + Math.sin(t * 1.0) * 0.05
        if (!model.userData._baseY) model.userData._baseY = model.position.y
      }

      // Spark orbit
      const sp = sparks.geometry.attributes.position
      for (let i = 0; i < sparkCount; i++) {
        const d = spkData[i]
        sp.setX(i, Math.cos(d.angle + t * 0.2)  * d.rad)
        sp.setY(i, d.baseY + Math.sin(t * d.speed + d.phase) * 0.22)
        sp.setZ(i, Math.sin(d.angle + t * 0.2) * d.rad * 0.5)
      }
      sp.needsUpdate = true

      // Ring + rune pulse
      ringMat.opacity = 0.08  + Math.sin(t * 1.5) * 0.05
      runeMat.opacity = 0.07  + Math.sin(t * 1.5) * 0.04
      ring.scale.setScalar(1  + Math.sin(t * 1.5) * 0.03)
      rune.rotation.z = t * 0.3

      renderer.render(scene, cam)
    }
    animate()

    // ── Resize ──
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      cam.aspect = w / h
      cam.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      mount.removeEventListener('mousemove', onMove)
      mount.removeEventListener('mouseleave', onLeave)
      renderer.dispose()
      dracoLoader.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className={`relative w-full h-[500px] lg:h-[560px] ${className}`} style={{ touchAction: 'none', cursor: 'grab' }}>

      {/* Three.js renders here */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-Ovo">
            {progress > 0 ? `Loading Klee... ${progress}%` : 'Loading Klee...'}
          </p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <p className="text-sm text-red-400 font-Ovo">
            Could not load klee.glb
          </p>
          <p className="text-xs text-gray-500 font-Ovo">
            Make sure the file is in /public/klee.glb
          </p>
        </div>
      )}
    </div>
  )
}
