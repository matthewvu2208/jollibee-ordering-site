# Link trải nghiệm công khai trên Cloudflare

Website: https://jollibee-chatbot-demo.matthewvu2208.workers.dev

Ngày xuất bản: 06/10/2026. Bản này chạy chatbot theo kịch bản, chưa sử dụng API key OpenAI theo lựa chọn của chủ dự án.

Bản Cloudflare dùng phiên khách riêng được ký HMAC trong cookie `HttpOnly`, `Secure`, `SameSite=Lax`. Mỗi phiên chỉ đọc và chỉnh sửa đơn, khẩu vị và phản hồi của chính mình. Đây là phiên dùng thử trên trình duyệt, không phải tài khoản ChatGPT hoặc tài khoản khách hàng thật. Xóa cookie sẽ làm mất quyền xem lại dữ liệu của phiên đó.

## Chuẩn bị tài khoản và dữ liệu

1. Chạy `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js login` để đăng nhập tài khoản Cloudflare của bạn.
2. Tạo database D1 riêng tên `jollibee-chatbot-demo`; không dùng dữ liệu hay tài khoản từ bản preview trên máy.
3. Lưu thông tin tài khoản và database do Cloudflare trả về trong `.sites-runtime/cloudflare-deployment.json`:

```json
{
  "account_id": "ID_TAI_KHOAN_CLOUDFLARE",
  "database_id": "ID_DATABASE_D1"
}
```

Thư mục `.sites-runtime` được Git bỏ qua. Không lưu token hoặc API key trong tệp này.

## Build và xuất bản

```sh
npm run build:cloudflare
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --remote --config dist/server/wrangler.json
```

Tạo bí mật `DEMO_SESSION_SECRET` ngẫu nhiên dài ít nhất 32 ký tự ở phía Cloudflare. Bí mật này chỉ dùng để ký cookie, không đưa vào JavaScript của trình duyệt. Khi xoay bí mật, các phiên khách cũ sẽ hết hiệu lực.

Trước lần xuất bản đầu tiên, chạy `wrangler deploy --dry-run --config dist/server/wrangler.json` để kiểm tra gói. Cấu hình xuất bản nằm ở `dist/server/wrangler.json`, chứa entrypoint và tài nguyên trình duyệt đã build.

```sh
npm run deploy:cloudflare
```

Chỉ chia sẻ URL `workers.dev` thật do lệnh xuất bản thành công trả về. Xác minh các API, cookie, hình ảnh và ba luồng ở URL đó trước khi bàn giao.

## AI hội thoại tùy chọn

Kết nối OpenAI mặc định tắt (`OPENAI_CHAT_ENABLED=false`). Chỉ khi chủ tài khoản muốn bật lại mới chuyển biến này thành `true` và cấu hình key. Nếu chưa cấu hình `OPENAI_API_KEY` dưới dạng Cloudflare secret, chatbot chạy theo kịch bản và thông báo rõ chế độ đó. Không tải `.dev.vars` lên GitHub hoặc thư mục public. Chỉ chuyển API key lên Cloudflare khi chủ tài khoản đồng ý; các lời gọi AI sử dụng hạn mức và phí API của chủ key.

Khi bật AI, mặc định toàn website giới hạn 100 lượt gọi/ngày UTC và mỗi phiên khách 30 lượt/ngày UTC; lượt thử gọi thất bại cũng được tính. Giới hạn toàn website có thể chỉnh bằng biến `AI_DAILY_LIMIT`, tối đa 500. Các giới hạn được lưu trong D1 để áp dụng xuyên suốt các Worker instance. Ngoài ra endpoint có giới hạn theo phút. Khi hết lượt, khách vẫn chọn món, đặt bàn và xác nhận đơn bằng các điều khiển trên website được.

## Phạm vi demo

Đơn hàng, tiền thanh toán, hoàn tiền, bàn trống và thời gian giao hàng là dữ liệu thử nghiệm. Không có đơn được gửi đến Jollibee, Grab, ShopeeFood hoặc shipper; không thu tiền thật. Không dùng thông tin khách hàng thật để thử nghiệm. Việc bấm liên hệ CSKH chỉ lưu yêu cầu hỗ trợ mẫu, không gọi nhân viên thực tế.
