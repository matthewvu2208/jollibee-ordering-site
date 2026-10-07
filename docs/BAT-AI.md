# Bật AI hội thoại cho Jollibee

Kết nối OpenAI hiện mặc định **tắt** theo yêu cầu ngày 08/10/2026, kể cả khi máy đã có API key. Chatbot chạy theo kịch bản và không gửi tin nhắn đến OpenAI. Câu đùa trong chế độ này là câu viết sẵn.

## Cấu hình trên máy Mac

1. Tạo API key tại https://platform.openai.com/api-keys và kiểm tra dự án API có hạn mức sử dụng. Việc có quyền dùng ChatGPT không xác nhận dự án API đã được cấu hình.

2. Chỉ khi muốn bật lại AI, tạo tệp `.dev.vars` ở thư mục gốc dự án và cấu hình `OPENAI_CHAT_ENABLED=true`, `OPENAI_API_KEY` và `OPENAI_MODEL`. Đặt `OPENAI_CHAT_ENABLED=false` hoặc bỏ biến này để giữ chatbot theo kịch bản.

3. Thay giá trị mẫu bằng key của bạn ngay trong tệp trên máy. Không gửi key qua chat, không đưa vào mã giao diện, không dùng tiền tố NEXT_PUBLIC hoặc VITE cho key. `.dev.vars*` đã được loại khỏi Git.
4. Khởi động lại máy chủ: dừng `npm run dev` đang chạy bằng Ctrl+C trong Terminal, rồi chạy lại `npm run dev` trong thư mục dự án. Mở địa chỉ được in ra và tải lại trang.
5. Khi cấu hình được nhận, dòng dưới khung chat đổi thành **AI hội thoại · Nội dung chat được gửi đến OpenAI**. Đây là trạng thái có cấu hình; gửi một tin nhắn mới để xác nhận key/model/hạn mức thực sự hoạt động. Nếu gọi API thất bại, UI báo mất kết nối và giữ nguyên giỏ hàng.

Nếu website báo **“Tài khoản API đã hết credit”**, key đã được nhận nhưng dự án OpenAI API chưa còn credit để chạy mô hình. Kiểm tra phần Billing tại https://platform.openai.com/settings/organization/billing/. Sau khi có credit, gửi lại tin nhắn thử; không cần gửi key cho Codex.

Model mặc định là GPT-4.1 mini; có thể đổi `OPENAI_MODEL` sang model mà tài khoản được phép dùng, hỗ trợ Responses API và Structured Outputs. Cần kiểm tra lại sau khi đổi model.

## Điều AI được làm

- Đọc tối đa 16 tin nhắn gần nhất, bản nháp hiện tại và khẩu vị nếu khách cho phép sử dụng.
- Trò chuyện tự nhiên, đáp lời khen bằng câu đùa nhẹ; không đùa khi khách phàn nàn.
- Hiểu sửa ý theo ngữ cảnh, ví dụ “5 miếng mà”; đề xuất thay đổi bản nháp bằng dữ liệu có cấu trúc.
- Máy chủ kiểm tra ID món, số lượng, ngày giờ và các trường hợp lệ trước khi gửi bản nháp về giao diện.
- Khi khách sửa giỏ hàng trên giao diện trong lúc AI đang trả lời, kết quả cũ bị bỏ để không ghi đè.

AI không có công cụ xác nhận đơn, sửa giá, tạo khuyến mại, thu tiền hay hoàn tiền. Các bước này vẫn do API nghiệp vụ và xác nhận trên giao diện quản lý. Không có kết nối nhà hàng/shipper thật. Thông tin dị ứng không được suy đoán.

## Dữ liệu, hạn mức và kiểm thử

Nội dung chat có thể bao gồm thông tin khách tự nhập như tên, số điện thoại và địa chỉ; khi bật AI, chúng được gửi đến OpenAI cùng bản nháp. Request sử dụng `store: false`; điều này không đồng nghĩa cam kết không có mọi loại lưu giữ phía nhà cung cấp. Không ghi key hoặc nội dung chat vào log ứng dụng.

Bản concept giới hạn 12 yêu cầu/phút/người dùng trên từng Worker, 1.800 token đầu ra/lượt và timeout 20 giây. Giới hạn trong bộ nhớ này chưa phải hạn mức chi phí toàn hệ thống; cần giới hạn bền vững và theo dõi chi phí trước khi mở công khai.

Các bài kiểm thử tự động dùng phản hồi giả lập: lời khen không đổi đơn, sửa số lượng tuyệt đối, chặn ID/giá/trạng thái lạ, lỗi API và phản hồi không hoàn chỉnh. Chưa kiểm chứng chất lượng mô hình thật khi chưa có API key. Sau khi bật, thử các câu: “Gà ngon quá”, “5 miếng mà”, “Mình không hài lòng”, “Bỏ khoai giúp mình”, và kiểm tra giỏ hàng trước xác nhận.

Khi nén/chia sẻ dự án, luôn loại `.dev.vars*`, `.env*`, `node_modules`, `.wrangler`, `.sites-runtime` và các tệp secret trong `dist`. Triển khai online cần secret phía hosting; không đưa key vào mã nguồn. Sites hiện chưa tìm thấy project cũ, nên hướng dẫn này áp dụng cho bản local.

Tham khảo: https://developers.openai.com/api/docs/guides/structured-outputs và https://developers.openai.com/api/docs/models/gpt-4.1-mini
