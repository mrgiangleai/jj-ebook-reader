# Quy tắc làm việc

- Chỉ can thiệp file trong dự án. Không xóa/sửa file ngoài dự án; nếu cần phải hỏi người dùng.
- Làm đúng yêu cầu, không tự mở rộng phạm vi. Nếu yêu cầu mơ hồ và ảnh hưởng kết quả, hỏi lại.
- MỖI TASK: trước khi làm, dùng AGENTS.md + CONTEXT.md làm nguồn bàn giao/trạng thái dự án; không đọc/quét lại toàn bộ lịch sử, context cũ hoặc toàn bộ codebase. Sau đó chỉ mở đúng file code trực tiếp liên quan đến yêu cầu hiện tại. Không yêu cầu người dùng phải nhắc lại quy tắc này ở từng task.
- Task nhỏ xử lý trực tiếp; không gọi subagent/agent phụ nếu agent chính tự làm được.
- TOKEN/CONTEXT GUARD: nếu cùng một yêu cầu đã cần khoảng 8 vòng tool/model mà chưa hoàn tất, dừng mở rộng, cập nhật CONTEXT.md ngắn gọn và báo người dùng nên mở context mới. Không tiếp tục chỉ vì còn context window.
- Batch các lệnh độc lập khi hợp lý. Không poll/retry/re-read/re-build/re-test nếu chưa có lỗi hoặc thay đổi mới.
- Build/test cần thiết một lần sau thay đổi. Pass thì dừng; không tự review lại nhiều vòng.
- Commit theo task/mốc hợp lý. Nếu commit lỗi quyền/sandbox, chỉ retry tối đa 1 lần bằng cơ chế quyền phù hợp; lần hai vẫn lỗi thì dừng và báo người dùng, không loop.
- Sau khoảng 20 nội dung chỉnh sửa, cập nhật CONTEXT.md ngắn gọn; quy tắc hoặc nội dung quan trọng có thể bổ sung vào AGENTS.md khi cần.
- Khi hoàn tất feature lớn hoặc thread đã xử lý nhiều việc, cập nhật CONTEXT.md rồi handoff sang context mới.
- BROWSER TEST CLEANUP: ưu tiên tái sử dụng tab/cửa sổ test do agent đã mở. Test xong phải đóng tab/cửa sổ/browser do chính tác vụ mở nếu không còn cần. Không để browser test tích lũy qua task. Tuyệt đối không đóng tab/cửa sổ của người dùng hoặc thứ không do tác vụ hiện tại tạo.
- Trả lời/cập nhật tiến độ ngắn gọn bằng tiếng Việt.
