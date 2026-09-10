import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountBubbleChart } from "@michi-vz/core";
import type { BubbleChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { BubbleChartProps } from "@michi-vz/core";

export const BubbleChart = defineComponent({
  name: "MichiVzBubbleChart",
  props: {
    options: { type: Object as PropType<BubbleChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<BubbleChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountBubbleChart(host.value, props.options);
    });
    watch(
      () => props.options,
      (next) => chart?.update(next),
      { deep: true },
    );
    onBeforeUnmount(() => chart?.destroy());

    expose({ getContext: (): ChartContext | null => chart?.getContext() ?? null });

    return () =>
      h("div", {
        ref: host,
        style: {
          width: `${props.options.width ?? 700}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});
