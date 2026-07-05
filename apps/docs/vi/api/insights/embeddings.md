---
title: Embeddings API
---

# Embeddings API

Các hàm hỗ trợ ngữ nghĩa cho tìm kiếm, đối chiếu, khớp dữ liệu chéo tập, và độ tương tự trên văn bản -
mặc định không cần mô hình (một bộ embedder dựa trên hashing), với backend transformers tùy chọn (MiniLM
qua WebGPU) cho khả năng khớp từ đồng nghĩa thực sự.
Xem câu chuyện và các lab tại **[Hướng dẫn Insights](/vi/guide/insights#clean-match-and-search-your-data)**.

## Import

```ts
import {
  findSimilar, matchLabels, reconcileLabels, createEmbedder,
  cosineSimilarity, hashEmbed,
} from "@michi-vz/insights/embeddings";
// also re-exported from the package root: import { findSimilar } from "@michi-vz/insights";
```

## `findSimilar` - xếp hạng các mục theo ý nghĩa

Thử ngay - gõ một từ khóa và các nhãn sẽ được xếp hạng theo ý nghĩa (mặc định không cần mô hình):

<SemanticSearchLab />

```ts
const ranked = await findSimilar("revenue", labels, (s) => s, { backend: "hash" });
// → [{ item, score }, ...] sorted by descending cosine similarity
```

| Tham số | Kiểu | Chức năng |
| --- | --- | --- |
| `query` | `string` | Văn bản cần khớp. |
| `items` | `T[]` | Các ứng viên cần xếp hạng. |
| `text` | `(item: T) => string` | Trích xuất chuỗi có thể so sánh từ mỗi mục. |
| `options` | `EmbedOptions` | `{ backend?, model?, dim? }` - xem bên dưới. |

## `reconcileLabels` - gộp các nhãn lộn xộn cùng nghĩa

Thử ngay - các nhãn lộn xộn, viết khác nhau sẽ được gộp lại thành các nhóm sạch:

<EmbeddingsLab />

Cùng một thực thể thường xuất hiện dưới nhiều cách viết khác nhau ("United States" / "usa" /
"United  States"); nhóm theo khớp chính xác sẽ chia nó thành nhiều nhóm với tổng số sai. Hàm này
embedding hóa mỗi nhãn và phân cụm tham lam theo độ tương tự cosine (single-linkage) với một cổng độ
tin cậy, để các thực thể khác biệt không bao giờ bị gộp chung chỉ vì gần nhau. Hãy cộng chuỗi dữ liệu
của bạn theo `name` của mỗi nhóm (medoid của cụm) để có tổng số sạch.

```ts
const groups = await reconcileLabels(labels, { threshold: 0.7, margin: 0.05 });
// → [{ name, members: [...] }, ...]
```

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Cosine tối thiểu để gộp vào một nhóm. |
| `margin` | `number` | `0.05` | Cổng độ tin cậy: một nhãn chỉ được gộp khi nó gần nhóm tốt nhất hơn ít nhất mức này so với nhóm tốt-nhì. `0` để tắt. |
| `embedder` | `Embedder` | tùy chọn | Tái sử dụng một embedder đã dựng sẵn thay vì tạo mới. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Các tùy chọn embedder được kế thừa. |

Mặc định không dùng mô hình sẽ gộp lỗi chính tả/viết hoa thường ở chế độ offline; `{ backend:
"transformers" }` còn gộp cả từ đồng nghĩa, từ viết tắt, và bản dịch. Để có tên chuẩn hóa đáng tin cậy
(USA -> United States), hãy kết hợp với một danh sách bí danh hoặc một LLM (xem công thức "Certify" của
hướng dẫn).

## `matchLabels` - liên kết cùng thực thể qua hai danh sách

Thử ngay - hai bản xuất không khớp trở thành các cặp đáng tin cậy cộng với các phần chưa khớp được báo
cáo trung thực, và các hàng đã ghép nối được vẽ thành một biểu đồ duy nhất:

<MatchLab />

Trong khi `reconcileLabels` làm sạch trùng lặp *bên trong* một danh sách, `matchLabels` ghép một danh
sách nguồn với một danh sách đích (một bản xuất CRM so với một bản xuất ERP). Một cặp chỉ được coi là
khớp đáng tin cậy khi nó vượt qua ngưỡng độ tương tự, cổng độ tin cậy-biên (dựa trên lựa chọn của nguồn
trong số các đích), và - mặc định - một **cặp khớp tốt nhất lẫn nhau**: mỗi bên chọn bên kia là lựa chọn
đầu tiên, để hai hàng nguồn không bao giờ âm thầm va vào cùng một đích. Mọi trường hợp còn lại được báo
cáo lại kèm ứng viên gần nhất, không bao giờ bị bỏ hoặc ghép ép.

```ts
const { matches, unmatchedSource, unmatchedTarget } = await matchLabels(crmLabels, erpLabels);
// matches          → [{ source, target, similarity }, ...] (source order)
// unmatchedSource  → [{ label, closest, similarity }, ...] ("did you mean" hints)
// unmatchedTarget  → [{ label, closest, similarity }, ...]
```

| Tùy chọn | Kiểu | Mặc định | Chức năng |
| --- | --- | --- | --- |
| `threshold` | `number` | `0.7` (transformers) / `0.6` (hash) | Cosine tối thiểu để một ứng viên được xem xét. |
| `margin` | `number` | `0.05` | Cổng độ tin cậy trên lựa chọn của nguồn: đích tốt nhất của nó phải vượt đích tốt-nhì ít nhất mức này. `0` để tắt. |
| `mutual` | `boolean` | `true` | Yêu cầu một cặp khớp tốt nhất lẫn nhau. `false` cho phép nhiều-đối-một lên một đích (hoặc tốt hơn: dùng `reconcileLabels` cho phía lộn xộn trước, rồi mới khớp chéo). |
| `embedder` | `Embedder` | tùy chọn | Tái sử dụng một embedder đã dựng sẵn thay vì tạo mới. |
| `backend` / `model` / `dim` | `EmbedOptions` | hash | Các tùy chọn embedder được kế thừa. |

Các nhãn nguồn trùng lặp sẽ được giải quyết về một người thắng duy nhất khi `mutual: true`; nhãn thua
được báo cáo là chưa khớp cùng ứng viên gần nhất của nó, đây là gợi ý để bạn đối chiếu phía đó trước.

## `createEmbedder` / `cosineSimilarity` / `hashEmbed` - các hàm nguyên thủy

```ts
const embedder = await createEmbedder({ backend: "transformers" }); // falls back to hash if unavailable
const [a, b] = await embedder.embed(["customer", "customers"]);
cosineSimilarity(a, b); // 0..1
hashEmbed("customer", 128); // deterministic char-ngram vector, no model
```

| Hàm | Chữ ký | Ghi chú |
| --- | --- | --- |
| `createEmbedder` | `(options?: EmbedOptions) => Promise<Embedder>` | `Embedder` là `{ backend, embed(texts) }`. `backend: "transformers"` lazy-load MiniLM và **quay về dùng hash** nếu thiếu dependency/mô hình. |
| `cosineSimilarity` | `(a: number[], b: number[]) => number` | Cosine chuẩn; `0` cho vector không (zero vector). |
| `hashEmbed` | `(text: string, dim?: number) => number[]` | Embedding char-ngram mờ (fuzzy), không cần mô hình (`dim` mặc định 128); giúp `customer ~ customers` mà không cần bất kỳ mô hình nào. |

`EmbedOptions` = `{ backend?: "hash" | "transformers"; model?: string; dim?: number }`.

**[Hướng dẫn Insights](/vi/guide/insights#clean-match-and-search-your-data)**
