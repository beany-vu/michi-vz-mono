---
title: Đài phun (Jet d'Eau)
description: "Biểu đồ Đài phun (Jet d'Eau): một chấm lớn cho giá trị thường gặp, một đài phun từ mức thấp nhất đến mức cao nhất, và một chấm nhỏ cho mỗi lần đo thật, để bạn đếm được bao nhiêu lần vượt giới hạn. Thử nghiệm."
---
# Đài phun (Jet d'Eau)

<span class="vp-badge warning">Thử nghiệm</span> <span class="vp-badge tip">So sánh</span>

::: warning Thử nghiệm - chưa ổn định
Không giống 21 biểu đồ còn lại (đã ổn định), biểu đồ Đài phun là **thử nghiệm**: API, hình ảnh và cấu trúc `ChartContext` của nó có thể thay đổi trong các phiên bản tương lai. Core 1.29 đã vẽ lại nó từ đầu; xem [Chuyển từ core 1.28](#migrating). Hãy ghim một phiên bản cụ thể nếu bạn phụ thuộc vào nó.
:::

**"Đi làm mất bao lâu?"** "Khoảng 30 phút" là đúng, nhưng chưa phải toàn bộ câu trả lời. Có hôm mất 22 phút, có hôm mất 55 phút. Điều bạn thật sự muốn biết là bao nhiêu lần nó vượt quá thời gian bạn dành ra. Biểu đồ Đài phun cho thấy tất cả trên cùng một trục: thời gian thường gặp, ngày tốt nhất và ngày tệ nhất, và từng ngày một dưới dạng một chấm bạn có thể đếm.

Tên biểu đồ lấy từ Jet d'Eau ở Geneva: một thân nước mảnh vươn lên từ mặt hồ rồi rơi xuống thành đài phun.

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

Mỗi chấm nhỏ là một trong 20 ngày làm việc gần nhất. Đi ô tô thường mất 30 phút, nhưng có 3 trong 20 ngày vượt vạch 45 phút, nên thỉnh thoảng vẫn có ngày tệ khi đi ô tô. Xe buýt vượt vạch 8 trên 20 ngày, nên ngày tệ khi đi xe buýt là thường xuyên. Tàu hỏa và xe đạp điện không bao giờ chạm vạch.

## Cách đọc {#how-to-read-it}

::: tip Các quy tắc
- **Chấm lớn là con số nên dùng**: giá trị thường gặp. Một nửa số lần đo nằm dưới nó, một nửa nằm trên.
- **Mỗi chấm nhỏ là một lần đo thật**: 20 chấm nhỏ là 20 ngày.
- **Nhiều chấm nhỏ sát nhau** cho thấy điều thường xảy ra.
- **Vạch đỏ đứt nét** là một lời hứa hay một giới hạn.
- **Bao nhiêu lần?** Đếm các chấm nhỏ vượt qua vạch: **1-2 trên 20 là hiếm, 3-4 là thỉnh thoảng, từ 5 trở lên là thường xuyên.** Dưới mỗi cột, biểu đồ đếm giúp bạn: trong bản demo, "17 of 20 within 45 min" nghĩa là 17 ngày ở phía tốt, tức 3 ngày vượt vạch.
- **Đài phun cao** nghĩa là thay đổi nhiều. Đài phun thấp nghĩa là lần nào cũng gần như nhau.
- **Tổng số chấm nhỏ nhiều hơn** nghĩa là đo nhiều lần hơn, nên đáng tin hơn. Đó không phải là một giá trị lớn hơn.
- **Ít chấm nhỏ** nghĩa là chỉ là phỏng đoán. Dưới 10 chấm, biểu đồ ghi rõ ("only 5 days").
- **Trái hay phải không có ý nghĩa gì.** Các chấm nhỏ chỉ dịch sang bên để không che nhau.
:::

### Các phần của một đài phun {#anatomy}

<ChartDemo chart="fountain-chart" :index="16" :legend="false" :height="420" />

1. **Thân**: một thanh từ 0 lên đến chấm lớn. Nó dừng ở chấm lớn. Cao hơn nghĩa là nhiều phút hơn, và ở đây nhiều phút hơn nghĩa là chậm hơn.
2. **Chấm lớn**: ngày thường gặp, 30 phút. Một nửa số ngày nhanh hơn, một nửa chậm hơn. Hãy dùng con số này.
3. **Đài phun**: đỉnh là ngày tệ nhất (55 phút), đáy phẳng là ngày tốt nhất (22 phút). Độ rộng của nó không có ý nghĩa gì: nó chỉ chừa chỗ cho các chấm nhỏ.
4. **Chấm nhỏ**: mỗi chấm là một ngày thật, nằm đúng độ cao của nó, luôn ở bên trong đài phun. Chỗ các chấm dồn lại, từ 25 đến 35 phút, là điều thường xảy ra. Hai chấm ở tít trên là những ngày chậm duy nhất.
5. **Vạch và số đếm**: vạch đứt nét màu đỏ là một lời hứa hay một giới hạn, ở đây là 45 phút bạn dành ra. Dưới cột, "18 of 20 within 45 min" đếm các chấm nhỏ nằm ở phía tốt của vạch.

Các con số cũng được ghi dưới cột (thường gặp, tốt nhất, tệ nhất) và hiện trong tooltip, nên không ai phải đo gì trên trục.

### Sáu dạng thường gặp {#patterns}

Mỗi đài phun dưới đây là cùng một quãng đường, đo vào những ngày khác nhau, trên cùng một trục: số phút, cao hơn = chậm hơn.

#### Ổn định

Đài phun thấp, các chấm nhỏ sát nhau: gần như ngày nào cũng mất chừng ấy thời gian.

<ChartDemo chart="fountain-chart" :index="17" :legend="false" :height="320" />

#### Thay đổi nhiều

Đài phun cao, chấm nhỏ trải dài lên tận đỉnh: ngày chậm là chuyện thường, nên hãy dành thêm thời gian.

<ChartDemo chart="fountain-chart" :index="18" :legend="false" :height="320" />

#### Hiếm khi tệ

Phần lớn chấm nhỏ ở dưới thấp, một khoảng trống, rồi một hai chấm ở trên cao: thường thì ổn, ngày tệ rất hiếm.

<ChartDemo chart="fountain-chart" :index="19" :legend="false" :height="320" />

#### Thường tệ

Phần lớn chấm nhỏ ở trên cao và chấm lớn gần đỉnh: ở đây chậm mới là ngày bình thường.

<ChartDemo chart="fountain-chart" :index="20" :legend="false" :height="320" />

#### Chỉ là phỏng đoán

Chỉ có 5 chấm nhỏ: quá ít ngày để tin được. Biểu đồ ghi thêm "only 5 days" dưới cột.

<ChartDemo chart="fountain-chart" :index="21" :legend="false" :height="320" />

#### Đủ ngày

Cùng hình dạng đó với 20 chấm nhỏ: đếm được nhiều ngày hơn, nên đáng tin hơn. Đài phun này đi từ cùng ngày tốt nhất đến cùng ngày tệ nhất như cái ở trên; chỉ có số chấm nhỏ thay đổi (đài phun rộng hơn một chút chỉ để chừa chỗ cho chúng).

<ChartDemo chart="fountain-chart" :index="22" :legend="false" :height="320" />

## Khi nào nên dùng, khi nào không {#when-to-use}

**Hãy dùng** khi mỗi cột có một con số mà mọi người hay nhắc tới, khoảng thật xung quanh nó, và nếu được thì cả các lần đo, và câu hỏi là "bao nhiêu lần nó vượt giới hạn của tôi?". Đi làm, thời gian giao hàng, giá ở các cửa hàng, điểm kiểm tra của một lớp, thời lượng pin: bất cứ thứ gì được đo đi đo lại.

- Dễ đọc nhất với **2 đến 12 cột** và 10 đến 30 chấm nhỏ mỗi cột.
- Thêm một **đường tham chiếu có `goodSide`** khi có một lời hứa, một ngân sách hay một điểm đạt. Khi đó biểu đồ tự đếm giúp người đọc.
- Ghi rõ phía nào là tốt trong `yAxisTitle`, ví dụ "phút (cao hơn = chậm hơn)".

**Hãy dùng biểu đồ khác** khi:

- bạn so sánh hai giá trị trên mỗi hàng (trước và sau, 2010 và 2023): [Biểu đồ khoảng cách](/vi/charts/gap);
- bạn dự báo nhiều kỳ phía trước và càng xa thì dự báo càng kém chắc chắn: [Biểu đồ hình quạt](/vi/charts/fan);
- bạn chia một tổng thành các phần: [Biểu đồ cột chồng dọc](/vi/charts/vertical-stack-bar);
- bạn chỉ có một con số cho mỗi mục và không có khoảng: một biểu đồ cột đơn giản nói nhanh hơn.

## Ví dụ {#examples}

Mười sáu câu hỏi đời thường. Các con số chỉ mang tính minh họa: được tạo ra cho giống thật, không lấy từ nguồn công bố nào. Các biểu đồ hiển thị chữ bằng tiếng Anh; `labels`, `endLabels` và `sampleWord` dùng để dịch chúng (xem [Các tùy chọn](#switches)).

### Đi làm thật ra mất bao lâu? {#commute-by-mode}

<ChartDemo chart="fountain-chart" :index="0" :legend="false" :height="480" />

**Cách đọc.** Mỗi chấm nhỏ là một trong 20 ngày làm việc gần nhất. Các chấm nhỏ của ô tô dồn lại trong khoảng 25 đến 35 phút, và chỉ 3 ngày vượt quá 45 phút tôi dành ra, lâu nhất là 55. Vậy thỉnh thoảng vẫn có ngày tệ khi đi ô tô. Xe buýt vượt 45 phút trong 8 trên 20 ngày, nên ngày tệ khi đi xe buýt là thường xuyên. Chấm nhỏ của tàu hỏa và xe đạp điện không bao giờ chạm vạch: ngày nào cũng mất gần như bằng nhau.

**Vì sao dùng biểu đồ này.** Một cột của ngày thường gặp sẽ cho ô tô thắng. Đài phun cho thấy ô tô cũng có thể làm bạn trễ 25 phút. Các chấm nhỏ cho thấy bao lâu một lần: 3 trên 20 ngày với ô tô, 8 trên 20 với xe buýt, và không lần nào với tàu hỏa hay xe đạp điện. Vào buổi sáng không được phép trễ, hãy đi tàu.

### Tôi trả tiền cho 100 Mbps. Thực tế tôi được bao nhiêu? {#home-internet-promised-vs-real}

<ChartDemo chart="fountain-chart" :index="1" :legend="false" :height="480" />

**Cách đọc.** Lúc 21 giờ, chấm lớn là 62, nhưng đài phun xuống tới 22. Các chấm nhỏ cho thấy đó không phải một lần đo xui xẻo: 5 trong 20 buổi tối tốc độ dưới 40, chưa bằng một nửa số bạn trả tiền. Lúc 17 giờ chỉ hai chấm nhỏ nằm thấp, nên chiều muộn mà chậm là hiếm. Lúc 7 giờ và 1 giờ sáng, các chấm nhỏ dồn sát đỉnh: những giờ đó đáng tin.

**Vì sao dùng biểu đồ này.** Tốc độ thường gặp trung bình trên 80, đủ gần 100 để bỏ qua. Đài phun lúc 21 giờ cho thấy buổi tối có thể tụt xuống còn khoảng một phần năm lời hứa, và các chấm nhỏ cho thấy chuyện này xảy ra khoảng một tối trong bốn, không phải chỉ một lần. Đó là bằng chứng để mang tới nhà mạng.

### Giao đồ ăn thật ra mất bao lâu? {#food-delivery-real-time}

<ChartDemo chart="fountain-chart" :index="2" :legend="false" :height="480" />

**Cách đọc.** Mỗi chấm nhỏ là một đơn hàng. Tối thứ Sáu, thời gian chờ thường gặp là 45 phút, nhưng 5 trong 20 đơn gần nhất mất hơn một tiếng, nên giao chậm là chuyện thường: hãy đặt trước khi đói, hoặc tự đến lấy. Chủ nhật mưa, gần như đơn nào cũng hơi chậm, nhưng chỉ 2 trên 18 đơn quá một tiếng.

**Vì sao dùng biểu đồ này.** Thời gian chờ thường gặp từ 25 đến 50 phút, và nếu vẽ thành cột thì trông đều như một lần chờ bình thường. Các đài phun cho thấy tối thứ Sáu và Chủ nhật mưa đều có thể mất 80 đến 90 phút. Các chấm nhỏ cho thấy nên lo cho lúc nào: tối thứ Sáu cứ bốn đơn thì một đơn quá một tiếng, còn Chủ nhật mưa chỉ có hai đơn. Trưa ngày thường, phần lớn chấm nhỏ nằm trong khoảng năm phút quanh con số 30 mà ứng dụng hứa, và đêm khuya gần như đơn nào cũng nhanh hơn thế.

### Ưu đãi Black Friday có thật sự rẻ hơn? {#black-friday-tv}

<ChartDemo chart="fountain-chart" :index="3" :legend="false" :height="480" />

**Cách đọc.** Mỗi chấm nhỏ là giá của một cửa hàng cho cùng một chiếc TV. Cuối tháng Mười và đầu tháng Mười Một, các chấm nhỏ đi lên: phần lớn cửa hàng tăng giá. Trong tuần Black Friday chúng quay về gần mức đầu tháng Mười, nên phần lớn "ưu đãi" chỉ thấp hơn vạch tháng Mười từ 5 đến 55 €. Chỉ một chấm nhỏ nằm tít dưới ở 600 €: một trong 15 cửa hàng thật sự bán rẻ hơn.

**Vì sao dùng biểu đồ này.** Một đường giá thường gặp chỉ cho thấy một chỗ trũng nhỏ. Đài phun cho thấy giá nhích dần trong những tuần trước đó, và đáy chạm 600 € trong tuần Black Friday, nhưng riêng nó thì không nói được có bao nhiêu cửa hàng rẻ đến thế. Các chấm nhỏ nói được: một cửa hàng đứng một mình ở 600 € và 14 cửa hàng còn lại dồn quanh vạch tháng Mười. Một món hời thật là hiếm, và biểu đồ cho thấy điều đó.

### Đơn hàng online của tôi có đến kịp không? {#parcel-delivery-by-origin}

<ChartDemo chart="fountain-chart" :index="4" :legend="false" :height="440" />

**Cách đọc.** Từ Trung Quốc, chấm lớn là 12 ngày, nhưng đài phun lên tới 30. Hãy đếm các chấm nhỏ: 4 trong 20 kiện mất hơn 3 tuần, nên kiện chậm từ Trung Quốc không hiếm. Hãy đặt quà sinh nhật trước một tháng. Từ Anh, phần lớn chấm nhỏ nằm ở 5 đến 7 ngày: 5 kiện mất lâu hơn, nhưng chỉ 3 kiện trong số đó quá 10 ngày. Từ Đức, chấm nhỏ nào cũng nằm trong khoảng 2 đến 5 ngày.

**Vì sao dùng biểu đồ này.** Một cột của số ngày thường gặp chỉ nói rằng càng xa càng chậm. Đài phun cho thấy càng xa càng khó đoán: đơn từ Đức không bao giờ quá 5 ngày, còn đơn từ Trung Quốc có thể mất cả tháng nếu kẹt ở hải quan. Các chấm nhỏ cho thấy chuyện đó xảy ra thường đến mức nào. Đài phun của Anh và Trung Quốc đều vươn cao, nhưng từ Anh chỉ 3 kiện mất hơn 10 ngày, còn từ Trung Quốc 4 trên 20 kiện mất hơn 3 tuần. Nhờ vậy bạn biết món quà có đến trước ngày sinh nhật hay không.

### Có tin được dự báo thời tiết cho buổi nướng thịt thứ Bảy không? {#weather-forecast-week}

<ChartDemo chart="fountain-chart" :index="5" :legend="false" :height="440" />

**Cách đọc.** Đài phun của thứ Bảy nằm trong khoảng 22° đến 28°, dù thế nào cũng trên vạch 20°, nên cứ yên tâm lên kế hoạch nướng thịt. Đài phun của thứ Ba kéo từ 17° đến 27° và thụt xuống dưới vạch, nên nó gần với phỏng đoán hơn.

**Vì sao dùng biểu đồ này.** Một đường dự báo trông chắc chắn về thứ Ba y như về hôm nay. Các đài phun cao dần qua các ngày trong tuần, nên nhìn là thấy ngay con số của thứ Bảy đủ tin để lên kế hoạch còn của thứ Ba thì chưa. Mỗi đài phun nằm gần như đều quanh chấm lớn, vì dự báo có thể sai theo cả hai hướng.

### Tôi thuê được căn hộ hai phòng ngủ ở đâu? {#rent-by-city}

<ChartDemo chart="fountain-chart" :index="6" :legend="false" :height="480" />

**Cách đọc.** Hãy nhìn vạch ngân sách 1.000 €. Đài phun của Lisbon, Berlin và Madrid đều chạm tới vạch, nhưng hãy đếm chấm nhỏ ở đó, vì mỗi chấm nhỏ là một căn hộ. Lisbon chỉ có một căn rẻ như vậy và Madrid có hai. Berlin có năm, nên đó là thành phố duy nhất dễ tìm được căn 1.000 €.

**Vì sao dùng biểu đồ này.** Một cột giá thuê thường gặp khiến Lisbon, Berlin và Madrid trông gần như nhau. Các đài phun cho thấy cả ba đều xuống tới 1.000 €, và các chấm nhỏ cho thấy chuyện đó thường đến mức nào. Ở Lisbon chỉ là một căn may mắn, căn rẻ kế tiếp đã là 1.180 €. Ở Madrid là hai căn, ở Berlin là năm. Ở phía trên, mức 2.300 € của Lisbon chỉ là một căn duy nhất, còn phần lớn căn hộ ở đó có giá từ 1.250 đến 1.600 €.

### Đi chợ bên kia biên giới Thụy Sĩ có rẻ hơn không? {#border-basket}

<ChartDemo chart="fountain-chart" :index="7" :legend="false" :height="420" />

**Cách đọc.** Đài phun của mọi nước láng giềng đều dừng dưới đáy đài phun của Thụy Sĩ (86 CHF), nên ngay cả cửa hàng đắt nhất bên kia biên giới vẫn rẻ hơn cửa hàng rẻ nhất ở Thụy Sĩ.

**Vì sao dùng biểu đồ này.** Một cột chỉ nói Thụy Sĩ đắt hơn. Các đài phun trả lời câu hỏi thật: chuyến đi có đáng không, dù bạn vào cửa hàng nào? Đài phun Thụy Sĩ và các đài phun còn lại thậm chí không chạm nhau. Ở đây mỗi đài phun nằm gần như đều quanh chấm lớn, vì cửa hàng rẻ tiết kiệm được khoảng bằng số tiền cửa hàng đắt tính thêm.

### Sao thứ Hai nào tôi cũng mệt thế? {#sleep-by-night}

<ChartDemo chart="fountain-chart" :index="8" :legend="false" :height="480" />

**Cách đọc.** Mỗi chấm nhỏ là một đêm. Chấm lớn của Chủ nhật chỉ thấp hơn đêm ngày thường nửa tiếng, nhưng 5 trong 16 chấm nhỏ của nó dưới 5 giờ. Khoảng ba Chủ nhật thì có một đêm tệ, và bạn thấy rõ vào sáng thứ Hai. Phần lớn chấm nhỏ của đêm ngày thường nằm trong khoảng 6 đến 7 giờ, chỉ có một đêm ngắn.

**Vì sao dùng biểu đồ này.** Các cột nói Chủ nhật (6 giờ) chỉ tệ hơn đêm ngày thường (6,5) một chút. Đài phun cho thấy Chủ nhật dao động nhiều nhất, xuống tới 3,5 giờ. Các chấm nhỏ cho thấy đây là thói quen, không phải chuyện một lần: 5 trong 16 Chủ nhật gần nhất ngủ dưới 5 giờ, nên đêm Chủ nhật là đêm cần sửa.

### Điện thoại của tôi còn trụ nổi một ngày không? {#phone-battery-year-by-year}

<ChartDemo chart="fountain-chart" :index="9" :legend="false" :height="480" />

**Cách đọc.** Vạch là một ngày trọn vẹn: rút sạc lúc 7 giờ sáng và vẫn còn pin lúc 22 giờ. Mỗi chấm nhỏ là một ngày, nên hãy đếm chấm nhỏ dưới vạch. Năm thứ nhất không ngày nào hụt. Năm thứ hai có ba ngày. Năm thứ ba có mười trong 21 ngày, và ba trong số đó điện thoại tắt trước 19 giờ. Năm thứ tư (nét đứt) là phỏng đoán, và khi đó ngay cả ngày bình thường cũng không trụ nổi.

**Vì sao dùng biểu đồ này.** Chấm lớn của ngày bình thường chỉ trượt từ 18 xuống 15 giờ trong ba năm, nên một đường đơn giản trông vẫn ổn. Các chấm nhỏ cho thấy điều gì thật sự đã thay đổi. Khi còn mới, điện thoại ngày nào cũng trụ được. Đến năm thứ ba, cứ hai ngày thì khoảng một ngày không trụ nổi. Đó là lúc nên thay pin mới.

### Tàu của tôi thật ra trễ thường xuyên đến mức nào? {#train-really-late}

<ChartDemo chart="fountain-chart" :index="10" :legend="false" :height="480" />

**Cách đọc.** Hãy đếm chấm nhỏ nằm trên vạch đứt nét. Đó là những chuyến chính hãng tàu coi là trễ: 5 trên 20 với chuyến 7:42, 9 với chuyến 17:48 về nhà, và chỉ 1 với chuyến 7:12. Một chấm nhỏ nằm đúng trên vạch (đúng 5 phút) không tính là trễ.

**Vì sao dùng biểu đồ này.** Một cột độ trễ trung bình sẽ ghi chuyến 7:42 là 5,5 phút, như thể chuyến nào cũng trễ một chút. Thực tế một nửa số chuyến trễ 2 đến 4 phút, và ba chuyến trễ 12, 18 và 25 phút. Một đường theo thời gian sẽ che mất lựa chọn giữa các chuyến. Ở đây bạn thấy ngay chuyến 7:12 gần như luôn đưa bạn đến đúng giờ, còn chuyến 7:42 làm hỏng khoảng một buổi sáng trong bốn và chuyến 17:48 gần một buổi tối trong hai.

### Ca nào đáng làm nhất để nhận tiền boa? {#tips-per-shift}

<ChartDemo chart="fountain-chart" :index="11" :legend="false" :height="480" />

**Cách đọc.** Hãy đếm chấm nhỏ trên vạch đứt nét 60 €: tối thứ Bảy nào cũng vượt, thứ Sáu hụt hai lần, còn ca trưa ngày thường chưa bao giờ đến gần.

**Vì sao dùng biểu đồ này.** Một cột tiền boa thường gặp đặt thứ Sáu (84 €) ngay cạnh thứ Bảy (97 €) và khiến chúng trông giống nhau. Các chấm nhỏ cho thấy thứ Sáu hai lần dưới 60 € còn thứ Bảy thì không lần nào, và điều đó quyết định nên đổi ca nào. Ở đây biểu đồ đường không có thứ tự thời gian nào để theo.

### Chơi trò board game nào để kịp xong trước giờ đi ngủ? {#board-game-before-bedtime}

<ChartDemo chart="fountain-chart" :index="12" :legend="false" :height="480" />

**Cách đọc.** Ticket to Ride thường mất 55 phút, nhưng 4 trong 15 ván vượt vạch một tiếng trước giờ đi ngủ. Scrabble thường mất 48 phút và chỉ vượt 2 trong 14 ván. Uno chưa bao giờ vượt; Monopoly lần nào cũng vượt.

**Vì sao dùng biểu đồ này.** Một cột thời gian thường gặp nói cả Scrabble (48 phút) và Ticket to Ride (55 phút) đều gói gọn trong một tiếng. Các chấm nhỏ cho thấy Ticket to Ride vượt giờ đi ngủ 4 trên 15 ván, còn Scrabble chỉ 2 trên 14. Đó là khác biệt giữa một giờ đi ngủ êm đềm và một trận cãi nhau.

### Tiền chợ hằng tuần có hay vượt 100 € hơn không? {#weekly-shop-trend}

<ChartDemo chart="fountain-chart" :index="13" :legend="false" :height="480" />

**Cách đọc.** Chấm lớn chỉ nhích từ 88 € lên 98 €, nhưng số chấm nhỏ trên vạch 100 € tăng từ 2 tuần lên 6 trên 13.

**Vì sao dùng biểu đồ này.** Một đường hóa đơn tuần thường gặp trông êm và vẫn dưới ngân sách. Các chấm nhỏ cho thấy số tuần vượt ngân sách tăng gấp ba (2, 3, 4, rồi 6 trên 13), và đó là điều một gia đình thật sự cảm thấy. Một cột cho mỗi mùa cũng sẽ che mất điều đó như vậy.

### Con gái tôi bơi 50 m đủ nhanh để thi đấu được bao nhiêu lần? {#swim-gala-time}

<ChartDemo chart="fountain-chart" :index="14" :legend="false" :height="480" />

**Cách đọc.** Thấp hơn là nhanh hơn. Chấm nhỏ dưới vạch đứt nét là những lần bơi đủ nhanh để thi đấu: không lần nào ở học kỳ mùa thu, 2 trên 14 ở học kỳ mùa xuân và 5 trên 13 ở học kỳ mùa hè.

**Vì sao dùng biểu đồ này.** Một đường thời gian thường gặp của cô bé chỉ xuống dưới 40 giây vào mùa thu tới, nên nó nói "chưa sẵn sàng". Các chấm nhỏ cho thấy mùa hè này cô bé đã bơi nhanh hơn mức chuẩn 5 trên 13 lần, nên có thể đăng ký ngay. Một đường không cho thấy được điều đó.

### Mỗi bài kiểm tra có bao nhiêu học sinh không đạt? {#class-test-pass-mark}

<ChartDemo chart="fountain-chart" :index="15" :legend="false" :height="480" />

**Cách đọc.** Hãy đếm chấm nhỏ dưới vạch điểm đạt: chấm lớn môn Khoa học nằm an toàn ở 58, vậy mà 7 trên 25 học sinh không đạt, và môn tiếng Pháp có 8 em.

**Vì sao dùng biểu đồ này.** Một cột điểm thường gặp của mỗi môn đặt cả năm môn trên mức đạt và gọi đó là một học kỳ tốt. Các chấm nhỏ cho thấy 7 em trượt môn Khoa học và 8 em trượt tiếng Pháp, trong khi môn Đọc không em nào trượt, và đó là điều phụ huynh hay giáo viên cần xử lý.

## Cấu trúc dữ liệu {#data-shape}

Mỗi mục trong `dataSet` là một tia: một cột ở chế độ ảnh chụp nhanh, một kỳ ở chế độ xu hướng.

| Trường | Ý nghĩa |
| --- | --- |
| `label` | Tên cột (ảnh chụp nhanh) hoặc tên chuỗi (xu hướng). |
| `value` | Chấm lớn: con số nên dùng. Không bắt buộc khi có `samples`; khi đó nó là lần đo ở giữa, một nửa số lần đo nằm dưới và một nửa nằm trên. |
| `low`, `high` | Đáy và đỉnh của đài phun. |
| `spread` | Cách viết tắt cho một khoảng đều hai phía: `low = value - spread`, `high = value + spread`. |
| `samples` | Các lần đo thật, mỗi lần một chấm nhỏ. |
| `forecast` | Một kỳ chưa diễn ra (xem [Xu hướng và dự báo](#trend-and-forecast)). |
| `date` | Vị trí trên trục x ở chế độ xu hướng. |
| `color`, `code` | Màu riêng cho mục này, và một mã cố định được đưa vào context. |

Khoảng được lấy theo thứ tự ưu tiên: `low` và `high`, rồi `spread`, rồi lần đo thấp nhất và cao nhất. Không có cái nào thì không có đài phun, chỉ có thân và chấm lớn. Một lần đo nằm ngoài `low`/`high`, hoặc một giá trị nằm ngoài khoảng, sẽ nới rộng khoảng cho vừa và gửi một [cảnh báo](/vi/api/fountain#warnings), nên không có gì bị giấu đi. Giá trị âm vẫn được: khi đó thân chạy xuống từ 0.

## Các tùy chọn {#switches}

| Prop | Mặc định | Tác dụng |
| --- | --- | --- |
| `showRange` | `true` | Vẽ đài phun. `false` chỉ giữ thân và chấm lớn; các chấm nhỏ cũng ẩn theo, vì chúng cần nằm trong đài phun. |
| `showSamples` | `true` | Vẽ mỗi lần đo một chấm nhỏ, khi các mục có `samples`. |
| `showValueLabels` | `true` | Ghi các con số dưới mỗi nhãn x: "usual 30", hai từ cho hai đầu, "only 5 days" khi dưới 10 lần đo, và các số đếm. |
| `drift` | `false` | Kiểu Geneva: phần trên của mỗi đài phun nghiêng về một phía cùng một mức. Nó không mang dữ liệu nào. |
| `referenceLines` | không có | Các vạch đỏ đứt nét ở những giá trị quan trọng. Có `goodSide` thì mỗi cột đếm các chấm nhỏ ở phía tốt. |
| `endLabels` | `["lowest", "highest"]` | Từ cho hai đầu của đài phun, ví dụ `["nhanh nhất", "chậm nhất"]` hoặc `["rẻ nhất", "đắt nhất"]`. |
| `readingGuide` | `false` | Hướng dẫn đọc dưới biểu đồ, nằm trên một dòng nếu vừa; nếu không, nó xuống dòng giữa các quy tắc (tại mỗi dấu « · »). `true` dùng hướng dẫn mặc định, chỉ gồm các quy tắc cho những gì biểu đồ vẽ; một chuỗi sẽ thay thế nó. |
| `sampleWord` | `"measurements"` | Từ số nhiều cho các chấm nhỏ: "20 ngày", "chỉ 5 đơn". |
| `labels` | từ tiếng Anh | Các từ khác mà biểu đồ ghi: `usual`, `of`, `only` và `forecast`, để dùng cho ngôn ngữ khác. |
| `yAxisTitle` | không có | Tiêu đề bên cạnh trục y, ví dụ "phút (cao hơn = chậm hơn)". |

### Chỉ có thân và chấm lớn: `showRange: false` {#show-range}

Bỏ đài phun đi thì biểu đồ thành biểu đồ kẹo mút: một thanh lên đến mỗi chấm lớn. Các chấm nhỏ và từ cho hai đầu biến mất; số đếm dưới mỗi cột vẫn còn, vì chúng tính từ các lần đo.

<ChartDemo chart="fountain-chart" :index="24" :legend="false" :height="440" />

### Kiểu Geneva: `drift: true` {#drift}

Phần trên của mỗi đài phun nghiêng sang phải cùng một mức, giống Jet d'Eau thật đôi khi bị thổi lệch. Tia nào cũng nghiêng như nhau, nên độ nghiêng không nói gì với người đọc. Người đọc lần đầu thấy nó khó hiểu, vì vậy mặc định nó tắt: hãy dùng cho áp phích, đừng dùng để ra quyết định.

<ChartDemo chart="fountain-chart" :index="23" :legend="false" :height="440" />

### Vạch, số đếm và từ ngữ của riêng bạn {#words}

```ts
const props = {
  yAxisTitle: "phút (cao hơn = chậm hơn)",
  endLabels: ["nhanh nhất", "chậm nhất"], // "nhanh nhất 22", "chậm nhất 55"
  sampleWord: "ngày", // "20 ngày", "chỉ 5 ngày"
  referenceLines: [
    {
      value: 45,
      label: "Thời gian tôi dành ra: 45 phút", // ghi ở đầu bên phải của vạch
      goodSide: "below", // đếm các chấm nhỏ bằng hoặc dưới 45
      countLabel: "không quá 45 phút", // "17 trên 20 không quá 45 phút"
    },
  ],
  readingGuide: "Chấm nhỏ = một ngày · Chấm lớn = ngày thường gặp · Đài phun cao = thay đổi nhiều",
  // Các từ khác của biểu đồ:
  labels: { usual: "thường", of: "trên", only: "chỉ", forecast: "dự báo" },
};
```

- Số đếm tính cả các chấm nhỏ nằm đúng trên vạch: "below" đếm những chấm bằng hoặc dưới vạch, "above" đếm những chấm bằng hoặc trên vạch.
- Cột dự báo và cột không có lần đo thì không có số đếm.
- Nếu không có `countLabel`, chữ hiện ra là "below the line" hoặc "above the line": hãy dịch bằng `countLabel`.
- `showValueLabels: false` bỏ các dòng dưới nhãn x. Tooltip vẫn hiện đúng các con số đó.

## Xu hướng và dự báo {#trend-and-forecast}

**Chế độ ảnh chụp nhanh** là mặc định (`xAxisDataType: "band"`): mỗi `label` một cột. Với **chế độ xu hướng**, hãy đặt `xAxisDataType` theo thời gian hoặc số (`"number"`, `"date_annual"` hoặc `"date_monthly"`) và cho mỗi mục một `date`. Khi đó các tia nằm dọc theo trục x, và một đường xám đứt nét nối các chấm lớn (`showTrendLine`: mặc định bật ở chế độ xu hướng với một chuỗi; tắt khi có nhiều chuỗi và ở chế độ ảnh chụp nhanh). Ở chế độ xu hướng, `label` là tên của chuỗi, nên một chuỗi giữ một màu.

Một mục **`forecast: true`** là một kỳ chưa diễn ra. Nó có thân và viền đứt nét, phần tô nhạt hơn, chấm lớn rỗng, không có chấm nhỏ và không có số đếm, và có "(forecast)" sau nhãn x (dịch được bằng `labels.forecast`).

Các kỳ có tên (giờ, học kỳ, mùa) đặt ở 1, 2, 3 và tiếp theo trên một trục số, và `xAxisFormat` in tên của chúng:

```ts
const names = ["Năm 1 (mới)", "Năm 2", "Năm 3", "Năm 4"];

const props = {
  xAxisDataType: "number",
  xAxisFormat: (d) => names[Number(d) - 1],
  yAxisTitle: "giờ (cao hơn = lâu hơn)",
  endLabels: ["ngắn nhất", "dài nhất"],
  sampleWord: "ngày",
  referenceLines: [
    { value: 15, label: "một ngày trọn vẹn", goodSide: "above", countLabel: "trụ được cả ngày" },
  ],
  dataSet: [
    { label: "Pin", date: 1, value: 18, low: 15, high: 20, samples: [18.5, 19, 17.5 /* … */] },
    { label: "Pin", date: 2, value: 17, low: 13, high: 19, samples: [17, 18, 16.5 /* … */] },
    { label: "Pin", date: 3, value: 15, low: 10, high: 17, samples: [15.5, 13, 16 /* … */] },
    { label: "Pin", date: 4, value: 12, low: 7, high: 14, forecast: true },
  ],
};
```

Biểu đồ đầy đủ nằm trong phần ví dụ: [Điện thoại của tôi còn trụ nổi một ngày không?](#phone-battery-year-by-year). Hãy giữ chế độ xu hướng ở vài kỳ (khoảng 3 đến 12), để mỗi đài phun có chỗ.

## Chạy qua các kỳ {#timeline}

Ở chế độ xu hướng, `timeline` thêm một nút phát và một thanh tua để đi qua các kỳ. Ở mỗi bước, biểu đồ vẽ các tia đến kỳ đang chọn, gồm trọn cả tia của kỳ đó, và rê chuột chỉ chạm tới những gì đã vẽ. Chế độ ảnh chụp nhanh không có kỳ nào, nên thanh điều khiển không hiện. Mặc định tắt.

<TimelinePlayDemo chart="fountain-chart" hint="Bấm nút phát dưới biểu đồ: nó đi qua từng kỳ và vẽ các tia đến kỳ đó. Kéo thanh tua để nhảy đến kỳ bất kỳ." />

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart ref={ref} {...props} timeline={{ speedMs: 1000, loop: true }} />;
// ref.current?.timeline() -> play() / pause() / seek(period) / seekIndex(i) / stepForward()
```

```vue [Vue]
<FountainChart :options="{ ...props, timeline: { speedMs: 1000, loop: true } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, timeline: { speedMs: 1000, loop: true } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, { ...props, timeline: { speedMs: 1000, loop: true } });
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.timeline = { speedMs: 1000, loop: true };
  // el.getTimeline() -> play() / pause() / seek(period) / seekIndex(i)
</script>
```

:::

- `speedMs` chỉnh nhịp chạy, `loop` quay vòng, `autoplay: true` tự chạy khi mount, `showControl: false` ẩn thanh điều khiển có sẵn.
- Controller headless luôn có sẵn: `chart.timeline()` cho `play() / pause() / toggle() / seek(period) / seekIndex(i) / stepForward() / stepBack()`, kèm `onStep` và `formatPeriod` trong config khi bạn tự làm nút điều khiển. Với các kỳ có tên, hãy truyền cho `formatPeriod` cùng hàm với `xAxisFormat`.
- `seek(period)` tìm kỳ trước, so sánh dạng chữ, nên `seek(2021)` và `seek("2021")` đều tới 2021 dù ngày trong dữ liệu là số hay chuỗi. Số chỉ được hiểu là vị trí (0 = kỳ đầu) khi không có kỳ nào khớp, còn chuỗi không khớp kỳ nào thì không làm gì. `seekIndex(i)` luôn đi theo vị trí, giống thanh tua có sẵn.
- Giá trị trượt mượt giữa các kỳ theo mặc định (`interpolate`); `interpolate: false` thì nhảy thẳng. Khi bật reduced motion, biểu đồ luôn nhảy thẳng.
- `timeline` được ưu tiên hơn `progressiveDraw` khi cả hai cùng được bật.

## Hiệu ứng vẽ dần

Biểu đồ tự vẽ dần từ trái sang phải khi mount. Mặc định tắt: một biểu đồ bật nó bằng prop `progressiveDraw`.

<RevealDemo chart="fountain-chart" :height="440" replay-label="Chạy lại hiệu ứng" hint="Các tia hiện dần từ trái sang phải; trục và tiêu đề đứng yên. Khi bật reduced motion, biểu đồ hiển thị đầy đủ ngay lập tức." />

`progressiveDraw: true` dùng cấu hình mặc định (1200 ms, easeInOutCubic). Truyền object để tinh chỉnh:

::: code-group

```tsx [React]
const ref = useRef<FountainChartHandle>(null);

<FountainChart
  ref={ref}
  {...props}
  progressiveDraw={{ durationMs: 2000 }}
/>;
// ref.current?.replay() chạy lại hiệu ứng khi cần
```

```vue [Vue]
<FountainChart :options="{ ...props, progressiveDraw: { durationMs: 2000 } }" />
```

```svelte [Svelte]
<div use:fountainChart={{ ...props, progressiveDraw: { durationMs: 2000 } }}></div>
```

```ts [Angular]
applyFountainChartProps(this.c.nativeElement, {
  ...props,
  progressiveDraw: { durationMs: 2000 },
});
```

```html [Web component]
<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("c");
  el.progressiveDraw = { durationMs: 2000 };
  // el.replay() chạy lại hiệu ứng
</script>
```

:::

- `durationMs` và `easing` ("linear", "easeOutQuad", "easeInOutCubic", hoặc hàm `(t) => t` của riêng bạn) quyết định cách vẽ.
- `autoplay: false` hiển thị biểu đồ đã vẽ đầy đủ; gọi `replay()` (handle ref của React, phương thức của web component, hoặc instance core) để chạy hiệu ứng khi cần. `replayOnUpdate: true` chạy lại mỗi khi dữ liệu thay đổi.
- Tôn trọng `prefers-reduced-motion`: khi đó biểu đồ hiển thị đầy đủ ngay lập tức.

## Dữ liệu lớn trên WebGPU <span class="vp-badge warning">Thử nghiệm</span>

<script setup>
function makeFountain() {
  const dataSet = [];
  for (let i = 0; i < 200; i++) {
    const value = Math.max(8, Math.round(40 + 25 * Math.sin(i / 11) + 10 * Math.sin(i / 3.3)));
    const low = value - (3 + (i % 5));
    const high = value + Math.round(4 + 14 * Math.abs(Math.sin(i / 5)));
    dataSet.push({ label: `Jet ${i + 1}`, value, low, high });
  }
  return { dataSet, xAxisDataType: "band", showValueLabels: false };
}
</script>

FountainChart có tùy chọn `renderer="webgpu"` để vẽ mỗi thân, đài phun và chấm lớn thành các mark instance trên GPU, trong khi trục, nhãn và tooltip vẫn ở lớp SVG. Nó phụ thuộc vào khả năng của trình duyệt: không có WebGPU thì nó quay về canvas, và `getContext().renderer` cho biết renderer nào thực sự đã vẽ. Quá khoảng mười hai cột thì biểu đồ không còn đọc được như một biểu đồ đài phun nữa; bản demo này là bài kiểm tra tải, không phải lời khuyên.

<WebgpuHeavyDemo element="michi-vz-fountain-chart" :make="makeFountain" caption="200 jets" />

## Cách dùng

::: code-group

```tsx [React]
import { FountainChart } from "@michi-vz/react";

export default () => <FountainChart {...props} />; // props = các tùy chọn của biểu đồ
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
// main.ts - đăng ký các element một lần
import "@michi-vz/angular";
import { applyFountainChartProps } from "@michi-vz/angular";

// component (dùng CUSTOM_ELEMENTS_SCHEMA)
// template: <michi-vz-fountain-chart #c></michi-vz-fountain-chart>
applyFountainChartProps(this.c.nativeElement, props);
```

```html [Web component]
<script type="module" src="https://cdn.jsdelivr.net/npm/@michi-vz/wc/dist/michi-vz-wc.bundle.js"></script>

<michi-vz-fountain-chart id="c"></michi-vz-fountain-chart>
<script>
  Object.assign(document.getElementById("c"), props); // dataSet, referenceLines, …
</script>
```

```ts [Vanilla JS]
import { mountFountainChart } from "@michi-vz/core";

const chart = mountFountainChart(el, props);
chart.update(next);
chart.getContext(); // không phụ thuộc renderer, sẵn sàng cho LLM
chart.destroy();
```

:::

### Web component: thuộc tính HTML và thuộc tính JS {#web-component}

Chuỗi và số đơn giản có thể là thuộc tính HTML (attribute). Mảng, object, hàm và các tùy chọn bật/tắt là thuộc tính JS (property).

```html
<michi-vz-fountain-chart
  id="dilam"
  chart-title="Đi làm thật ra mất bao lâu?"
  y-axis-title="phút (cao hơn = chậm hơn)"
  sample-word="ngày"
  renderer="canvas"
></michi-vz-fountain-chart>
<script>
  const el = document.getElementById("dilam");
  el.dataSet = [
    { label: "Ô tô", value: 30, low: 22, high: 55, samples: [29, 31, 27 /* mỗi ngày một số */] },
    { label: "Tàu hỏa", value: 35, low: 32, high: 42, samples: [34, 35, 33 /* … */] },
  ];
  el.endLabels = ["nhanh nhất", "chậm nhất"];
  el.referenceLines = [
    { value: 45, label: "Thời gian tôi dành ra: 45 phút", goodSide: "below", countLabel: "không quá 45 phút" },
  ];
  el.labels = { usual: "thường", of: "trên", only: "chỉ", forecast: "dự báo" };
  el.readingGuide = true;
  el.showRange = true; // cả: showSamples, showValueLabels, drift
</script>
```

- **Attribute:** `chart-title`, `y-axis-title`, `sample-word`, `x-axis-data-type`, `renderer`, `locale`, `width`, `height`, `ticks`.
- **Chỉ là property:** `dataSet`, `referenceLines`, `endLabels`, `labels`, `readingGuide`, `showRange`, `showSamples`, `showValueLabels`, `drift`, `showTrendLine`, `colors`, `colorsMapping`, `yAxisDomain`, `xAxisFormat`, `yAxisFormat`, `timeline`, `progressiveDraw`.
- Đặt tiêu đề bằng `chartTitle` (hoặc `chart-title`), đừng dùng `title`: trên một phần tử HTML, `title` là tooltip riêng của trình duyệt.

## Chuyển từ core 1.28 {#migrating}

Core 1.29 thay hai hình dáng cũ (kiểu jet và kiểu plume) bằng một kiểu vẽ duy nhất, trong đó mọi dấu đều đọc được trên trục y. Mã cũ vẫn chạy; đây là những gì thay đổi.

- **Các prop đã bỏ sẽ bị bỏ qua.** `style`, `frothLayers`, `bloomExponent`, `stemFraction`, `showDroplets` và `showMist` vẫn được chấp nhận thêm một phiên bản, không thay đổi gì, và mỗi prop gửi một [cảnh báo](/vi/api/fountain#warnings) `ignored-option`. Hãy xóa chúng. Trên web component, `fountainStyle` (`fountain-style`) cũng bị bỏ qua như vậy.
- **`density` và `lean` trên từng mục bị bỏ qua**, kèm cảnh báo `ignored-option`. Hãy đưa các lần đo thật (`samples`) thay cho mật độ; muốn kiểu nghiêng thì dùng `drift` cho cả biểu đồ.
- **`spread` giờ vẽ một khoảng thật.** `{ value: 30, spread: 8 }` vẫn chạy: đài phun đi từ 22 đến 38 trên trục y. Biểu đồ cũ vẽ spread thành một độ rộng không hề nằm trên trục. Nếu `spread` của bạn đo một thứ khác (một khoản lỗ, một khoảng chênh, một tỷ lệ), nó không còn hợp với biểu đồ này: hãy đưa con số đó vào tooltip hoặc sang biểu đồ khác.
- **`predicted` và `certainty` vẫn chạy**; tên mới là `forecast` (`certainty: false` tương đương `forecast: true`).
- **Trục y** giờ bao gồm 0, mọi `low` và `high` và mọi đường tham chiếu, cộng thêm 10% khoảng trống. Giá trị âm được vẽ dưới mặt hồ.
- **Ở chế độ xu hướng, các mục không có `date`** bị bỏ qua kèm cảnh báo `missing-date`. Trước đây chúng khiến cả biểu đồ chuyển sang chế độ ảnh chụp nhanh.
- **Đang tải và không có dữ liệu.** Biểu đồ Đài phun giờ nhận `isLoading`, `isNodata`, `noDataLabel` và `suppressDefaultOverlay`, như các biểu đồ khác. Một `dataSet` rỗng hiện lớp phủ không có dữ liệu ("No data available", hoặc `noDataLabel` của bạn) thay cho trục rỗng: hãy truyền `isLoading` trong lúc dữ liệu đang tải, hoặc `isNodata: false` để giữ trục rỗng.
- **Màu** lấy từ toàn bộ `dataSet` theo thứ tự xuất hiện, nên tắt một nhãn không bao giờ làm đổi màu các nhãn khác, và `color` riêng của từng mục được tôn trọng.
- **TypeScript: `value` và `spread` giờ là tùy chọn** trong `FountainDataItem`, vì một mục có thể chỉ đưa `samples`. Mã đọc `.value` hoặc `.spread` từ các mục của bạn có thể cần kiểm tra hoặc thêm `?? 0`. `tooltipFormatter` nhận mục đó với `value` đã được điền (trung vị của các lần đo khi mục không đưa giá trị), nên ở đó `d.value` luôn là một số, và một formatter có kiểu `(d: FountainDataItem) => string` vẫn dùng được.
- **Context.** `jets[].spread`, `jets[].spreadRatio` và `jets[].upperBound` vẫn còn như bí danh đã lỗi thời; hãy dùng `range`, `rangeRatio` và `high`. `jets[].lean` luôn là `null`. `stats.frothiest` là bí danh đã lỗi thời; hãy dùng `stats.widestRange`. Xem [getContext()](/vi/api/fountain#getcontext).

## API

Props được định kiểu là `FountainChartProps` trong [`@michi-vz/core`](https://github.com/beany-vu/michi-vz-mono/blob/main/packages/core/src/types.ts). Dùng chung cho mọi biểu đồ: `width`, `height`, `margin`, `colors` / `colorsMapping`, `renderer` (`"svg"`, `"canvas"`, hoặc `"webgpu"` thử nghiệm), `highlightItems`, `disabledItems`, và các callback `on*`. `onChartDataProcessed` / `getContext()` trả về [ChartContext](/vi/guide/llm-context) không phụ thuộc renderer. Tài liệu đầy đủ: [API Đài phun](/vi/api/fountain).
