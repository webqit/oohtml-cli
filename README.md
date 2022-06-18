# OOHTML Command Line Interface

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/oohtml-cli" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/oohtml-cli.svg" alt="NPM version" /></a></span><span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/oohtml-cli" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/oohtml-cli.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->

OOHTML Command Line is a utility that automates certain aspects of your hand-authored OOHTML-based documents. You are able to go about coding in absolute free-form with a view to having everything automatically come to shape in one command.


## Commands

+ [`oohtml bundle`](#command-oohtml-bundle)
+ [`oohtml config`](#command-oohtml-config)

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
<template name="pages">

    <template name="home">
       <main exportgroup="main.html" class="page-container">Home Page</main>
    </template>

    <template name="about">
       <main exportgroup="main.html" class="page-container">About Page</main>
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
        <template name="pages">

            <template name="home">
                <main exportgroup="main.html" class="page-container">Home Page</main>
            </template>

            <template name="about">
                <main exportgroup="main.html" class="page-container">About Page</main>
            </template>

        </template>
    </head>
    <body>
        <h1 data-id="headline"></h1>
        <import name="main.html" template="pages"><import>
    </body>
</html>
```

The **`oohtml bundle`** command acheives just that! It scans the current directory for those files and, this time, writes them to a new file named `bundle.html`. The bundle contains just the following content:

```html
<!--
public
 ├── bundle.html
-->
<template name="home">
    <main exportgroup="main.html" class="page-container">Home Page</main>
</template>

<template name="about">
    <main exportgroup="main.html" class="page-container">About Page</main>
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
        <template name="pages" src="/bundle.html"></template>
    </head>
    <body>
        <h1 data-id="headline"></h1>
        <import name="main.html" template="pages"><import>
    </body>
</html>
```

> You can find a working example of [a typical module structure](https://webqit.io/tooling/oohtml/docs/learn/examples/spa) right at OOHTML's documentation.

That said, much of this can be customized using *flags* and other options.

### Flags

#### `--recursive`

This flag gets the bundler to restart a new bundling process for nested directories that have their own `index.html` files. The default behaviour is to see them as *subroots* and ignore them.

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

Above, the `subroot` directory will recieve its own `bundle.html` for its contents. This gives us the following final structure:

```html
public
  ├── about
  │    └── main.html <main class="page-container">About Page</main>
  ├── home
  │    └── main.html <main class="page-container">Home Page</main>
  ├── subroot
  │    ├── home
  │    │    └── main.html <main class="page-container">Home Page</main>
  │    ├── bundle.html <template name="home">...</template>
  │    └── index.html <!DOCTYPE html>
  ├── bundle.html <template name="about">...</template> <template name="home">...</template>
  └── index.html <!DOCTYPE html>
```

#### `--auto-embed=[value]`

This flag gets the bundler to automatically find the `index.html` document at its entry directory and embed the appropriate `<template name="[value]" src="/bundle.html"></template>` element on it.

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
    "public_base_url": "/",
    "max_data_url_size": 1024,
    "submodules_srcmode": "eager",
    "ignore_folders_by_prefix": ["."],
    "create_outline_file": "create",
    "module_ext": "",
    "module_id_attr": "name",
    "export_mode": "attribute",
    "export_group_attr": "exportgroup",
    "export_element": "html-export",
    "export_id_attr": "export"
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
<template name="about">
    <template name="deep" src="/about/deep/bundle.html"></template>
    <main exportgroup="main.html" class="page-container">About Page</main>
</template>
```

> To add the OOHTML `loading="lazy"` attribute to linked modules, see [`[submodules_srcmode]`](#submodules_srcmode) below.

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

This specifies the HTTP URL that maps to [`[output_dir]`](#output_dir) on the filesystem. The default value is `/`. The *`src` (or equivalent)* attribute of any automatically-embedded `<template>` element, plus every asset bundled, will be prefixed with this path.

#### `[max_data_url_size]`

This specifies at what file size an image, or other assets, should be bundled with inline *[data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs)*. (See [Bundling Assets](#bundling-assets) below.) The default value is `1024`, in bytes. Assets smaller than this size will be bundled with inline *data URL*.

This is good for having small image files embed their own content instead of having them create additional HTTP requests on the page.

#### `[submodules_srcmode]`

This specifies the loading mode for sub modules that link to their own `bundle.html` file. (See [`[filename]`](#filename) above.) The default value is `eager`. Choose `lazy` when you want these modules to have the `loading="lazy"` attribute.

> The OOHTML `loading="lazy"` attribute tells a module having the `src` attribute to only load its contents on-demand - on the first attempt to access its contents.

#### `[ignore_folders_by_prefix]`

This specifies a comma-separated list of prefixes for certain types of folders to ignore. Folders with a name that begins with any of the listed prefixes are ingnored. The default value is an array of one prefix: dot `.`.

This is good for excluding certain system folders or *dot directories* like `.git`. *Dot directories* are automatically excluded by the default value.

#### `[create_outline_file]`

This specifies whether or not to generate a JSON outline of the bundle. The default value is `create`. The generated file is named after [`[filename]`](#filename); e.g. `./bundle.html.json`. Set to `create_merge` to merge the generated JSON outline with any previously generated one. Set to *empty* to disable outline generation.

This is good for programmatically traversing the bundle structure. Simply `JSON.parse()` the contents of `./bundle.html.json`.

#### OOHTML-Related Options

#### `[module_ext]`

This specifies an extended tag name for the generated `<template>` elements. This value will be set to the `is` attribute of the `<template>` elements. The is empty by default.

This is good for automatically extending generated `<template>` elements. A value like `customized-module` will generate `<template is="customized-module"></template>` elements.

> Be sure to take into account the `element.template` setting in the [OOHTML meta tag](https://webqit.io/tooling/oohtml/docs/spec/html-modules#polyfill-support) of the page where the bundle will be used.

#### `[module_id_attr]`

This specifies the attribute that gives the generated `<template>` elements a name. The default value is `name` which conforms to [the default module ID attribute](https://webqit.io/tooling/oohtml/docs/spec/html-modules#convention) in the OOHTML spec.

> This should generally only be changed to align with the `attr.moduleid` setting in the [OOHTML meta tag](https://webqit.io/tooling/oohtml/docs/spec/html-modules#polyfill-support) of the page where the bundle will be used.

#### `[export_mode]`

This specifies the syntax for representing the *module exports* within the generated `<template>` elements. The default value is `attribute` which translates to using the `exportgroup` attribute (or [`[export_group_attr]`](#export_group_attr)) to designate *module exports*. Set to `element` to use the `<export>` element (or [`[export_element]`](#export_element)) instead.  (See [the two standard convetions](https://webqit.io/tooling/oohtml/docs/spec/html-modules#convention).)

#### `[export_group_attr]`

This specifies the attribute that gives *module exports* a name when using the [attribute export mode](#export_mode). The default value is `exportgroup` which conforms to [the default syntax](https://webqit.io/tooling/oohtml/docs/spec/html-modules#convention) in the OOHTML spec. E.g. `<div exportgroup="export-id"></div>`.

> This should generally only be changed to align with the `attr.exportgroup` setting in the [OOHTML meta tag](https://webqit.io/tooling/oohtml/docs/spec/html-modules#polyfill-support) of the page where the bundle will be used.

> This option is only shown when the [`[export_mode]`](#export_mode) option is set to `attribute`.

#### `[export_element]`

This specifies the tag name for reprensenting *module exports* when using the [element export mode](#export_mode). The default value is `export` which conforms to [the default syntax](https://webqit.io/tooling/oohtml/docs/spec/html-modules#convention) in the OOHTML spec. E.g. `<export> <div></div> </export>`

> This should generally only be changed to align with the `element.export` setting in the [OOHTML meta tag](https://webqit.io/tooling/oohtml/docs/spec/html-modules#polyfill-support) of the page where the bundle will be used.

> This option is only shown when the [`[export_mode]`](#export_mode) option is set to `element`.

#### `[export_id_attr]`

This specifies the attribute that gives `<export>` elements (or [`[export_element]`](#export_element)) a name when using the [element export mode](#export_mode). The default value is `name` which conforms to [the default syntax](https://webqit.io/tooling/oohtml/docs/spec/html-modules#convention) in the OOHTML spec. E.g. `<export name="export-id"> <div></div> </export>`

> This should generally only be changed to align with the `element.export` setting in the [OOHTML meta tag](https://webqit.io/tooling/oohtml/docs/spec/html-modules#polyfill-support) of the page where the bundle will be used.

> This option is only shown when the [`[export_mode]`](#export_mode) option is set to `element`.

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
<template name="home">
    <main exportgroup="main.html" class="page-container">Home Page</main>
</template>

<template name="about">
    <img exportgroup="image1.png" src="/about/image1.png" />
    <main exportgroup="main.html" class="page-container">About Page</main>
</template>
```

But where the file size of that image is smaller than `1024` - [`[max_data_url_size]`](#max_data_url_size), its contents is *inlined* as [data URL](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs), and no copying takes place on the filesystem.

```html
<template name="home">
    <main exportgroup="main.html" class="page-container">Home Page</main>
</template>

<template name="about">
    <img exportgroup="image1.png" src="data:image/png,%89PNG%0D%0A=" />
    <main exportgroup="main.html" class="page-container">About Page</main>
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

+ **`base_url`** - Set this to a value that will be used as the base URL for relative links. This is similar to how the [`[public_base_url]`](#public_base_url) option works.
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
        json: '{',
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

All forms of contributions and PR are welcome! To report bugs or request features, please submit an [issue](https://github.com/webqit/oohtml-cli/issues).

## License

MIT.
