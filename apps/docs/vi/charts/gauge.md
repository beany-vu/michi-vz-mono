---
title: Biểu đồ vòng cung
description: "Biểu đồ vòng cung đồng tâm: mỗi vòng quét value/max của một vòng tròn đầy đủ trên nền rãnh, kích hoạt khi di chuột và có phần hiển thị trung tâm tích hợp."
---
# Biểu đồ vòng cung

<span class="vp-badge tip">Composition</span>

"Mỗi chỉ số đang ở đâu, trên cùng một thang đo?" Biểu đồ vòng cung trả lời bằng các vòng đồng tâm, từ ngoài vào trong: mỗi vòng quét `value / max` của một vòng tròn đầy đủ, theo chiều kim đồng hồ từ vị trí 12 giờ, trên một rãnh nền. Di chuột lên một vòng sẽ **kích hoạt** nó (nhấn mạnh + phần hiển thị trung tâm tích hợp); `defaultActive` chọn vòng hiển thị mặc định, và vòng có giá trị `null` chỉ vẽ rãnh nền - "không có dữ liệu" mà không ẩn biểu đồ.

<ChartDemo chart="gauge-chart" :legend="false" />

Hầu như mọi thứ đều cấu hình được: độ dày và khoảng cách vòng, màu và độ mờ rãnh theo từng vòng, góc bắt đầu, đầu bo tròn, độ mờ cung theo từng vòng (thiết kế một màu), và phần trung tâm - thay hoàn toàn bằng `centerContent`, hoặc tắt bằng `showCenterLabel: false` và tự điều khiển lớp phủ qua `onHighlightItem`:

<ChartDemo chart="gauge-chart" :index="1" :legend="false" />

> Các vòng dùng chung một thang đo (`max`, mặc định 100). Với các giá trị khác thang đo, hãy chuẩn hoá trước - hoặc dùng [biểu đồ thanh so sánh](/vi/charts/comparable), đọc giá trị tuyệt đối chính xác hơn.

## Khi nào nên dùng

- **Thị phần lồng nhau.** Thị phần của một sản phẩm trên các phạm vi lồng nhau (thế giới, khu vực, thị trường) trong một hình gọn.
- **Vòng tiến độ / KPI.** Kiểu vòng hoạt động: một màu với các mức độ mờ theo vòng, `roundedCaps`, và phần trung tâm tuỳ chỉnh.

## Trình kết xuất

`renderer: "svg"` (mặc định), `"canvas"` (cùng các vòng trên canvas 2D; CSS của bên dùng vẫn tới được các cung qua đầu dò màu), hoặc `"webgpu"` <span class="vp-badge warning">Thử nghiệm</span> (dải vành khuyên trên GPU; tạm dùng canvas cho tới khi thiết bị sẵn sàng).
