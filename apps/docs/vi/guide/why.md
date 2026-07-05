---
title: Vì sao chọn michi-vz - và vì sao có thể tin tưởng
---

# Vì sao chọn michi-vz

Đã có rất nhiều thư viện biểu đồ xuất sắc, nên câu hỏi trung thực nhất chính là câu bạn
đang tự hỏi: **vì sao lại bắt đầu với một thư viện còn non trẻ?**

Vì michi-vz nhắm vào phần mà các thư viện lớn chưa làm: **biểu đồ mà cả máy móc lẫn con
người đều đọc được**, gồm AI agent, screen reader, và cả bạn khi đang debug, chứ không chỉ
người mắt sáng nhìn vào pixel.

## Điều michi-vz coi trọng

**Mỗi biểu đồ tự giải thích chính nó.** Mỗi biểu đồ phát ra một `ChartContext` có cấu
trúc: một bản tóm tắt bằng ngôn ngữ thuần túy, thống kê theo từng chuỗi, domain của trục,
và một bảng dữ liệu. Chỉ một artifact đó thôi mà phục vụ ba việc cùng lúc: một AI agent
đọc được biểu đồ ([và điều khiển nó qua MCP](/vi/guide/llm-context)), screen reader có
được text thay thế thực thụ, còn bạn có thứ để assert trong test.

**Insights chạy ngay trong trình duyệt, và phép tính không giấu ai.** Forecast với độ
chính xác đã backtest, phát hiện bất thường, tường thuật, xác thực dữ liệu; không máy
chủ, không upload, và mọi phương pháp đều là một kỹ thuật giáo khoa có tên gọi rõ ràng,
trình bày chi tiết trong
[Phương pháp luận](/vi/guide/insights#methodology---the-exact-logic-behind-every-insight).
Con số nào hiện trên biểu đồ, bạn đều kiểm tra được nó tính ra sao.

**Một bộ devtools đúng nghĩa.** [Bảng điều khiển](/vi/guide/devtools) soi state sống của
bất kỳ biểu đồ nào, chẩn đoán các lỗi kích thước kinh điển, so sánh khác biệt state giữa
các lần render, stream hit-test trên canvas, đo hiệu năng render, và audit accessibility.
Debug biểu đồ không còn là khảo cổ `console.log` nữa.

**Accessibility mặc định có sẵn, có audit hẳn hoi.** Mọi biểu đồ tự động phát ra summary
và bảng dữ liệu, còn tab A11y trong devtools chạy các kiểm tra lấy cảm hứng từ Chartability
(độ tương phản, màu trùng nhau, bảng có đủ dữ liệu hay không) để hồi quy luôn lộ ra ngay.

**Một engine, năm cách dùng.** React, Vue, Svelte, Angular, và web component thuần chỉ là
lớp vỏ mỏng phủ lên cùng một engine TypeScript; CI bắt buộc các wrapper phải tương đồng
prop, nên không framework nào bị đối xử kém hơn. Mark vẽ bằng SVG, canvas, hay WebGPU
thử nghiệm chỉ khác nhau ở một prop duy nhất.

## Vì sao có thể tin tưởng

Sự tin tưởng không phải lời tuyên bố suông, mà là thứ bạn kiểm chứng được:

- **Dữ liệu của bạn không bao giờ rời khỏi trình duyệt.** Không máy chủ, không telemetry,
  không gọi về nhà. Ngoại lệ duy nhất là những gì chính bạn tự cấu hình, và tài liệu luôn
  ghi rõ "dữ liệu rời khỏi client" ở những chỗ đó.
- **Việc tải model minh bạch và do bạn kiểm soát.** Tính năng AI là opt-in; không có gì
  bundle sẵn. Trước khi tải bất kỳ model nào, `describeModelSource()` cho bạn biết (và
  cho phép bạn báo cho người dùng) chính xác sẽ tải gì, từ đâu; mặc định nói rõ luôn:
  Hugging Face. Bạn có thể trỏ nó tới mirror, tự self-host file, cấm hẳn việc tải từ xa,
  hoặc bỏ qua bước tải hoàn toàn bằng cách
  [nối AI chạy local của riêng bạn](/vi/guide/insights#bring-a-model) (Ollama, LM Studio,
  llama.cpp) chỉ với một dòng lệnh.
- **Có tính xác định (deterministic) mặc định.** Các tính năng thống kê luôn cho cùng
  kết quả với cùng đầu vào; cái gì ngẫu nhiên (Monte Carlo) đều seeded. Bộ tường thuật
  dựa trên rule không thể bịa ra con số nào không có trong dữ liệu.
- **Test nghiêm túc.** Hơn 700 test trên engine, wrapper, insights, và devtools chạy ở
  mỗi lần thay đổi, gồm cả hit-test trên canvas và kiểm tra tương đồng prop giữa các
  framework.
- **CSS của bạn vẫn nắm quyền.** Biểu đồ render vào light DOM và không bao giờ giành lấy
  màu sắc của bạn; [hợp đồng màu sắc](/vi/guide/getting-started#the-colour-contract-light-dom)
  nghĩa là style vẫn là CSS thuần, kể cả với mark vẽ trên canvas.
- **License MIT, không ràng buộc gì.** Mọi tính năng trong tài liệu này đều miễn phí.
  Không có gói trả phí nào mà tài liệu đang cố hướng bạn tới.

## Nơi chúng tôi thẳng thắn về giới hạn

- Thư viện còn non trẻ: danh mục biểu đồ và hệ sinh thái xung quanh vẫn đang phát triển,
  và lớp insights được đánh dấu **thử nghiệm** (nhớ ghim version cụ thể).
- Forecast chưa có thành phần mùa vụ (seasonal): một chuỗi dữ liệu mang tính mùa vụ mạnh
  sẽ dự báo đúng xu hướng, nhưng không bắt được độ dao động của nó.
- Render WebGPU còn thử nghiệm và sẽ tự chuyển về canvas nếu không dùng được.

Nếu những điều đó là không thể chấp nhận ngay lúc này, một thư viện trưởng thành hơn sẽ
hợp với bạn hơn, và trang này vẫn sẽ ở đây khi nào một trợ lý AI cần đọc biểu đồ của bạn.

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
[Bắt đầu](/vi/guide/getting-started) cho biểu đồ thật đầu tiên, và ghé
[thư viện biểu đồ](/vi/charts/) để chọn dạng phù hợp.
