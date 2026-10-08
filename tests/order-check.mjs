import assert from 'node:assert/strict';
import {initialDraft,calculate,validateDraft} from '../.sites-runtime/order-test.mjs';
import {parseChat} from '../.sites-runtime/chat-test.mjs';
let d={...initialDraft,cart:{}};
let p=parseChat('Mua mang về, quận 3, ngày mai 18h30',d);assert.equal(p.draft.mode,'pickup');assert.equal(p.draft.branch,'Jollibee Pasteur');assert.match(p.draft.when,/T18:30/);
p=parseChat('đặt bàn Tô Hiến Thành, 5 người, ngày mai 19h, yêu cầu: gần cửa sổ',d);assert.equal(p.draft.people,5);assert.equal(p.draft.notes,'gần cửa sổ');assert.equal(p.draft.mode,'table');
p=parseChat('thêm 2 gà giòn, thêm 1 khoai tây',d);assert.deepEqual(p.draft.cart,{'chickenjoy':2,fries:1});p=parseChat('không ăn khoai tây',p.draft);assert.deepEqual(p.draft.cart,{'chickenjoy':2});assert.equal(calculate(p.draft).total,81000);
p=parseChat('gà giòn không cay',d);assert.equal(p.draft.cart.chickenjoy,1);
assert.equal(parseChat('Tôi dị ứng đậu phộng',d).changed,false);
assert.throws(()=>validateDraft({...d,name:'Test',phone:'0900000000',address:'123 Đường Test',cart:{chickenjoy:1},when:'2020-01-01T00:00:00Z'}));
console.log('PASS: multi-slot pickup/table, add/remove, non-spicy not removal, allergy escalation, past-date validation');

const validPickup={...d,mode:'pickup',branch:'Jollibee Pasteur',name:'Khách thử',phone:'0900000000',cart:{chickenjoy:1},when:new Date(Date.now()+86400000).toISOString()};
assert.equal(validateDraft(validPickup).branch,'Jollibee Pasteur');
assert.throws(()=>validateDraft({...validPickup,branch:'Quận 3'}),/sáu chi nhánh/);
assert.throws(()=>validateDraft({...validPickup,branch:'Jollibee không có thật'}),/sáu chi nhánh/);
console.log('PASS: checkout accepts named branches and rejects obsolete demo districts and invented branches.');
