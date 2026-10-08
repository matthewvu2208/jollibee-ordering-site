import {products, money} from './catalog';
import {branches,findBranch,getBranch} from './branches';
import {normalize, type Draft, type Mode} from './order';

export type ChatSlot = 'welcome'|'mode'|'cart'|'address'|'branch'|'people'|'when'|'name'|'phone'|null;
export type ChatReply = {draft:Draft;reply:string;changed:boolean;awaiting:ChatSlot};
export const greeting = 'Chào quý khách, Jollibee có thể giúp cho bạn ?';
const aliases:Record<string,string[]>={
  chickenjoy:['ga gion','ga ran'], 'spicy-chicken':['ga sot cay','ga cay'],
  fries:['khoai tay','khoai chien'], 'pumpkin-soup':['sup bi','sup'], rice:['com trang'],
  'peach-mango-pie':['banh xoai','banh dao'], 'tropical-sundae':['tropical'],
  'strawberry-sundae':['kem dau'], 'chocolate-sundae':['kem socola','kem so co la'],
  'spaghetti-drink':['mi y','mi jolly'], 'spaghetti-fries-drink':['combo mi khoai'],
  'chicken-rice-drink':['com ga']
};
const titles:Record<Mode,string>={delivery:'giao tận nơi',pickup:'mang về',table:'đặt bàn'};

/** One pending question, shared by chat replies and service-tab changes. */
export function nextQuestion(d:Draft):{slot:ChatSlot;text:string}{
  if(d.mode!=='delivery'&&!getBranch(d.branch))return {slot:'branch',text:`Mình có ${branches.map(b=>b.shortName).join(', ')}. Khách yêu nhà mình muốn ghé chi nhánh nào ${d.mode==='pickup'?'để lấy món':'để dùng bữa'} ạ?`};
  if(d.mode==='table'&&!d.people)return {slot:'people',text:'Bàn mình có mấy người ạ?'};
  if(d.mode!=='table'&&!Object.keys(d.cart).length)return {slot:'cart',text:'Bạn muốn dùng món gì hôm nay ạ?'};
  if(d.mode==='delivery'&&!d.address)return {slot:'address',text:'Mình giao đến địa chỉ nào cho bạn ạ?'};
  if(!d.when||(d.when==='asap'&&d.mode!=='delivery'))return {slot:'when',text:d.mode==='delivery'?'Bạn muốn nhận sớm nhất hay hẹn một thời gian cụ thể ạ?':d.mode==='table'?'Bạn muốn đến vào lúc nào ạ?':'Bạn muốn ghé lấy món lúc nào ạ?'};
  if(!d.name.trim())return {slot:'name',text:'Mình xin tên để ghi vào yêu cầu nhé?'};
  if(!/^0\d{9}$/.test(d.phone.replace(/\s/g,'')))return {slot:'phone',text:'Bạn cho mình số điện thoại liên hệ nhé?'};
  return {slot:null,text:d.mode==='table'?'Thông tin đã đủ rồi ạ. Bạn bấm “Kiểm tra đặt bàn” để xem lại trước khi xác nhận nhé.':'Mình đã chuẩn bị xong thông tin. Bạn bấm “Kiểm tra đơn” để xem món và tổng tiền trước khi xác nhận nhé.'};
}
export function serviceReply(d:Draft):ChatReply{
  const question=d.mode==='delivery'?{slot:'cart' as ChatSlot,text:'Bạn cứ chọn món nhé. Khi chọn xong, nhắn “Mình chọn xong” để mình hỗ trợ bước tiếp theo.'}:nextQuestion(d);
  return {draft:d,changed:true,awaiting:question.slot,reply:d.mode==='pickup'?question.text:`Dạ, mình hỗ trợ ${titles[d.mode]} nhé. ${question.text}`};
}
export function quickReplies(slot:ChatSlot,d:Draft):string[]{
  if(slot==='mode')return ['Giao tận nơi','Mua mang về','Đặt bàn'];
  if(slot==='branch')return branches.map(b=>b.shortName);
  if(slot==='people')return ['2 người','4 người','6 người'];
  if(slot==='when')return d.mode==='delivery'?['Nhận sớm nhất']:[];
  if(slot==='cart')return Object.keys(d.cart).length?['Mình chọn xong']:['Gợi ý món cho mình'];
  return [];
}

export function parseChat(input:string,d:Draft,awaiting:ChatSlot=null):ChatReply{
  const text=input.trim(),s=normalize(text);
  const stay=(reply:string):ChatReply=>({draft:d,changed:false,awaiting,reply});
  if(!text)return stay('Mình đang nghe bạn đây ạ.');
  if(/di ung|thanh phan|an toan|dau phong/.test(s))return stay('Mình chưa có thông tin thành phần được nhà hàng xác nhận nên chưa thể khẳng định món an toàn cho bạn. Bạn chọn “Liên hệ đội ngũ CSKH” để kiểm tra trước khi đặt nhé.');
  if(/ngon|tuyet voi|me qua/.test(s)&&!/khong ngon|chang ngon|do te|te qua|goi y|mon nao|them|dat|cho (?:minh|toi)|lay|mua|bao nhieu|\?/.test(s))return stay('Jollibee là ngon số 1 đấy! 😄 Cảm ơn bạn đã thương tụi mình nha.');
  if(/khong ngon|do te|te qua|that vong/.test(s))return stay('Mình rất tiếc vì trải nghiệm chưa như mong đợi. Bạn có thể nhắn điều chưa hài lòng hoặc chọn “Liên hệ đội ngũ CSKH” để gửi góp ý nhé.');
  if(/^(?:cam on|thank|thanks|ok cam on)/.test(s))return stay('Rất vui được hỗ trợ bạn ạ. Cần đổi gì trong đơn, bạn cứ nhắn mình nhé.');
  if(/(?:doi (?:minh|toi|mot|ti|chut)|de (?:minh|toi) (?:xem|nghi|chon)|chua (?:biet|quyet))/ .test(s))return stay('Dạ, bạn cứ xem thoải mái nhé. Khi chọn xong, nhắn mình là được ạ.');
  if(/^(?:xin chao|chao|hello|hi)\b/.test(s))return stay((awaiting==='mode'||awaiting==='welcome')?greeting:'Chào bạn! Mình đang ở đây, bạn cứ nhắn điều cần hỗ trợ nhé.');
  if(/goi y|tu van|recommend|mon nao ngon/.test(s))return stay(`Bạn có thể chọn 1 miếng Gà Giòn Vui Vẻ (${money(33000)}) hoặc Mì Ý Jolly vừa kèm nước (${money(40000)}). Đây là giá tham khảo nhé. Bạn cứ xem và chọn món mình thích ạ.`);
  if(/[?？]|bao nhieu|co .*khong|duoc khong/.test(s)&&Object.values(aliases).some(a=>a.some(x=>s.includes(x)))){
    const found=products.filter(p=>aliases[p.id]?.some(a=>s.includes(a)));
    return stay(found.map(p=>`${p.name}: ${money(p.price)}`).join('. ')+'. Đây là giá tham khảo; mình chưa thêm món vào giỏ nhé.');
  }

  const branchInfo=findBranch(text);
  if(branchInfo&&/dia chi|o dau|gio mo|gio dong|may gio|thong tin/.test(s)&&!/(?:chon|dat ban|mang ve|lay tai|nhan tai quay)/.test(s))return stay(`${branchInfo.name}: ${branchInfo.address}. Giờ mở cửa ${branchInfo.opens}–${branchInfo.closes}. ${branchInfo.description}`);

  const finished=/^(?:(?:minh|toi) )?(?:chon xong|xong|du roi|vay thoi|chot don|tinh tien|thanh toan|xac nhan|dat di)(?: roi)?(?: nhe| nha| a)?[.!\s]*$/.test(s);
  const next:Draft={...d,cart:{...d.cart}};
  const changes:string[]=[];
  let explicitMode=false,issue='';
  let issueSlot:ChatSlot=null;
  const foodMention=Object.values(aliases).some(aa=>aa.some(a=>s.includes(a)));
  if(/dat ban/.test(s)){next.mode='table';explicitMode=true;}
  else if(/mang ve|lay tai|nhan tai quay/.test(s)){next.mode='pickup';explicitMode=true;}
  else if(/giao|ship/.test(s)){next.mode='delivery';explicitMode=true;}
  if(explicitMode){if(next.mode!=='delivery'&&next.when==='asap')next.when='';changes.push(`chọn ${titles[next.mode]}`);}

  const bareDistrict=awaiting==='branch'?s.match(/^(\d{1,2})(?:\s*(?:nhe|a))?[.!]?$/):null;
  const selectedBranch=next.mode!=='delivery'?findBranch(bareDistrict?'quận '+bareDistrict[1]:text):undefined;
  if(selectedBranch){next.branch=selectedBranch.name;changes.push('chọn chi nhánh '+selectedBranch.shortName);}
  else if(next.mode!=='delivery'&&/(?:quan\s*|q\.?\s*)\d{1,2}\b/.test(s)){issue='Mình chưa có chi nhánh ở khu vực này trong danh sách. Bạn muốn chọn chi nhánh nào trong sáu lựa chọn bên dưới ạ?';issueSlot='branch';}
  const people=s.match(/(\d+)\s*(?:nguoi|khach)/)||(awaiting==='people'?s.match(/^(\d+)(?:\s*(?:nhe|a))?[.!]?$/):null);
  if(people){const n=+people[1];if(n<1||n>30){issue='Mình hỗ trợ bàn từ 1 đến 30 người trong bản thử nghiệm. Bàn mình có mấy người ạ?';issueSlot='people';}else{next.people=n;changes.push(`ghi nhận bàn ${n} người`);}}

  const clock=s.match(/\b([01]?\d|2[0-3])\s*(?::|h|gio)\s*([0-5]\d)?/)||(awaiting==='when'?s.match(/^([01]?\d|2[0-3])(?:\s*(?:nhe|a))?[.!]?$/):null);
  if(clock){
    const date=new Date();
    if(/\bmai\b/.test(s))date.setDate(date.getDate()+1);
    else if(d.when&&d.when!=='asap'&&!/hom nay/.test(s)){const previous=new Date(d.when);if(Number.isFinite(+previous))date.setFullYear(previous.getFullYear(),previous.getMonth(),previous.getDate());}
    const day=s.match(/(?:ngay\s*)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/);
    if(day)date.setFullYear(+(day[3]||date.getFullYear()),+day[2]-1,+day[1]);
    let hour=+clock[1];if(/chieu|toi/.test(s)&&hour<12)hour+=12;
    date.setHours(hour,+(clock[2]||0),0,0);
    const validDay=!day||(date.getDate()===+day[1]&&date.getMonth()===+day[2]-1);
    if(!validDay||+date<Date.now()+5*60000||+date>Date.now()+30*86400000){issue='Thời gian này chưa phù hợp. Bạn chọn một giờ trong 30 ngày tới, sau hiện tại ít nhất 5 phút nhé?';issueSlot='when';}
    else{next.when=new Date(+date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);changes.push(`hẹn lúc ${hour}:${String(clock[2]||'00').padStart(2,'0')}`);}
  }
  if(/som nhat|ngay bay gio/.test(s)){if(next.mode==='delivery'){next.when='asap';changes.push('chọn nhận sớm nhất');}else{issue='Với lịch hẹn tại quán, mình cần một giờ cụ thể. Bạn muốn đến lúc mấy giờ ạ?';issueSlot='when';}}

  const address=text.match(/(?:địa chỉ(?:\s+mới)?|giao (?:đến|tới)|giao tại)\s*[:：]?\s*(.+?)(?:;|$)/i);
  const bareAddress=awaiting==='address'&&!foodMention&&!clock&&!explicitMode&&!/^0[\d .-]{8,16}\d(?:\s*(?:nhe|a))?[.!]?$/.test(s)&&/\d/.test(s)&&/[a-z]/.test(s)&&text.length>=10;
  if(address||bareAddress){const value=address?address[1].trim():text;if(value.length<10||value.length>400){issue='Bạn cho mình địa chỉ đầy đủ để tránh giao nhầm nhé?';issueSlot='address';}else{next.address=value;changes.push('cập nhật địa chỉ giao hàng');}}
  const notes=text.match(/(?:ghi chú|yêu cầu)\s*[:：]?\s*(.+)$/i)||(next.mode==='table'?text.match(/((?:bàn gần|ghế trẻ em|bàn ngoài|bàn trong).+)$/i):null);
  if(notes){next.notes=notes[1].slice(0,500);changes.push('ghi chú yêu cầu của bạn');}

  const phone=s.match(/(?:so dien thoai|sdt|dien thoai)\s*[:：]?\s*(0[\d .-]{8,16}\d)/)||s.match(/^\s*(0[\d .-]{8,16}\d)\s*(?:nhe|a)?[.!]?$/);
  if(phone){const value=phone[1].replace(/\D/g,'');if(/^0\d{9}$/.test(value)){next.phone=value;changes.push('lưu số liên hệ');}else{issue='Mình cần số điện thoại gồm 10 chữ số. Bạn kiểm tra lại giúp mình nhé?';issueSlot='phone';}}
  const named=text.match(/(?:tên (?:mình|tôi|em|anh|chị)(?: là)?|mình tên|tôi tên|gọi mình là)\s*[:：]?\s*([^,;\d]+)/i);
  const bareName=awaiting==='name'&&!changes.length&&!foodMention&&!/[?\d]/.test(text)&&/^[\p{L} .'-]{2,60}$/u.test(text)&&!/khong|chua|doi|thoi|xong|oke|^ok$/.test(s);
  if(named||bareName){next.name=(named?named[1]:text).replace(/\s+(nhé|nha|ạ)$/i,'').trim().slice(0,80);changes.push('ghi tên '+next.name);}

  // Address, name and notes are data, not instructions to add food mentioned in them.
  if(!address&&!bareAddress&&!named&&!bareName&&!notes){
    const clauses=s.split(/[,;]|\bnhung\b|\bva\b/);
    for(const clause of clauses){
      const matches=Object.entries(aliases).filter(([,aa])=>aa.some(a=>clause.includes(a)));
      const picked=matches.some(([id])=>id==='spaghetti-fries-drink')?matches.filter(([id])=>id!=='spaghetti-drink'&&id!=='fries'):matches;
      for(const [id,aa] of picked){
        const name=products.find(p=>p.id===id)!.name;
        if(/\b(?:bo|xoa)\b|\bkhong (?:muon an|muon lay|an|lay)\b/.test(clause)){if(next.cart[id]){delete next.cart[id];changes.push('bỏ '+name);}else changes.push('kiểm tra: '+name+' chưa có trong giỏ');}
        else{const alias=aa.find(a=>clause.includes(a))!;const prefix=clause.slice(0,clause.indexOf(alias));const suffix=clause.slice(clause.indexOf(alias)+alias.length);const qty=+(prefix.match(/(\d+)\s*(?:mieng|phan|suat)?\s*$/)?.[1]||suffix.match(/^\s*(\d+)\s*(?:mieng|phan|suat)\b/)?.[1]||1);if(qty<1||qty+(next.cart[id]||0)>20){issue='Mỗi món đặt từ 1 đến 20 phần trong bản thử nghiệm. Bạn nhắn lại món kèm số lượng giúp mình nhé?';issueSlot='cart';continue;}next.cart[id]=(next.cart[id]||0)+qty;changes.push(`thêm ${qty} ${/^1\s/.test(name)?name.replace(/^1\s+/,''):'phần '+name}`);}
      }
    }
  }
  const changed=JSON.stringify(next)!==JSON.stringify(d);
  const question=nextQuestion(next);
  const ack=explicitMode&&changes.length===1?(next.mode==='pickup'?'':`Dạ, mình hỗ trợ ${titles[next.mode]} nhé.`):changes.length>2?'Dạ, mình đã ghi lại các thông tin bạn vừa gửi.':changes.length?'Dạ, mình đã '+changes.join(' và ')+'.':'';
  if(issue)return {draft:next,changed,awaiting:issueSlot||question.slot,reply:[ack,issue].filter(Boolean).join(' ')};
  const cartChanged=JSON.stringify(next.cart)!==JSON.stringify(d.cart);
  if(cartChanged&&next.mode!=='table'&&!finished){
    if(awaiting==='welcome'&&!explicitMode)return {draft:next,changed,awaiting:'mode',reply:ack+' Bạn muốn giao tận nơi hay mua mang về ạ?'};
    return {draft:next,changed,awaiting:awaiting==='welcome'||awaiting==='mode'||explicitMode?'cart':awaiting,reply:ack};
  }
  if(explicitMode&&next.mode==='delivery'&&!finished&&!cartChanged){
    return {...serviceReply(next),changed};
  }
  if(!changes.length){
    if(finished)return {draft:next,changed:false,awaiting:question.slot,reply:question.text};
    if(/^(?:ok|oke|xong|du roi|dong y|xac nhan|dat di|vay nhe)[.!\s]*$/.test(s))return {draft:next,changed:false,awaiting:question.slot,reply:question.slot?'Dạ, mình tiếp tục nhé. '+question.text:question.text};
    if(awaiting==='mode'||awaiting==='welcome')return {...stay('Mình có thể giúp đặt món hoặc đặt bàn. Bạn muốn giao tận nơi, mang về hay đặt bàn ạ?'),awaiting:'mode'};
    return stay('Mình chưa hiểu rõ ý này. Bạn nói thêm một chút giúp mình nhé?');
  }
  // Do not repeat a pending question whenever the customer adjusts the cart.
  const followUp=question.slot!==awaiting||explicitMode||!question.slot?question.text:'';
  const locationInfo=selectedBranch?`${selectedBranch.address}. Giờ mở cửa ${selectedBranch.opens}–${selectedBranch.closes}.`:'';
  return {draft:next,changed,awaiting:question.slot,reply:[ack,locationInfo,followUp].filter(Boolean).join(' ')};
}
