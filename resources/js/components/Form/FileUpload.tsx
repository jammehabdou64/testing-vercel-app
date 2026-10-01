import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

export function FileUpload(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="file" {...props} />;
}
