---
title: Insights - dự đoán, giải thích, và điều khiển biểu đồ bằng AI
---

# Biểu đồ dự đoán, tự giải thích chính mình, và trò chuyện với AI

::: warning Thử nghiệm - chưa ổn định
Lớp AI `@michi-vz/insights` là **thử nghiệm**: API, sub-path, và đầu ra của nó có thể thay đổi trong các bản phát hành tương lai. 16 biểu đồ lõi đã ổn định; insights (và [biểu đồ Fountain](/vi/charts/fountain) mới) thì chưa. Hãy ghim một phiên bản nếu bạn phụ thuộc vào chúng.
:::

Một biểu đồ thông thường chỉ *vẽ lại* quá khứ. `@michi-vz/insights` khiến nó **dự báo tương
lai**, **tự giải thích bằng ngôn ngữ thuần túy**, **bắt lỗi dữ liệu xấu**, và **trả lời một
trợ lý AI** - tất cả ngay trong trình duyệt, không máy chủ và không có gì rời khỏi trang.
Đây là tính năng **tùy chọn (opt-in)** và dùng **các phương pháp giáo khoa thuần túy** (không
hộp đen); mỗi biểu đồ michi-vz đã mang sẵn một `ChartContext` có cấu trúc, và các tính năng
này chỉ đơn giản là đọc từ đó.

<InsightsDemo feature="forecast" />

> Ở trên là một biểu đồ đường thực sự. Bật **Forecast** để thấy một dự đoán nét đứt + vùng
> dự báo được tô mờ; **Explain** viết một câu từ dữ liệu. Không máy chủ - tất cả chạy ngay
> trong trình duyệt của bạn.

> [!IMPORTANT] Một mô hình hỗ trợ; nó không quyết định.
> Các mô hình khác nhau cho ra câu trả lời khác nhau, và ngay cả một mô hình mạnh cũng có
> thể sai - càng nhỏ và càng nhanh thì càng dễ sai hơn. Các công cụ này giúp việc *đọc* một
> biểu đồ nhanh hơn; chúng không chịu trách nhiệm thay cho việc đó. Hãy coi bất kỳ đầu ra
> nào của mô hình như một điểm khởi đầu, dựa vào phương án dự phòng dựa trên quy tắc có
> tính xác định như một cơ sở trung thực, và **xác minh bất cứ điều gì quan trọng trước khi
> bạn hành động dựa trên nó**. AI ở đây để giúp đỡ, không phải để trả lời thay cho bạn.

---

## Nó làm được gì

Bốn điều trở nên khả thi ngay khi một biểu đồ mang theo ý nghĩa có cấu trúc của riêng nó:

### Đọc và điều khiển biểu đồ từ một trợ lý AI

Đây là điểm nổi bật nhất. Vì mỗi biểu đồ phơi bày ý nghĩa của nó (`ChartContext`) **và**
các điều khiển của nó dưới dạng **công cụ (tools)**, một trợ lý AI có thể tóm tắt nó, lọc
nó, tô nổi bật một chuỗi dữ liệu, hoặc dự báo nó - bằng cách gọi hàm, chứ không cào điểm
ảnh. Hãy thử các nút (mỗi nút là một lệnh gọi công cụ thực sự):

<InsightsDemo feature="agent" />

```ts
// In your app - bring your own LLM caller:
import { createAgent, chartHandle } from "@michi-vz/insights/agent";
const agent = createAgent({ charts: [chartHandle("revenue", chart, props)], llm: myCaller });
await agent.ask("Filter to the top 5 and forecast next quarter");
```

Các công cụ tương tự được phơi bày qua **MCP** (Model Context Protocol), nên **Claude Code,
Codex, Cursor, và Claude Desktop** kết nối mà không cần tích hợp tùy chỉnh nào - xem
**Agents & MCP** trong phần tham chiếu bên dưới.

### Dự đoán tương lai

Thêm một plugin và biểu đồ sẽ mọc thêm một dự đoán nét đứt, một dải tin cậy, và một con số
**độ chính xác đã qua kiểm định hậu nghiệm (backtest)** (để nó đáng tin cậy, không phải một
phỏng đoán). Dự báo hoạt động trên Line, **Fan**, Range, Area, và họ stacked-bar.

```ts
import { forecast } from "@michi-vz/insights/forecast";
mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ method: "holt-winters", horizon: 4, level: 0.95 })],
});
// getContext().summary → "...Revenue projected to 189 by 2027 (holt-winters, MAPE 6.1%)."
```

(Bản demo ở đầu trang chính là cái này.) Và nó **không chỉ dành riêng cho line** - cùng một
dự báo mở rộng ra một biểu đồ Fan (các dải tin cậy lồng nhau), phần chồng của một biểu đồ
Area, một dải Range, và hơn thế nữa:

<InsightsDemo feature="forecast" chart="fan" />

<InsightsDemo feature="forecast" chart="area" />

**[Biểu đồ Fan](/vi/charts/fan)** là phần trình bày dự báo chuyên dụng, được xây dựng chỉ
trong một lệnh gọi với `forecastFan()`.

### Tự giải thích chính mình, bắt lỗi dữ liệu xấu

Biểu đồ **phát hiện bất thường** (và đánh dấu chúng), viết một **tường thuật bằng ngôn ngữ
thuần túy**, và chạy **xác thực chất lượng dữ liệu** - tất cả từ cùng một context có cấu
trúc.

<InsightsDemo feature="anomaly" />

<InsightsDemo feature="validate" />

```ts
import { anomaly } from "@michi-vz/insights/anomaly";
import { narrate } from "@michi-vz/insights/narrate";
import { validate } from "@michi-vz/insights/validate";
chart.use(anomaly());   // flags + annotates outliers
chart.use(narrate());   // richer plain-English summary (also feeds screen readers)
chart.use(validate());  // warns via onDataWarning AND marks the bad points red on the chart
```

### Làm sạch và kết nối dữ liệu của bạn, cũng vậy

Cùng ý nghĩa có cấu trúc đó cũng dọn dẹp dữ liệu lộn xộn và tìm thấy mọi thứ theo ý nghĩa
của chúng, không phải theo cách chúng được viết ra - tất cả đều không cần mô hình theo mặc
định, tất cả đều là tùy chọn nâng cấp lên một mô hình thực khi bạn muốn nhiều hơn:

- **[Đối chiếu nhãn](#reconcile-labels)** - gộp `USA` / `united states` / `U.S.A.` thành
  một nhóm sạch duy nhất, để tổng số ngừng bị tách ra theo cách viết khác nhau.
- **[Khớp giữa các tập dữ liệu](#match-across-datasets)** - liên kết hai danh sách được
  viết khác nhau (một tệp xuất từ CRM và một tệp xuất từ ERP) thành một biểu đồ đã nối,
  trung thực.
- **[Tìm kiếm thông minh](#smart-search)** - tìm một chuỗi dữ liệu theo ý bạn muốn nói
  ("tiền đang chảy vào"), chứ không theo đúng nhãn của nó.
- **[Mang mô hình của riêng bạn vào](#bring-a-model)** - mọi tính năng dựa trên mô hình đều
  quay về một câu trả lời có tính xác định, dựa trên quy tắc; bật **Real model** trong demo
  tường thuật để so sánh văn xuôi của một mô hình nhỏ chạy trong trình duyệt song song,
  trực tiếp.

---

## Ví dụ thực tế

Mỗi biểu đồ bên dưới là hàng thật - nó tính toán ngay trong trình duyệt của bạn khi trang
tải, và có thể nhấp được (bật Canvas/SVG, nhấn **Explain ▸**). Vấn đề không phải là bản
demo; mà là một nhà phân tích, một chủ ngân hàng, một nhà khoa học dược phẩm, hay một sử
gia đều nhận được câu trả lời *ngay trên biểu đồ* - không notebook, không máy chủ. Mỗi
thuật ngữ được giải thích ngay lần đầu xuất hiện, và được tập hợp trong [Thuật ngữ](#glossary).

### Forecast: điều này đang đi về đâu, và liệu nó có đạt được mục tiêu?

Đường nét đứt dự phóng xu hướng gần đây. **Dải tin cậy** được tô mờ chính là sai số quá khứ
của mô hình, nên nó cho thấy một *khoảng* trung thực thay vì một con số đầy hy vọng duy
nhất. Và nơi dự phóng gặp một mục tiêu, một **điểm chạm (fall point)** màu đỏ đánh dấu *khi
nào* mục tiêu đạt được - trả lời cả câu hỏi "điều này đang đi về đâu?" lẫn câu hỏi tìm mục
tiêu (goal-seek) "liệu nó có đạt được không, và khi nào?".

**Tốc độ tăng doanh thu (run-rate) của một ngân hàng - kế hoạch cuối năm có trong tầm với
không?**

<InsightsDemo feature="forecast" dataset="bank-revenue" />

**Một thử nghiệm lâm sàng - liệu nó có tuyển đủ bệnh nhân thứ 300 trước hạn chót công bố
kết quả không?**

<InsightsDemo feature="forecast" dataset="pharma-enrollment" />

**Lạm phát (CPI) - dải này rộng vì tương lai thực sự không chắc chắn.**

<InsightsDemo feature="forecast" dataset="cpi" />

**Một lưới điện - liệu nhu cầu đỉnh có chạm tới công suất trước khi nhà máy tiếp theo được
xây dựng không?**

<InsightsDemo feature="forecast" dataset="energy-demand" />

**Một sổ sách SaaS - doanh thu định kỳ gần đến cột mốc tiếp theo đến mức nào?**

<InsightsDemo feature="forecast" dataset="saas-mrr" />

### Kịch bản: tốt nhất, cơ sở, xấu nhất

Một dự phóng duy nhất hiếm khi là đủ. Thêm các đường **kịch bản** - một giả định tăng
trưởng lạc quan và một giả định bi quan - và cùng một lịch sử tỏa ra thành một dải tốt
nhất / cơ sở / xấu nhất, giống cách một CFO hay một bài kiểm tra căng thẳng (stress test)
của ngân hàng đóng khung tương lai.

**Một bài kiểm tra căng thẳng ngân hàng - doanh thu trong kịch bản khả quan và kịch bản
nghiêm trọng, đối chiếu với đường kế hoạch.**

<InsightsDemo feature="forecast" dataset="scen-bank-stress" />

**Đường băng tiền mặt (runway) của một startup - dòng tiền chạm mốc 0 khi nào nếu vòng gọi
vốn tiếp theo trễ mất một quý?**

<InsightsDemo feature="forecast" dataset="scen-startup-runway" />

**Ra mắt một loại thuốc mới - tiếp nhận mạnh so với tiếp nhận chậm ngay từ ngày đầu.**

<InsightsDemo feature="forecast" dataset="scen-pharma-uptake" />

### Narration: biểu đồ tự viết tiêu đề của chính mình (và không bao giờ bịa đặt)

Một biểu đồ bận rộn che giấu câu chuyện của chính nó. `narrate()` đọc dữ liệu và viết một
câu văn thuần túy: nó gọi tên **top mover** (chuỗi dữ liệu biến động nhiều nhất giữa điểm
đầu và điểm cuối) và tỷ lệ tăng-so-với-giảm. Mọi con số đều được tính từ dữ liệu số, nên -
khác với một chatbot - nó không thể bịa ra một con số. Nhấn **Explain ▸** để xem câu văn.

**Một ngân hàng bán lẻ - tiền gửi số hóa âm thầm vượt qua mạng lưới chi nhánh.**

<InsightsDemo feature="narrate" dataset="narr-bank-channel" />

**Một thử nghiệm với hai địa điểm - địa điểm nào thực sự đang gánh vác nghiên cứu?**

<InsightsDemo feature="narrate" dataset="narr-pharma-sites" />

**Lương thực tế - một thập kỷ mất đà, bất chấp đợt tăng gần đây.**

<InsightsDemo feature="narrate" dataset="narr-real-wages" />

**Một thế kỷ đô thị hóa - vùng nông thôn trống rỗng khi các thành phố đầy lên.**

<InsightsDemo feature="narrate" dataset="narr-urbanisation" />

**Cơ cấu điện năng - than đá rút lui, năng lượng tái tạo dẫn đầu.**

<InsightsDemo feature="narrate" dataset="narr-energy-mix" />

### Anomaly: thứ gì không thuộc về đây?

Một **bất thường (anomaly)** là một năm nổi bật khác biệt so với phần còn lại của chuỗi
dữ liệu. Theo mặc định nó được tìm thấy bằng **z-score** (một điểm dữ liệu cách trung bình
bao nhiêu bước chuẩn; quá khoảng ba bước thì bị gắn cờ) và được đánh dấu bằng một chấm -
biến câu hỏi "có điều gì bất thường đã xảy ra không?" thành một cái liếc mắt duy nhất.
Logic chính xác của cả ba phương pháp phát hiện (z-score, hàng rào IQR, dải dự báo), ngưỡng
của chúng và giới hạn của chúng được trình bày chi tiết trong
[Phương pháp luận](#methodology---the-exact-logic-behind-every-insight).

**Một ngân hàng - năm mà tổn thất gian lận thẻ vượt khỏi xu hướng (một vụ vi phạm hoặc làn
sóng lừa đảo).**

<InsightsDemo feature="anomaly" dataset="anom-fraud" />

**An toàn dược phẩm - năm mà các sự kiện bất lợi được báo cáo tăng vọt, một tín hiệu cho
cảnh giác dược.**

<InsightsDemo feature="anomaly" dataset="anom-adverse" />

**Vận hành - năm mà độ trễ đỉnh phình to, đánh dấu một sự cố lớn.**

<InsightsDemo feature="anomaly" dataset="anom-latency" />

**Bán lẻ - năm mà lượng hàng trả lại tăng vọt, chỉ ra một lô hàng lỗi.**

<InsightsDemo feature="anomaly" dataset="anom-returns" />

**Một nền kinh tế - năm mà GDP lao dốc, một cú sốc suy thoái trước đà tăng trưởng ổn định.**

<InsightsDemo feature="anomaly" dataset="anom-gdp" />

## Thêm nữa từ bộ công cụ

Bảng **Sub-path** ở gần cuối liệt kê nhiều hơn những gì thư viện demo ở trên cho thấy. Đây
là sáu plugin nữa trong số đó đang chạy thật - mỗi cái không cần mô hình, có tính xác định,
và chỉ vài dòng để kết nối vào. Chúng trả lời những câu hỏi mà một biểu đồ thuần túy bỏ
ngỏ: *cần gì để đạt được con số đó, tỷ lệ là bao nhiêu, xu hướng thực sự thay đổi khi nào,
và đâu là tăng trưởng mùa vụ so với tăng trưởng thực.*

**Goal-seek - cần gì để đạt được con số đó?** Dự báo chạy thời gian về phía trước;
goal-seek chạy nó *ngược lại* từ một mục tiêu bạn đặt ra. Di chuyển mục tiêu và xem tốc độ
cần thiết (đường nét đứt màu vàng) phản ứng, cùng một phán quyết liệu tốc độ gần đây của
bạn có đạt được nó hay không.

<PluginLab feature="goalseek" />

**Monte Carlo - tỷ lệ, không chỉ một đường.** Một đường dự báo duy nhất che giấu rủi ro.
Cái này chạy hàng trăm tương lai được mô phỏng và báo cáo *dải* cộng với xác suất vượt qua
một mục tiêu - được gieo hạt (seeded), nên nó phát lại chính xác, với một nút **Re-roll**
để xem dải phân bố dịch chuyển.

<PluginLab feature="montecarlo" />

**Changepoints - xu hướng thực sự thay đổi khi nào?** Các mức trung bình làm mờ đi khoảnh
khắc câu chuyện đổi hướng. Cái này tìm ra nơi độ dốc thay đổi về mặt cấu trúc và tô màu
đường theo từng chế độ (regime) - ở đây là một mô hình đỉnh-rồi-suy-giảm rõ ràng.

<PluginLab feature="changepoints" />

**Seasonality - tách tăng trưởng thực khỏi "lại đến tháng Mười Hai rồi."** Một lệnh gọi
tách một đường gập ghềnh thành một xu hướng mượt và một sóng mùa vụ lặp lại, và tự nó phát
hiện độ dài chu kỳ.

<PluginLab feature="seasonal" />

**Aggregate - từ hàng dữ liệu thô thành biểu đồ trong một lệnh gọi.** Trước khi có thể vẽ
biểu đồ dữ liệu, thường bạn phải *định hình* nó. `aggregate()` thực hiện group-by + các
phép đo mà không cần dependency nào (tùy chọn dùng DuckDB-Wasm cho SQL thực sự trên hàng
triệu hàng). Đổi cách nhóm và nó tính lại.

<PluginLab feature="sql" />

**Sonify - nghe thấy xu hướng.** Một chiến thắng cho khả năng truy cập: mỗi giá trị trở
thành một cao độ, nên một chuỗi dữ liệu tăng *nghe* như đang tăng lên. Nhấn play - các
thanh chính là đầu ra thuần túy, có thể kiểm thử được của `valuesToTones()`.

<PluginLab feature="sonify" />

## Làm sạch, khớp, và tìm kiếm dữ liệu của bạn

Bốn điều AI mang lại cho dữ liệu của bạn, tất cả ngay trong trình duyệt: **đối chiếu**
(reconcile) các nhãn lộn xộn trong một danh sách, **khớp** (match) hai danh sách viết khác
nhau, **tìm kiếm** một chuỗi dữ liệu theo ý nghĩa, và **phân loại** văn bản tự do mà không
cần quy tắc nào - được cấp năng lượng bởi các mô hình mở nhỏ, không phải một mô hình đám
mây khổng lồ.

**Biến văn bản thành ý nghĩa.** Một *embedding* là một cách biến một từ hay cụm từ thành
một danh sách số, được sắp xếp sao cho những thứ *mang cùng ý nghĩa* nằm gần nhau - để một
máy tính có thể biết `USA` và `United States` là cùng một nơi dù chúng không chia sẻ chữ
cái nào. `@michi-vz/insights` không phát minh ra bất cứ điều gì trong số này; nó cho thấy
cách *tận dụng* các mô hình mã nguồn mở mà cộng đồng đã xây dựng sẵn: các **mô hình
embedding** nhỏ (họ BERT / MiniLM) và các **LLM mở đủ nhỏ** (Qwen, Gemma, Phi), tất cả đều
chạy **phía client trong trình duyệt của bạn** - không máy chủ, không API key, không gì
được gửi đi đâu cả. Khi trỏ vào dữ liệu biểu đồ của bạn, chúng nâng **chất lượng** của nó
lên và dọn dẹp **dữ liệu sai, lộn xộn**: bốn vấn đề thường ngày trở thành một thủ thuật -
**gộp** những gì mang cùng ý nghĩa, **khớp** những gì hai hệ thống viết khác nhau, **tìm**
những gì bạn muốn nói, **sắp xếp** những gì chưa được sắp xếp. Mặc định
**không cần mô hình** chạy ngay lập tức ngoại tuyến (n-gram ký tự, rất tốt cho lỗi chính tả
và cách viết); **chọn một mô hình** từ dropdown (MiniLM ~23 MB → MPNet ~110 MB, kích thước
được hiển thị, tải theo yêu cầu) để chuyển từ khớp *chữ cái* sang khớp *ý nghĩa* - và mang
một LLM nhỏ vào để **xác nhận** kết quả.

### Đối chiếu nhãn

**Vấn đề mà mọi nhà phân tích đều biết.** Dữ liệu của bạn đến từ ba nguồn và mỗi nguồn viết
cùng một thứ theo cách khác nhau - `United States`, `united states`, `USA`. Nhóm theo khớp
chính xác và biểu đồ của bạn sẽ tách một quốc gia thành ba thanh ngắn với **tổng số sai**,
và một buổi chiều trôi qua để viết tay một bảng tra cứu (lookup table).

**Embedding sửa nó bằng ý nghĩa.** Biến mỗi nhãn thành một vector và gộp những cái nằm gần
nhau. Mặc định **không cần mô hình** (tức thời, ngoại tuyến) đã gộp được cách viết, chữ
hoa/thường, khoảng trắng và lỗi chính tả. Tải một mô hình thực sự (dropdown hiển thị kích
thước của từng cái) và nó cũng gộp cả từ viết tắt và bản dịch - `USA` ≈ `United States`,
`Deutschland` ≈ `Germany`, `Nippon` ≈ `Japan`. **Certify** sau đó thêm một LLM nhỏ xác nhận
mỗi nhóm và đóng dấu tên chuẩn.

<EmbeddingsLab />

> Bắt đầu ở **Raw labels** để cảm nhận sự lộn xộn - 10 thanh, tổng số bị tách - rồi nhấn
> **Reconcile**. Không cần mô hình đã gộp được các biến thể cách viết ngoại tuyến; tải một
> mô hình (MiniLM → MPNet) cũng gộp luôn cả từ viết tắt và bản dịch, xuống còn 3 quốc gia
> thực sự. **Certify** trao các nhóm đó cho một LLM nhỏ chạy trong trình duyệt để lấy tên
> chuẩn.

> [!NOTE] Sự tương đồng đề xuất, một mô hình mới *xác nhận*.
> Một mô hình embedding chạy hoàn toàn **ngoại tuyến** - nó không có internet và không tra
> cứu gì cả. Nó gộp `Deutschland` với `Germany` vì vector của chúng nằm gần nhau trong quá
> trình huấn luyện, chứ không phải vì nó "biết" đó là quốc gia nào. Vì vậy việc gộp không
> chỉ được quyết định dựa trên ngưỡng thô: một nhãn chỉ tham gia vào một nhóm khi nó
> **gần nhóm đó hơn hẳn so với bất kỳ nhóm nào khác** (một biên độ tin cậy), điều này giữ
> cho hai quốc gia khác biệt không bị sụp vào nhau chỉ vì chúng nằm gần nhau. Để có một câu
> trả lời *có thẩm quyền*, **Certify** chạy một **cascade** (không phải mixture-of-experts -
> đó là nội bộ của một mô hình): embedding đề xuất các phép gộp với chi phí rẻ, sau đó một
> LLM **nhỏ** chạy trong trình duyệt (Qwen / Gemma, kích thước được hiển thị) xác nhận mỗi
> nhóm là một quốc gia và trả về tên chuẩn. Mô hình đó thực sự biết về các quốc gia, nhưng
> nó cần **WebGPU** và trọng số tải xuống một lần. (Trong một ứng dụng thực tế, một caller
> tùy chỉnh có thể trỏ tới một mô hình lớn hơn hoặc một máy chủ **Ollama** cục bộ thay thế;
> một trang web tĩnh không thể gọi Ollama trực tiếp - chính sách CORS của trình duyệt chặn
> `localhost`. Xem **Agents & MCP** bên dưới.)

> [!NOTE] Canh cược: một mô hình nhanh hoàn tất, một mô hình thông minh hơn tinh chỉnh.
> Luồng ở trên là một thử nghiệm có chủ đích - để một mô hình nhanh, đơn giản (embedding)
> làm phần lớn công việc, sau đó gọi một mô hình nặng hơn, thông minh hơn (một LLM nhỏ) chỉ
> để tinh chỉnh những gì còn lại. Nó đánh đổi một chút độ chính xác ban đầu để lấy tốc độ
> và chi phí, và chỉ trả giá cho mô hình lớn hơn ở nơi nó thực sự quan trọng. Đây là một
> niềm tin đang được kiểm chứng ở đây, không phải một học thuyết đã an bài; nó có thể được
> tranh luận theo chiều ngược lại, và cách tiếp cận này - cùng với các kết quả này - sẽ tiến
> hóa khi các mô hình tiến hóa.

### Khớp giữa các tập dữ liệu

**Vấn đề tiếp theo: hai nguồn riêng biệt, không phải một danh sách lộn xộn.** Một tệp xuất
từ CRM và một tệp xuất từ ERP đều đặt tên cho cùng những khách hàng, quốc gia, hay sản phẩm
- nhưng viết hơi khác nhau ở mỗi hệ thống. `reconcileLabels` dọn dẹp các bản trùng lặp
*trong* một danh sách; `matchLabels` liên kết các thực thể *giữa* hai danh sách, để hai tập
dữ liệu trở thành một biểu đồ trung thực duy nhất.

<MatchLab />

> Hai tập dữ liệu nhỏ, bị làm cho không khớp một cách có chủ đích. Nhấn **Match** và các
> cặp tự tin sẽ sáng lên cùng độ tương đồng của chúng; phần còn lại vẫn trung thực ở trạng
> thái không khớp (kèm gợi ý gần-khớp-nhất) thay vì bị ép khớp cho bằng được - và các hàng
> đã nối vẽ thành một biểu đồ, hai thanh phụ cho mỗi hàng.

### Tìm kiếm thông minh

Một dashboard với hàng chục chuỗi dữ liệu và bạn không nhớ chính xác tên. Gõ những gì bạn
*muốn nói* và embedding xếp hạng mọi chuỗi dữ liệu theo độ tương đồng - không cần từ khóa
nào phải khớp.

<SemanticSearchLab />

> Thử `customer` trước - không cần mô hình đã tìm ra các KPI khách hàng nhờ chữ cái chung.
> Rồi thử `money coming in`: chỉ **BERT** mới đạt tới `Revenue`, vì chúng chia sẻ *ý nghĩa*,
> không phải cách viết.

### Categorize

Một đống bình luận khảo sát không có nhãn. Đưa cho embedding chỉ **tên chủ đề** (không danh
sách từ khóa, không huấn luyện) và mỗi bình luận rơi vào chủ đề gần nhất của nó - để văn
bản phi cấu trúc trở thành một biểu đồ bạn có thể hành động dựa trên đó. Đây là cái thực sự
cần một mô hình: `keeps freezing` → **Performance** không chia sẻ chữ cái nào với bất kỳ
tên chủ đề nào.

<CategorizeLab />

> **Tải BERT** và xem các bình luận nhảy vào đúng chủ đề theo ý nghĩa - `too expensive` →
> Pricing, `love the clean new look` → Design & UX - không cái nào trong số đó chia sẻ một
> từ khóa với chủ đề của chúng.

Cách viết nó - đối chiếu trước, rồi tới các cách dùng embedding khác:

::: code-group

```ts [Reconcile labels]
import { reconcileLabels } from "@michi-vz/insights/embeddings";
// one call: groups messy labels by meaning, with a confidence gate + a tidy representative name
const groups = await reconcileLabels(rawLabels); // { backend: "transformers" } adds synonyms
// → [{ name: "United States", members: ["United States", "USA", ...] }, ...]
// now sum your series by group.name instead of the raw label → clean, correct totals
```

```ts [Match two datasets]
import { matchLabels } from "@michi-vz/insights/embeddings";
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmCountries, erpCountries);
// matches → [{ source: "USA", target: "United States", similarity: 0.91 }, ...]
const rows = matches.map((m) => ({
  label: m.target,
  valueBased: crmTotals[m.source],     // two sources, one row -
  valueCompared: erpTotals[m.target],  // feeds straight into mountComparableHorizontalBarChart
}));
```

```ts [Embed with BERT]
import { createEmbedder, cosineSimilarity } from "@michi-vz/insights/embeddings";
// opt into a small in-browser BERT (MiniLM via Transformers.js, WebGPU); lazy, nothing bundled
const e = await createEmbedder({ backend: "transformers" }); // default all-MiniLM-L6-v2
const [a, b] = await e.embed(["USA", "United States"]);
cosineSimilarity(a, b); // ≈ 0.8 - close, even with no letters in common
```

```ts [Search by meaning]
import { findSimilar } from "@michi-vz/insights/embeddings";
// rank a large chart catalog by what a query means, not how it is spelled
const ranked = await findSimilar("revenue", chartLabels, (l) => l);
```

```ts [Dashboard RAG]
import { findSimilar } from "@michi-vz/insights/embeddings";
// retrieve the charts most relevant to a question, feed THEIR context to an LLM (see Agents)
const top = (await findSimilar(question, charts, (c) => c.getContext().summary)).slice(0, 3);
```

:::

Cùng một engine, các cách dùng khác: **tìm kiếm** một danh mục biểu đồ lớn theo ý nghĩa,
**gom cụm (clustering)** các chuỗi dữ liệu tương tự, và **RAG toàn dashboard** - lấy ra các
biểu đồ phù hợp để một agent có thể trả lời trên toàn bộ một dashboard (xem **Agents &
MCP**). Embedding là lớp truy xuất; tiêu điểm chính là những gì nằm phía trên nó.

## Phương pháp luận - logic chính xác đằng sau mỗi insight

Không có gì ở đây là hộp đen: mỗi insight là một phương pháp giáo khoa có tên gọi mà bạn có
thể tự tay kiểm chứng. Phần này nêu rõ thuật toán, giá trị mặc định, và giới hạn của nó,
theo từng tính năng.

### Forecast

- **Phương pháp (mặc định `"holt-winters"`):** làm mượt hàm mũ kép của Holt - hai ước lượng
  đang chạy, *level* (mức) và *trend* (xu hướng), được cập nhật ở mỗi điểm (`alpha = 0.5`
  cho level, `beta = 0.3` cho trend; chưa có thành phần mùa vụ). Dự báo mở rộng mức cuối
  cùng dọc theo xu hướng cuối cùng. `method: "linear"` thay vào đó khớp một đường hồi quy
  bình phương tối thiểu thông thường (OLS) qua toàn bộ chuỗi và mở rộng nó.
- **Dải tin cậy:** sai số chuẩn phần dư của lần khớp trong mẫu một-bước-tới-trước, được mở
  rộng bằng `sqrt(step)` khi dự báo càng đi xa hơn, nhân với giá trị z của `level` bạn chọn
  (mặc định 95%). Dải rộng = mô hình khớp lịch sử kém; sự trung thực đó chính là điểm hay.
- **Độ chính xác (MAPE/RMSE):** một backtest holdout thực sự - một phần ba cuối của chuỗi
  (tối đa tới horizon) bị ẩn đi, mô hình được khớp trên phần còn lại, và các dự đoán của nó
  được chấm điểm dựa trên những gì thực sự đã xảy ra. Chuỗi ngắn hơn 6 điểm sẽ quay về độ
  chính xác trong mẫu (in-sample).
- **Giới hạn:** chỉ trục x dạng số; chưa có thành phần mùa vụ (một chuỗi mang tính mùa vụ
  mạnh sẽ dự báo xu hướng của nó, không phải độ dao động - hãy phân tách trước, xem bên
  dưới).

### Phát hiện bất thường

Ba phương pháp qua `anomaly({ method, threshold })`; mỗi điểm bị gắn cờ mang theo
`{ index, value, score, kind }` và kết quả công cụ giờ bao gồm nguyên văn lời giải thích
này:

- **`zscore` (mặc định, ngưỡng 3):** `score = |value - mean| / standard deviation` trên
  chính chuỗi dữ liệu; bị gắn cờ khi vượt ngưỡng (`kind: "high"` trên mức trung bình,
  `"low"` dưới mức trung bình). 3 là ngưỡng cắt giáo khoa thận trọng; 2 gắn cờ các đợt tăng
  vọt nhẹ hơn. Lưu ý: một xu hướng mạnh làm phồng độ lệch chuẩn và che giấu các điểm ngoại
  lệ - hãy dùng `forecast` trong trường hợp đó.
- **`iqr` (ngưỡng 1.5):** hàng rào Tukey - bị gắn cờ khi dưới `Q1 - k*IQR` hoặc trên
  `Q3 + k*IQR` (Q1/Q3 = phân vị thứ 25/75). Tứ phân vị bỏ qua các giá trị cực đoan, nên cái
  này vẫn vững chắc khi dữ liệu đã chứa sẵn các điểm hoang dã.
- **`forecast`:** nhận biết xu hướng - mỗi điểm được kiểm tra so với một dự báo
  một-bước-tới-trước được xây dựng CHỈ từ lịch sử trước nó, bị gắn cờ khi nằm ngoài dải 95%;
  `score` = số sai số chuẩn đã bị lệch.

### Narration

Bộ tường thuật mặc định **dựa trên quy tắc và có tính xác định** - nó chỉ đọc
`ChartContext` có cấu trúc (không bao giờ đọc điểm ảnh thô, không bao giờ dùng mô hình):
top mover theo thay đổi tuyệt đối (kèm tỷ lệ phần trăm của nó), tỷ lệ xu hướng tăng-so-với-
giảm, và tổng lớn nhất cho các biểu đồ theo danh mục. Cùng đầu vào, cùng câu văn, mọi lần -
và nó không thể bịa ra một con số không có trong context. Văn xuôi dựa trên mô hình
(`explainChart`) là tùy chọn và luôn quay về các quy tắc khi cần.

### Validation

Các kiểm tra hình dạng/thống kê thuần túy trên chuỗi dữ liệu: tập dữ liệu rỗng, giá trị
không hữu hạn, ngày trùng lặp, và ngày không đơn điệu - mỗi cái được báo cáo dưới dạng một
`DataWarning` có kiểu, kèm chỉ số chính xác, và tùy chọn được chú thích trên biểu đồ.

### Changepoints, seasonality, Monte Carlo

- **Changepoints:** với mỗi điểm chia ứng viên, một đường OLS được khớp trước và một đường
  sau; điểm chia được chấm điểm bằng `|slopeAfter - slopeBefore|` và chỉ những cực đại cục
  bộ trên một ngưỡng mới được giữ lại. Phát hiện đoạn gấp khúc xu hướng đơn giản, dễ giải
  thích.
- **Seasonality:** phân tách cộng tính cổ điển - một xu hướng trung bình động có tâm, một
  thành phần mùa vụ theo từng pha đã căn giữa trung bình, và một phần dư; chu kỳ được phát
  hiện bằng tự tương quan.
- **Monte Carlo:** dự báo có tính xác định là đường trung tâm; nhiều tương lai được mô
  phỏng bằng cách thêm nhiễu phần dư Gaussian có tỷ lệ theo `se*sqrt(step)`, với một PRNG
  **được gieo hạt** (mulberry32) để các lần chạy có thể tái lập được. Các phân vị của các
  lần chạy cho ra dải; tổng hợp bước cuối cho ra xác suất vượt ngưỡng.

### Embeddings (reconcile, match, search, sort)

Bộ embedder mặc định là **băm không cần mô hình** (n-gram ký tự thành một vector kích
thước cố định, chuẩn hóa L2) - hoàn toàn ngoại tuyến và có tính xác định; nó gộp các biến
thể cách viết/chữ hoa-thường/lỗi chính tả nhưng không gộp từ đồng nghĩa thực sự.
`backend: "transformers"` nâng cấp lên MiniLM (xem
[Mô hình đến từ đâu](#where-models-come-from-and-how-to-change-it)). Độ tương đồng là
cosine; ngưỡng gộp mặc định là 0.6 (hash) / 0.7 (mô hình).

`reconcileLabels` gom cụm *trong* một danh sách (single-linkage tham lam, có ngưỡng biên độ
tin cậy để một nhãn chỉ tham gia vào nhóm mà nó gần nhất một cách quyết định). `matchLabels`
thay vào đó liên kết *giữa* hai danh sách: mỗi nhãn nguồn ghép cặp với đích tốt nhất duy
nhất của nó, cùng biên độ tin cậy đó gác cổng lựa chọn của nguồn, và theo mặc định một cặp
chỉ được tính là một **mutual best match** (khớp tốt nhất theo cả hai chiều) - mỗi bên chọn
bên kia trước - đó là điều ngăn hai hàng nguồn va chạm vào cùng một đích. Mọi thứ không
vượt qua được các cổng gác đều được báo cáo lại là không khớp cùng gợi ý gần-khớp-nhất của
nó, không bao giờ bị âm thầm loại bỏ.

## Vì sao có thể tin tưởng (và dành cho ai)

- **Không phải hộp đen.** Mỗi con số là một phương pháp giáo khoa có tên gọi (Holt, MAPE,
  z-score, IQR, OLS…) - logic chính xác theo từng tính năng được trình bày chi tiết trong
  [Phương pháp luận](#methodology---the-exact-logic-behind-every-insight) ở trên. Cùng
  những nguyên hàm mà một thư viện thống kê sử dụng.
- **Có tính xác định + đã kiểm thử.** Các tính năng thống kê cho ra cùng kết quả với cùng
  đầu vào và được bao phủ bởi một bộ kiểm thử đồ sộ; bất cứ điều gì ngẫu nhiên (Monte
  Carlo) đều được gieo hạt.
- **Dữ liệu ở lại trong trình duyệt.** Không máy chủ, không tải lên. Các backend mô hình từ
  xa là tùy chọn nghiêm ngặt và được ghi chú là "dữ liệu rời khỏi client."
- **Không khóa chặt (lock-in).** Không mô hình nào từng được đóng gói sẵn; các tính năng mô
  hình là tùy chọn và **quay về** một phiên bản thống kê/dựa-trên-quy-tắc hoạt động được
  nếu mô hình không khả dụng.

**Dành cho ai:**

- **Đang xây dựng một sản phẩm (phân tích nhúng)?** Cung cấp biểu đồ dự báo và tự giải
  thích cho *người dùng của bạn* - phía client, không cần chạy dịch vụ Python nào.
- **Là một nhà phân tích dữ liệu / thị trường?** Những phương pháp bạn đã biết
  (Holt-Winters, MAPE, z-score) - giờ chạy tại runtime trong ứng dụng, không chỉ trong một
  notebook (xem **so với quy trình pandas / notebook** bên dưới).
- **Đang xây dựng với các tác nhân AI?** Biểu đồ của bạn trở thành các công cụ MCP mà một
  agent có thể đọc và điều khiển.

## Bắt đầu

```bash
npm i @michi-vz/insights
```

```ts
import { mountLineChart } from "@michi-vz/core";
import { forecast } from "@michi-vz/insights/forecast";

const chart = mountLineChart(el, { dataSet: revenue, xAxisDataType: "date_annual" }, {
  plugins: [forecast({ horizon: 4 })],
});
```

Vậy là xong - biểu đồ giờ đã dự báo. Mọi thứ bên dưới là phần tham chiếu.

---

## Forecasting

```ts
forecast({
  method: "holt-winters",                                   // or "linear" / lazy "arima"
  horizon: 8,
  level: 0.95,
  zone: true,                                               // shade the forecast region (toggleable)
  scenarios: [{ name: "optimistic", growth: 0.15 }, { name: "pessimistic", growth: -0.1 }],
  trendline: true,
  threshold: { value: 0, label: "Break-even" },             // reference line + "fall point"
  onThresholdBreach: (b) => alertOps(b),                    // fires when the forecast crosses it
});
```

Thêm các helper thuần túy, có tính xác định trong `@michi-vz/insights/forecast`:
`forecastFan()`, `decompose()` / `detectPeriod()` (mùa vụ STL), `detectChangepoints()`,
`monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (goal-seek & run-rate).

## Narration: tùy chỉnh, bản địa hóa (i18n), hoặc mang mô hình vào

Đây là tường thuật - một biểu đồ hai chuỗi dữ liệu tự viết câu văn của chính nó. Nhấn
**Explain ▸** để có câu văn dựa trên quy tắc tức thời; bật **Real model** để tải một mô
hình ngôn ngữ nhỏ chạy trong trình duyệt (kích thước của nó được hiển thị trước khi bất cứ
thứ gì được tải xuống) và đọc văn xuôi của nó cạnh các quy tắc, song song với nhau:

<InsightsDemo feature="narrate" model-explain />

`narrate()` mặc định là **dựa trên quy tắc** (không mô hình). Biến nó thành của riêng bạn
theo ba cách:

```ts
import { narrate, explainChart, SLM_PRESETS } from "@michi-vz/insights/narrate";

// 1. i18n - translate the built-in phrases (the sentence logic stays):
narrate({ strings: {
  topMover: (label, dir, pct) => `${label} a ${dir === "rose" ? "le plus augmenté" : "le plus baissé"}${pct}.`,
  trendSplit: (up, down) => `${up} séries en hausse et ${down} en baisse.`,
}});

// 2. Fully custom narrator - any wording, any language:
narrate({ render: (ctx) => myTemplate(ctx) });
```

### Mang mô hình của riêng bạn vào

Hãy thử trực tiếp trong bản demo ở trên: bật **Real model**, chọn một mô hình nhỏ theo kích
thước của nó, và so sánh văn xuôi của nó với câu dựa trên quy tắc, song song với nhau.

`explainChart(ctx, { backend, model })` nâng cấp văn xuôi bằng một mô hình và **luôn quay
về** văn bản dựa trên quy tắc. Không cần plugin - gọi nó theo yêu cầu. **Các mô hình ngôn
ngữ nhỏ chạy trong trình duyệt** được ưu tiên (ưu tiên cục bộ, riêng tư, không máy chủ):

```ts
// In-browser via Transformers.js (ONNX + WebGPU). Phi-3-mini (MIT) or Google Gemma 2 (2B):
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.phi3 });
await explainChart(chart.getContext(), { backend: "transformers", model: SLM_PRESETS.transformers.gemma });

// In-browser via WebLLM (WebGPU):
await explainChart(chart.getContext(), { backend: "webllm", model: SLM_PRESETS.webllm.gemma });

// Or your own remote model (data leaves the client - opt-in):
await explainChart(chart.getContext(), { backend: "remote", caller: (prompt) => callClaude(prompt) });
```

**Đã có sẵn một AI cục bộ đang chạy?** Kết nối trực tiếp vào nó - không tải xuống, không
Hugging Face, các prompt chỉ đi tới endpoint bạn chỉ định. Hai caller dựng sẵn bao phủ các
máy chủ cục bộ thường gặp:

```ts
import { ollamaCaller, openaiCompatCaller } from "@michi-vz/insights/narrate";

// Ollama (native API, default http://localhost:11434):
await explainChart(ctx, {
  backend: "remote",
  caller: ollamaCaller({ model: "llama3.2" }),
});

// LM Studio, llama.cpp server, vLLM, LocalAI - anything OpenAI-compatible:
await explainChart(ctx, {
  backend: "remote",
  caller: openaiCompatCaller({ url: "http://localhost:1234", model: "qwen2.5" }),
});
```

Cả hai đều throw lỗi khi thất bại, nên tường thuật quay về câu dựa trên quy tắc có tính
xác định - biểu đồ không bao giờ trống trơn chỉ vì một máy chủ cục bộ bị sập.

`SLM_PRESETS` cung cấp sẵn model id cho **Phi-3-mini** và **Gemma 2 (2B)**. Mô hình chỉ
được tải lười (lazy-load) khi được gọi; không có gì được đóng gói sẵn, và nếu nó không tải
được thì văn bản dựa trên quy tắc sẽ được trả về. Kết hợp với `strings` / `render` để ngay
cả phương án dự phòng cũng bằng ngôn ngữ của bạn.

Lần tải mô hình đầu tiên sẽ tải xuống trọng số, nên hãy hiển thị một bộ tải với
`onProgress` (kết nối với Transformers.js / WebLLM). Các demo ở trên dùng một chỉ báo "đang
suy nghĩ" theo phong cách Bắc Âu điềm tĩnh trong khi nó chạy:

```ts
await explainChart(ctx, {
  backend: "transformers",
  model: SLM_PRESETS.transformers.gemma,
  onProgress: (p) => setLoading(p.status, p.progress), // drive your own loading UI
});
```

### Mô hình đến từ đâu (và cách thay đổi nó)

Việc tải mô hình không bao giờ nên là một bất ngờ. Đây là chính xác những gì mỗi backend
lấy về, từ đâu, theo mặc định:

| Backend | Có tải xuống không? | Nguồn mặc định |
| --- | --- | --- |
| `rules` (mặc định) | Không có gì | Hoàn toàn ngoại tuyến, có tính xác định |
| `transformers` | Trọng số mô hình, ở lần dùng đầu tiên | **`https://huggingface.co`** (được cache trong trình duyệt sau lần tải đầu tiên) |
| `webllm` | Trọng số mô hình, ở lần dùng đầu tiên | Registry dựng sẵn của WebLLM (lưu trữ trên Hugging Face), được cache trong trình duyệt |
| `remote` | Không có gì | Các prompt của bạn đi tới endpoint **của bạn** (tùy chọn `caller`) - ví dụ một máy chủ Ollama/llama.cpp cục bộ hoặc API của bạn. Dữ liệu rời khỏi trang; đó chính là phần tùy chọn. |

Hãy hỏi chính thư viện trước khi tải bất cứ thứ gì, và hiển thị nó cho người dùng của bạn:

```ts
import { describeModelSource, SLM_PRESETS } from "@michi-vz/insights";

const src = describeModelSource("transformers", SLM_PRESETS.transformers.phi3);
// { host: "https://huggingface.co",
//   url:  "https://huggingface.co/Xenova/Phi-3-mini-4k-instruct/resolve/main/",
//   downloads: true, note: "Transformers.js downloads the model files from ..." }
```

Và chuyển hướng nó với `modelSource` (hoạt động trên cả `explainChart` và
`createEmbedder`):

```ts
// A mirror (e.g. hf-mirror.com, or your artifact proxy):
await explainChart(ctx, {
  backend: "transformers",
  modelSource: { remoteHost: "https://models.example.com" },
});

// Self-hosted, fully offline - serve the model directory from your own origin
// and FORBID any remote download (intranet/compliance):
await explainChart(ctx, {
  backend: "transformers",
  model: "my-fine-tuned-model",
  modelSource: { localModelPath: "/models/", allowRemoteModels: false },
});

// WebLLM self-hosting: point its registry at your own weights:
await explainChart(ctx, {
  backend: "webllm",
  webllmAppConfig: { model_list: [{ model: "https://your.cdn/phi3/", model_id: "phi3", model_lib_url: "https://your.cdn/phi3/lib.wasm" }] },
});

// No download at all - your own API (local or remote):
await explainChart(ctx, { backend: "remote", caller: (prompt) => fetch("/api/llm", { method: "POST", body: prompt }).then(r => r.text()) });
```

## Agents & MCP

Cùng một registry đó cấp năng lượng cho demo bên dưới - mỗi nút là một lệnh gọi công cụ
thực sự đối với biểu đồ (chính xác các công cụ mà một client MCP như Claude Code sẽ gọi):

<InsightsDemo feature="agent" />

```ts
import { createAgentRegistry, chartHandle } from "@michi-vz/insights/agent";
import { createMcpServer, stdioTransport } from "@michi-vz/insights/mcp";
const registry = createAgentRegistry();
registry.register(chartHandle("revenue", chart, props));
createMcpServer(registry, stdioTransport(), { name: "michi-vz" });
```

Công cụ: `get_chart_context`, `summarize_chart`, `list_series`, `forecast_series`,
`detect_threshold_breach`, `set_filter`, `highlight`, `set_disabled`, `set_data`. Context của
mỗi biểu đồ cũng là một resource `michivz://chart/<name>` có thể đọc được. Một
`messagePortTransport` bắc cầu tới các biểu đồ của một ứng dụng web đang chạy.

---

## Tham chiếu

### Sub-path

Mỗi khả năng là một import có thể tree-shake riêng của chính nó:

| Import | Bạn nhận được gì | API |
| --- | --- | --- |
| `@michi-vz/insights/forecast` | plugin `forecast()` (dự đoán nét đứt + dải + độ chính xác đã backtest), kịch bản, đường xu hướng, ngưỡng + "fall point", `forecastFan()` | [forecast](/vi/api/insights/forecast) |
| `@michi-vz/insights/forecast` (bổ sung) | `decompose()` / `detectPeriod()` (mùa vụ), `detectChangepoints()`, `monteCarloForecast()`, `requiredGrowth()` / `pacingToGoal()` (goal-seek) | [forecast extras](/vi/api/insights/forecast-extras) |
| `@michi-vz/insights/anomaly` | `anomaly()` / `detectAnomalies()` - các điểm ngoại lệ z-score / IQR / dải dự báo | [anomaly](/vi/api/insights/anomaly) |
| `@michi-vz/insights/validate` | `validate()` - các cảnh báo chất lượng dữ liệu phong phú hơn | [validate](/vi/api/insights/validate) |
| `@michi-vz/insights/narrate` | `narrate()` / `explainChart()` - cơ sở quy tắc, SLM/remote tùy chọn | [narrate](/vi/api/insights/narrate) |
| `@michi-vz/insights/embeddings` | `reconcileLabels()` / `matchLabels()` / `findSimilar()` / `createEmbedder()` - dự phòng hash, BERT/MiniLM tùy chọn | [embeddings](/vi/api/insights/embeddings) |
| `@michi-vz/insights/sql` | `aggregate()` - group-by/measures (DuckDB-Wasm tùy chọn) | [aggregate](/vi/api/insights/sql) |
| `@michi-vz/insights/sonify` | `sonify()` - nghe một chuỗi dữ liệu như cao độ | [sonify](/vi/api/insights/sonify) |
| `@michi-vz/insights/agent` | `createAgent()` + registry công cụ | [agent & MCP](/vi/api/insights/agent) |
| `@michi-vz/insights/mcp` | `createMcpServer()` - Claude Code / Codex / Cursor | [agent & MCP](/vi/api/insights/agent) |

### Cách nó hoạt động (logic, theo cách đơn giản)

- **Forecast.** Khớp một mô hình (Holt-Winters theo dõi *level* + *trend*; hồi quy tuyến
  tính khớp một đường phù hợp nhất) → dự phóng về phía trước. **Dải** đến từ độ trải rộng
  sai số quá khứ của chính mô hình (mở rộng theo khoảng cách). Một **backtest** ẩn đi vài
  điểm thực gần nhất và đo sai số → con số độ chính xác.
- **Anomaly.** Tính trung bình và độ trải rộng, sau đó gắn cờ các điểm nằm quá xa - bằng
  **z-score** (một điểm cách trung bình bao nhiêu độ lệch chuẩn; bị gắn cờ khi vượt qua
  khoảng 3) hoặc **IQR** (liệu một điểm có nằm ngoài phạm vi giữa thông thường của dữ liệu
  hay không).
- **Narrate / Explain - từ ngữ đến từ đâu.** Theo **mặc định thì không hề có mô hình AI
  nào cả**: `narrate()` đọc `ChartContext` có cấu trúc (xu hướng, mover lớn nhất, % thay
  đổi, tổng) và điền vào các mẫu câu. Đó là việc lắp ráp chuỗi ký tự thuần túy, có tính xác
  định - tức thời và ngoại tuyến. `explainChart()` có thể **tùy chọn** nâng cấp lên một mô
  hình ngôn ngữ **sinh (generative)** thực sự: `backend: "transformers"` tải một mô hình
  sinh văn bản nhỏ (mặc định Phi-3-mini) trong trình duyệt qua Transformers.js, `backend:
  "webllm"` chạy Llama/Phi trên WebGPU, hoặc `backend: "remote"` gọi một mô hình của riêng
  bạn (ví dụ một API Claude). Bất kỳ cái nào trong số đó cũng nhận `ChartContext` làm prompt
  của nó và **quay về các quy tắc** nếu không khả dụng.
  > **Không phải BERT.** BERT (trong `@michi-vz/insights/embeddings`) biến văn bản thành
  > vector cho *độ tương đồng / tìm kiếm*, không phải để viết câu văn. Tường thuật mặc định
  > dựa trên quy tắc, hoặc một LLM sinh nhỏ khi được bật tùy chọn - hai công việc khác nhau.

### Thuật ngữ

Ý nghĩa bằng ngôn ngữ thuần túy của các thuật ngữ mà những biểu đồ này sử dụng:

- **Fall point (điểm chạm)** - vị trí mà đường dự phóng được kỳ vọng sẽ chạm tới một mục
  tiêu bạn quan tâm (một điểm hòa vốn, một mục tiêu), dù nó leo lên tới đó hay tụt xuống
  tới đó; nó trả lời câu hỏi "khi nào chúng ta sẽ tới đó?".
- **Confidence band / dải tin cậy (khoảng dự đoán)** - vùng được tô mờ quanh đường dự báo
  cho thấy khoảng mà giá trị tương lai có khả năng rơi vào; hẹp nghĩa là khá chắc chắn,
  rộng nghĩa là một phỏng đoán thô, và nó mở rộng ra khi vươn xa hơn.
- **Forecast horizon (chân trời dự báo)** - dự báo mở rộng bao nhiêu kỳ tương lai; một chân
  trời ngắn thì đáng tin hơn, một chân trời dài thì mang tính suy đoán hơn.
- **MAPE / backtest** - một điểm số cho độ chính xác của dự báo: những năm thực gần nhất bị
  ẩn đi, được dự đoán từ các năm trước đó, và sai số trung bình được báo cáo dưới dạng phần
  trăm (càng thấp càng tốt).
- **Holt-Winters** - phương pháp dự báo mặc định; nó học mức hiện tại và hướng xu hướng và
  mang đà đó tiến về phía trước, đặt trọng số cho các năm gần đây cao hơn các năm cũ.
- **z-score** - một giá trị bất thường đến mức nào, được tính là số bước chuẩn mà nó cách
  trung bình; quá khoảng ba bước thì nó bị gắn cờ là một điểm ngoại lệ.
- **IQR (hàng rào Tukey)** - một phép kiểm tra điểm ngoại lệ thay thế được xây dựng từ nửa
  giữa của dữ liệu, nên một giá trị cực đoan duy nhất không thể làm lệch nó; vững chắc cho
  các chuỗi dữ liệu gồ ghề hoặc lệch.
- **Anomaly (bất thường)** - một điểm bị gắn cờ vì nổi bật khác biệt so với phần còn lại
  của chuỗi dữ liệu (một đợt tăng vọt, một đợt sụt giảm, một lỗi dữ liệu có thể xảy ra),
  được đánh dấu bằng một chấm.
- **Top mover** - trên một biểu đồ nhiều đường, chuỗi dữ liệu biến động nhiều nhất giữa
  điểm đầu và điểm cuối; bản tóm tắt bằng ngôn ngữ thuần túy gọi tên nó ra, nên phát hiện
  đáng chú ý nhất được trao tận tay thay vì phải tự đi tìm.
- **Threshold / reference line (ngưỡng / đường tham chiếu)** - một đường ngang tại một giá
  trị quan trọng (một mục tiêu, một ngân sách, một điểm hòa vốn); mọi giá trị khác được đọc
  dựa trên nó, và đó là đường mà dự báo được theo dõi để tìm ra fall point.

Và các đơn vị và cách viết tắt mà các biểu đồ ví dụ sử dụng:

- **CPI (Chỉ số giá tiêu dùng)** - thước đo lạm phát chuẩn: giá trung bình của một giỏ hàng
  hóa thường ngày, nên CPI tăng nghĩa là chi phí sinh hoạt đang leo thang.
- **$k / $M** - nghìn / triệu đô la (nên "$120M" là 120 triệu).
- **Index (mốc cơ sở 100)** - một chuỗi dữ liệu được thu nhỏ lại sao cho năm đầu tiên của nó
  bằng 100, nên "xuống còn 92" đọc thoáng qua là "thấp hơn 8% so với mức bắt đầu", bất kể
  đơn vị gốc là gì.
- **Gigawatt (GW)** - một đơn vị công suất điện; một nhà máy điện lớn có công suất khoảng
  một GW.
- **Run-rate (tốc độ chạy)** - tốc độ mà một con số đang tăng trưởng ngay lúc này, được
  mang tiếp về phía trước (ví dụ "1,2 triệu đô la một tuần").
- **MRR (doanh thu định kỳ hàng tháng)** - khoản thu nhập đăng ký có thể dự đoán được mà
  một doanh nghiệp SaaS ghi nhận mỗi tháng, con số nổi bật mà các công ty như vậy được đo
  lường theo đó.

### Phương pháp & công thức

Mỗi con số trong các demo này đều được tính từ dữ liệu, không bao giờ chỉ nói suông - và
không cái nào trong số đó cần bằng cấp thống kê. Bên dưới là những gì mỗi phương pháp làm
bằng lời văn đơn giản, công thức đằng sau nó cho những ai tò mò, và một nguồn tham khảo
miễn phí, dễ đọc. Các tham chiếu tới *Hyndman* trỏ tới
[*Forecasting: Principles and Practice*](https://otexts.com/fpp3/), một giáo trình trực
tuyến miễn phí.

| Nó làm gì | Phương pháp | Công thức (cho người tò mò) | Tìm hiểu thêm |
| --- | --- | --- | --- |
| **Dự phóng một xu hướng về phía trước** - mang mức và độ dốc gần đây tiến lên; theo dõi một mùa vụ lặp lại nếu có tồn tại. | Holt-Winters | `ŷₜ₊ₕ = ℓₜ + h·bₜ` (level + trend được cập nhật mỗi bước) | [Làm mượt hàm mũ](https://otexts.com/fpp3/expsmooth.html) (Hyndman, ch. 8) |
| **Khớp một đường thẳng** - đường phù hợp nhất qua các điểm. | Hồi quy tuyến tính (OLS) | `ŷ = a + b·x` (bình phương tối thiểu) | [Hồi quy chuỗi thời gian](https://otexts.com/fpp3/regression.html) (Hyndman, ch. 7) |
| **Dự báo với đà (momentum)** - học cách mỗi điểm phụ thuộc vào quá khứ gần đây. | ARIMA / SARIMA (tải khi cần) | tự hồi quy + trung bình trượt | [Mô hình ARIMA](https://otexts.com/fpp3/arima.html) (Hyndman, ch. 9) · [thư viện `arima`](https://github.com/zemlyansky/arima) |
| **Cho thấy dự báo chắc chắn đến mức nào** - biến sai số quá khứ của chính mô hình thành các dải 50/80/95%; rộng hơn khi đi xa hơn. | Khoảng dự đoán (prediction interval) | `ŷ ± z·σ·√h` (z = 1.96 cho 95%) | [Khoảng dự đoán](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Chấm điểm độ chính xác** - ẩn các điểm gần đây, dự đoán lại chúng, và báo cáo mức độ lệch. | Backtest rolling-origin | `MAPE = mean(\|y−ŷ\|/\|y\|)·100` · `RMSE = √mean((y−ŷ)²)` | [Độ chính xác dự báo](https://otexts.com/fpp3/accuracy.html) (Hyndman, §5.8) |
| **Tách mùa vụ khỏi xu hướng** - tách một chuỗi dữ liệu thành xu hướng + mùa vụ lặp lại + nhiễu còn lại. | Phân tách STL | trend + seasonal + remainder (Loess) | [Phân tách STL](https://otexts.com/fpp3/stl.html) (Hyndman, §3.6) |
| **Mô phỏng nhiều tương lai** - phát lại hàng nghìn đường đi khả dĩ để có một dải tốt nhất/xấu nhất. | Monte Carlo | lấy mẫu lại phần dư qua N đường đi → dải kết quả | [Bootstrap & mô phỏng](https://otexts.com/fpp3/prediction-intervals.html) (Hyndman, §5.5) |
| **Gắn cờ một điểm ngoại lệ (đơn giản)** - đánh dấu các điểm xa trung bình. | z-score | `z = (x−μ)/σ`, gắn cờ `\|z\| > 3` | [Phát hiện điểm ngoại lệ](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm) (sổ tay NIST) |
| **Gắn cờ một điểm ngoại lệ (vững chắc)** - đánh dấu các điểm ngoài phạm vi giữa thông thường; bỏ qua các giá trị cực đoan. | IQR / hàng rào Tukey | `x < Q1−1.5·IQR` hoặc `x > Q3+1.5·IQR` | [Boxplot & hàng rào](https://www.itl.nist.gov/div898/handbook/prc/section1/prc16.htm) (sổ tay NIST) |
| **Đo lường một mối quan hệ** - hai biến di chuyển cùng nhau chặt chẽ đến mức nào, từ −1 đến +1. | Pearson *r* | `r = cov(x,y)/(σₓ·σᵧ)` | [Tương quan](https://otexts.com/fpp3/regression.html) (Hyndman, ch. 7) |
| **Khớp văn bản theo ý nghĩa** - biến các từ thành vector để những ý nghĩa tương tự có
điểm số cao. | Độ tương đồng cosine | `cos = (a·b)/(‖a‖·‖b‖)` | [Sentence embeddings](https://huggingface.co/docs/transformers.js) (Transformers.js) |

### So với quy trình pandas / notebook

Không phải một sự thay thế cho việc khám phá - hãy tiếp tục dùng pandas / R / một notebook
cho việc đó. Sự khác biệt nằm ở *nơi insight chạy*:

| | pandas / notebook | `@michi-vz/insights` |
| --- | --- | --- |
| **Chạy ở đâu** | máy của bạn, ngoại tuyến, một lần | ứng dụng, trình duyệt của người dùng |
| **Đầu ra** | một con số / hình ảnh tĩnh để chia sẻ | biểu đồ *đã render* tự cập nhật chính nó |
| **Đối tượng** | nhà phân tích | người dùng sản phẩm của bạn |
| **Backend** | runtime Python | không có - không máy chủ, dữ liệu ở lại cục bộ |
| **Sẵn sàng cho AI** | prompt được viết tay | biểu đồ **chính là** bề mặt công cụ (MCP) |

pandas là cách một insight được *khám phá*; đây là cách nó được **chuyển giao** tới người
dùng và biến thành một biểu đồ mà một tác nhân AI có thể điều khiển - cùng các phương pháp
đáng tin cậy, được giao tại runtime.

### Đọc thêm

- **Forecasting: Principles and Practice** (Hyndman & Athanasopoulos): <https://otexts.com/fpp3/>
- **Model Context Protocol**: <https://modelcontextprotocol.io> · [thông báo của Anthropic](https://www.anthropic.com/news/model-context-protocol)
- **Transformers.js** (BERT/embedding trong trình duyệt): <https://huggingface.co/docs/transformers.js>
- **NIST/SEMATECH e-Handbook of Statistical Methods**: <https://www.itl.nist.gov/div898/handbook/>

### Nguyên tắc

- **Tùy chọn & tree-shakeable** - các khả năng không dùng đến không chiếm byte nào.
- **Suy giảm nhẹ nhàng (graceful degradation)** - các đường dẫn thống kê/dựa-trên-quy-tắc
  không cần mô hình; các đường dẫn mô hình có phương án dự phòng.
- **Riêng tư theo mặc định** - dữ liệu ở lại trong trình duyệt; các backend từ xa là tùy
  chọn.
- **Chỉ mã nguồn mở dễ dãi (permissive-OSS)** - không mô hình nào từng được đóng gói sẵn.
