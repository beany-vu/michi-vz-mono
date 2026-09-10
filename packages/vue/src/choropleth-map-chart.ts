import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountChoroplethMapChart } from "@michi-vz/core";
import type { ChoroplethMapChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { ChoroplethMapChartProps } from "@michi-vz/core";

export const ChoroplethMapChart = defineComponent({
  name: "MichiVzChoroplethMapChart",
  props: {
    options: { type: Object as PropType<ChoroplethMapChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<ChoroplethMapChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountChoroplethMapChart(host.value, props.options);
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
          height: `${props.options.height ?? 520}px`,
        },
      });
  },
});
