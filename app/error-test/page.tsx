/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useEffect } from "react";

/**
 * Copyright (c) LichtLabs.
 * SPDX-License-Identifier: Apache-2.0
 */

export default function ErrorTest() {
  useEffect(() => {
    throw new Error("This is a test error to trigger the global error page");
  }, []);

  return <div>This text should not display as an error will be thrown</div>;
}
