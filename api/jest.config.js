module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
            useESM: true,
            tsconfig: 'tsconfig.json'
        }]
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@curvefi/api$': '<rootDir>/../node_modules/@curvefi/api/lib/index.js',
        '^@curvefi/lending-api$': '<rootDir>/../node_modules/@curvefi/lending-api/lib/index.js'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@curvefi)/.*)'
    ],
    extensionsToTreatAsEsm: ['.ts', ],
    preset: 'ts-jest/presets/default-esm'
}; 