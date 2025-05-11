"use client";

import { useEffect } from "react";

export default function ErrorTest() {
  useEffect(() => {
    throw new Error("This is a test error to trigger the global error page");
  }, []);

  return <div>This text should not display as an error will be thrown</div>;
}
