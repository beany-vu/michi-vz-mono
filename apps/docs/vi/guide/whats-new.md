# Có gì mới

Các bản phát hành `@michi-vz` mới nhất, mới nhất trước tiên. Cả sáu gói -
[core](https://www.npmjs.com/package/@michi-vz/core),
[wc](https://www.npmjs.com/package/@michi-vz/wc),
[react](https://www.npmjs.com/package/@michi-vz/react),
[vue](https://www.npmjs.com/package/@michi-vz/vue),
[svelte](https://www.npmjs.com/package/@michi-vz/svelte),
[angular](https://www.npmjs.com/package/@michi-vz/angular) - đánh số phiên bản cùng nhau
(mỗi bản phát hành liệt kê gói nào đã tiến xa hơn). Chi tiết theo từng commit đầy đủ nằm
trong [GitHub releases](https://github.com/beany-vu/michi-vz-mono/releases).

## v1.6.0

Phiên bản gói: react **1.6.0** · devtools **0.2.0** · insights **0.2.0** · core, wc, vue,
svelte, angular **1.5.2**.

- **DevTools 0.2.0: nút bật/tắt lá chắn Michi.** Việc mount devtools không còn che phủ
  ứng dụng của bạn nữa - nó bắt đầu như một lá chắn nổi nhỏ (huy hiệu của thư viện). Nhấp
  vào đó, hoặc nhấn `Ctrl/Cmd+Shift+M`, để mở bảng điều khiển; trạng thái mở/đóng được ghi
  nhớ theo từng trình duyệt, nên tải lại trang sẽ trở về đúng như bạn đã để lại. Góc màn
  hình đã bị một widget nổi khác chiếm? **Kéo lá chắn tới bất kỳ đâu** - vị trí đó cũng
  được ghi nhớ, và tùy chọn `buttonPosition` mới chọn góc bắt đầu. Handle có thêm
  `isOpen()`, và `<MichiVzDevtools />` (react 1.6.0) truyền `buttonPosition` xuống. Xem
  [DevTools](/vi/guide/devtools).
- **Insights 0.2.0: liên kết đa tập dữ liệu bằng `matchLabels()`.** Liên kết cùng một thực
  thể trên hai danh sách được viết khác nhau (một tệp xuất từ CRM so với một tệp xuất từ
  ERP) để hai tập dữ liệu trở thành một biểu đồ đã nối. Mặc định khớp tốt nhất theo cả hai
  chiều (mutual best match), có ngưỡng biên độ tin cậy, các hàng không khớp được trả về
  kèm gợi ý "có phải bạn muốn nói". Cơ chế băm không cần mô hình hoạt động ngoại tuyến;
  backend MiniLM còn liên kết cả từ đồng nghĩa, từ viết tắt, và bản dịch. Hãy thử bản demo
  trực tiếp [MatchLab](/vi/guide/insights#clean-match-and-search-your-data).
- **Core 1.5.2: các bản sửa hiệu năng cho trang nặng.** Cơ chế bảo vệ tính bất biến
  (idempotency) của `onChartDataProcessed` giờ ký các context bằng một hàm băm FNV-1a có
  giới hạn thay vì chuyển toàn bộ dữ liệu từng hàng thành chuỗi (một chuỗi nhiều MB mỗi
  lần render với 50 nghìn điểm dữ liệu), và việc hover trên scatter canvas/WebGPU gộp mọi
  đợt trỏ chuột dồn dập trong một khung hình thành một lượt `requestAnimationFrame` cuối
  cùng duy nhất. Các dashboard lớn vẫn phản hồi nhanh mà không cần cấu hình gì thêm.
- **Tài liệu, nay có bốn ngôn ngữ.** Trang web nói tiếng Anh, tiếng Pháp, tiếng Hà Lan và
  tiếng Việt, với bộ chuyển ngôn ngữ trên thanh điều hướng - mọi trang hướng dẫn, biểu đồ và API
  đều được dịch. Rất hoan nghênh đóng góp cho bản dịch; xem liên kết **Giúp dịch thuật** ở chân
  trang.
- **Trang chủ sắc nét hơn.** Trang chủ giờ dẫn dắt bằng câu chuyện DevTools và bốn trụ cột bằng
  ngôn ngữ tự nhiên - kiểm tra mọi thứ, biểu đồ mà máy đọc được, mặc định dễ tiếp cận, và chạy
  cục bộ. Chân trang mới mời bạn gắn sao cho kho mã, tham gia cộng đồng, đóng góp và giúp dịch
  thuật. Lá chắn Michi là favicon của trang web và nằm cạnh tiêu đề thanh điều hướng, và mỗi
  trang đều có mô tả riêng và thẻ chia sẻ mạng xã hội riêng.

## v1.5.0

- **DevTools đã có mặt: `@michi-vz/devtools` 0.1.0, bản phát hành công khai đầu tiên.**
  Một bảng điều khiển ngay trong trang (không cần tiện ích mở rộng trình duyệt) kiểm tra
  trạng thái trực tiếp của mọi biểu đồ qua tám tab - Overview (với chỉnh sửa trực tiếp +
  **Reset chart**), Sizing, Scales, Diff, Hit-test, Profiler, Insights, và một tab kiểm
  toán A11y. Cách ly bằng Shadow DOM, có thể thay đổi kích thước, sáng + tối, mặc định chỉ
  dành cho môi trường phát triển với một điểm vào `/production` vô hại, và một dòng React
  duy nhất: `<MichiVzDevtools />`. Xem [DevTools](/vi/guide/devtools).
- **Insights 0.1.0: AI minh bạch và ưu tiên cục bộ.**
  [Phương pháp luận](/vi/guide/insights#methodology---the-exact-logic-behind-every-insight)
  giờ trình bày chi tiết logic chính xác đằng sau mỗi insight; `describeModelSource()` nêu
  rõ một backend mô hình sẽ tải gì và từ đâu **trước khi** bất cứ thứ gì được tải;
  `modelSource` chuyển hướng việc tải xuống tới một máy chủ nhân bản hoặc các tệp tự lưu
  trữ (hoặc cấm hoàn toàn); và `ollamaCaller` / `openaiCompatCaller` kết nối một AI cục bộ
  (Ollama, LM Studio, llama.cpp) chỉ trong một dòng lệnh mà không cần tải xuống gì cả. Kết
  quả phát hiện bất thường giờ mang theo phương pháp, ngưỡng, và một lời giải thích bằng
  ngôn ngữ thuần túy.
- **Core:** hook devtools có thêm các kênh hit-test tần suất cao và đo thời gian render
  (không tốn chi phí gì khi devtools tắt).

## v1.4.0

- **Đường chữ thập khi di chuột (crosshair) đã trở lại - và có thể tùy chỉnh.** Đường
  chuột dọc của LineChart giờ mặc định bật lại (khôi phục sự tương đồng với phiên bản cũ;
  bản port trước đó đã âm thầm tắt nó đi), bám vào điểm dữ liệu gần nhất thay vì bám theo
  con trỏ thô, và ẩn đi khi con trỏ rời khỏi biểu đồ - giống nhau ở cả chế độ SVG, canvas,
  và WebGPU. Tạo kiểu riêng cho từng biểu đồ bằng `enableMouseLine: { stroke, strokeWidth,
  strokeDasharray, snap }`, đặt chủ đề toàn cục bằng các biến CSS `--michi-vz-crosshair` /
  `--michi-vz-crosshair-width` / `--michi-vz-crosshair-dash`, hoặc truyền `false` để tắt nó.

## v1.3.0

- **Không bỏ sót kỳ nào trên trục x.** Trục ngày của LineChart giờ luôn giữ đúng kỳ đầu
  tiên và cuối cùng thực sự (các tick thời gian thô của `d3` trước đây thường bám vào các
  mốc tròn và loại bỏ chúng), và các nhãn bị chen chúc sẽ tự động xoay -45° rồi thu gọn
  xuống còn khoảng 5 nhãn thay vì âm thầm biến mất.
- **Dòng thời gian liên tục với `fillPeriodTicks` (Line + Area, tùy chọn).** Một tick cho
  mỗi kỳ trong khoảng, chứ không chỉ những kỳ có mặt trong dữ liệu; các kỳ bị thiếu được
  render mờ đi kèm tooltip khi hover là "không có dữ liệu", có thể tùy chỉnh qua
  `noDataTickTooltip` và `noDataTickColor`.

## v1.2.1

- **Mỗi trang npm liên kết tới các gói anh em.** README của mỗi gói giờ có một bảng *Gói
  framework* liên kết tới cả sáu gói, nên từ bất kỳ wrapper nào bạn cũng có thể đến được
  các gói còn lại. Một liên kết monorepo bị hỏng đã được sửa.
- **Cả sáu gói được đồng bộ lại.** `vue`, `angular`, `svelte`, và `wc` từng chậm hơn một
  phiên bản trên npm; giờ chúng được phát hành cùng lúc với `core` và `react` ở cùng một
  phiên bản.
- **Khả năng khám phá tài liệu.** Bảng [Cài đặt](/vi/guide/installation) liên kết mỗi gói
  tới npm, và có một nút npm ở trang chủ cùng một biểu tượng npm trên thanh điều hướng
  trên cùng.

## v1.2.0

Bản phát hành **tương thích thay thế trực tiếp** (drop-in compatibility): các gói
`@michi-vz/*` theo scope có thể thay thế gói đơn lẻ cũ `michi-vz` mà không gây hồi quy cho
bất kỳ biểu đồ nào. Mọi thứ đều tương thích ngược.

- **Context không phụ thuộc renderer.** `legendData` (hợp đồng màu theo từng chuỗi dữ liệu
  dành cho canvas / các consumer ở chế độ skip) trên context của Line/Gap/Area/Scatter/
  BarBell/Radar; `renderedData` / `visibleItems`; mọi `on*Processed` giờ có tính bất biến
  (idempotent), nên chỉ kích hoạt khi context thực sự thay đổi và không bao giờ lặp vô hạn.
- **LineChart.** Trạng thái đang tải / không có dữ liệu, cấu hình trục (`yTicks`, đường
  lưới, tô nổi bật đường số 0), `fontFamily`, và `svgChildren` do consumer cung cấp.
- **Thêm props biểu đồ.** Chú giải hình dạng cho Gap; `maxBarHeight` / `symmetricXDomain`
  cho Comparable; xoay nhãn + `keys` cho VerticalStackBar; band scale, crosshair, và hình
  dạng theo từng điểm cho Scatter; hình dạng dữ liệu kiểu cũ + hit-test dễ tính hơn cho
  Radar.
- **Trục, SEO, và a11y.** Tự động xoay và thu gọn tick thích ứng trên các trục bị chen
  chúc; `<svg>` của biểu đồ giờ mang `<title>`, `<desc>`, và `<metadata>` JSON-LD chuẩn
  schema.org.
- **Đường render WebGPU thử nghiệm** song song với SVG và canvas.

## v1.1.1

- **Bản sửa Bar-Bell.** Các vòng tròn đầu mút (end-cap) giờ render đè lên trên các đoạn
  thanh (trước đây một đoạn sau có thể vẽ đè lên đầu mút của đoạn trước), và toàn bộ đoạn
  thanh đều có thể hover để hiện tooltip, không chỉ riêng vòng tròn đầu mút.
