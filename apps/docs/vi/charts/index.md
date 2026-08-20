---
title: Charts
description: "Danh mục biểu đồ michi-vz: 22 loại biểu đồ cho xu hướng, cấu thành, so sánh, tương quan và luồng, mỗi loại đều có bản demo trực tiếp trong React, Vue, Svelte, Angular và web components."
---
# Danh mục biểu đồ

Hai mươi hai biểu đồ độc lập với framework. Mỗi trang có một ví dụ, cách sử dụng trên mọi framework, và một bảng ngữ cảnh LLM.

- [**Biểu đồ đường**](/vi/charts/line) - _Xu hướng_ · Xu hướng theo thời gian trên một hoặc nhiều chuỗi - có tùy chọn phát hiện khoảng trống, bộ dựng canvas tùy chọn (giảm mẫu bằng LTTB cho dữ liệu lớn), và đường dẫn hướng cho từng điểm đơn lẻ.
- [**Biểu đồ hình quạt**](/vi/charts/fan) - _Xu hướng · Dự báo_ · Một hình quạt dự báo: lịch sử, đường trung vị dự báo nét đứt, và các dải tin cậy lồng nhau mở rộng dần theo tầm nhìn (kết hợp từ Line + Range).
- [**Biểu đồ vùng**](/vi/charts/area) - _Cấu thành_ · Tỷ trọng theo thời gian: tỷ phần của mỗi thành phần trong tổng chồng thay đổi ra sao.
- [**Biểu đồ phân tán**](/vi/charts/scatter) - _Tương quan_ · Mối quan hệ giữa hai biến số; kích thước bong bóng biểu diễn biến thứ ba.
- [**Biểu đồ khoảng**](/vi/charts/range) - _Xu hướng_ · Dải giá trị tối thiểu-tối đa cho mỗi chuỗi - dự báo, khoảng tin cậy, hoặc phạm vi quan sát được theo thời gian.
- [**Biểu đồ dải**](/vi/charts/ribbon) - _Cấu thành_ · Các cột chồng theo từng kỳ, liên kết bằng các dải nối theo dõi từng danh mục qua thời gian.
- [**Biểu đồ radar**](/vi/charts/radar) - _So sánh_ · So sánh nhiều thực thể trên cùng một tập trục chỉ trong nháy mắt (mỗi thực thể là một đa giác).
- [**Biểu đồ cột chồng dọc**](/vi/charts/vertical-stack-bar) - _Cấu thành_ · Các cột dọc chồng lên nhau theo từng danh mục, kèm cơ chế bảo vệ đánh dấu dữ liệu thiếu rõ ràng cho các tập dữ liệu thưa.
- [**Biểu đồ cột so sánh**](/vi/charts/comparable) - _So sánh_ · Hai cột con nằm chồng lên nhau theo mỗi nhãn - giá trị “cơ sở” so với giá trị “so sánh”.
- [**Biểu đồ cột dọc so sánh**](/vi/charts/comparable-vertical-bar) - _So sánh_ · Hai cột chồng nhau chiếm trọn chiều rộng mỗi nhóm - giá trị gốc ở sau, giá trị so sánh ở trước - kèm mũi tên thay đổi phía trên từng cặp.
- [**Biểu đồ cột kép (Tornado)**](/vi/charts/dual) - _So sánh_ · Các cột phân kỳ từ một đường trung tâm - value1 bên phải, value2 bên trái (tháp dân số, biểu đồ tornado).
- [**Biểu đồ quả tạ**](/vi/charts/bar-bell) - _Cấu thành_ · Các đoạn ngang tích lũy theo mỗi hàng, với các vòng tròn nắp đầu đánh dấu từng bước.
- [**Biểu đồ khoảng cách**](/vi/charts/gap) - _So sánh_ · Hai giá trị cho mỗi nhãn được nối bằng một thanh khoảng cách - nhấn mạnh sự chênh lệch giữa chúng.
- [**Treemap**](/vi/charts/treemap) - _Cấu thành_ · Các ô phân cấp có kích thước theo giá trị, mỗi ô có thể tùy chọn chia thành hai phần (ví dụ: đã hiện thực hóa so với chưa khai thác) - với bố cục xếp chồng thân thiện với di động.
- [**Biểu đồ tròn / Vành khuyên**](/vi/charts/pie) - _Cấu thành_ · Các lát có kích thước theo tỷ phần trong tổng thể, kèm nhãn % cho từng lát; đặt `innerRadiusRatio` để tạo vành khuyên.
- [**Biểu đồ vòng cung**](/vi/charts/gauge) - _So sánh_ · Các vòng đồng tâm, mỗi mục một vòng, quét theo value/max của một vòng tròn đầy trên nền track, kèm số liệu ở tâm bật lên khi hover.
- [**Biểu đồ bong bóng**](/vi/charts/bubble) - _Cấu thành_ · Các vòng tròn có kích thước theo giá trị, được kéo vào một cụm bằng lực hấp dẫn, mỗi vòng có thể tùy chọn chia thành lõi đã hiện thực hóa và vành chưa khai thác.
- [**Sankey**](/vi/charts/sankey) - _Luồng_ · Các luồng giữa các nút được bố trí theo cột, với độ dày dải tỷ lệ với giá trị luồng (xây dựng trên d3-sankey).
- [**Đài phun (Jet d'Eau)**](/vi/charts/fountain) - _So sánh_ · Chiều cao đỉnh = giá trị, chùm tia nở rộng = độ bất định. Trục x theo danh mục = ảnh chụp nhanh/so sánh các KPI; trục x theo thời gian hoặc số = xu hướng kèm tia dự báo tùy chọn (phù hợp nhất với khoảng 5-12 kỳ).
- [**Bản đồ phân cấp màu**](/vi/charts/choropleth-map) - _Địa lý_ · Dùng GeoJSON của bạn, tô màu theo thang ngưỡng hoặc theo bảng danh mục chỉ định, với 13 phép chiếu d3-geo.
- [**Bản đồ ký hiệu**](/vi/charts/symbol-map) - _Địa lý_ · Ký hiệu đặt theo kinh độ/vĩ độ, có một lượt mô phỏng lực đẩy các vòng tròn chồng lên nhau tách ra.
- [**Cây tỏa tròn**](/vi/charts/radial-tree) - _Cấu thành_ · Một dendrogram tỏa tròn: các lá cách đều tâm, vòng tròn được tính kích thước ở cả cấp nhóm lẫn cấp lá, và mật độ nhãn tự điều chỉnh khi số lá tăng lên.
