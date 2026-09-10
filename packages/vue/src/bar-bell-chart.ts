import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountBarBellChart } from "@michi-vz/core";
import type { BarBellChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { BarBellChartProps } from "@michi-vz/core";

export const BarBellChart = defineComponent({
  name: "MichiVzBarBellChart",
  props: {
    options: { type: Object as PropType<BarBellChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<BarBellChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountBarBellChart(host.value, props.options);
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
          width: `${props.options.width ?? 900}px`,
          height: `${props.options.height ?? 480}px`,
        },
      });
  },
});
