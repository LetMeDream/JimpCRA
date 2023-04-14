import './App.css'
import { useState, useEffect } from 'react'
/* Imgs for brightness */
import dark from './img/dark_1.jpg'
import light from './img/bright.png'
/* Imgs for saturation */
import saturated from './img/saturated.jpg'
import optimalSaturation from './img/optimal_saturation.png'
import desaturated from './img/desaturated.jpg'
/* Imgs for constrast */
import lowContrast from './img/lowcontrast_1.png'
import highContrast from './img/highcontrast.png'

// For some reason, Jimp attaches to self, even in Node.
// https://github.com/jimp-dev/jimp/issues/466
import * as _Jimp from 'jimp'
// @ts-ignore
const Jimp = (typeof window.self !== 'undefined') ? (window.self.Jimp || _Jimp) : _Jimp

/* Scan brightness */
const scanBrightness = (jimpImg) => {
  let brightnessSum = 0
  let transparentPixel = 0
  jimpImg.scan(0, 0, jimpImg.bitmap.width, jimpImg.bitmap.height, (x, y, idx) => {
    const pixelColor = jimpImg.getPixelColor(x, y)
    if (pixelColor === 0) {
      /* Just not to take into consideration 'transparent' px */
      transparentPixel++
      return
    }
    const { r, g, b } = Jimp.intToRGBA(pixelColor)
    /* console.log(r, g, b) */
    const brightness = (r + g + b) / 3
    brightnessSum += brightness
  })
  const avgBrightness = brightnessSum / ((jimpImg.bitmap.width * jimpImg.bitmap.height) - transparentPixel) / 255
  return avgBrightness
}
/* Scan saturation */
const scanSaturation = (jimpImg) => {
  let saturationSum = 0
  let transparentPixel = 0
  jimpImg.scan(0, 0, jimpImg.bitmap.width, jimpImg.bitmap.height, (x, y, idx) => {
    const pixelColor = jimpImg.getPixelColor(x, y)
    if (pixelColor === 0) {
      /* Just not to take into consideration 'transparent' px */
      transparentPixel++
      return
    }
    const { r, g, b } = Jimp.intToRGBA(pixelColor)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let saturation = 0
    if (max !== 0) {
      saturation = (max - min) / max
    }
    saturationSum += saturation
  })
  const avgSaturation =
    saturationSum / ((jimpImg.bitmap.width * jimpImg.bitmap.height) - transparentPixel)
  return avgSaturation
}
/* Custom contrast calculation */
const getContrast = (jimpImg) => {
  const numPixels = jimpImg.bitmap.width * jimpImg.bitmap.height
  let brightnessSum = 0
  let contrastSum = 0

  // calculate the brightness sum of all pixels
  jimpImg.scan(0, 0, jimpImg.bitmap.width, jimpImg.bitmap.height, (x, y, idx) => {
    const r = jimpImg.bitmap.data[idx + 0]
    const g = jimpImg.bitmap.data[idx + 1]
    const b = jimpImg.bitmap.data[idx + 2]
    const brightness = (r + g + b) / 3
    brightnessSum += brightness
  })

  // calculate the average brightness
  const avgBrightness = brightnessSum / numPixels

  // calculate the contrast sum of all pixels
  jimpImg.scan(0, 0, jimpImg.bitmap.width, jimpImg.bitmap.height, (x, y, idx) => {
    const r = jimpImg.bitmap.data[idx + 0]
    const g = jimpImg.bitmap.data[idx + 1]
    const b = jimpImg.bitmap.data[idx + 2]
    const brightness = (r + g + b) / 3
    contrastSum += Math.pow(brightness - avgBrightness, 2)
  })

  // calculate the standard deviation of the pixel brightness values
  const contrast = Math.sqrt(contrastSum / numPixels)
  return contrast / 100
}

function App () {
  const [image, setImage] = useState(null)
  const [imgProperties, setImgProperties] = useState({})

  useEffect(() => {
    setImgProperties({})
  }, [image])

  const handleChange = (e) => {
    if (!e.target.files[0]) return
    const file = e.target.files[0]
    const imgFile = URL.createObjectURL(file)
    setImage(imgFile)
  }

  const handleAnalize = async () => {
    if (!image) return

    const jimpImage = await Jimp.read(image)
    // Property calculations
    const avgBrightness = scanBrightness(jimpImage)
    setImgProperties((prev) => {
      return {
        ...prev,
        brightness: avgBrightness.toFixed(3)
      }
    })
    const avgSaturation = scanSaturation(jimpImage)
    setImgProperties((prev) => {
      return {
        ...prev,
        saturation: avgSaturation.toFixed(3)
      }
    })
    const approximatedContrast = getContrast(jimpImage)
    setImgProperties((prev) => {
      return {
        ...prev,
        contrast: approximatedContrast.toFixed(3)
      }
    })
  }

  const handleSelectImg = (e) => {
    setImage(e.target.src)
  }

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-2 px-16 py-2'>
      <h1>Jimp Test</h1>
      <p>Pick any img and test it:</p>
      <div className='flex flex-col md:flex-row gap-2'>
        <div className='brightness flex flex-col items-center p-2 border rounded-md'>
          Testing <strong>brightness</strong>
          <div className='flex gap-2'>
            <img
              src={dark} alt='dark' className='w-24 cursor-pointer hover:scale-105 transition-all duration-500 rounded-sm hover:rounded-md'
              onClick={handleSelectImg}
            />
            <img
              src={light} alt='light' className='w-24 cursor-pointer hover:scale-105 transition-all duration-500 rounded-sm hover:rounded-md'
              onClick={handleSelectImg}
            />
          </div>
        </div>
        <div className='saturation flex flex-col items-center p-2 border rounded-md'>
          Testing <strong>Saturation</strong>
          <div className='flex gap-2'>
            <img
              src={saturated} alt='saturated' className='w-24 cursor-pointer hover:scale-105 transition-all duration-500 rounded-sm hover:rounded-md'
              onClick={handleSelectImg}
            />
            <img
              src={optimalSaturation} alt='optimal' className='w-24 hidden md:block cursor-pointer hover:scale-105 transition-all duration-500 rounded-sm hover:rounded-md'
              onClick={handleSelectImg}
            />
            <img
              src={desaturated} alt='desaturated' className='w-24 cursor-pointer hover:scale-105 transition-all duration-500 rounded-sm hover:rounded-md'
              onClick={handleSelectImg}
            />
          </div>
        </div>
        <div className='contrast flex flex-col items-center p-2 border rounded-md'>
          Testing <strong>contrast</strong>
          <div className='flex gap-2'>
            <img
              src={lowContrast}
              alt='lowContrast'
              className='w-24 cursor-pointer hover:scale-105 transition-all duration-500 rounded-sm hover:rounded-md'
              onClick={handleSelectImg}
            />
            <img
              src={highContrast}
              alt='highContrast'
              className='w-24 cursor-pointer hover:scale-105 transition-all duration-500 rounded-sm hover:rounded-md'
              onClick={handleSelectImg}
            />
          </div>
        </div>

      </div>

      <img src={image} width='200' />
      <input className='w-min text-center' accept='image/jpeg,image/png,image/gif,image/bmp' onChange={handleChange} type='file' hidden id='upload-input' />
      Or upload your own:
      <label
        htmlFor='upload-input'
        className='transition-all duration-500 hover:shadow-md hover:bg-gray-400 hover:text-white cursor-pointer border border-gray-400 rounded-md px-4 py-2 caret-transparent'
      >
        Upload
      </label>
      <button
        className='transition-all duration-500 hover:shadow-md hover:bg-gray-400 hover:text-white cursor-pointer border border-gray-400 rounded-md px-4 py-2 caret-transparent'
        onClick={handleAnalize}
      >
        Analize
      </button>

      <div className='overflow-x-auto'>
        <table className='table w-full'>
          {/* head */}
          <thead>
            <tr>
              <th>Property</th>
              <th>Value [0-1]</th>
            </tr>
          </thead>
          <tbody>
            {/* row 1 */}
            <tr>
              <td>Brightness</td>
              <td>{imgProperties?.brightness}</td>
            </tr>
            {/* row 2 */}
            <tr>
              <td>Saturation</td>
              <td>{imgProperties?.saturation}</td>
            </tr>
            {/* row 3 */}
            <tr>
              <td>Contrast</td>
              <td>{imgProperties?.contrast}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </main>
  )
}

export default App
