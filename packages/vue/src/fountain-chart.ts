import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountFountainChart } from "@michi-vz/core";
import type { FountainChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { FountainChartProps } from "@michi-vz/core";

export const FountainChart = defineComponent({
  name: "MichiVzFountainChart",
  props: {
    options: { type: Object as PropType<FountainChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<FountainChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountFountainChart(host.value, props.options);
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
