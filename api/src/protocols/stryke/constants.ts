interface StrykeAddresses {
    positionManager: string;
    autoExercise: string;
    clammRouter: string
}

export const STRYKE_ADDRESSES: Record<ChainId, StrykeAddresses> = {
    146: {
        positionManager: '0xa8C29FD16c272092b4361804736B4f7193a61c92',
        autoExercise: '0xC57175761E91D38A45E70820613551C855b700EF',
        clammRouter: '0x9FD06bb305d74C85961CE2307dab72b07d06606F'
    },
    10: {
        positionManager: '0x99fF939Ef399f5569d57868d43118e6586F574d9',
        autoExercise: '0x872C7AC60F27Ffd76c5BC3F2FE7EF9da59659818',
        clammRouter: '0x8C4D42ACdAf0dea678B02A092276E2313eD7D820'
    },
    42161: {
        positionManager: '0x5eE223AcD61E744458b4d1bB1e24F64F243Cf28E',
        autoExercise: '0xb223eD797742E096632c39d1b2e0c313750B25FE',
        clammRouter: '0x2dD8BF6bf68dD903F32B9dEfB20443305D301fA6'
    }
}