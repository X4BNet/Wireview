<script setup>
import { useId } from "vue";

const gradientId = useId();
</script>

<template>
  <svg viewBox="0 0 24 14">
    <defs>
      <linearGradient
        :id="gradientId"
        x1="8"
        x2="15"
        y2="14"
        gradientTransform="translate(0 1038.4)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#fff" stop-opacity=".15753" offset="0" />
        <stop stop-color="#fff" stop-opacity="0" offset="1" />
      </linearGradient>
    </defs>
    <g transform="translate(0 -1038.4)" fill-rule="evenodd">
      <rect
        x="-26"
        y="1038.4"
        width="24"
        height="14"
        rx="2"
        ry="2"
        fill="#3465a4"
      />
      <rect
        x="-22"
        y="1043.4"
        width="14"
        height="4"
        rx="1"
        ry="1"
        fill="#eeeeec"
      />
      <path
        d="m-11 1042.4v6.0003l4.0001-3.0001z"
        fill="#eeeeec"
        stroke="#eeeeec"
        stroke-linejoin="round"
        stroke-width="2"
      />
      <path
        transform="translate(0 1038.4)"
        d="m2 0c-1.108 0-2 0.892-2 2v10c0 1.108 0.892 2 2 2h20c1.108 0 2-0.892 2-2v-10c0-1.108-0.892-2-2-2h-20zm13.043 3a1.0001 1.0001 0 0 1 0.55664 0.20117l4 3a1.0001 1.0001 0 0 1 0 1.5996l-4 3a1.0001 1.0001 0 0 1-1.5996-0.80078v-1h-9c-0.554 0-1-0.446-1-1v-2c0-0.554 0.446-1 1-1h9v-1a1.0001 1.0001 0 0 1 0.94336-0.99805 1.0001 1.0001 0 0 1 0.09961-0.0019531z"
        fill="currentColor"
      />
      <path
        d="m2 1038.4c-1.108 0-2 0.892-2 2v10c0 1.108 0.892 2 2 2h20c1.108 0 2-0.892 2-2v-10c0-1.108-0.892-2-2-2h-20zm13.043 3a1.0001 1.0001 0 0 1 0.55664 0.2012l4 3a1.0001 1.0001 0 0 1 0 1.5996l-4 3a1.0001 1.0001 0 0 1-1.5996-0.8008v-1h-9c-0.554 0-1-0.446-1-1v-2c0-0.554 0.446-1 1-1h9v-1a1.0001 1.0001 0 0 1 0.94336-0.998 1.0001 1.0001 0 0 1 0.09961 0z"
        :fill="`url(#${gradientId})`"
      />
    </g>
  </svg>
</template>
