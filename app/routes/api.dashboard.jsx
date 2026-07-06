import { data } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return data({
    stats: [
      {
        title: "Total Searches",
        value: "24,381",
        change: "+12%",
      },
      {
        title: "Zero Results Rate",
        value: "3.2%",
        change: "-0.5%",
      },
      {
        title: "Click-through Rate",
        value: "67.4%",
        change: "+4.1%",
      },
      {
        title: "Avg. Results per Search",
        value: "18.6",
        change: "Stable",
      },
    ],

    searches: [
      {
        query: "blue sneakers",
        time: "2 mins ago",
        results: 14,
      },
      {
        query: "summer dress",
        time: "15 mins ago",
        results: 42,
      },
      {
        query: "phone case",
        time: "45 mins ago",
        results: 156,
      },
      {
        query: "running shoes",
        time: "1 hour ago",
        results: 8,
      },
    ],
  });
};