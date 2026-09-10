import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountRibbonChart } from "@michi-vz/core";
import type { RibbonChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { RibbonChartProps } from "@michi-vz/core";

export const RibbonChart = defineComponent({
  name: "MichiVzRibbonChart",
  props: {
    options: { type: Object as PropType<RibbonChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<RibbonChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountRibbonChart(host.value, props.options);
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
