module.exports = {
    plugins: [
        'tailwindcss',
        'autoprefixer',
        ...(process.env.NODE_ENV === 'production'
            ? [[
                '@fullhuman/postcss-purgecss',
                {
                        content: [
                            './src/components/**/*.tsx',
                            './src/pages/**/*.tsx'
                        ],
                        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
                    }
            ]]
            : [])
    ]
};
