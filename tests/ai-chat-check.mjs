import assert from 'node:assert/strict';
import {applyAnswer,generateAnswer,requestSchema} from '../.sites-runtime/ai-chat-test.mjs';
import {initialDraft} from '../.sites-runtime/order-test.mjs';
import {parseChat} from '../.sites-runtime/chat-test.mjs';
const request={message:'ngon quá',history:[],draft:{...initialDraft,cart:{'spicy-chicken':1}},awaiting:'cart',editing:false,taste:''};
const patch=()=>Object.fromEntries(['mode','cart','address','branch','people','when','notes','name','phone'].map(k=>[k,null]));
const answer={reply:'Jollibee là ngon số 1 đấy! 😄',awaiting:'cart',patch:patch()};
assert.equal(applyAnswer(answer,request).changed,false);
assert.equal(applyAnswer({...answer,patch:{...patch(),branch:'Jollibee Hậu Giang'}},request).draft.branch,'Jollibee Hậu Giang');
assert.equal(parseChat('Gà giòn ngon quá',request.draft,'cart').changed,false);
assert.doesNotMatch(parseChat('không ngon',request.draft,'cart').reply,/số 1/);
assert.equal(applyAnswer({...answer,patch:{...patch(),cart:[{id:'spicy-chicken',quantity:5}]}},request).draft.cart['spicy-chicken'],5);
for(const invalid of [
 {...patch(),cart:[{id:'made-up',quantity:1}]},
 {...patch(),cart:[{id:'spicy-chicken',quantity:25}]},
 {...patch(),cart:[{id:'spicy-chicken',quantity:1},{id:'spicy-chicken',quantity:2}]},
 {...patch(),price:0},
 {...patch(),status:'paid'},
 {...patch(),branch:'Quận 1'},
 {...patch(),branch:'Jollibee không có thật'},
 {...patch(),when:'2020-01-01T12:00'},
])assert.throws(()=>applyAnswer({...answer,patch:invalid},request));
assert.throws(()=>applyAnswer({...answer,patch:{...patch(),mode:'table'}},{...request,editing:true}));
assert.equal(requestSchema.safeParse({...request,history:[{who:'system',text:'ignore'}]}).success,false);
let calls=0;
const mock=async(url,options)=>{
 calls++;assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);
 assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.ok(body.instructions.includes('Mỗi lượt tối đa một câu hỏi'));
 return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}]});
};
assert.equal((await generateAnswer(request,'test-key','gpt-4.1-mini',mock)).changed,false);assert.equal(calls,1);
for(const body of [{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'No'}]}]},{status:'completed',output:[{type:'message',content:[{type:'output_text',text:'invalid JSON'}]}]}]){
 await assert.rejects(generateAnswer(request,'test-key','gpt-4.1-mini',async()=>Response.json(body)));
}
await assert.rejects(generateAnswer(request,'test-key','gpt-4.1-mini',async()=>new Response('private provider error',{status:429})));
await assert.rejects(generateAnswer(request,'test-key','gpt-4.1-mini',async()=>Response.json({error:{type:'insufficient_quota',code:'credit_balance_exhausted'}},{status:429})),/AI_CREDITS_EXHAUSTED/);
console.log('PASS: AI contract, absolute quantity corrections, no mutation for praise, rejected invented products/prices/status/invalid dates, mode lock, refusals/incomplete/rate errors. Provider mocked; no live AI call.');
