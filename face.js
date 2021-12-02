const workerpool = require('workerpool')
const canvas = require('canvas')
const UTIF = require('utif')
const fs = require('fs')
require('@tensorflow/tfjs')
require('@tensorflow/tfjs-backend-wasm')
const faceapi = require('@vladmandic/face-api')
const faceoptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 })
faceapi.env.monkeyPatch({ Canvas: canvas.Canvas, Image: canvas.Image, ImageData: canvas.ImageData })
const loadpromise = (async () => {
  await faceapi.tf.setBackend('wasm')
  await faceapi.tf.enableProdMode()
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + '/node_modules/@vladmandic/face-api/model')
  await faceapi.tf.ready()
})()

function faceSize (face) {
  return face._box._width * face._box._height
}

function betterFace (face1, face2) {
  if (!face1) return face2
  if (!face2) return face1
  if (face1._score - face2._score > 0.07) return face1
  if (face2._score - face1._score > 0.07) return face2
  if (faceSize(face1) > faceSize(face2)) return face1
  return face2
}

async function main (filepath, exifdata) {
  let cvs, img
  try {
    img = await canvas.loadImage(filepath)
    if (exifdata && [3,6,8].includes(exifdata.image.Orientation)) {
      console.log(`exif orientation ${exifdata.image.Orientation} for ${filepath}`)
      cvs = canvas.createCanvas(img.width, img.height)
      const ctx = cvs.getContext('2d')
      switch (exifdata.image.Orientation) {
        case 3:
          ctx.translate(img.width, img.height)
          ctx.rotate(Math.PI)
          break
        case 6:
          cvs.width = img.height
          cvs.height = img.width
          ctx.rotate(0.5 * Math.PI)
          ctx.translate(0, -img.height)
          break
        case 8:
          cvs.width = img.height
          cvs.height = img.width
          ctx.translate(0, img.width)
          ctx.rotate(1.5 * Math.PI)
          break
      }
      ctx.drawImage(img, 0, 0)
    }
  } catch (e) {
    const imgBuffer = fs.readFileSync(filepath)
    const [ifd] = UTIF.decode(imgBuffer)
    UTIF.decodeImage(imgBuffer, ifd)
    if (ifd.width && ifd.height) {
      const clamped = new Uint8ClampedArray(UTIF.toRGBA8(ifd).buffer)
      const imgData = new canvas.ImageData(clamped, ifd.width, ifd.height)
      cvs = canvas.createCanvas(ifd.width, ifd.height)
      const ctx = cvs.getContext('2d')
      ctx.putImageData(imgData, 0, 0)
    }
  }
  await loadpromise
  const faces = await faceapi.detectAllFaces(cvs || img, faceoptions)
  const imgarea = (cvs || img).width * (cvs || img).height
  const validfaces = faces.filter(f => (faceSize(f)/imgarea > 0.015 && f._score > 0.75) || faceSize(f)/imgarea > 0.05)

  let saveface
  for (face of validfaces) {
    saveface = betterFace(saveface, face)
  }

  if (!saveface) return {}
  return { x: saveface._box._x, y: saveface._box.y, width: saveface._box._width, height: saveface._box._height, imgW: (cvs || img).width, imgH: (cvs || img).height }
}

workerpool.worker({
  face: main
})
