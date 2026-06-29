/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  toast: (message: string) => void;
}

declare namespace App {
  interface Locals {
    user?: any;
  }
}
