import urllib.request,urllib.error,http.cookiejar,json,uuid,datetime
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));base='http://127.0.0.1:5173'
client.open(base+'/signin-with-chatgpt?return_to=/').read()
def call(b=None,expected=200):
 req=urllib.request.Request(base+'/api/state',data=json.dumps(b).encode() if b else None,headers={'Content-Type':'application/json','Origin':base})
 try:r=client.open(req)
 except urllib.error.HTTPError as e:r=e
 out=json.load(r);assert r.status==expected,(r.status,out);return out
when=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=1)).isoformat()
d={'mode':'delivery','cart':{'chickenjoy':2},'address':'123 Đường Kiểm Thử, Quận 1','branch':'','people':2,'when':'asap','notes':'Dữ liệu QA cục bộ','name':'Khách thử nghiệm','phone':'0900000000'}
id=str(uuid.uuid4());o=call({'action':'order','id':id,'draft':d,'total':1})['order'];assert o['total']==81000
assert call({'action':'order','id':id,'draft':d})['order']['id']==id
assert len([o for o in call()['orders'] if o['id']==id])==1
bad={**d,'cart':{'chickenjoy':-1}};call({'action':'order','id':str(uuid.uuid4()),'draft':bad},400)
d['cart']={'chickenjoy':1};assert call({'action':'update','id':id,'version':1,'draft':d})['refund']==33000
call({'action':'update','id':id,'version':1,'draft':d},400)
call({'action':'accept_demo','id':id,'version':2});call({'action':'cancel','id':id,'version':3},400)
for mode in ['pickup','table']:
 x={**d,'mode':mode,'branch':'Quận 3','when':when,'cart':{} if mode=='table' else {'fries':1}}
 i=str(uuid.uuid4());o=call({'action':'order','id':i,'draft':x})['order'];assert o['total']==(0 if mode=='table' else 20000)
 call({'action':'cancel','id':i,'version':1})
call({'action':'preferences','text':'Gà giòn, không cay','enabled':True});assert call()['preferences']['text']=='Gà giòn, không cay'
call({'action':'preferences','clear':True});assert call()['preferences']==None
assert call({'action':'support','text':'QA kiểm tra lưu hỗ trợ','context':{'orderId':id}})['id']
assert call({'action':'feedback','text':'QA phản hồi','rating':4})['id']
print('PASS: delivery/pickup/table, server prices, idempotency, negative quantity, edit/refund, stale version, accepted lock, preferences save/delete, support/feedback')
