---
title: Vì sao chọn michi-vz - và vì sao có thể tin tưởng
---

# Vì sao chọn michi-vz

Đã có rất nhiều thư viện biểu đồ xuất sắc, nên câu hỏi trung thực nhất chính là câu bạn
đang tự hỏi: **vì sao lại bắt đầu với một thư viện còn non trẻ?**

Bởi vì michi-vz được xây dựng cho phần của việc vẽ biểu đồ mà các thư viện lớn chưa được
thiết kế cho: **những biểu đồ mà máy móc và mọi người đều có thể đọc được** - tác nhân AI,
trình đọc màn hình, và cả nhà phát triển đang gỡ lỗi - chứ không chỉ dành cho người sáng
mắt nhìn vào điểm ảnh.

## Điều michi-vz coi trọng

**Mỗi biểu đồ tự giải thích chính nó.** Mỗi biểu đồ phát ra một `ChartContext` có cấu
trúc: một bản tóm tắt bằng ngôn ngữ thuần túy, thống kê theo từng chuỗi dữ liệu, miền giá
trị của trục, và một bảng dữ liệu. Chỉ một tạo phẩm đó thôi mà cấp năng lượng cho ba việc
cùng lúc - một tác nhân AI có thể đọc biểu đồ
([và điều khiển nó qua MCP](/vi/guide/llm-context)), trình đọc màn hình có được một
phương án thay thế văn bản thực thụ, và bạn có thứ để khẳng định trong các bài kiểm thử.

**Insights, ngay trong trình duyệt, với phép toán được phơi bày.** Dự báo với độ chính
xác đã qua kiểm định hậu nghiệm (backtest), phát hiện bất thường, tường thuật, xác thực
dữ liệu - không máy chủ, không tải lên, và mọi phương pháp đều là một kỹ thuật giáo khoa
có tên gọi rõ ràng, được trình bày chi tiết trong
[Phương pháp luận](/vi/guide/insights#methodology---the-exact-logic-behind-every-insight).
Nếu một con số xuất hiện trên biểu đồ của bạn, bạn có thể kiểm tra xem nó được tính như
thế nào.

**Một devtools đúng nghĩa.** [Bảng điều khiển](/vi/guide/devtools) kiểm tra trạng thái
trực tiếp của bất kỳ biểu đồ nào, chẩn đoán các lỗi kích thước kinh điển, so sánh khác
biệt trạng thái giữa các lần render, phát trực tiếp các phép kiểm tra va chạm (hit-test)
trên canvas, đo hiệu năng render, và kiểm toán khả năng truy cập. Gỡ lỗi biểu đồ không
còn là việc khảo cổ `console.log` nữa.

**Khả năng truy cập theo mặc định, được kiểm toán.** Bản tóm tắt và bảng dữ liệu được
mọi biểu đồ tự động phát ra, và tab A11y trong devtools chạy các kiểm tra lấy cảm hứng
từ Chartability (độ tương phản, màu trùng lặp, tính đầy đủ của bảng) để các hồi quy luôn
hiện rõ.

**Một engine, năm cách sử dụng.** React, Vue, Svelte, Angular, và web component thuần
đều là các lớp vỏ mỏng phủ lên cùng một engine TypeScript - sự tương đồng props giữa các
wrapper được CI thực thi bắt buộc, nên không framework nào là công dân hạng hai. Các mark
được vẽ bằng SVG, canvas, hoặc WebGPU thử nghiệm chỉ đằng sau một prop duy nhất.

## Vì sao có thể tin tưởng

Sự tin tưởng không phải là lời tuyên bố suông, mà là điều có thể kiểm chứng được:

- **Dữ liệu của bạn không bao giờ rời khỏi trình duyệt.** Không máy chủ, không đo từ xa,
  không gọi về nhà. Những ngoại lệ duy nhất là những gì bạn tự cấu hình rõ ràng, và chúng
  được ghi chú "dữ liệu rời khỏi client" trong tài liệu.
- **Việc tải mô hình minh bạch và nằm trong tầm kiểm soát của bạn.** Các tính năng AI là
  tùy chọn (opt-in); không có gì được đóng gói sẵn. Trước khi bất kỳ mô hình nào được tải,
  `describeModelSource()` cho bạn biết (và cho phép bạn thông báo với người dùng) chính
  xác những gì sẽ được tải xuống và từ đâu - mặc định được nêu rõ ràng: Hugging Face. Bạn
  có thể trỏ nó tới một máy chủ nhân bản (mirror), tự lưu trữ (self-host) các tệp, cấm
  hoàn toàn việc tải từ xa, hoặc bỏ qua việc tải xuống hoàn toàn bằng cách
  [kết nối AI cục bộ của riêng bạn](/vi/guide/insights#bring-a-model) (Ollama, LM Studio,
  llama.cpp) chỉ trong một dòng lệnh.
- **Có tính xác định theo mặc định.** Các tính năng thống kê cho ra cùng một kết quả với
  cùng một đầu vào, mọi lần; bất cứ điều gì ngẫu nhiên (Monte Carlo) đều được gieo hạt
  (seeded). Bộ tường thuật dựa trên quy tắc không thể bịa ra một con số không có trong dữ
  liệu.
- **Được kiểm thử nghiêm túc.** Hơn 700 bài kiểm thử trên engine, các wrapper, insights,
  và devtools chạy ở mỗi lần thay đổi - bao gồm cả kiểm tra va chạm trên canvas và sự
  tương đồng props giữa các framework.
- **CSS của bạn vẫn nắm quyền kiểm soát.** Biểu đồ render vào light DOM và không bao giờ
  chiếm quyền màu sắc của bạn - [hợp đồng màu sắc](/vi/guide/getting-started#the-colour-contract-light-dom)
  nghĩa là việc tạo kiểu vẫn là CSS thuần túy, kể cả với các mark được vẽ trên canvas.
- **Cấp phép MIT, không ràng buộc.** Mọi tính năng trong tài liệu này đều miễn phí. Không
  có gói trả phí nào mà tài liệu đang dẫn dắt bạn tới.

## Nơi chúng tôi thẳng thắn về giới hạn

- Thư viện còn non trẻ: danh mục biểu đồ và hệ sinh thái xung quanh nó vẫn đang phát
  triển, và lớp insights được đánh dấu là **thử nghiệm** (hãy ghim một phiên bản cụ thể).
- Dự báo chưa có thành phần mùa vụ (seasonal) - một chuỗi dữ liệu mang tính mùa vụ mạnh sẽ
  dự báo xu hướng của nó, chứ không phải độ dao động của nó.
- Render WebGPU là thử nghiệm và sẽ chuyển về canvas nếu không khả dụng.

Nếu đó là những điều không thể chấp nhận ngay hôm nay, một thư viện trưởng thành hơn sẽ
phục vụ bạn tốt hơn - và trang này vẫn sẽ ở đây khi một trợ lý AI cần đọc biểu đồ của bạn.

## Thử trong sáu mươi giây

Không cần bước build nào cả:

```html
<!-- pin the version you audited; add an integrity hash if your policy requires SRI -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc@1.4.0"></script>

<michi-vz-line-chart id="c" width="600" height="300"></michi-vz-line-chart>
<script>
  document.getElementById("c").dataSet = [
    { label: "North", series: [
      { date: 2020, value: 10, certainty: true },
      { date: 2021, value: 14, certainty: true },
      { date: 2022, value: 19, certainty: true },
    ]},
  ];
</script>
```

Sau đó: [Cài đặt](/vi/guide/installation) cho framework của bạn,
[Bắt đầu](/vi/guide/getting-started) cho biểu đồ thực đầu tiên, và
[thư viện biểu đồ](/vi/charts/) để chọn một dạng.
