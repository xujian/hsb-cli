const
  fs = require('fs'),
  fse = require('fs-extra'),
  { green } = require('chalk')

const
  appPaths = require('./app-paths')

module.exports = function legacyValidations (cfg) {
  let file, content, error = false

  file = appPaths.resolve.app(cfg.sourceFiles.indexHtmlTemplate)
  if (!fs.existsSync(file)) {
    console.log('⚠️  Missing /src/index.template.html file...')
    console.log()
    error = true
  }
  content = fs.readFileSync(file, 'utf-8')
  if (content.indexOf('<base href') > -1) {
    console.log(`⚠️  Your newer Quasar CLI requires a minor change to /src/index.template.html
   Please remove this tag completely:
  <base href="<%= htmlWebpackPlugin.options.appBase %>">
  `)
    console.log()
    error = true
  }

  if (content.indexOf(`chunk.initial ? 'preload' : 'prefetch'`) > -1) {
    console.log(`\n⚠️  Your newer Quasar CLI requires a minor change to /src/index.template.html
   Please remove this section completely:

  <!--
    The following is optional if you DON'T build for PWA.
    Preloads/prefetches chunks/assets.
  -->
  <% if (!['cordova', 'electron'].includes(htmlWebpackPlugin.options.ctx.modeName) && htmlWebpackPlugin.options.ctx.prod) {
      for (var chunk of webpack.chunks) {
        for (var file of chunk.files) {
          if (file.match(/\.(js|css)$/)) { %>
    <link rel="<%= chunk.initial ? 'preload' : 'prefetch' %>" href="<%= file %>" as="<%= file.match(/\.css$/)? 'style' : 'script' %>">
  <% }}}} %>
  `)
    console.log()
    error = true
  }

  if (content.indexOf('<link rel="manifest"') > -1) {
    console.log(`\n⚠️  Your newer Quasar CLI requires a minor change to /src/index.template.html
   Please remove this section completely:

   <% if (htmlWebpackPlugin.options.ctx.mode.pwa) { %>
    <!-- Add to home screen for Android and modern mobile browsers -->
    .....
   <% } %>
  `)
    console.log()
    error = true
  }

  if (content.indexOf('htmlWebpackPlugin.options.headScripts') > -1) {
    console.log(`\n⚠️  Your newer Quasar CLI requires a minor change to /src/index.template.html
   Please remove this section completely:

   <%= htmlWebpackPlugin.options.headScripts %>
  `)
    console.log()
    error = true
  }

  if (content.indexOf('htmlWebpackPlugin.options.bodyScripts') > -1) {
    console.log(`\n⚠️  Your newer Quasar CLI requires a minor change to /src/index.template.html
   Please remove this section completely:

   <%= htmlWebpackPlugin.options.bodyScripts %>
  `)
    console.log()
    error = true
  }

  file = appPaths.resolve.app(cfg.sourceFiles.rootComponent)
  content = fs.readFileSync(file, 'utf-8')
  if (content.indexOf('id="q-app"') === -1) {
    console.log(`\n⚠️  Your newer Quasar CLI requires a minor change to the root component:
   ${file}

  Please add: id="q-app"
  to the outermost HTML element of the template.

${green('Example:')}
  <template>
    <div id="q-app">
      ...
    </div>
  </template>
`)
    error = true
  }

  if (error) {
    process.exit(1)
  }

  file = appPaths.resolve.app(cfg.sourceFiles.router)
  content = fs.readFileSync(file, 'utf-8')
  if (cfg.ctx.mode.ssr && content.indexOf('export default function') === -1) {
    console.log(`\n⚠️  In order to build with SSR mode you need a minor change to the ROUTER file
   This won't break other build modes after you change it.

   ${file}

 You need to have a default export set to "function ({ store })" which returns a new
 instance of Router instead of default exporting the Router instance itself.

${green('OLD WAY:')}
  import Vue from 'vue'
  import VueRouter from 'vue-router'
  import routes from './routes'
  Vue.use(VueRouter)

  // in the new way, we'll wrap the instantiation into:
  // export default function ({ store }) --> store is optional
  const Router = new VueRouter({
    scrollBehavior: () => ({ y: 0 }),
    routes,
    // Leave these as they are and change from quasar.conf.js instead!
    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE,
  })

  // in the new way, this will be no more
  export default Router

${green('NEW WAY:')}
  import Vue from 'vue'
  import VueRouter from 'vue-router'
  import routes from './routes'
  Vue.use(VueRouter)

  // DO NOT import the store here as you will receive it as
  // parameter in the default exported function:

  export default function (/* { store } */) {
    // IMPORTANT! Instantiate Router inside this function

    const Router = new VueRouter({
      scrollBehavior: () => ({ y: 0 }),
      routes,
      // Leave these as they are and change from quasar.conf.js instead!
      mode: process.env.VUE_ROUTER_MODE,
      base: process.env.VUE_ROUTER_BASE,
    })

    return Router
  }
  `)
    console.log()
    process.exit(1)
  }

  if (cfg.store && cfg.ctx.mode.ssr) {
    file = appPaths.resolve.app(cfg.sourceFiles.store)
    content = fs.readFileSync(file, 'utf-8')
    if (content.indexOf('export default function') === -1) {
      console.log(`\n⚠️  In order to build with SSR mode you need a minor change to the STORE file
   This won't break other build modes after you change it.

   ${file}

  You need to have a default export set to "function ()" which returns a new
  instance of Vuex Store instead of default exporting the Store instance itself.

${green('OLD WAY:')}
  import Vue from 'vue'
  import Vuex from 'vuex'
  import example from './module-example'
  Vue.use(Vuex)

  // in the new way, we'll wrap the instantiation into:
  // export default function ()
  const store = new Vuex.Store({
    modules: {
      example
    }
  })

  // in the new way, this will be no more
  export default store

${green('NEW WAY:')}
  import Vue from 'vue'
  import Vuex from 'vuex'
  import example from './module-example'
  Vue.use(Vuex)

  export default function () {
    // IMPORTANT! Instantiate Store inside this function

    const Store = new Vuex.Store({
      modules: {
        example
      }
    })

    return Store
  }
  `)
      console.log()
      process.exit(1)
    }
  }

  file = appPaths.resolve.app('.babelrc')
  if (!fs.existsSync(file)) {
    console.log('⚠️  Missing .babelrc file...')
    console.log()
    process.exit(1)
  }
  content = fs.readFileSync(file, 'utf-8')
  if (content.indexOf('"transform-runtime"') > -1) {
    console.log()
    console.log(' ⚠️  WARNING')
    console.log(` Your newer Quasar CLI requires a change to .babelrc file.`)
    console.log(` Doing it automatically. Please review the changes.`)
    console.log()

    fse.copySync(
      appPaths.resolve.cli('templates/app/babelrc'),
      appPaths.resolve.app('.babelrc')
    )
  }
}
