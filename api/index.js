const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const write = require('write')
const path = require('path')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const fs = require('fs')
const jimp = require('jimp')

const app = express()

router.use(fileUpload({ createParentPath: false }))
router.use(cors())

router.use(bodyParser.json())
router.use((req, res, next) => {
  Object.setPrototypeOf(req, app.request)
  Object.setPrototypeOf(res, app.response)
  req.res = res
  res.req = req
  next()
})

router.post('/write-file', async (req, res) => {

  let imgData = []
  const metadata = JSON.parse(req.body.metadata)
  const defImage = 'default.jpg'

  if (req.files) {

    let files = []
    let featImgName = false

    if (req.files.images.length) {
      files = req.files.images
    } else {
      files.push(req.files.images)
    }

    for (let image of files) {
      const featImg = path.normalize(`assets/images/featured/${image.name}`)
      const contImg = path.normalize(`assets/images/content/${image.name}`)

      if (image.name == metadata.image) {
        await image.mv(featImg)
        await multiResizeImage(featImg)
        featImgName = image.name

      } else {
        await image.mv(contImg)
        await multiResizeImage(contImg)
      }

      imgData.push({
        name: image.name,
        mimetype: image.mimetype,
        size: image.size
      })
    } // forEach

    if (req.body.isNewPost == 'false' && featImgName) {
      if (req.body.image != featImgName && req.body.image != defImage) {
        const featDir = 'assets/images/featured'
        const featImgOld = path.normalize(`${featDir}/${req.body.image}`)
        const small = appendImgSize(featImgOld, '_small')
        const thumb = appendImgSize(featImgOld, '_thumb')
        await fs.unlink(featImgOld, err => console.log(err))
        await fs.unlink(small, err => console.log(err))
        await fs.unlink(thumb, err => console.log(err))
      }
    }

  } // req.files

  let filename = `content/${req.body.language}/blog/${metadata.slug}.md`
    filename = path.normalize(filename)

  let message = ""

  if (req.body.language == 'en') {
    message = 'Recorded!'
  } else if (req.body.language == 'ru') {
    message = 'Записано!'
  }

  write(filename, req.body.mdeValue).then(() => {
    res.send({
      status: true,
      message: message,
      filename: filename,
      imgData: imgData
    })
  })

}) // router.post

module.exports = {
  path: '/api',
  handler: router
}

const multiResizeImage = async (filename) => {
  const image = await jimp.read(filename)

  await image.resize(1024, jimp.AUTO)
  await image.writeAsync(filename)

  await image.resize(600, jimp.AUTO)
  const small = appendImgSize(filename, '_small')
  await image.writeAsync(small)

  await image.resize(320, jimp.AUTO)
  const thumb = appendImgSize(filename, '_thumb')
  await image.writeAsync(thumb)
}

const appendImgSize = (filename, append="") => {
  return filename.replace(/(\.[\w\d?=_-]+)$/i, `${append}$1`)
}
