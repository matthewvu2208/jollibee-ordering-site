import assert from 'node:assert/strict';
import {initialDraft} from '../.sites-runtime/order-test.mjs';
import {parseChat,serviceReply,greeting,quickReplies} from '../.sites-runtime/chat-test.mjs';
const fresh=()=>({...initialDraft,cart:{}});
assert.equal(greeting,'Chào quý khách, Jollibee có thể giúp cho bạn ?');
assert.deepEqual(quickReplies('welcome',fresh()),[]);
let d=fresh(),slot='welcome';
function say(text){const r=parseChat(text,d,slot);d=r.draft;slot=r.awaiting;assert.ok((r.reply.match(/\?/g)||[]).length<=1,r.reply);return r;}
assert.equal(say('Giao tận nơi').awaiting,'cart');
assert.match(say('để mình xem').reply,/thoải mái/);assert.equal(slot,'cart');
assert.equal(say('2 gà giòn').awaiting,'cart');
assert.doesNotMatch(say('thêm khoai tây').reply,/\?|địa chỉ|điện thoại/);
assert.doesNotMatch(say('bỏ khoai tây').reply,/\?|địa chỉ/);
assert.equal(say('Mình chọn xong').awaiting,'address');
assert.equal(say('thêm khoai tây').awaiting,'address');assert.doesNotMatch(say('bỏ khoai tây').reply,/địa chỉ/);
assert.equal(say('123 Nguyễn Trãi, Quận 1').awaiting,'when');assert.equal(d.address,'123 Nguyễn Trãi, Quận 1');
assert.equal(say('nhận sớm nhất').awaiting,'name');assert.equal(say('Minh Anh').awaiting,'phone');assert.equal(d.name,'Minh Anh');
assert.equal(say('0901234567').awaiting,null);assert.match(say('xác nhận').reply,/Kiểm tra đơn/);
assert.equal(say('cảm ơn').changed,false);
d=fresh();slot='mode';assert.equal(say('Đặt bàn').awaiting,'branch');assert.equal(say('quận 3').awaiting,'people');assert.equal(say('4').awaiting,'when');assert.equal(d.people,4);assert.equal(say('ngày mai 19h').awaiting,'name');assert.equal(say('mình tên Linh').awaiting,'phone');assert.equal(say('0987654321').awaiting,null);
d=fresh();slot='mode';assert.equal(say('mang về Tô Hiến Thành ngày mai 18h30, 2 gà giòn').awaiting,'cart');assert.equal(say('Mình chọn xong').awaiting,'name');assert.equal(d.branch,'Jollibee Tô Hiến Thành');assert.equal(d.cart.chickenjoy,2);
const before=JSON.stringify(d);assert.equal(say('gà giòn giá bao nhiêu?').changed,false);assert.equal(JSON.stringify(d),before);
assert.equal(say('tôi dị ứng đậu phộng').changed,false);
let r=serviceReply({...d,name:'A',phone:'0901234567'});assert.equal(r.awaiting,null);
assert.equal(parseChat('đặt bàn',fresh(),'mode').draft.people,0);
console.log('PASS: sequential delivery and reservation, bare answers, pause, no repeated prompts, multi-slot pickup, price query does not order, manual confirmation retained');
d=fresh();slot='mode';say('giao tận nơi');say('2 gà giòn');say('thêm 2 khoai tây');assert.equal(d.address,'');assert.equal(d.cart.fries,2);say('0901234567 nhé');assert.equal(d.address,'');assert.equal(d.phone,'0901234567');
const badTime=parseChat('đổi sang 31/02/2027 19h',{...fresh(),mode:'table',branch:'Jollibee Pasteur',people:4,when:'',name:'Linh',phone:'0901234567'},'name');assert.equal(badTime.awaiting,'when');assert.equal(badTime.draft.when,'');
console.log('PASS: food quantity and phone never become delivery address; invalid date keeps time question active');

assert.equal(parseChat('Gà sốt cay 5 miếng',fresh(),'cart').draft.cart['spicy-chicken'],5);
console.log('PASS: quantity after item name is preserved');

// Real branches must be accepted in both conversational flows and final validation.
const locations=['Jollibee Pasteur','Jollibee Tô Hiến Thành','Jollibee Giga Mall Phạm Văn Đồng','Jollibee Lê Trọng Tấn','Jollibee Hậu Giang','Jollibee Phan Xích Long'];
for(const name of locations){
 d={...fresh(),mode:'pickup'};slot='branch';const reply=say(name);
 assert.equal(d.branch,name);assert.equal(reply.awaiting,'cart');assert.match(reply.reply,/Giờ mở cửa/);
}
d=fresh();slot='mode';say('đặt bàn Phan Xích Long, 4 người, ngày mai 19h');assert.equal(d.branch,'Jollibee Phan Xích Long');assert.equal(slot,'name');
d={...fresh(),mode:'pickup'};slot='branch';say('quận 10');assert.equal(d.branch,'Jollibee Tô Hiến Thành');
d={...fresh(),mode:'pickup'};slot='branch';assert.equal(say('quận 1').awaiting,'branch');assert.equal(d.branch,'');
assert.equal(parseChat('Pasteur hay Hậu Giang',{...fresh(),mode:'pickup'},'branch').draft.branch,'');
assert.equal(parseChat('Địa chỉ Giga Mall ở đâu?',fresh(),'welcome').changed,false);
assert.equal(parseChat('giao đến 194D Pasteur, quận 3',fresh(),'address').draft.branch,'');
console.log('PASS: six real branches, district lookup, multi-slot booking, unsupported/ambiguous branches never selected, store info does not change draft or delivery branch.');
