# JJ Ebook Reader

Bản test giao diện tiếng Việt: kệ sách bìa dọc có shadow, duyệt thư mục, đọc album ảnh hai trang cạnh nhau, Prev/Next, phím mũi tên, vuốt, toàn màn hình, lưu vị trí đọc.

## Chạy

```sh
npm ci --cache .npm-cache
npm run dev
npm run build
```

## Drive

Không có đăng nhập Google. Link mẫu được lập danh mục test trong `public/data/` từ trang Drive công khai. Snapshot chỉ có 50 thư mục đầu ở gốc và các thư mục con đã khảo sát; không phải duyệt Drive trực tiếp và có thể thiếu dữ liệu do phân trang. Các thư mục đã khảo sát chứa PDF. PDF được mở ngay trong app bằng Google Drive Preview, cuộn dọc đọc toàn bộ tập. Nút Prev/Next chuyển giữa các tập; tập cuối có nút quay lại kệ. Vị trí tập PDF đang mở được khôi phục, vị trí cuộn bên trong Drive Preview không được lưu do khác tên miền.

Muốn nhập link công khai tùy ý: bật Google Drive API trong Google Cloud, tạo API key dành cho trình duyệt, giới hạn API về Drive API và HTTP referrers về tên miền Pages. Nhập key tại “Cấu hình Drive”. Key lưu trong localStorage, không commit. API phân trang đến hết danh sách. Một số link yêu cầu resource key chưa được hỗ trợ ở bản này.

Ảnh dùng endpoint thumbnail của Drive với kích thước 800px; chưa xác minh tải ảnh thực tế vì nguồn mẫu là PDF. Không đảm bảo đây là ảnh nguyên bản. Không dùng proxy công cộng bên thứ ba.

## GitHub Pages

Workflow `.github/workflows/pages.yml` build và deploy nhánh `main`. Sau khi tạo repo, đặt Settings → Pages → Source: GitHub Actions. Build dùng đường dẫn tương đối để hoạt động trong project Pages.

## Trạng thái kiểm chứng

- `npm run build`: PASS.
- Giao diện kệ sách đã mở trong trình duyệt cục bộ.
- Danh sách thư mục và phát hiện PDF: dữ liệu Drive thật.
- Đọc hai ảnh, vuốt và tải trước ảnh: chưa kiểm chứng với album ảnh thật.
- Repository: https://github.com/mrgiangleai/jj-ebook-reader
- Website: https://mrgiangleai.github.io/jj-ebook-reader/

## Cập nhật kệ sách

- Bìa cùng khổ 2:3 theo kích thước màn hình, tiêu đề tự giảm cỡ chữ để vừa vùng bìa.
- Mặc định 8 album/trang; chọn 4/8/12 và dùng Trang trước/Trang sau.
- Tìm theo tiêu đề trong thư mục đang mở, lọc trước khi phân trang.
- Lưu thư mục, trang kệ, số sách/trang, từ khóa; khôi phục khi mở lại cùng trình duyệt. Nếu đang đọc album ảnh, mở lại trình đọc và vị trí đã lưu.
- Đã kiểm tra trong trình duyệt: số album 4/8/12, tìm tiêu đề dài, bìa cùng kích thước, tự giảm chữ, khôi phục trang 2 và từ khóa sau reload. Build PASS. Khôi phục trình đọc chưa kiểm chứng với nguồn ảnh thật.

## Mở sách

Bấm bìa có hiệu ứng zoom và blur trong 280ms, sau đó mở thư mục hoặc trình đọc. Người bật giảm chuyển động sẽ bỏ hiệu ứng. PDF dùng iframe Google Drive Preview, không sao chép nội dung PDF vào repository. Các nút chuyển tập nằm ngoài iframe nên vẫn thao tác được khi PDF đang tải.

## Bìa thật và tải theo trang

Bìa PDF dùng thumbnail trang đầu của Google Drive. Bìa thư mục lấy ảnh/PDF đầu tiên theo tên, hoặc duyệt sâu các thư mục con theo thứ tự tên, bỏ qua nhánh trống hoặc không truy cập được. Ảnh bìa chỉ bắt đầu tải khi bấm Mở kệ sách; tải tuần tự cho các album của trang hiện tại. Chuyển trang hủy ảnh đang tải của trang cũ; không tải trước bìa trang kế tiếp. Bìa lỗi giữ tiêu đề dự phòng. Khi reload vẫn khôi phục trang kệ nhưng chưa tải ảnh hay tự mở PDF cho đến thao tác của người dùng.

Đã kiểm tra browser: mặc định 8, không có yêu cầu ảnh bìa trước nút mở kệ, tải lần lượt và hiện ảnh thật, đổi trang bắt đầu với 1 ảnh, reload khôi phục trang 2 với 0 ảnh yêu cầu.

Bìa dùng thumbnail nhỏ 150px thay vì 600px để ưu tiên tốc độ. Danh sách thư mục được cache trong phiên để tránh gọi lại khi quay về trang đã xem. Cache được xóa khi đổi cấu hình API key. Kiểm tra thuật toán: `node tests/cover-source.test.js` (thư mục trống, thứ tự số tự nhiên, nhánh lỗi, hủy khi đổi trang, vòng lặp, PDF).

## Cache bìa lâu dài

Service worker lưu ảnh thumbnail 150px vào Cache Storage và ánh xạ nguồn thật trong localStorage theo link gốc. Reload chỉ phục hồi bìa từ cache, không tải ảnh mới từ Drive. Bấm Mở kệ sách tạo phiên nguồn mới để tải mới từ Drive. Ảnh lỗi sẽ thử ảnh/PDF kế tiếp rồi duyệt các thư mục con theo thứ tự, chỉ nhận nguồn khi ảnh tải thành công. Nếu toàn bộ nguồn không truy cập được, báo Chưa tải được ảnh bìa; không tạo ảnh giả. Trình đọc ảnh rời dùng 800px và tải trước 2 ảnh. PDF vẫn dùng Drive Preview, app không điều khiển được độ phân giải nội bộ của Google.
