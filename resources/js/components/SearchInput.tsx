import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="search" {...props} />;
}
