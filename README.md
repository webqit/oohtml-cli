# OOHTML Command Line Interface

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/oohtml-cli" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/oohtml-cli.svg" alt="NPM version" /></a></span><span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/oohtml-cli" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/oohtml-cli.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

OOHTML Command Line is a small utility that automates certain aspects of your hand-authored OOHTML-based documents. You are able to go about coding in absolute free-form with a view to having everything automatically come to shape in one command.

> **Note**
> <br>This is documentation for `OOHTML-CLI@1.x` - for working with [`OOHTML@2.x`](https://github.com/webqit/oohtml/tree/next). (Looking for [`OOHTML-CLI@0.x`](https://github.com/webqit/oohtml-cli/tree/v0.3.4)?)

## Commands

+ [`oohtml bundle`](#command-oohtml-bundle)
+ [`oohtml config`](#command-oohtml-config)

## Installation

With [npm available on your terminal](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm), run the following command to install OOHTML CLI.

> System Requirements: Node.js 14.0 or later.

```js
npm i -g @webqit/oohtml-cli@next
```

> The `-g` flag above makes this installation global such that you can directly call `oohtml` from any directory. If you omit it, you may need to prefix each command in this documentation with `npx`; e.g. `npx oohtml bundle`.

## Command: `oohtml bundle`

The **`oohtml bundle`** command is used to automatically bundle static HTML files from the filesystem into *[HTML Module](http://github.com/webqit/oohtml#html-modules)* elements.

### Overview

Here, you are able to place your `.html` files in a directory, or a hierarchy of directories, and have them automatically come together into an HTML `<template>` element, or an equivalent hierarchy of HTML `<template>` elements - in the case of the latter.

Here's a sample layout of HTML files for an application.

```html
public
  ├── about
  │    └── main.html <main class="page-container">About Page</main>
  ├── home
  │    └── main.html <main class="page-container">Home Page</main>
  └── index.html <!DOCTYPE html>
```

The goal is to translate the above layout into the following *module* structure...

```html
<template def="pages">

    <template def="home">
       <main def="main.html" class="page-container">Home Page</main>
    </template>

    <template def="about">
       <main def="main.html" class="page-container">About Page</main>
    </template>

</template>
```

...such that each `<main>` element can be imported into the `index.html` document using the `<import>` element:

```html
<!--
public
 ├── index.html
-->
<!DOCTYPE html>
<html>
    <head>
        <title>FluffyPets</title>
        <template def="pages">

            <template def="home">
                <main def="main.html" class="page-container">Home Page</main>
            </template>

            <template def="about">
                <main def="main.html" class="page-container">About Page</main>
            </template>

        </template>
    </head>
    <body>
        <h1 data-id="headline"></h1>
        <import ref="/pages/home#main.html"><import>
    </body>
</html>
```

The **`oohtml bundle`** command acheives just that! It scans the current directory for those files and, this time, writes them to a new file named `bundle.html`. The bundle contains just the following content:

```html
<!--
public
 ├── bundle.html
-->
<template def="home">
    <main def="main.html" class="page-container">Home Page</main>
</template>

<template def="about">
    <main def="main.html" class="page-container">About Page</main>
</template>
```

And the `index.html` document is able to link to the bundle as an external resource.

```html
<!--
public
 ├── index.html
-->
<!DOCTYPE html>
<html>
    <head>
        <title>FluffyPets</title>
        <template def="pages" src="/bundle.html"></template>
    </head>
    <body>
        <h1 data-id="headline"></h1>
        <import ref="/pages/home#main.html"><import>
    </body>
</html>
```

> You can find a working example of [a typical module structure](https://github.com/webqit/oohtml#put-together) right at OOHTML's documentation.

That said, much of this can be customized using *flags* and other options.

### Flags

#### `--recursive`

This flag gets the bundler to restart a new bundling process for nested directories that have their own `index.html` file. The default behaviour is to see them as *subroots* and ignore them.

```html
public
  ├── about
  │    └── main.html <main class="page-container">About Page</main>
  ├── home
  │    └── main.html <main class="page-container">Home Page</main>
  ├── subroot <!-- This would be ignored by default because it has an index.html file -->
  │    ├── home
  │    │    └── main.html <main class="page-container">Home Page</main>
  │    └── index.html <!DOCTYPE html>
  └── index.html <!DOCTYPE html>
```

With the `--recursiv` flag, the bundler will now recursively bundle the `subroot` directory above. The *subroot* recieves its own `bundle.html` for its contents, and will be omitted from its parent bundle. This gives us the following final structure:

```html
public
  ├── about
  │    └── main.html <main class="page-container">About Page</main>
  ├── home
  │    └── main.html <main class="page-container">Home Page</main>
  ├── subroot
  │    ├── home
  │    │    └── main.html <main class="page-container">Home Page</main>
  │    ├── bundle.html <template def="home">...</template>
  │    └── index.html <!DOCTYPE html>
  ├── bundle.html <template def="about">...</template> <template def="home">...</template>
  └── index.html <!DOCTYPE html>
```

#### `--auto-embed=[value]`

This flag gets the bundler to automatically find the `index.html` document at its entry directory and embed the appropriate `<template def="[value]" src="/bundle.html"></template>` element on it.

> Replace `[value]` with and actual module name; e.g. `pages`.

### Other Options

This utility lets us keep additional configurations to a JSON file, to have a better command-line experience! It expects to locate this file at `./.webqit/oohtml-cli/bundler.json`, relative to its entry directory.

> The `./.webqit/oohtml-cli/bundler.json` file may be edited by hand or from a command line walkthrough using [`oohtml config bundler`](#command-oohtml-config).

```shell
public
  ├── .webqit/oohtml-cli/bundler.json
```

```json
{
    "entry_dir": "./",
    "output_dir": "./",
    "filename": "./bundle.html",
    "plugins": [],

    "module_inherits": "",
    "module_extends": "",
    "remote_module_loading": "eager",
    "remote_module_ssr": true,

    "public_base_url": "/",
    "max_data_url_size": 1024,
    "ignore_folders_by_prefix": ["."],
    "create_outline_file": false,

    "module_def_attr": "def",
    "fragment_def_attr": "def"
}
```

For advanced layout scenerios, a nested directory may have its own `.webqit/oohtml-cli/bundler.json` config, and the bundler will honour those configurations down that subtree.

```html
public
  ├── .webqit/oohtml-cli/bundler.json
  ├── about
  │    ├── deep <!-- New configurations take effect from here -->
  │    │    ├── .webqit/oohtml-cli/bundler.json
  │    │    └── main.html <main class="page-container">Deep Page</main>
  │    └── main.html <main class="page-container">About Page</main>
```

#### `[entry_dir]`

This specifies the entry point into the filesystem. The default value is `./`, relative to its host directory. (An absolute path may also be used.)

This is good for pointing the bundler to the actual *`views` (or equivalent)* folder when working from the actual project root.

```html
my-app
  ├── .webqit/oohtml-cli/bundler.json
  ├── views
  │    └── about
  │         └── main.html <main class="page-container">About Page</main>
```

#### `[output_dir]`

This specifies the output directory for the generated `bundle.html` file. The default value is `./`, relative to its host directory. (An absolute path may also be used.)

This is good for pointing the bundler to the actual *`public` (or equivalent)* folder when working from the actual project root.

```html
my-app
  ├── .webqit/oohtml-cli/bundler.json
  ├── views
  │    └── about
  │          └── main.html <main class="page-container">About Page</main>
  └── public
        └── index.html <!DOCTYPE html>
```

> Typical layouts have the `./public` (or equivalent) directory for both `[entry_dir]` and `[output_dir]`.

#### `[filename]`

This specifies the file name of the output bundle. The default value is `./bundle.html`, which is resolved relative to [`[output_dir]`](#output_dir).

Where the given `.webqit/oohtml-cli/bundler.json` config is for a nested directory, having a non-empty `filename` means that the sub directory is bundled to its own `./bundle.html` file and only *linked* to the parent bundle as an external resource.

```html
public
  ├── .webqit/oohtml-cli/bundler.json
  ├── about
  │    ├── deep <!-- New configurations take effect from here -->
  │    │    ├── .webqit/oohtml-cli/bundler.json
  │    │    └── main.html <main class="page-container">Deep Page</main>
  │    └── main.html <main class="page-container">About Page</main>
```

```html
<!--
public
 ├── bundle.html
-->
<template def="about">
    <template def="deep" src="/about/deep/bundle.html"></template>
    <main def="main.html" class="page-container">About Page</main>
</template>
```

> To add the OOHTML `loading="lazy"` attribute to linked modules, see [`[remote_module_loading]`](#remote_module_loading) below.

#### `[plugins]`

This specifies an optional list of plugins for the bundling operation. (See [Bundler Plugins](#bundler-plugins).) The default value is an empty array `[]`.

This is good for extending the capabilities of the bundler to custom-load or transform certain file formats that are not natively provided for.

> On the command line, skip this question where not apply. Or follow the prompt to interactively specify plugins, optionally along with their arguments or flags. Entries are asked recursively.

Each entry has the following structure:

+ **`[name]`** - The path to a function, or the name of an installed npm package, that is designed as an [OOHTML CLI Plugin](#bundler-plugins). (The bundler imports plugins using the ES6 `import()` syntax.)

  To refer to the bundler's [built-in plugins](#built-ins), like the markdown-to-HTML loader ([`md-loader`](#md-loader)), simply add the prefix `default:` to the plugin's bare name. E.g. `default:md-loader`.

+ **`[args]`** - Optional list of parameters (arguments/flags) for a plugin - each in name/value pair.

  > On the command line, skip this question where not apply. Or follow the prompt to interactively specify parameters.  Entries are asked recursively.

  Each entry has the following structure:

  + **`[name]`** - The name of the parameter as required by a plugin. E.g. `flavor` - in the default [`md-loader`](#md-loader).
  + **`[value]`** - The value of the parameter. E.g. `github` - for the `flavor` parameter above.

#### Advanced Options

#### `[public_base_url]`

This specifies the public path that maps to [`[output_dir]`](#output_dir) on the filesystem. The default value is `/`. The *`src` (or equivalent)* attribute of any automatically-embedded `<template>` element, plus every asset bundled, will be prefixed with this path.

#### `[max_data_url_size]`

This specifies at what file size an image, or other assets, should be bundled with inline *[data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)*. (See [Bundling Assets](#bundling-assets) below.) The default value is `1024`, in bytes. Assets smaller than this size will be bundled with inline *data URL*.

This is good for having small image files embed their own content instead of having them create additional HTTP requests on the page.

#### `[module_inherits]`

This specifies a space-separated list of *sibling* module IDs that this module inherits, which when set, creates an `inherits` attribute on the module.

```html
<template def="pages">

    <header def="header.html"></header>
    <footer def="footer.html"></footer>

    <template def="home" inherits="header.html footer.html">
        <main def="main.html"></main>
    </template>

    <template def="about" inherits="header.html footer.html">
        <main def="main.html"></main>
    </template>

</template>
```

*See [how the `inherits` attribute is treated](https://github.com/webqit/oohtml#inheriting-modules) in OOHTML.*

#### `[module_extends]`

This specifies a *sibling* module ID that this module extends, which when set, creates an `extends` attribute on the module.

```html
<template def="pages">

    <template def="common">
        <header def="header.html"></header>
        <footer def="footer.html"></footer>
    </template>

    <template def="home" extends="common">
        <main def="main.html"></main>
    </template>

    <template def="about" extends="common">
        <main def="main.html"></main>
    </template>

</template>
```

*See [how the `extends` attribute is treated](https://github.com/webqit/oohtml#extending-modules) in OOHTML.*

#### `[remote_module_loading]`

This controls the loading mode for remote-loading modules - `<template src="..."></template>`, which when set to `lazy` adds the `loading="lazy"` attribute. The default value is `eager`.

```html
<template src="/bundle.html" loading="lazy"></template>
```

> The OOHTML `loading="lazy"` attribute tells a remote-loading module to only load its contents on-demand - on the first attempt to access its contents. (See [how lazy-loading works](https://github.com/webqit/oohtml-ssr#lazy-loading) in OOGTML.)

#### `[remote_module_ssr]`

This controls the "SSR" (Server-Side Rendering) flag for remote-loading modules - `<template src="..."></template>`, which when set, adds the `ssr` boolean attribute. The default value is `false`.

```html
<template ssr src="/bundle.html"></template>
```

> The `ssr` attribute enables resource loading for a given element during Server-Side Rendering. (See [how subresources are treated](https://github.com/webqit/oohtml-ssr#subresource-loading) during Server-Side Rendering.)

#### `[ignore_folders_by_prefix]`

This specifies a comma-separated list of prefixes for certain types of folders to ignore. Folders with a name that begins with any of the listed prefixes are ingnored. The default value is an array of one prefix: `.`.

This is good for excluding certain system folders or *dot directories* like `.git`. *Dot directories* are automatically excluded by the default value.

```shell
my-app
  ├── .git
  ├── public
```

#### `[create_outline_file]`

This specifies whether or not to generate a JSON outline of the bundle. The generated file is named after [`[filename]`](#filename); e.g. `./bundle.html.json`. The default value is `false`.

```shell
public
  ├── bundle.html
  ├── bundle.html.json
```

This is good for programmatically traversing the bundle structure. Simply `JSON.parse()` the contents of `./bundle.html.json`.

#### OOHTML-Related Options

#### `[module_def_attr]`

This controls the "Module Def" attribute name `def` for the template element and should generally only be changed to align with custom settings in the [OOHTML meta tag](https://github.com/webqit/oohtml#the-polyfill) of the page where the bundle will be used.

#### `[fragment_def_attr]`

This controls the "Fragment Def" attribute name `def` for the template's fragments and should generally only be changed to align with custom settings in the [OOHTML meta tag](https://github.com/webqit/oohtml#the-polyfill) of the page where the bundle will be used.

### Bundling Assets

While HTML files are bundled by reading the file's contents into the bundle, assets, like images, are handled differently. These files are copied from their location in [`[entry_dir]`](#entry_dir) into [`[output_dir]`](#output_dir) when these happen to be two different locations on the filesystem. Copying them to [`[output_dir]`](#output_dir) makes them accessible to HTTP requests. An appropriate HTML element that points to an asset's *public* location is automatically generated as a *module export* in the bundle. This is illustrated below.

We have an image file at `my-app/views/about`, and we have set [`[entry_dir]`](#entry_dir) to `./views` and [`[output_dir]`](#output_dir) to `./public`.

```html
my-app
  └── views
      ├── about
      │    ├── image1.png
      │    └── main.html <main class="page-container">About Page</main>
      └── home
            └── main.html <main class="page-container">Home Page</main>
```

On running the **`oohtml bundle`** command, our final directory structure will be...

```html
my-app
  ├── public
  │   └── about
  │         └── image1.png
  └── views
       ├── about
       │    ├── image1.png
       │    └── main.html <main class="page-container">About Page</main>
       └── home
             └── main.html <main class="page-container">Home Page</main>
```

...and an `<img>` element pointing to the *public* location of `image1.png` is added as a *module export* to the bundle.


```html
<template def="home">
    <main def="main.html" class="page-container">Home Page</main>
</template>

<template def="about">
    <img def="image1.png" src="/about/image1.png" />
    <main def="main.html" class="page-container">About Page</main>
</template>
```

But where the file size of that image is smaller than `1024` - [`[max_data_url_size]`](#max_data_url_size), its contents is *inlined* as [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs), and no copying takes place on the filesystem.

```html
<template def="home">
    <main def="main.html" class="page-container">Home Page</main>
</template>

<template def="about">
    <img def="image1.png" src="data:image/png,%89PNG%0D%0A=" />
    <main def="main.html" class="page-container">About Page</main>
</template>
```

This way, the browser won't have to load it via a HTTP request. (Cutting down on the number of assets to load should greatly speed up the site's load time.)

### Bundler Plugins

OOHTML CLI plugins are packages that extend the capabilities of the OOHTML Bundler. OOHTML CLI comes with certain plugins built-in, and it also makes it possible to provide custom plugins.

#### Overview

Plugins are functions that are called with each file during the bundling process. Multiple plugins are taken in cascade order where a plugin is responsible for calling the next. This makes for an awesome processing pipeline for each file being bundled.

> This, however, requires thoughtfulness in the order in which these plugins are specified.

By default, the main OOHTML CLI bundler only handles `.html` files, and images, audio and video files. Then it features built-in plugins that extend the list.

#### Built-Ins

##### `md-loader`

The `md-loader` plugin is used to load `.md` (markdown) files into HTML exports, just the way regular HTML files are. It takes an initial step of converting the markdown content into HTML using the [Showdown](https://github.com/showdownjs/showdown) library, then goes ahead to add it to the bundle as a *module export*. Markdown links are automatically resolved to better work as HTML links. And a few other transformations are supported through arguments/flags. (Learn more about specifying arguments/flags for a plugin [here](#plugins).)

###### Arguments/Flags

All parameters are optional.

+ **`outline_generation`** - Set this to a *non-empty* value to generate a JSON outline of the page's content. The generated outline will show up in the meta data for the file in the bundle's overall [JSON outline](#create_outline_file).
+ **`code_highlighting`** - Set this to a *non-empty* value to transform code blocks into stylable markup using the [Showdown-Highlight](https://github.com/Bloggify/showdown-highlight) utility. The transformed code blocks are highlighted in the UI on adding any of the [Highlight.js](https://highlightjs.org/) CSS to the page.
+ **`flavor`** - This equates to any of [Showdown's three flavours](https://github.com/showdownjs/showdown#flavors): `original`, `vanilla`, `github`.

###### Other

+ **Markdown Metadata** - By default, `md-loader` automatically parses any found markdown metadata (defined at the top of the document between ««« and »»» or between --- and ---) into JSON. This metadata object is added as a node to the bundle's overall [JSON outline](#create_outline_file). Below is an example metadata:

  ```md
  ---
  description: Page description.
  ---
  # Page Title
  ```
+ **Markdown Tables** - The markdown table syntax is supported by default. Below is an example table:

  ```md
  | h1    |    h2   |      h3 |
  |:------|:-------:|--------:|
  | 100   | [a][1]  | ![b][2] |
  | *foo* | **bar** | ~~baz~~ |
  ```

###### Usage

The `md-loader` plugin is used by specifying `default:md-loader` in the [`[plugins]`](#plugins) config option.

#### Custom Plugins

Custom Plugins are basic JavaScript modules that *export* a `type` variable (`export const type;`), and a function named `handle` (`export function handle() {}`). The `type` variable is the plugin type, and this should be either `input` or `output`.

###### Input Plugins

*Input* plugins are plugins that are called to load a resource and return its contents.

```js
export const type = 'input';
export function handle( event, args, recieved, next ) {
    if ( received || !event.resource.endsWith( '.css' ) ) {
        // Or let the flow continue
        return next( received );
    }
    console.log( event.resource ); // File name
    console.log( args );
    return {
        type: 'text/css'
        contents: '...',
    };
}
```

**Parameters**

+ **`event.resource: String`** - The filename of the resource being processed.
+ **`event.params: Object`** - The [`options` object](#other-options) that the Bundler was initialized with.
+ **`event.indentation: Number`** - A number which represents how deep in the source directory the given resource is. This number is `0` at the root of the source directory.
+ **`args: Object`** - The [`args` object](#plugins) defined specifically for the plugin.
+ **`received: Object`** - The output forwarded (that is, `next()`ed) from the previous plugin in the pipeline, if any.
+ **`next: Function`** - A function that forwards control to the next plugin in the pipeline, if any, and if none, to the default internal *loader*. The `next()` accpets only one parameter, which is received by the next plugin on its `received` parameter.

**Return Schema**

+ **`type: String`** - The MIME type of the resource.
+ **`contents: String`** - The contents of the resource.

###### Output Plugins

*Output* plugins are plugins that are called to transform a loaded resource into its final HTML representation.

```js
export const type = 'output';
export function handle( event, args, recieved, next ) {
    if ( received || event.resource.type !== 'text/css' ) {
        // Or let the flow continue
        return next( received );
    }
    console.log( event.resource.type ); // text/css
    console.log( event.resource.contents ); // ...
    console.log( args );
    return {
        html: '<style rel="stylesheet">...</style>'
        json: {},
    };
}
```

**Parameters**

+ **`event.resource: Object`** - The object that represents a loaded resource - as returned by a *loader*.
+ **`event.params: Object`** - The [`options` object](#other-options) that the Bundler was initialized with.
+ **`event.indentation: Number`** - A number which represents how deep in the source directory the given resource is. This number is `0` at the root of the source directory.
+ **`args: Object`** - The [`args` object](#plugins) defined specifically for the plugin.
+ **`received: Object`** - The output forwarded (that is, `next()`ed) from the previous plugin in the pipeline, if any.
+ **`next: Function`** - A function that forwards control to the next plugin in the pipeline, if any, and if none, to the default internal *loader*. The `next()` accpets only one parameter, which is received by the next plugin on its `received` parameter.

**Return Schema**

+ **`html: String`** - The HTML representation of the resource.
+ **`json: Object`** - An optional object that contains metadata about the resource. (This metadata object is added as a node to the overall [JSON outline](#create_outline_file) generated by the bundler.)

###### Usage

Custom plugins are used by specifying their filename in the [`[plugins]`](#plugins) config option. Plugins installed as an npm package are used by specifying their package name.

## Getting Involved

All forms of contributions and PR are welcome! To report bugs or request features, please submit an [issue](https://github.com/webqit/oohtml-cli/issues). For general discussions, ideation or community help, please join our github [Discussions](https://github.com/webqit/oohtml-cli/discussions).

## License

MIT.
