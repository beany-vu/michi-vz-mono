import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountSankeyChart } from "@michi-vz/core";
import type { SankeyChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { SankeyChartProps } from "@michi-vz/core";

export const SankeyChart = defineComponent({
  name: "MichiVzSankeyChart",
  props: {
    options: { type: Object as PropType<SankeyChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<SankeyChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountSankeyChart(host.value, props.options);
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
          width: `${props.options.width ?? 800}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});
