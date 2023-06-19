const path = require('path');
const tsJsxLiteral = require('@astrinxit66/ts-jsx-literal').default;

module.exports = {
    entry: './src/index.tsx',
    mode: 'production', // 'development' or 'production
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './dist'),
    },
    devServer: {
        static: path.resolve(__dirname, './dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: require.resolve('ts-loader'),
                exclude: /node_modules/,
                options: {
                    // here is where to apply the transformer
                    getCustomTransformers: () => ({
                        before: [tsJsxLiteral]
                    }),
                }
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts']
    },
};