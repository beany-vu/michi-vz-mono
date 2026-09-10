import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, type PropType } from "vue";
import { mountSymbolMapChart } from "@michi-vz/core";
import type { SymbolMapChartProps, ChartInstance, ChartContext } from "@michi-vz/core";

export type { SymbolMapChartProps } from "@michi-vz/core";

export const SymbolMapChart = defineComponent({
  name: "MichiVzSymbolMapChart",
  props: {
    options: { type: Object as PropType<SymbolMapChartProps>, required: true },
  },
  setup(props, { expose }) {
    const host = ref<HTMLDivElement | null>(null);
    let chart: ChartInstance<SymbolMapChartProps> | null = null;

    onMounted(() => {
      if (host.value) chart = mountSymbolMapChart(host.value, props.options);
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
