import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountAreaChart } from "@michi-vz/core";
import type { AreaChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { AreaChartProps } from "@michi-vz/core";

export const AreaChart = defineComponent({
  name: "MichiVzAreaChart",
  props: {
    options: { type: Object as PropType<AreaChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<AreaChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountAreaChart(host.value, props.options);
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
