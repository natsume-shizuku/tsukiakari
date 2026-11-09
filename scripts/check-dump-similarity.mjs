// Local check that new questions are original: node scripts/check-dump-similarity.mjs <dump.pdf> [--text extra.txt]
// The dump stays outside the repository. Only item IDs and scores are written, never its text.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2),pdf=args[0];
if(!pdf)throw Error('Usage: node scripts/check-dump-similarity.mjs <dump.pdf> [--text extra.txt]');
let corpus=execFileSync('pdftotext',['-layout',pdf,'-'],{maxBuffer:1<<27}).toString('utf8');
const extra=args.indexOf('--text');
if(extra>=0)corpus+='\n'+await fs.readFile(args[extra+1],'utf8');

const words=value=>value.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(' ').filter(Boolean);
const stop=new Set('a an the is are was were be to of in on at with and or for from that this their its has have had as by should which what how you your must need needs company uses use using customer service representatives representative csrs csr contact center dynamics 365'.split(' '));
const grams=(tokens,size=5)=>{const out=new Set();for(let i=0;i+size<=tokens.length;i++)out.add(tokens.slice(i,i+size).join(' '));return out};

// Lines repeated across many questions are instructions or shared case text, not distinctive wording.
const parts=corpus.split(/^\s*(?:\[\d+,\d+\]\s*)?QUESTION (\d+)\s/m);
const raw=new Map();
for(let i=1;i<parts.length;i+=2)raw.set(parts[i],(raw.get(parts[i])??'')+'\n'+parts[i+1]);
const lineOf=line=>line.replace(/^\[\d+,\d+\]\s*/,'').trim();
const seen=new Map();
for(const body of raw.values())for(const line of new Set(body.split('\n').map(lineOf)))seen.set(line,(seen.get(line)??0)+1);
const dump=[...raw.entries()].map(([number,body])=>{
 const text=body.split('\n').map(lineOf).filter(line=>line&&(seen.get(line)??0)<5).join(' ');
 const tokens=words(text);
 return {number,grams:grams(tokens),words:new Set(tokens.filter(token=>!stop.has(token))),normalized:' '+tokens.join(' ')+' '};
});
if(dump.length<90)throw Error('Could not read the dump questions.');

const jaccard=(a,b)=>{let shared=0;for(const value of a)if(b.has(value))shared++;return shared/(a.size+b.size-shared||1)};
const containment=(a,b)=>{if(!a.size)return 0;let shared=0;for(const value of a)if(b.has(value))shared++;return shared/a.size};
function score(id,prompt,choices){
 const tokens=words([prompt,...choices].join(' ')),own=grams(tokens),stem=new Set(words(prompt).filter(token=>!stop.has(token)));
 const long=choices.map(choice=>words(choice)).filter(choice=>choice.length>=3);
 let phrase=0,stemWords=0,options=0;
 for(const question of dump){
  phrase=Math.max(phrase,containment(own,question.grams));
  stemWords=Math.max(stemWords,jaccard(stem,question.words));
  if(long.length)options=Math.max(options,long.filter(choice=>question.normalized.includes(' '+choice.join(' ')+' ')).length/long.length);
 }
 return {id,phrase:Number(phrase.toFixed(3)),stemWords:Number(stemWords.toFixed(3)),options:Number(options.toFixed(3))};
}

const folder=path.join(root,'src/content/simulator');
const results=[];
for(const file of (await fs.readdir(folder)).filter(name=>name.endsWith('.json')&&name!=='manifest.json')){
 const bundle=JSON.parse(await fs.readFile(path.join(folder,file),'utf8'));
 for(const question of bundle.questions)results.push(score(question.id,question.prompt,[...(question.options??[]).filter(o=>!/^(yes|no)$/i.test(o.text)).map(o=>o.text),...(question.tokens??[]).map(o=>o.text),...(question.rows??[]).flatMap(row=>[row.label,...(row.options??[]).map(o=>o.text)])]));
 for(const group of bundle.groups)results.push(score(group.id,group.exhibits.map(exhibit=>exhibit.body).join(' '),[]));
}
const thresholds={phrase:0.2,stemWords:0.5,options:0.5};
const flagged=results.filter(item=>item.phrase>=thresholds.phrase||item.stemWords>=thresholds.stemWords||item.options>=thresholds.options);
const report={checkedAt:new Date().toISOString(),dumpQuestions:dump.length,items:results.length,thresholds,maxima:{phrase:Math.max(0,...results.map(item=>item.phrase)),stemWords:Math.max(0,...results.map(item=>item.stemWords)),options:Math.max(0,...results.map(item=>item.options))},flagged};
await fs.mkdir(path.join(root,'reports/phase8'),{recursive:true});
await fs.writeFile(path.join(root,'reports/phase8/dump-similarity.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Compared ${results.length} items with ${dump.length} dump questions. Flagged ${flagged.length}.`,report.maxima);
for(const item of flagged)console.log('FLAGGED',item);
if(flagged.length)process.exitCode=1;
