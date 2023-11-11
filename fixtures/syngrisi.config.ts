export const config = {
    baseUrl: 'http://localhost:3000/',
    apiKey: '',
    project: 'My Project',
    branch: 'main',

    // if below variables not set 'runName' and 'runIdent' will be generated
    runName: process.env.SYNGRISY_RUN_NAME,
    runIdent: process.env.SYNGRISY_RUN_INDENT,
}
