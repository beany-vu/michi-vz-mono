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

## Nửa biểu đồ vòng cung và dải màu chuyển sắc

`sweepAngle` thu hẹp biểu đồ từ một vòng tròn đầy đủ thành một cung, theo chiều kim đồng hồ từ `startAngle`; `gradient` thay màu đặc của một vòng bằng dải màu chuyển sắc tuyến tính nhiều điểm dừng. Nửa biểu đồ vòng cung kinh điển là `startAngle: -90, sweepAngle: 180`:

<ChartDemo chart="gauge-chart" :index="2" :legend="false" />

Hai điều dễ hiểu sai khi đọc lần đầu:

- **Rãnh nền cũng quét theo góc quét.** Rãnh nền của nửa biểu đồ là một nửa vòng tròn, không phải vòng tròn đầy đủ - `sweepAngle` rút ngắn cả rãnh nền lẫn cung giá trị cùng nhau, nên không có "nửa còn lại" nào bị ẩn lộ ra.
- **Dải màu chuyển sắc được neo theo toàn bộ góc quét, không theo phần được vẽ.** Một màu nhất định luôn ứng với cùng một *giá trị*, không phải cùng một vị trí trên cung thực tế được vẽ - vì vậy một biểu đồ đầy một nửa sẽ hiển thị nửa đầu của dải màu, chứ không phải toàn bộ dải màu bị nén vào nửa đó. `gradient` riêng của một vòng sẽ ghi đè lên `gradient` ở cấp biểu đồ.

## Định vị trong một khoảng

Biểu đồ vòng cung cũng trả lời được câu hỏi "giá trị này nằm ở đâu giữa mức tối thiểu và tối đa?": `min` dời điểm bắt đầu của cung khỏi số 0, `valueMarker` ghim giá trị của từng vòng lên cung, `ticks` thêm các vạch tham chiếu với nhãn và giá trị, `endLabels` đặt tên hai đầu của một cung không trọn vòng, và `sweepFit` co giãn nửa biểu đồ vừa khung của nó thay vì căn giữa một vòng tròn đầy đủ:

<ChartDemo chart="gauge-chart" :index="3" :legend="false" />

Bên dùng sở hữu mọi chuỗi văn bản: truyền `label` và `valueLabel` cho vạch hoặc nhãn đầu mút, đã dịch và định dạng sẵn; chỉ khi thiếu `valueLabel` mới dùng đến `valueFormatter`. Ba chi tiết đáng lưu ý:

- **Thang đo là `[min, max]`.** Giá trị vòng hoặc vạch nằm ngoài thang sẽ được kẹp về đầu gần nhất (kèm cảnh báo dữ liệu), nên một nhà cung cấp rẻ hơn mọi mức tham chiếu vẫn hiển thị, ghim ở điểm đầu.
- **Vạch và nhãn đầu mút mô tả thang đo, điểm đánh dấu mô tả từng vòng.** Biểu đồ nhiều vòng vẽ vạch một lần trên vòng ngoài cùng, và một điểm đánh dấu cho mỗi vòng có dữ liệu; vòng `null` vẫn giữ vạch nhưng không có điểm đánh dấu.
- **`sweepFit` dành một dải 36 px** ở mỗi cạnh khi có vạch hoặc nhãn đầu mút, và neo phần hiển thị trung tâm (`centerContent`) vào giữa khung được quét. Trên vòng tròn 360° đầy đủ chỉ áp dụng phần dải dành cho vạch.

Cả ba trình kết xuất hiển thị cùng các chú giải: ở chế độ canvas và WebGPU chúng nằm trong lớp phủ phía trên các cung được vẽ, nên CSS của bên dùng trên `.mv-gauge-tick-label`, `.mv-gauge-tick-value` và `.mv-gauge-marker` áp dụng ở mọi nơi.

## Giá trị tham chiếu khi rê chuột

Các nhãn trên cung được rút gọn có chủ đích. `annotationTooltipFormatter` cho mỗi chú giải —
điểm đánh dấu giá trị, một vạch tham chiếu, hoặc nhãn ở hai đầu mút — phần hiển thị riêng, nên
con số chính xác chỉ cách một lần rê chuột mà không làm rối biểu đồ:

<ChartDemo chart="gauge-chart" :index="4" :legend="false" />

Hàm này nhận chú giải đang nằm dưới con trỏ (`kind`, kèm `end` cho nhãn đầu mút), vị trí của
nó trên thang đo, `label` và `valueLabel` đúng như được vẽ, và `ring` mà điểm đánh dấu thuộc
về (`null` với vạch và nhãn đầu mút, vốn mô tả thang đo chứ không phải một vòng cụ thể). Trả
về `null` hoặc `""` để không hiển thị gì cho chú giải đó.

Hai hệ quả từ cách nối dây này:

- **Rê chuột lên một chú giải không làm đổi vòng đang hoạt động.** Phần hiển thị trung tâm
  giữ nguyên trong lúc xem một giá trị tham chiếu — hai phần hiển thị trả lời hai câu hỏi
  khác nhau.
- **Nó hoạt động ở mọi trình kết xuất.** Các chú giải được vẽ không nhận sự kiện con trỏ (một
  điểm đánh dấu nhận sự kiện sẽ kích hoạt `mouseleave` trên ô vòng bên dưới và làm mất cả
  phần nhấn mạnh lẫn phần hiển thị trung tâm), nên thao tác rê chuột được suy ra từ hình học
  ở cấp phần tử chứa, thay vì từ DOM.

Vòng không có giá trị thì không có điểm đánh dấu để rê chuột, nhưng vạch và nhãn đầu mút của
thang đo vẫn rê được — khoảng giá trị vẫn có thật ngay cả khi một chuỗi không có dữ liệu.

## Khi nào nên dùng

- **Thị phần lồng nhau.** Thị phần của một sản phẩm trên các phạm vi lồng nhau (thế giới, khu vực, thị trường) trong một hình gọn.
- **Vòng tiến độ / KPI.** Kiểu vòng hoạt động: một màu với các mức độ mờ theo vòng, `roundedCaps`, và phần trung tâm tuỳ chỉnh.

## Trình kết xuất

`renderer: "svg"` (mặc định), `"canvas"` (cùng các vòng trên canvas 2D; CSS của bên dùng vẫn tới được các cung qua đầu dò màu), hoặc `"webgpu"` <span class="vp-badge warning">Thử nghiệm</span> (dải vành khuyên trên GPU; tạm dùng canvas cho tới khi thiết bị sẵn sàng).
