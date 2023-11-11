import { generateRunIdent, generateRunName, log } from '@syngrisi/playwright-sdk/dist/lib/utils';

const setup = ()=>{
    process.env.SYNGRISY_RUN_NAME  = process.env.SYNGRISY_RUN_NAME ? process.env.SYNGRISY_RUN_NAME : generateRunName();
    log.warn(`runname: '${process.env.SYNGRISY_RUN_NAME}'`);

    process.env.SYNGRISY_RUN_INDENT  = process.env.SYNGRISY_RUN_INDENT ? process.env.SYNGRISY_RUN_INDENT : generateRunIdent();
    log.warn(`runident: '${process.env.SYNGRISY_RUN_INDENT}'`)
}
export default setup;
