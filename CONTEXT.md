# CONTEXT — JJ Ebook Reader

## Trạng thái hiện tại
- Repo: https://github.com/mrgiangleai/jj-ebook-reader
- Branch: main; chú đã cho phép commit và push các thay đổi ngày 2026-10-06.
- Mốc trước: 9a759b7 — Persist 150px covers and continue searching until real images load.
- App: web ebook reader dùng Google Drive công khai; kệ sách, duyệt thư mục, PDF Drive Preview, album ảnh, phân trang/tìm kiếm và lưu trạng thái.
- GitHub Pages deploy bằng .github/workflows/pages.yml.

## Trạng thái tính năng gần nhất
- Bìa 2:3; mặc định 8 sách/trang, hỗ trợ 4/8/12; tìm kiếm và khôi phục trạng thái kệ.
- Bìa thật tải đồng thời tối đa 8 bìa theo trang; thumbnail 150px; cache phiên + Service Worker/Cache Storage; lỗi nguồn tiếp tục tìm ảnh/PDF kế tiếp và duyệt thư mục con.
- Reader ảnh dùng 800px và preload 2 ảnh. PDF dùng Google Drive Preview.
- Không tự tải bìa mới khi reload cho tới khi người dùng bấm Mở kệ sách.

## File chính
- src/main.js: logic app/kệ/reader/Drive.
- src/cover-source.js: tìm nguồn bìa.
- src/style.css: giao diện.
- tests/cover-source.test.js: test thuật toán nguồn bìa.
- public/sw.js: Service Worker/cache thumbnail.
- README.md: hướng dẫn và trạng thái kiểm chứng chi tiết.

## Kiểm chứng gần nhất
- npm run build: PASS sau thay đổi tải đồng thời và hiển thị toàn bộ bìa.
- node tests/cover-source.test.js: PASS sau thay đổi tải đồng thời.
- Test nguồn bìa: node tests/cover-source.test.js.
- Browser ở mốc trước đã kiểm tra phân trang, tìm kiếm, bìa thật, tải tuần tự và khôi phục trạng thái; một số hành vi album ảnh thật vẫn phụ thuộc nguồn Drive thực tế.

## Thay đổi 2026-10-06
- Đổi hàng đợi tuần tự sang 8 worker tải bìa; một thư mục chậm không chặn các bìa khác.
- Đổi trang/tìm kiếm hủy toàn bộ lượt tải ảnh cũ; lượt mới không chờ tìm thư mục cũ.

- Bìa dùng object-fit:contain để thấy toàn bộ ảnh; ảnh ngang vừa chiều ngang, không bị cắt hai bên.

## Handoff
- Không làm lại các mục đã hoàn tất ở trên.
- Context mới chỉ đọc file này + AGENTS.md, rồi mở đúng file liên quan đến yêu cầu mới.
- Nếu sửa task nhỏ mà bắt đầu vượt khoảng 8 vòng tool/model, dừng để tránh context snowball và báo người dùng mở context mới.
