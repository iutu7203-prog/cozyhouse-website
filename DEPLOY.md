# Hướng dẫn Deploy lên Hostinger

Áp dụng cho gói **Hostinger Business / Cloud hosting** (hoặc VPS) có hỗ trợ **Node.js Web App** trong hPanel.

## 0. Gợi ý tên miền

Chưa có domain? Một vài gợi ý (kiểm tra tình trạng còn trống khi mua trên Hostinger):

1. `cozyhouse.vn` — ngắn gọn, dễ nhớ, đúng thương hiệu (ưu tiên nếu còn trống).
2. `cozyhousevn.com`
3. `cozyhousesaigon.com`
4. `thuecozyhouse.vn`

## 1. Chuẩn bị mã nguồn trên GitHub

Repo: `https://github.com/iutu7203-prog/cozyhouse-website`

Nếu chưa push, xem hướng dẫn ở cuối README hoặc chạy:

```bash
git remote add origin https://github.com/iutu7203-prog/cozyhouse-website.git
git branch -M main
git push -u origin main
```

## 2. Tạo Node.js Web App trong hPanel

1. Đăng nhập hPanel → chọn website/hosting plan → mục **Node.js** (hoặc **Website → Advanced → Node.js**).
2. Chọn **Create Application** (hoặc "Deploy from GitHub" nếu Hostinger hỗ trợ liên kết trực tiếp).
3. **Node.js version**: chọn **22.x hoặc 24.x** (⚠️ BẮT BUỘC — dự án dùng `node:sqlite`, module này chỉ có từ Node 22.5 trở lên. KHÔNG chọn 18.x/20.x, ứng dụng sẽ không chạy được).
4. **Application root**: thư mục chứa mã nguồn sau khi kéo về (vd: `cozyhouse-website`).
5. **Application startup file**: `server.js`.
6. Kết nối GitHub repo (nếu Hostinger hỗ trợ auto-deploy) hoặc dùng Git pull / Hostinger File Manager để upload mã nguồn, sau đó `git clone` repo vào đúng thư mục qua Terminal trong hPanel.

## 3. Cấu hình biến môi trường (Environment Variables)

Trong màn hình quản lý Node.js App của Hostinger, thêm các biến môi trường sau (lấy mẫu từ file `.env.example`):

| Biến | Giá trị |
|---|---|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | một chuỗi ngẫu nhiên dài (vd: tạo bằng `openssl rand -hex 32`) |
| `ADMIN_USERNAME` | tên đăng nhập quản trị mong muốn |
| `ADMIN_PASSWORD` | mật khẩu quản trị lần đầu (đổi ngay sau khi đăng nhập lần đầu) |
| `PORT` | thường Hostinger tự gán/tiêm biến này — chỉ thêm thủ công nếu bảng điều khiển yêu cầu |

## 4. Cài đặt & khởi động

- Hostinger thường tự chạy `npm install` khi deploy. Nếu không, vào Terminal (trong hPanel) và chạy thủ công tại thư mục ứng dụng:
  ```bash
  npm install
  ```
- Nhấn **Start / Restart Application**. Ứng dụng tự tạo database SQLite (`data/cozyhouse.sqlite`) và tài khoản admin trong lần chạy đầu tiên — **không cần chạy lệnh khởi tạo thủ công**.
- Kiểm tra log ứng dụng trong hPanel nếu có lỗi khi khởi động.

## 5. Gắn domain & SSL

1. Trong hPanel, trỏ domain (hoặc subdomain) vào Node.js App vừa tạo.
2. Bật **SSL miễn phí (Let's Encrypt)** cho domain — Hostinger thường tự động cấp sau khi domain trỏ đúng.
3. Chờ DNS cập nhật (có thể mất vài phút đến vài giờ nếu domain mới trỏ).

## 6. Đăng nhập quản trị lần đầu

1. Truy cập `https://<domain-cua-ban>/admin/login`.
2. Đăng nhập bằng `ADMIN_USERNAME` / `ADMIN_PASSWORD` đã đặt ở bước 3.
3. Vào **Cài đặt chung → Đổi mật khẩu quản trị**, đặt mật khẩu mới ngay lập tức.
4. (Khuyến nghị) Xoá hoặc thay giá trị `ADMIN_PASSWORD` trong biến môi trường sau khi đã đổi mật khẩu qua giao diện, để tránh lộ mật khẩu gốc trong cấu hình server.
5. Cập nhật ảnh thật cho từng phòng / từng chi nhánh (ảnh hiện tại là ảnh minh họa tạm).

## 7. Sao lưu dữ liệu (quan trọng)

Toàn bộ dữ liệu (giá phòng, trạng thái, ảnh upload, tin nhắn liên hệ) được lưu trong:

- `data/cozyhouse.sqlite` — database chính.
- `public/uploads/` — ảnh upload từ trang quản trị.

Hai thư mục này **không nằm trong Git** (được `.gitignore` loại trừ) nên **sẽ không tự động có bản sao lưu**. Định kỳ tải 2 thư mục này về máy qua File Manager/FTP của Hostinger, đặc biệt trước khi thực hiện deploy lại hoặc thay đổi lớn.

## 8. Deploy các lần cập nhật code sau này

```bash
git add -A
git commit -m "Mo ta thay doi"
git push origin main
```

Sau đó vào hPanel bấm **Redeploy / Pull latest** (hoặc `git pull` thủ công qua Terminal trong hPanel) rồi **Restart Application**. Vì `data/` và `public/uploads/` không nằm trong Git, việc deploy lại **không ảnh hưởng** tới giá phòng/ảnh đã cập nhật qua trang quản trị.

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân khả dĩ | Cách xử lý |
|---|---|---|
| App không khởi động, log báo lỗi liên quan `node:sqlite` | Đang chọn Node.js version < 22.5 | Vào cấu hình Node.js App, đổi sang version 22.x hoặc 24.x, Restart |
| Đăng nhập `/admin` báo sai tài khoản dù đúng | `ADMIN_USERNAME`/`ADMIN_PASSWORD` chỉ có hiệu lực ở **lần khởi động đầu tiên** (khi database còn trống) | Nếu đã từng chạy trước đó với giá trị khác, tài khoản admin đã được tạo theo giá trị cũ — dùng lại giá trị cũ hoặc xoá `data/cozyhouse.sqlite` để tạo lại (sẽ mất toàn bộ dữ liệu đã chỉnh sửa, chỉ làm khi thực sự cần) |
| Ảnh vừa upload không hiển thị | Thư mục `public/uploads` bị dọn dẹp khi deploy lại | Kiểm tra cấu hình deploy của Hostinger có giữ lại thư mục ngoài Git hay không; luôn sao lưu định kỳ theo mục 7 |
