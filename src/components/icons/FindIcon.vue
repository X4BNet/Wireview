<script setup>
import { useId } from "vue";

const gradientId = useId();
</script>
<template>
  <svg height="16" width="16" viewBox="0 0 16 16">
    <radialGradient
      :id="gradientId"
      cx="3.776183"
      cy="8.476432"
      gradientTransform="matrix(0.8502024,0.49086459,-0.49086459,0.8502024,4.567725,-0.470796)"
      gradientUnits="userSpaceOnUse"
      r="4.321379"
    >
      <stop offset="0" stop-opacity=".121569" />
      <stop
        offset="1"
        stop-opacity=".309645"
        style="stop-color: currentColor; stop-opacity: 0.24705882"
      />
    </radialGradient>
    <rect
      style="
        fill: currentColor;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-opacity: 1;
        fill-opacity: 1;
      "
      y="13.242122"
      x="2.593333"
      width="1.763713"
      transform="rotate(-30)"
      rx="1"
      height="5.2911401"
    />
    <path
      style="
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-opacity: 1;
      "
      d="M 5.0650002,4.688002 A 2.3258973,2.3258973 0 0 1 7.845173,3.2474687"
    />
    <path
      style="fill: none; stroke: currentColor; stroke-width: 2; stroke-opacity: 1"
      d="m 9.2089838,9 c 0.715675,1.2396 0.715675,1.2396 0.715675,1.2396"
    />
    <circle
      :fill="`url(#${gradientId})`"
      style="stroke: currentColor; stroke-linecap: round; stroke-opacity: 1"
      transform="rotate(-30)"
      r="3.8213789"
      cy="8.2449293"
      cx="3.47523"
    />
  </svg>
</template>
