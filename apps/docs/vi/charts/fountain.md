---
title: Đài phun (Jet d'Eau)
description: "Biểu đồ Đài phun (Jet d'Eau), biểu đồ dấu ấn của michi-vz lấy cảm hứng từ đài phun nước Geneva: một biểu đồ với chế độ ảnh chụp nhanh và chế độ xu hướng. Thử nghiệm."
---
# Đài phun (Jet d'Eau)

<span class="vp-badge warning">Thử nghiệm</span> <span class="vp-badge tip">So sánh</span>

::: warning Thử nghiệm - chưa ổn định
Không giống 16 biểu đồ còn lại (đã ổn định), biểu đồ Đài phun là **thử nghiệm**: API, hình ảnh, và cấu trúc `ChartContext` của nó có thể thay đổi trong các phiên bản tương lai. Đây là một mark kể chuyện / truyền đạt, không phải một công cụ phân tích chính xác - xem [Khi nào Đài phun xứng đáng có mặt](#when-the-fountain-earns-its-place). Ghim một phiên bản cụ thể nếu bạn phụ thuộc vào nó.
:::

Geneva bơm 500 lít nước mỗi giây lên bầu trời. Bạn chụp ảnh tia nước. Bạn không bao giờ chụp được hàng tấn nước rơi trở lại mà không ai thấy - phần bụi nước mà cột nước thực sự được tạo nên từ đó. **Hầu hết các con số đều có hình dạng như vậy: một đỉnh sáng rõ, đứng trên một khối ẩn mà không ai ghi nhận.** Biểu đồ Đài phun vẽ cả hai cùng lúc - con số nổi bật bạn báo cáo, và thứ đang âm thầm bào mòn nó (hoặc nâng đỡ nó).

- **Đỉnh của tia nước chính là con số** - đọc nó trên trục y, một cách chính xác. Đây là kênh truyền đạt mạnh nhất mà một biểu đồ có.
- **Bụi nước là một lá cờ báo hiệu, không phải một cây thước** - "cái này đang chảy máu / cái này đang lung lay." Con số thứ hai *chính xác* nằm trong tooltip và trong `getContext()` (`spreadRatio`), không bao giờ được đo bằng độ rộng của chùm tia.

Vì vậy đây là một biểu đồ **kể chuyện và quy kết** trung thực: doanh thu đã ghi nhận so với doanh thu đang rò rỉ, doanh số đã chốt so với hao hụt, những ngôi sao bạn thấy so với những người bảo trì bạn không thấy. Đây không phải là một công cụ phân tích chính xác - cho việc đó, hãy dùng [Fan](/vi/charts/fan) (dải bất định), [Biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar) (đã bảo đảm + rủi ro có thể sắp xếp), hoặc một biểu đồ thác nước. Xem [Khi nào Đài phun xứng đáng có mặt](#when-the-fountain-earns-its-place).

`style: "jet"` mặc định là Jet d'Eau trung thực: một cột cao, hẹp, đặc ở đáy, tơi dần thành một vòng vương miện mềm mại trôi theo chiều gió. Một `style: "plume"` đối xứng hơn (một cột thẳng đứng với một chùm hoa mềm mại và một váy sương mù) cũng có sẵn - xem [Hai hình dạng](#two-silhouettes).

<ChartDemo chart="fountain-chart" :legend="false" />

## Giải phẫu: đọc một đài phun nước thế nào

Mỗi phần nhìn thấy được của hình đều mang đúng một ý nghĩa đã định. Không có gì khác chứa dữ liệu.

- **Đỉnh (apex)** - CHÍNH LÀ con số. Nó nằm trên một trục y có nhãn thật, và là thứ duy nhất bạn đo.
- **Thân (stem)** - phần thân của con số. Chỉ mang tính trang trí; độ rộng của nó không bao giờ mã hóa gì cả.
- **Vòng vương miện / bọt (crown / froth)** - lá cờ báo hiệu: "cái này đang lung lay / cái này đang chảy máu." Rộng và sủi bọt nghĩa là hãy nhìn kỹ hơn; con số thứ hai chính xác nằm trong tooltip và trong `getContext().jets[].spreadRatio`, không bao giờ nằm ở độ rộng bạn thấy.
- **Vòng vương miện đối xứng hay nghiêng** - đối xứng là một tín hiệu. Vòng vương miện thẳng đứng nói rằng độ trải cân bằng (có thể lệch về bên nào cũng được). Vòng vương miện nghiêng nói rằng khối ẩn nghiêng về một phía, một cái đuôi trễ, rủi ro thiên về phía dưới. Chỉ đọc hướng nghiêng thôi; con số lệch nằm trong tooltip (`jets[].lean`).
- **Gió** - một tia không mã hóa `lean` vẫn trôi nhẹ về một phía. Đó là dấu ấn Jet d'Eau chung (gió thổi trên mặt hồ), thuần túy trang trí: mọi tia như vậy đều trôi theo cùng một hướng, và `lean` là `null` trong context.
- **Giọt nước và sương mù (kiểu plume)** - trang trí; số lượng giọt nước tỉ lệ theo trường `density` tùy chọn.

> Một biểu đồ, hai chế độ - quyết định bởi kiểu trục x. Đặt `xAxisDataType: "band"` cho **chế độ Ảnh chụp nhanh**: một tia cho mỗi danh mục, so sánh độ lớn cạnh nhau (đài phun, thành phố, sản phẩm). Dùng một trục x theo thời gian hoặc số (`"date_annual"`, `"date_monthly"`, `"number"`) cho **chế độ Xu hướng**: một tia cho mỗi kỳ, các đỉnh đang tăng dần vẽ nên xu hướng trong khi mỗi chùm tia thể hiện độ biến động của kỳ đó, và một tia dự báo hiển thị nét đứt với vòng vương miện rộng hơn, sủi bọt hơn.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 400; i++) {
    const base = 40 + 60 * Math.sin(i / 11) + 20 * Math.sin(i / 3.3);
    const value = Math.max(5, Math.round(base + (i % 7) * 2));
    const spread = Math.max(1, Math.round(4 + 18 * Math.abs(Math.sin(i / 5)) + (i % 5)));
    const density = Math.min(1, 0.15 + (spread / 40));
    dataSet.push({
      label: `Jet ${i + 1}`,
      value,
      spread,
      density,
      ...(i % 47 === 0 ? { color: "#D4AF37" } : {}),
    });
  }
  return { dataSet, xAxisDataType: "band" };
}
</script>

FountainChart có tùy chọn `renderer="webgpu"` để vẽ cột và chùm tia tơi của mỗi tia dưới dạng các mark theo instance trên GPU trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Tính năng này được kiểm soát theo khả năng: trên trình duyệt không có WebGPU, nó sẽ tự động hạ cấp xuống canvas, và `getContext().renderer` báo cáo bất kỳ renderer nào thực sự đã vẽ. Độ trôi ngang chung mà bạn thấy giữa các tia chỉ là gió trang trí (không tia nào trong số này mã hóa `lean`), không phải dữ liệu.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="400 jets" />

## Cách dùng

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = the chart options
```

```vue [Vue]
<script setup>
import { FountainChart } from "@michi-vz/vue";
</script>

<template>
  <FountainChart :options="props" />
</template>
```

```svelte [Svelte]
<script>
  import { fountainChart } from "@michi-vz/svelte";
</script>

<div use:fountainChart={props}></div>
```

```ts [Angular]
// main.ts - register the elements once
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// component (uses CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // renderer-agnostic, LLM-ready
chart.destroy();
```

:::

## Chế độ Ảnh chụp nhanh (trục x theo danh mục)

Truyền `xAxisDataType: "band"` (hoặc bỏ qua; "band" là mặc định). Mỗi phần tử `dataSet` trở thành một tia, đặt trong dải x riêng của nó. Đây là chế độ so sánh: chiều cao trả lời "cái nào lớn hơn?" và độ rộng chùm tia trả lời "cái nào bất định nhất?"

```ts
const props = {
  xAxisDataType: "band",
  dataSet: [
    { label: "Jet d'Eau",    value: 140, spread: 20 },
    { label: "King Fahd",    value: 312, spread: 35 },
    { label: "World Cup",    value: 185, spread: 15 },
    { label: "Bellagio",     value:  84, spread:  8 },
  ],
};
```

## Chế độ Xu hướng (trục x theo thời gian hoặc số)

Cung cấp một `xAxisDataType` theo thời gian hoặc số và bổ sung một `date` cho mỗi phần tử. Các tia được bố trí dọc theo trục thời gian; một đường xu hướng xâu chuỗi các đỉnh của chúng lại với nhau. Một phần tử `predicted: true` hiển thị nét đứt với một chùm tia sủi bọt rõ rệt hơn - vẻ ngoài của dự báo.

```ts
const props = {
  xAxisDataType: "date_annual",
  dataSet: [
    { label: "2020", date: 2020, value: 42, spread:  5 },
    { label: "2021", date: 2021, value: 51, spread:  6 },
    { label: "2022", date: 2022, value: 63, spread:  8 },
    { label: "2023", date: 2023, value: 70, spread: 10 },
    { label: "2024", date: 2024, value: 78, spread: 14, predicted: true },
    { label: "2025", date: 2025, value: 85, spread: 20, predicted: true },
  ],
};
```

::: warning Phù hợp nhất với 5-12 kỳ ở chế độ xu hướng
Với nhiều điểm dữ liệu, các tia bị nén lại và biểu đồ trông giống như một biểu đồ đường được trang trí - chi tiết chùm tia bị mất đi. Với chuỗi thời gian dày đặc (20+ kỳ), hãy ưu tiên [biểu đồ Fan](/vi/charts/fan) vốn mã hóa độ bất định thành các dải tin cậy mượt mà. Đài phun tỏa sáng ở quy mô con người: một vài kỳ nơi mỗi chùm tia có không gian để "thở".
:::

## Cẩm nang: các cách đọc một đài phun nước

Đài phun còn mới, nên đây là toàn bộ kho cách đọc: mỗi demo là một biểu đồ sống thật với một chú thích trung thực. Bốn cái đầu là cách đọc chủ lực (con số nổi bật và thứ đang âm thầm bào mòn hoặc nâng đỡ nó); phần còn lại tổng quát hóa cùng một ngữ pháp đó cho độ chắc chắn, độ ổn định, rủi ro, AI và đối tượng khán giả.

### Doanh số đã chốt so với hao hụt

Ba cửa hàng ghi nhận doanh số gần như giống hệt nhau, nên một biểu đồ cột sẽ coi chúng ngang nhau. Chùm tia dày, đặc ở Store C báo hiệu nơi trộm cắp và hư hỏng hàng đang bào mòn biên lợi nhuận, và nơi cần ưu tiên gửi đội chống thất thoát tới trước. Tỷ lệ hao hụt nằm trong tooltip; trên 2% doanh số là ngưỡng cảnh báo.

<ChartDemo chart="fountain-chart" :index="1" :legend="false" />

### Đã giao so với chưa từng lập hóa đơn (xu hướng)

Chế độ xu hướng: lượng giao hàng vẫn tăng đều, nhưng chùm tia ngày càng rộng cảnh báo rằng một phần ngày càng lớn không bao giờ được lập hóa đơn, rò rỉ và sử dụng không đo đếm được đang vượt qua tốc độ tăng trưởng. Dưới 10% nước phi doanh thu là tốt; trên 20% nghĩa là cần hành động.

<ChartDemo chart="fountain-chart" :index="2" :legend="false" />

### Một dự báo cao nhưng lung lay

Xu hướng đang tăng, nhưng các tia dự báo tơi ra thành bọt nét đứt: tăng trưởng được dự báo, còn độ tin cậy đằng sau nó đang mỏng dần nhanh chóng. Muốn có dải chính xác, [biểu đồ Fan](/vi/charts/fan) mới là công cụ phù hợp; đây là phiên bản dễ nhớ của cùng một lời cảnh báo đó.

<ChartDemo chart="fountain-chart" :index="3" :legend="false" />

### Ngôi sao bạn thấy, người bảo trì bạn không thấy

Cái hook mà biểu đồ này được sinh ra để kể: đỉnh tia là thứ ai cũng thấy và gắn sao; bụi nước là những contributor vô hình mà dự án thực sự đang dựa vào. Danh tiếng tương đồng, nền tảng rất khác nhau. Kể chuyện, không phải đo lường.

<ChartDemo chart="fountain-chart" :index="4" :legend="false" />

### Cùng một con số, ba mức độ chắc chắn

Ba đội ước tính cùng một con số 72 ngày để ra mắt. Đỉnh giống hệt nhau; chỉ có chùm tia phân biệt đội đã đo đạc thật với đội chỉ đoán mò. Lá cờ báo hiệu nói rằng con số 72 đó không chắc chắn, khoảng chính xác thuộc về tooltip, còn các khoảng tin cậy thật sự thuộc về [biểu đồ Fan](/vi/charts/fan).

<ChartDemo chart="fountain-chart" :index="6" :legend="false" />

### Ổn định hay lung lay

Hai service có latency trung bình 120 ms và hai service khác trung bình 60 ms, một biểu đồ cột sẽ cho thấy hai cặp song sinh. Chùm tia tách từng cặp ra: vòng vương miện thắt chặt là cái bạn có thể đặt SLO lên. Ở đây đỉnh thấp hơn là tốt hơn; hãy ghi rõ điều đó trong chú thích khi bạn dùng cách đọc này. Cách đọc tương tự áp dụng cho lợi nhuận so với độ biến động.

<ChartDemo chart="fountain-chart" :index="7" :legend="false" />

### Tổn thất dự kiến so với trường hợp xấu nhất

Đỉnh là tổn thất dự kiến; vòng vương miện vươn tới trường hợp căng thẳng (`value + spread`, chính là `upperBound` trong `getContext()`). Hai vị thế dự kiến cùng một mức tổn thất; một trong hai ẩn giấu một cái đuôi nặng hơn nhiều. Đọc con số xấu nhất trên tooltip, không bao giờ đọc trên độ rộng.

<ChartDemo chart="fountain-chart" :index="8" :legend="false" />

### Câu trả lời AI: chắc chắn hay đang đoán

Đỉnh là điểm số của câu trả lời; chùm tia là độ bất định của chính model, được chuẩn hóa về cùng đơn vị điểm số để cả hai chia sẻ chung trục y. Vòng vương miện thắt chặt: an toàn để tự động hóa. Vòng vương miện tơi ra: nên giao cho con người xử lý. [Lớp insights](/vi/guide/insights) đọc cùng `spreadRatio` từ `getContext()` để kể lại câu trả lời nào đáng tin.

<ChartDemo chart="fountain-chart" :index="9" :legend="false" />

### Cùng mức trung bình, khán giả bị chia tách

Hai bài viết có cùng mức trung bình 5.5 phút thời gian đọc. Một bài giữ chân gần như mọi độc giả trong khoảng đó; bài kia lại chia độc giả ra thành nhóm lướt nhanh và nhóm đọc say sưa. Con số trung bình che giấu sự chia tách; chùm tia báo hiệu nó, và tín hiệu đó là gợi ý để bạn phân khúc trước khi kết luận bất cứ điều gì.

<ChartDemo chart="fountain-chart" :index="10" :legend="false" />

### Rủi ro nghiêng về phía nào

Đối xứng như một tín hiệu: ba tuyến đường có cùng trung vị và cùng độ trải, nhưng một vòng vương miện nghiêng, những bất ngờ của nó thiên về một phía, một cái đuôi trễ (`lean: 0.8`). Thẳng đứng (`lean: 0`) nghĩa là cân bằng; nghiêng nghĩa là khối ẩn nghiêng về phía đó. Chỉ đọc hướng nghiêng thôi, đừng bao giờ đọc góc nghiêng.

<ChartDemo chart="fountain-chart" :index="11" :legend="false" />

### Bão trên Philippines

Đôi khi độ nghiêng mang nghĩa đen. Mỗi cột nước là một cơn bão: apex là sức gió duy trì cực đại, phần spray vươn tới gió giật (cùng đơn vị km/h), độ dày của froth thể hiện độ rộng trường gió, còn vương miện nghiêng theo hướng bão di chuyển - bão Thái Bình Dương quét qua Philippines từ đông sang tây nên cả hàng nghiêng về trái, riêng cơn bão đổi hướng lên Nhật Bản nghiêng về phía kia. Một glyph, bốn kênh trung thực, không cần thêm loại biểu đồ mới nào.

<ChartDemo chart="fountain-chart" :index="12" :legend="false" />

## Hai hình dạng

Đặt `style` để chọn hình dạng; cả hai đều mã hóa cùng dữ liệu (đỉnh = `value`, kênh độ trải = `spread`).

- **`style: "jet"` (mặc định)** - Jet d'Eau trung thực: một cột cao, hẹp, đặc và không trong suốt ở đáy, **tơi dần thành một vòng vương miện mềm, bán trong suốt** ở đỉnh (dựng từ các lớp độ mờ tăng dần; độ rộng vòng vương miện tăng theo `spread`, số lớp tăng theo `density` tùy chọn). `lean` (trong khoảng [-1, 1]) khiến vòng vương miện **trôi theo chiều gió**. Mang tính biểu tượng; phù hợp nhất làm một tiêu điểm/KPI hoặc một so sánh.
- **`style: "plume"`** - một cột đối xứng nở thành một vòng vương miện mềm mại: `frothLayers` là các lát độ mờ tăng dần ở đỉnh, một váy `showMist` mềm mại, và các vòng cung đạn đạo `showDroplets`. `stemFraction` và `bloomExponent` tinh chỉnh biên dạng từ cột sang vòng vương miện. Gọn gàng hơn cho một KPI đơn lẻ nơi độ trải đọc như một quầng tin cậy.

```ts
const props = { style: "plume", dataSet: [{ label: "Q4", value: 78, spread: 20 }] };
```

<ChartDemo chart="fountain-chart" :index="5" :legend="false" />

**Nguyên tắc chung: plume cho ít tia, jet cho hero và cho dữ liệu lớn.** Ở quy mô con người (1 đến 12 tia), vòng vương miện đối xứng nhiều lớp của plume là hình dạng dễ đọc triệu chứng nhất, quầng thắt chặt so với bọt trải rộng. Với hàng trăm tia, phần nở của plume bị ép lại thành một lát mỏng trong ô chứa và suy biến thành một cột đơn giản, trong khi jet với thân chiếm ưu thế lại suy biến một cách duyên dáng thành một dải cao (xem demo dữ liệu lớn ở trên); nó cũng mang thương hiệu riêng. Với chuỗi dữ liệu thực sự dày đặc, hãy ngừng trang trí và dùng [biểu đồ Fan](/vi/charts/fan).

**Đối xứng mang ý nghĩa.** Một vòng vương miện thẳng đứng (kiểu plume, hoặc một tia với `lean: 0`) nói rằng độ trải cân bằng. Một vòng vương miện nghiêng (`lean` trong khoảng [-1, 1], chỉ dấu của nó mới quan trọng) nói rằng độ trải nghiêng về một phía. Một tia **không có** `lean` vẫn giữ một độ trôi trang trí nhẹ nhàng, gió Geneva, và báo cáo `lean: null` trong context, để consumer phân biệt được đâu là lá cờ và đâu chỉ là trang trí.

Cả hai kiểu đều dùng chung `stemFraction` (nửa độ rộng đáy cột như một phân số của ô chứa), trường `density`, và `lean`. Màu sắc theo dữ liệu/`colorsMapping` của bạn; bọt/bụi nước chỉ điều biến độ mờ của tông màu của bạn, nên biểu đồ thích ứng với cả chủ đề sáng lẫn tối.

## Khi nào Đài phun xứng đáng có mặt

Tài liệu học thuật đã được rà soát trước khi biểu đồ này phát hành. Ẩn dụ Jet d'Eau là mới mẻ trong dataviz (chưa có biểu đồ đài phun/tia nước nào từng tồn tại), và ý tưởng nền tảng là một cách định hướng lại hợp lý cho họ raincloud / violin / density-strip. Nhưng công việc trung thực của nó là **truyền đạt, không phải đo lường** - vì vậy hãy dùng nó ở nơi một tiêu điểm dễ nhớ cộng với nửa ẩn của nó quan trọng, và dùng một biểu đồ chính xác khi bạn cần so sánh chính xác con số thứ hai.

**Phù hợp mạnh**

- **Tiêu điểm so với sự bào mòn ẩn.** Doanh thu đã ghi nhận so với đang rò rỉ (khoảng cách giữ chân từ gross sang net), doanh số đã chốt so với hao hụt, công suất so với tổn thất. Một mark nói lên "đây là con số, và đây là thứ đang chảy máu bên dưới nó." Đây là công dụng chủ lực của nó.
- **Cao nhưng lung lay / bị đẩy lên cao.** Một cột thể hiện mức độ; bụi nước bổ sung "và đây là mức độ mong manh của nó."
- **Kể chuyện "những gì bạn thấy so với những gì đã bỏ ra"** - chiến thắng hiển hiện và công sức vô hình đằng sau nó. Nó thắng ở khả năng nhận diện và ghi nhớ (điều duy nhất mà nghiên cứu về trang trí đồ thị ủng hộ).

**Dùng nó một cách trung thực**

- **Đỉnh là thứ duy nhất người đọc đo lường.** Đặt con số tiêu điểm ở đó, trên một trục y có nhãn thực sự. Độ rộng và diện tích là các kênh có độ chính xác thấp (con người đánh giá thấp chúng), vì vậy không bao giờ yêu cầu ai đó so sánh độ rộng của bụi nước.
- **Bụi nước là một lá cờ báo hiệu; con số là văn bản.** Hiển thị con số thứ hai chính xác trên tooltip / chú giải / `getContext().jets[].spreadRatio`, và neo nó vào một ngưỡng đã nêu rõ (hao hụt > 2%, NRR < 100%, nước phi doanh thu > 20%, P10-P90).
- **Ưu tiên chế độ ảnh chụp nhanh**; giới hạn chế độ xu hướng ở một vài kỳ. Đối với công việc bất định dày đặc hoặc chính xác, hãy ưu tiên [Fan](/vi/charts/fan) (dải), [Biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar) (đã bảo đảm + rủi ro có thể sắp xếp), hoặc một biểu đồ thác nước.
- Giữ ở mức **5-12 hình biểu tượng** và sắp xếp các ảnh chụp nhanh theo `spreadRatio` để tìm ra mục sủi bọt nhất một cách dễ dàng.

## API

Các prop được định kiểu là `FountainChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) độc lập với renderer. Tài liệu tham khảo đầy đủ: [Fountain API](/vi/api/fountain).
