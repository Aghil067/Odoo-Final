import EmbeddedPostgres from 'embedded-postgres';
import {randomBytes} from 'node:crypto';
import {mkdir,mkdtemp,readFile,writeFile,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../.runtime');
await mkdir(root,{recursive:true,mode:0o700});
const credentials=resolve(root,'test-database.json');
let config;
try{config=JSON.parse(await readFile(credentials,'utf8'));if(config.disposable!==true||config.database!=='solar_integration_test'||config.port!==55432)throw new Error('Refusing an unrecognized test database descriptor');}
catch(e){if(e.code!=='ENOENT')throw e;config={disposable:true,database:'solar_integration_test',port:55432,user:'solar_test_admin',password:randomBytes(32).toString('hex')};await writeFile(credentials,JSON.stringify(config),{flag:'wx',mode:0o600});}
if(!config.storageRoot){config.storageRoot=await mkdtemp(join(tmpdir(),'solar-integration-evidence-'));await writeFile(credentials,JSON.stringify(config),{mode:0o600});}
const databaseDir=resolve(root,'integration-postgres');
const pg=new EmbeddedPostgres({databaseDir,user:config.user,password:config.password,port:config.port,persistent:true,authMethod:'scram-sha-256',autoRehydrateSymlinks:true,postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:()=>{}});
try{await access(resolve(databaseDir,'PG_VERSION'));}catch{await pg.initialise();}
await pg.start();
const client=pg.getPgClient();await client.connect();
const existing=await client.query('SELECT datname FROM pg_database WHERE datname=$1',[config.database]);
if(!existing.rowCount)await pg.createDatabase(config.database);
await client.end();
const url=`postgresql://${config.user}:${encodeURIComponent(config.password)}@127.0.0.1:${config.port}/${config.database}`;
await writeFile(resolve(root,'backend.env'),`DATABASE_URL=${url}\nAPP_ORIGIN=http://localhost:5173\nPORT=3000\n${['SURVEY','INSTALLATION','WARRANTY','SERVICE','FINANCE'].map(module=>`${module}_STORAGE_DIR=${join(config.storageRoot,module.toLowerCase())}`).join('\n')}\n`,{mode:0o600});
console.info('Disposable integration PostgreSQL listening on127.0.0.1:55432; credentials saved privately under .runtime (not printed).');
let stopping=false;async function stop(){if(stopping)return;stopping=true;await pg.stop();process.exit(0);}
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());
setInterval(()=>{},60000);
