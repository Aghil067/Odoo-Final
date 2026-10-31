import {readFile,readdir,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute,basename,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=fileURLToPath(new URL('..',import.meta.url));
const environment=await readFile(resolve(root,'.runtime/backend.env'),'utf8');
const url=new URL(environment.split(/\r?\n/).find(line=>line.startsWith('DATABASE_URL='))?.slice(13)??'');
if(url.hostname!=='127.0.0.1'||url.port!=='55432'||url.pathname!=='/solar_integration_test')throw new Error('Browser mutations require the explicitly disposable local database');
const accounts=JSON.parse(await readFile(resolve(root,'.runtime/test-accounts.json'),'utf8'));
if(accounts.disposable!==true)throw new Error('Run the disposable backend integration suite to prepare test accounts');
const directory=await realpath(resolve(root,'e2e'));
const requested=process.argv.slice(2);
const files=requested.length?requested:(await readdir(directory)).filter(name=>name.endsWith('.spec.ts')).sort().map(name=>join('e2e',name));
if(!files.length)throw new Error('No browser workflow tests were found');
for(const name of files){
 const file=await realpath(resolve(root,name)),part=relative(directory,file);
 if(part.startsWith('..')||isAbsolute(part)||!file.endsWith('.spec.ts'))throw new Error('Select a workflow spec inside e2e/');
 // Each workflow owns fresh local app processes, while retaining real PostgreSQL data.
 // This isolates in-memory session/rate-limit state without changing any backend policy.
 const output=resolve(root,'test-results',basename(file,'.spec.ts'));
 const filter=relative(root,file).replaceAll('\\','/');
 console.info(`Running isolated browser workflow: ${basename(file)}`);
 const code=await new Promise((done,reject)=>{
  const child=spawn(process.execPath,[resolve(root,'node_modules/@playwright/test/cli.js'),'test',filter,'--output',output],{cwd:root,stdio:'inherit',shell:false,windowsHide:true});
  child.once('error',reject);child.once('exit',code=>done(code??1));
 });
 if(code!==0)process.exit(code);
}
console.info(`All ${files.length} isolated browser workflow files passed.`);
