import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { getCharmBalance } from "../lib/api";

export default function CharmBalance() {
  const { data } = useQuery({ queryKey: ["charmBalance"], queryFn: getCharmBalance });
  return <div className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-4 py-2" title="Your earned star charms">
    <Star className="size-5 fill-warning text-warning" />
    <span className="font-bold">{data?.charms ?? 0}</span>
    <span className="text-sm opacity-70">charms</span>
  </div>;
}
