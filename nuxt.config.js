const jwt = require('jsonwebtoken');
const querystring = require("querystring");

export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'chocospread',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: ['@nuxtjs/markdownit'],
  markdownit: {
    runtime: true // Support `$md()`
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  },
  
  privateRuntimeConfig: {
    wikiTitle: process.env.WIKI_TITLE,
    frontPage: process.env.FRONT_PAGE,
    wikiUrl: process.env.WIKI_URL,
    privateKeyId: process.env.PRIVATE_KEY_ID,
    privateKey: process.env.PRIVATE_KEY,
    clientEmail: process.env.CLIENT_EMAIL,
    clientId: process.env.CLIENT_ID,
    sheetId: process.env.SPREADSHEET,
  },

  generate: {
    async routes(callback) {
      var secretKey = process.env.PRIVATE_KEY.replace(/\\n/gm, '\n')

      const token = jwt.sign(
          { "iss": process.env.CLIENT_EMAIL, "scope": "https://www.googleapis.com/auth/spreadsheets", "aud": "https://oauth2.googleapis.com/token" },
          secretKey,
          { algorithm: 'RS256', expiresIn: "1h", keyid: process.env.PRIVATE_KEY_ID }
      );

      const googleAuthUrl = 'https://oauth2.googleapis.com/token'
      const googleAuthParam = {
              method: 'POST',
              headers: {
                  'content-type': "application/x-www-form-urlencoded",
              },
              body: querystring.stringify({
                  grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                  assertion: token
              })
          }

      var authData = await fetch(googleAuthUrl, googleAuthParam)
      var authRes = await authData.json()

      const googleSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET}/`
      const googleSheetParam = {
          method: 'GET',
          headers: {
              "content-type": "application/json",
              Authorization: "Bearer " + authRes.access_token,
          },
      }
      var sheetData3 = await fetch(googleSheetUrl, googleSheetParam)
      var sheetRes3 = await sheetData3.json()
      var wikiListArray = sheetRes3.sheets
      var wikiList = []
      for (let i=0; i<wikiListArray.length; i++) {
          wikiList.push('/'+encodeURIComponent(wikiListArray[i].properties.title))
      }

      const routes = wikiList
      callback(null, routes)
    }
  }
}
