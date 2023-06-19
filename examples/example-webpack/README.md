# example-webpack

## Config

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
                loader: require.resolve('ts-loader'),
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
This allows us to instruct typescript that any tag would be a valid JSX tag name. 
Fine grained control is possible but not necessary for this example.

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

## Test

```sh
$ npm install
$ npm run build
$ npm start
```
