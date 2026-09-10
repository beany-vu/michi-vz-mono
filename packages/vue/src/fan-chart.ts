import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountFanChart } from "@michi-vz/core";
import type { FanChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { FanChartProps } from "@michi-vz/core";

export const FanChart = defineComponent({
  name: "MichiVzFanChart",
  props: {
    options: { type: Object as PropType<FanChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<FanChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountFanChart(host.value, props.options);
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
          width: `${props.options.width ?? 1000}px`,
          height: `${props.options.height ?? 500}px`,
        },
      });
  },
});
