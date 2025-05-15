/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  printWidth: 80,
  tabWidth: 2,
  trailingComma: "none",
  semi: true,
  plugins: [
    "prettier-plugin-tailwindcss",
    "@trivago/prettier-plugin-sort-imports"
  ],
  importOrder: [
    "<THIRD_PARTY_MODULES>",
    "^@/app/(.*)$",
    "^@/lib/(.*)$",
    "^@/components/(.*)$",
    "^@/components/ui/(.*)$",
    "^[./]"
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
};
