import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".agents/**",
      ".claude/**",
      ".next/**",
      ".test-dist/**",
      "next-env.d.ts",
      "out/**",
    ],
  },
];

export default config;
