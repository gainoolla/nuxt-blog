<template>
  <client-only>
    <div class="post-edit">
      <h1 class="text-center mt-0">
        {{ $t('edit') }}
      </h1>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <form
        class="editForm"
        enctype="multipart/form-data"
        style="font-size:1.1em; line-height:1.7em; font-family:'Nunito', sans-serif; font-weight:400 !important;"
        @submit.prevent="onSubmit"
      >
        <div class="field w-100">
          <label>{{ $t('images') }}</label>
          <span class="dropper">
            <input
              type="file"
              multiple
              accept="image/*"
              @change="onFileSelect($event.target.files)"
            >
            <span class="icon icon__hashtag" />
            <span class="image">{{ textImages }}</span>
          </span>
        </div>
        <div class="field w-100">
          <label>{{ $t('content') }}</label>
          <vue-simplemde ref="contentEditor" v-model="simpleMde" class="content-editor" />
        </div>
        <button type="button" @click="onSubmit">
          {{ $t('save') }}
        </button>
      </form>
    </div>
  </client-only>
</template>

<script>
import axios from 'axios'
import parseMD from 'parse-md'
import YAML from 'yaml'

export default {
  props: {
    data: {
      type: Object,
      default: () => ({
        article: null,
        content: 'Article...'
      })
    }
  },

  data () {
    return {
      simpleMde: null,
      files: null,
      isNewPost: true,
      textImages: '',
      error: ''
    }
  },

  mounted () {
    this.init()
  },

  methods: {

    frontmatter () {
      let metadata

      if (this.isNewPost) {
        metadata = {
          title: 'Title',
          description: 'Description',
          image: 'default.jpg',
          published: 'yy-mm-dd',
          alt: 'Image',
          slug: 'post-slug',
          localesData: [
            { locale: 'en', slug: 'post-slug', tags: 'no tag' },
            { locale: 'ru', slug: 'слаг-поста', tags: 'no tag' }
          ]
        }
      } else {
        metadata = {
          title: this.data.article.title,
          description: this.data.article.description,
          image: this.data.article.image,
          alt: this.data.article.alt,
          published: this.data.article.published,
          slug: this.data.article.slug,
          localesData: this.data.article.localesData
        }
      }

      return '---\n' + YAML.stringify(metadata) + '---\n'
    },

    init () {
      this.isNewPost = (this.data.article === null)
      this.simpleMde = this.frontmatter() + this.data.content
    },

    onFileSelect (files) {
      this.files = files
      const imagesArr = Array.from(files).map(image => image.name)
      this.textImages = imagesArr.join(', ')
    },

    onSubmit () {
      let data = {}

      try {
        data = parseMD(this.simpleMde)
      } catch (e) {
        this.error = this.$t('mdParseErr')
        alert(this.error)
        return
      }

      this.error = ''

      data.metadata.slug = this.$cyrtt(data.metadata.slug)
      data.metadata.localesData.forEach((lang, i) => {
        if (lang.locale === 'ru') {
          data.metadata.localesData[i].slug = this.$cyrtt(lang.slug)
        }
      })

      const formData = new FormData()
      formData.append('isNewPost', this.isNewPost)
      formData.append('metadata', JSON.stringify(data.metadata))
      formData.append('mdeValue', this.simpleMde)
      formData.append('language', this.$i18n.locale)

      if (this.files) {
        Array.from(this.files).forEach((file) => {
          formData.append('images', file)
          if (!this.isNewPost) {
            formData.append('image', this.data.article.image)
          }
        })
      }

      this.submit(formData)
    },

    submit (data) {
      // debug: console.log('FORM VALUES', data.values())

      axios.post('http://localhost:3000/api/handle-form', data)
        .then((res) => {
          if (res.data.message === 'success') {
            alert(this.$i18n.t('mdFileSuccess'))
            // debug: console.log('IMG DATA', res.data.imgData)
          }
        })
    }

  } // methods
}
</script>

<style lang="scss" scoped>

.post-edit {
  background-color: white;
  margin-left: -1rem;
  margin-right: -1rem;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

p.error {
  display: inline-block;
  padding: 1.2rem 1.6rem;
  color: #d44343;
  background-color: #EEE;
  border-radius: .4rem;
}

.editForm {
  display: flex;
  flex-flow: row wrap;

  .field {
    margin-top: .2rem;
    margin-bottom: .7rem;

    label {
      display: block;
      font-weight: bold;
      letter-spacing: .02em;
      margin-bottom: .2rem;
      &::first-letter {
        text-transform: capitalize;
      }
    }

    &.w-50 {
      width: 50%;
      min-width: 21rem;
    }

    &.w-50:nth-child(2n + 1) {
      width: calc(50% - .7rem);
      margin-right: .7rem;
    }

    &.w-100 {
      width: 100%;
      min-width: 21rem;
    }

    textarea {
      width: 100%;
      padding: 1rem;
      &.content-editor {
        height: 10vh;
      }
    }

    input {
      width: 100%;
      padding: .3rem 0;
      border: 1px solid #DDD;
      border-radius: .2rem;
    }

    .image {
      display: inline-block;
      margin-bottom: .5rem;
    }

    .dropper {
      position: relative;
      width: 100%;
      display: inline-block;
      height: 2.4rem;
      border: 1px solid #DDD;
      border-radius: .2rem;
      display: flex;
      justify-content: flex-start;
      align-items: center;

      input {
        position: absolute;
        width: 46px;
        height: 2.4rem;
        opacity: 0;
      }

      span {
        margin: 0 .3rem;
      }
    }
  }

  button {
    display: block;
    letter-spacing: .1em;
    padding: .5rem .8rem;
    background-color: hsla(147, 59%, 40%, 0.801);
    border: 0;
    color: white;
    text-transform: uppercase;
    float: right;
    cursor: pointer;
    outline: none;
  }
}

</style>
