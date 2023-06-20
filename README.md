# @astrinxit66/ts-jsx-literal

A plugin for the typescript compiler to transpile JSX into String literal.

This is  a fork of [typescript-transform-jsx](https://github.com/LeDDGroup/typescript-transform-jsx)
with support of Typescript 5.

## Table of Contents
  - [Motivation](#motivation)
  - [Example](#example)
  - [Install](#install)
  - [Setup with webpack](#setup-with-webpack)

### Motivation

- Enable JSX in VanillaJS web applications, expanding its use beyond React.
- Provide intuitive syntax resembling HTML for creating UI components with VanillaJS.
- Offer developers the choice to select the right tools for specific project needs without sacrificing comfort.

### Example

```tsx
interface Person {
  name: string;
  age: number;
}

const App = (props: { persons: Person[] }) => (
  <ul>
    {props.persons.map((person) => (
      <li>
        {person.name} is {person.age} years old
      </li>
    ))}
  </ul>
);
```

Gets compiled to:

```js
const App = (props) =>
  `<ul>${props.persons
    .map((person) => `<li>${person.name} is ${person.age} years old</li>`)
    .join("")}</ul>`;
```

### Install

```sh
$ npm i -D @astrinxit66/ts-jsx-literal
```

### Setup with webpack

Even though the typescript compiler can be extended through "transformers", 
[there are no compiler options yet](https://github.com/Microsoft/TypeScript/issues/14419) 
for specifying a custom transformer. The easiest way to do so remains by using webpack with `ts-loader`.

There are 3 files to edit to be able to use JSX without React.

1. **tsconfig.json**
```
{
    "compilerOptions": {
        "jsx": "preserve",
        ...
    }
}
```

2. **webpack.config.js**
```js
// import the transformer
const tsJsxLiteral = require('@astrinxit66/ts-jsx-literal').default;

module.exports = {
    //...
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: require.resolve('ts-loader'), // up to you to install ts-loader
                exclude: /node_modules/,
                options: {
                    // set it as a custom transformer for ts-loader
                    getCustomTransformers: () => ({
                        before: [tsJsxLiteral]
                    }),
                }
            },
        ]
    },
    //...
};
```

3. **types.ts**

Create this file at the root of your package.
This will declare custom JSX so you don't need react typings.
You might want to tune it to your needs or use the types provided by 
[@types/react](https://www.npmjs.com/package/@types/react)

```ts
declare namespace JSX {
    type Element = string;
    interface ElementChildrenAttribute {
        children: any;
    }
    interface IntrinsicElements {
        [element: string]: {
            [property: string]: any;
        };
    }
}
```
See [examples of full configuration and use](https://github.com/astrinxit66/ts-jsx-literal/tree/main/examples).