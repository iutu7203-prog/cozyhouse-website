# Cozy House Website

Website chính thức của hệ thống cho thuê phòng trọ **Cozy House** (2 chi nhánh: Cozy House 156 và Cozy House 220, đường Cộng Hòa, TP. Hồ Chí Minh).

Xây dựng bằng **Node.js + Express + EJS + SQLite** (dùng module `node:sqlite` tích hợp sẵn trong Node.js, không cần biên dịch native module — dễ deploy trên mọi nền tảng, kể cả Hostinger).

## Tính năng

- Trang chủ giới thiệu hệ thống, 2 chi nhánh, ưu điểm, CTA đặt phòng.
- Trang chi nhánh: danh sách phòng (ban công / phòng trong), giá, trạng thái còn trống.
- Trang chi tiết từng phòng: ảnh, tiện nghi, giá, chi phí điện nước dịch vụ.
- Trang bảng giá tổng hợp toàn bộ phòng của 2 chi nhánh.
- Trang liên hệ: form gửi yêu cầu (lưu vào database), nút gọi điện / chat Zalo trực tiếp, nút liên hệ nổi (floating) trên mọi trang.
- **Trang quản trị** (`/admin`): đăng nhập bảo mật, chỉnh sửa giá/trạng thái/tiện nghi/ảnh từng phòng, chỉnh thông tin chi nhánh, chỉnh thông tin liên hệ chung & giá điện nước dịch vụ, xem tin nhắn liên hệ từ khách, đổi mật khẩu.
- SEO cơ bản: sitemap.xml động, robots.txt, thẻ meta/Open Graph.
- Bảo mật: Helmet (CSP), giới hạn số lần submit form/đăng nhập (rate limit), mật khẩu admin mã hoá bcrypt, session lưu trong SQLite.

## Yêu cầu hệ thống

- **Node.js >= 22.5** (bắt buộc — dự án dùng module `node:sqlite` tích hợp sẵn từ Node 22.5 trở lên, khuyến nghị dùng Node 22.x hoặc 24.x). Không dùng Node 18/20.

## Cài đặt & chạy thử ở máy local

```bash
npm install
cp .env.example .env
```

Mở file `.env` vừa tạo, đổi các giá trị:
- `SESSION_SECRET`: một chuỗi ngẫu nhiên dài bất kỳ.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: tài khoản đăng nhập trang quản trị lần đầu (chỉ dùng để tạo tài khoản admin trong database — sau khi chạy lần đầu nên đổi mật khẩu ngay trong trang quản trị).

Chạy server:

```bash
npm run dev      # co tu dong reload khi sua code (can nodemon)
# hoac
npm start        # chay binh thuong
```

Mở trình duyệt tại `http://localhost:3000`. Database SQLite (`data/cozyhouse.sqlite`) và tài khoản admin sẽ tự động được khởi tạo trong lần chạy đầu tiên.

Trang quản trị: `http://localhost:3000/admin/login`

## Cấu trúc thư mục

```
cozyhouse-website/
├── server.js              # Entry point
├── src/
│   ├── db/                 # Ket noi SQLite, schema, seed du lieu, session store
│   ├── middleware/          # Auth (bao ve /admin), upload anh (multer)
│   ├── routes/              # public.js (trang khach), admin.js (trang quan tri)
│   ├── utils/format.js      # Format tien te, link Zalo/tel...
│   └── views/                # Template EJS (trang khach + trang quan tri)
├── public/                  # CSS, JS, anh minh hoa, anh upload tu admin
└── data/                     # File SQLite (khong commit len git)
```

## Cập nhật nội dung (không cần sửa code)

Đăng nhập `/admin` để:
- Sửa giá, trạng thái (còn trống / đã cho thuê), tiện nghi, ảnh của từng phòng.
- Sửa mô tả, ảnh đại diện, thang máy / PCCC của từng chi nhánh.
- Sửa số điện thoại, Zalo, tên chủ nhà, giờ hỗ trợ, giá điện/nước/dịch vụ, nội dung trang chủ — tại mục **Cài đặt chung**.
- Xem và xoá tin nhắn khách gửi từ form Liên hệ.

## Deploy lên Hostinger

Xem hướng dẫn chi tiết tại [DEPLOY.md](./DEPLOY.md).

## Ảnh minh họa

Toàn bộ ảnh phòng/chi nhánh hiện tại là **ảnh minh họa (placeholder)** dạng vẽ đơn giản theo đúng màu thương hiệu, có ghi chú "Ảnh minh họa" để khách không hiểu nhầm là ảnh thật. Hãy thay bằng ảnh thật càng sớm càng tốt qua trang quản trị (mục sửa từng phòng / từng chi nhánh, phần "Ảnh phòng" / "Ảnh đại diện chi nhánh").
