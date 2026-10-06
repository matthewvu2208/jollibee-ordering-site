"""Production-Worker integration test. Uses fake customer data only."""
import datetime
import json
import urllib.error
import urllib.request
import uuid
import sys

BASE = sys.argv[1] if len(sys.argv) == 2 else 'http://127.0.0.1:5174'
assert BASE in ['http://127.0.0.1:5174', 'https://jollibee-chatbot-demo.matthewvu2208.workers.dev']

def call(cookie='', body=None, extra=None, expected=200):
    headers = {'Origin': BASE, 'Content-Type': 'application/json'}
    if cookie:
        headers['Cookie'] = cookie
    headers.update(extra or {})
    request = urllib.request.Request(BASE + '/api/state', headers=headers,
        data=json.dumps(body).encode() if body is not None else None)
    try:
        response = urllib.request.urlopen(request)
    except urllib.error.HTTPError as error:
        response = error
    raw = response.read().decode()
    assert response.status == expected, (response.status, raw[:200])
    return json.loads(raw), response.headers

_, headers = call()
first = headers['Set-Cookie'].split(';')[0]
_, headers = call()
second = headers['Set-Cookie'].split(';')[0]
assert first != second
call(first, {'action': 'preferences', 'text': 'QA: thích gà giòn', 'enabled': True})
assert call(first)[0]['preferences']['text'] == 'QA: thích gà giòn'
assert call(second, extra={'oai-authenticated-user-id': 'local_seedy'})[0]['preferences'] is None
call(first, {'action': 'preferences', 'clear': True}, {'Origin': 'https://other.example'}, 403)
call('', {'action': 'preferences', 'clear': True}, expected=401)
call(first, {'action': 'preferences', 'clear': True})

tomorrow = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)).isoformat()
for mode in ['delivery', 'pickup', 'table']:
    draft = {'mode': mode, 'cart': {} if mode == 'table' else {'chickenjoy': 1},
        'address': '123 Đường Kiểm Thử, Quận 1', 'branch': 'Quận 3', 'people': 2,
        'when': 'asap' if mode == 'delivery' else tomorrow, 'notes': 'QA cục bộ',
        'name': 'Khách thử nghiệm', 'phone': '0900000000'}
    order_id = str(uuid.uuid4())
    result, _ = call(first, {'action': 'order', 'id': order_id, 'draft': draft})
    assert result['order']['total'] == {'delivery': 48000, 'pickup': 33000, 'table': 0}[mode]
    assert any(order['id'] == order_id for order in call(first)[0]['orders'])
    assert not any(order['id'] == order_id for order in call(second)[0]['orders'])
    call(second, {'action': 'cancel', 'id': order_id, 'version': 1}, expected=400)
    call(first, {'action': 'cancel', 'id': order_id, 'version': 1})

print('PASS: public Worker guest isolation, CSRF, forged identity rejection and all three order flows.')
